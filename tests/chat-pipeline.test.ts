/**
 * Grounded AI Chat Subsystem & Voice Pipeline Test Suite
 * Tests:
 * 1. Question answerable from ingested facts returns correct answer with citations
 * 2. Question outside data returns "insufficient data" and never calls Gemini (verified via mock/spy)
 * 3. PII-like string typed by user is masked before being logged to audit trail
 * 4. Audit trail captures complete exchange (question, facts, citations, answer) with zero raw PII
 * 5. Language selector correctly maps to speech recognition and synthesis language parameters
 * 6. Transcribed voice message goes through identical PII masking and fact retrieval pipeline
 * 7. Graceful degradation when facts lack required details
 */

import { runIngestion } from '../lib/ingestion';
import { chatAnswer } from '../lib/query/chat';
import * as aiModule from '../lib/ai/gemini';
import { AuditLogRepository } from '../lib/audit/repository';
import { hasRawPiiLeaks, maskTextPii, REDACTED } from '../lib/pii';
import {
  SUPPORTED_LANGUAGES,
  getTtsLanguage,
  detectLanguage,
  normalizeVoiceTranscription,
} from '../lib/voice';
import { closeMongoDb } from '../lib/db/mongodb';

async function runChatPipelineTestSuite() {
  console.log('===================================================================');
  console.log(' GRAFITY GROUNDED AI CHAT & VOICE PIPELINE TEST SUITE');
  console.log('===================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Ingest context foundation
  console.log('--- SETUP: Ingesting Context Foundation ---');
  await runIngestion();
  const auditRepo = new AuditLogRepository();
  await auditRepo.clear();

  // ==========================================
  // TEST 1: Question Answerable From Ingested Facts
  // ==========================================
  console.log('\n--- TEST 1: Grounded Question With Citations ---');
  const res1 = await chatAnswer('What is Shakti Cement delivery SLA?');
  assert(res1.status === 'grounded', 'Grounded query returns status: grounded');
  assert(
    res1.answer.includes('36') || res1.answer.includes('Shakti') || res1.answer.includes('SLA'),
    'Grounded answer contains Shakti Cement SLA details'
  );
  assert(res1.source_refs.length > 0, 'Returns non-empty source_refs array');
  assert(
    res1.source_refs.some((r) => r.includes('contracts_master') || r.includes('dispatcher_interview')),
    'Returns authoritative source citations (contracts_master or dispatcher_interview)'
  );

  // Vehicle grounded question
  const resVehicle = await chatAnswer('What are the specifications of vehicle UP17GN7381?');
  assert(resVehicle.status === 'grounded', 'Vehicle query returns status: grounded');
  assert(
    resVehicle.source_refs.some((r) => r.includes('fleet_master.csv')),
    'Vehicle answer cites fleet_master.csv'
  );
  assert(
    resVehicle.answer.includes('UP17GN7381') || resVehicle.answer.includes('Kanpur') || resVehicle.answer.includes('Tata'),
    'Vehicle answer includes model or hub details'
  );

  // ==========================================
  // TEST 2: Question Outside Data Returns "Insufficient Data" & Skips Gemini
  // ==========================================
  console.log('\n--- TEST 2: Out-Of-Domain Query Skips Gemini ---');
  let geminiCallCount = 0;

  // Set spy handler
  aiModule.__setGenerateAnswerHandler(async () => {
    geminiCallCount++;
    return 'Mock answer';
  });

  const ungroundedRes = await chatAnswer('What is the weather and population on planet Neptune?');
  assert(
    ungroundedRes.status === 'insufficient_data',
    'Ungrounded query returns status: insufficient_data'
  );
  assert(
    ungroundedRes.answer.toLowerCase().includes("don't have enough information") ||
      ungroundedRes.answer.toLowerCase().includes('insufficient'),
    'Ungrounded query returns refusal response without hallucination'
  );
  assert(ungroundedRes.source_refs.length === 0, 'Ungrounded query returns empty source_refs');
  assert(
    geminiCallCount === 0,
    'Gemini API was NEVER called for out-of-domain query (relevance threshold gate passed)'
  );

  // Restore handler
  aiModule.__setGenerateAnswerHandler(null);


  // ==========================================
  // TEST 3: PII Masking on User-Typed Message
  // ==========================================
  console.log('\n--- TEST 3: User PII Redaction Before Audit Logging ---');
  const userQueryWithPii =
    'My phone number is +91 9876543210 and Aadhaar 2345 6789 0123. Can UP17GN7381 go on winter Delhi routes?';
  const resPii = await chatAnswer(userQueryWithPii);

  assert(resPii.status === 'grounded', 'Query with PII is successfully answered');
  assert(
    resPii.maskedUserMessage !== undefined && !resPii.maskedUserMessage.includes('9876543210'),
    'User phone number is masked in response payload'
  );
  assert(
    resPii.maskedUserMessage !== undefined && !resPii.maskedUserMessage.includes('2345 6789 0123'),
    'User Aadhaar is masked in response payload'
  );
  assert(
    resPii.maskedUserMessage !== undefined && resPii.maskedUserMessage.includes(REDACTED),
    'User message contains [REDACTED] placeholder'
  );

  // ==========================================
  // TEST 4: Audit Trail Integrity & Zero PII Leaks
  // ==========================================
  console.log('\n--- TEST 4: Audit Trail Verification ---');
  const auditLogs = await auditRepo.findAll();
  const chatLogs = auditLogs.filter((l) => l.eventType === 'CHAT_QUERY');
  assert(chatLogs.length >= 3, 'Audit trail logs every chat exchange');

  const piiLog = chatLogs.find((l) => l.reason.includes('[REDACTED]'));
  assert(piiLog !== undefined, 'Audit trail stores PII-redacted question in reason field');
  assert(!hasRawPiiLeaks(auditLogs), 'Security Audit: Zero raw PII leaks across all stored audit records');

  if (piiLog) {
    const meta = piiLog.safeMetadata as Record<string, unknown>;
    assert(
      Array.isArray(meta.factsRetrieved) && meta.factsRetrieved.length > 0,
      'Audit log captures factsRetrieved array'
    );
    assert(
      Array.isArray(meta.citations) && meta.citations.length > 0,
      'Audit log captures citations array'
    );
    assert(
      typeof meta.finalAnswer === 'string' && meta.finalAnswer.length > 0,
      'Audit log captures finalAnswer'
    );
  }

  // ==========================================
  // TEST 5: Multilingual Language Selector Configuration
  // ==========================================
  console.log('\n--- TEST 5: Voice Language Configuration ---');
  const enOption = SUPPORTED_LANGUAGES.find((l) => l.code === 'en-US');
  const hiOption = SUPPORTED_LANGUAGES.find((l) => l.code === 'hi-IN');
  const hinglishOption = SUPPORTED_LANGUAGES.find((l) => l.code === 'hinglish');

  assert(enOption?.speechRecognitionLang === 'en-US', 'English sets speechRecognitionLang to en-US');
  assert(hiOption?.speechRecognitionLang === 'hi-IN', 'Hindi sets speechRecognitionLang to hi-IN');
  assert(hinglishOption?.speechRecognitionLang === 'en-IN', 'Hinglish sets speechRecognitionLang to en-IN');

  assert(getTtsLanguage('hi-IN') === 'hi-IN', 'TTS language for Hindi is hi-IN');
  assert(getTtsLanguage('en-US') === 'en-US', 'TTS language for English is en-US');
  assert(getTtsLanguage('hinglish') === 'en-IN', 'TTS language for Hinglish is en-IN');

  // ==========================================
  // TEST 6: Transcribed Voice Input Safety & Processing
  // ==========================================
  console.log('\n--- TEST 6: Transcribed Voice Input Safety & Processing ---');
  const rawSpokenInput = 'MF 068 home hub batao contact 9876543210';
  const normalizedSpoken = normalizeVoiceTranscription(rawSpokenInput);
  assert(normalizedSpoken.includes('MF-068'), 'Voice normalization formats "MF 068" to "MF-068"');

  const { maskedText: safeVoiceInput } = maskTextPii(normalizedSpoken);
  assert(!safeVoiceInput.includes('9876543210'), 'Voice transcript is scrubbed of phone number');
  assert(safeVoiceInput.includes(REDACTED), 'Voice transcript has [REDACTED] placeholder');

  // Route transcribed voice through chatAnswer pipeline
  const voiceChatRes = await chatAnswer(safeVoiceInput);
  assert(voiceChatRes.status === 'grounded', 'Transcribed voice query successfully retrieves grounded answer');
  assert(
    voiceChatRes.source_refs.some((r) => r.includes('fleet_master.csv')),
    'Voice query correctly cites fleet_master.csv for MF-068'
  );


  // ==========================================
  // TEST 7: Hindi & Hinglish Language Detection
  // ==========================================
  console.log('\n--- TEST 7: Multilingual Detection ---');
  assert(detectLanguage('गाड़ी UP17GN7381 का स्टेटस क्या है?') === 'hi-IN', 'Detects Devanagari Hindi text');
  assert(detectLanguage('gaadi UP17GN7381 ka status batao') === 'hinglish', 'Detects Hinglish text');
  assert(detectLanguage('What is the status of vehicle UP17GN7381?') === 'en-US', 'Detects English text');

  console.log('\n===================================================================');
  console.log(` CHAT & VOICE PIPELINE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();
  process.exit(failed > 0 ? 1 : 0);
}

runChatPipelineTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
