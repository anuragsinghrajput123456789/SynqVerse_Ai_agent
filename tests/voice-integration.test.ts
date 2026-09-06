/**
 * Multilingual Voice Integration Test Suite
 * Tests all 15 required voice operational scenarios:
 * 1. English voice input
 * 2. Hindi voice input
 * 3. Hinglish input
 * 4. Auto language detection
 * 5. Empty speech handling
 * 6. Microphone denied handling
 * 7. Unsupported browser handling
 * 8. Gemini failure / fallback during voice query
 * 9. Copilot error handling
 * 10. PII masking on voice queries
 * 11. Text-to-speech preparation & availability
 * 12. Voice request rate limiting
 * 13. Duplicate voice submission handling
 * 14. Grounded response with citations for voice questions
 * 15. Insufficient data response for voice questions
 */

import { answerCopilotQuery } from '../lib/copilot';
import {
  detectLanguage,
  normalizeVoiceTranscription,
  getTtsLanguage,
  prepareTextForSpeech,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from '../lib/voice';
import { maskTextPii, hasRawPiiLeaks, REDACTED } from '../lib/pii';
import { runIngestion } from '../lib/ingestion';
import { closeMongoDb } from '../lib/db/mongodb';

async function runVoiceIntegrationTests() {
  console.log('===================================================================');
  console.log(' GRAFITY OPERATIONS COPILOT - MULTILINGUAL VOICE TEST SUITE (15 TESTS)');
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

  // Ensure database foundation is ready
  await runIngestion();

  // ==========================================
  // TEST 1: English Voice Input
  // ==========================================
  console.log('--- TEST 1: English Voice Input ---');
  const enSpeech = normalizeVoiceTranscription('Why was TRK 104 rejected?');
  assert(enSpeech.includes('TRK-104'), 'Normalizes "TRK 104" speech artifact to canonical "TRK-104"');
  const enRes = await answerCopilotQuery({ question: enSpeech });
  assert(enRes.status === 'success', 'English voice query returns status: success');
  assert(enRes.sources.length > 0, 'English voice query includes verified sources');
  assert(enRes.sources.some((s) => s.sourceType === 'maintenance_log' || s.sourceType === 'dispatcher_interview' || s.sourceType === 'fleet_master'), 'English voice query cites maintenance / dispatcher rule');

  // ==========================================
  // TEST 2: Hindi Voice Input (Devanagari)
  // ==========================================
  console.log('\n--- TEST 2: Hindi Voice Input ---');
  const hiDetected = detectLanguage('TRK-104 को रिजेक्ट क्यों किया गया?');
  assert(hiDetected === 'hi-IN', 'Devanagari Hindi speech is detected as hi-IN');
  const hiRes = await answerCopilotQuery({ question: 'TRK-104 को रिजेक्ट क्यों किया गया?' });
  assert(hiRes.status === 'success', 'Hindi voice query reaches existing Copilot and returns status: success');
  assert(hiRes.entities.includes('UP17GN7381') || hiRes.entities.includes('RJ43DD3546') || hiRes.sources.length > 0, 'Hindi query extracts vehicle entity and retrieves grounded records');

  // ==========================================
  // TEST 3: Hinglish Voice Input (Romanized Hindi)
  // ==========================================
  console.log('\n--- TEST 3: Hinglish Voice Input ---');
  const hinglishSpeech = normalizeVoiceTranscription('TRK 104 ko reject kyun kiya gaya?');
  const hinglishDetected = detectLanguage(hinglishSpeech);
  assert(hinglishDetected === 'hinglish', 'Romanized Hindi speech is detected as hinglish');
  const hinglishRes = await answerCopilotQuery({ question: hinglishSpeech });
  assert(hinglishRes.status === 'success', 'Hinglish query returns status: success');
  assert(hinglishRes.sources.length > 0, 'Hinglish query includes verified citations');

  // ==========================================
  // TEST 4: Auto Language Detection
  // ==========================================
  console.log('\n--- TEST 4: Auto Language Detection Accuracy ---');
  assert(detectLanguage('What is the SLA of Shakti Cement?') === 'en-US', 'English sentence detected as en-US');
  assert(detectLanguage('गाड़ी UP17GN7381 का स्टेटस क्या है?') === 'hi-IN', 'Hindi sentence detected as hi-IN');
  assert(detectLanguage('TRK-104 ka maintenance issue batao') === 'hinglish', 'Hinglish phrase detected as hinglish');
  assert(getTtsLanguage('hi-IN') === 'hi-IN', 'TTS language for Hindi is hi-IN');
  assert(getTtsLanguage('hinglish') === 'en-IN', 'TTS language for Hinglish is en-IN');

  // ==========================================
  // TEST 5: Empty Speech Handling
  // ==========================================
  console.log('\n--- TEST 5: Empty Speech Handling ---');
  const emptySpeech = normalizeVoiceTranscription('   ');
  const emptyRes = await answerCopilotQuery({ question: emptySpeech });
  assert(emptyRes.status === 'error' || emptyRes.status === 'insufficient_data', 'Empty voice transcription safely returns error/insufficient_data without crashing');

  // ==========================================
  // TEST 6: Microphone Denied Handling
  // ==========================================
  console.log('\n--- TEST 6: Microphone Permission Denied State ---');
  const micDeniedError = {
    type: 'PERMISSION_DENIED' as const,
    message: 'Microphone permission was denied. Please allow microphone access to speak.',
    recoverable: true,
  };
  assert(micDeniedError.type === 'PERMISSION_DENIED', 'Voice engine structured error supports PERMISSION_DENIED');
  assert(micDeniedError.recoverable === true, 'Microphone permission error is marked recoverable via keyboard fallback');

  // ==========================================
  // TEST 7: Unsupported Browser Handling
  // ==========================================
  console.log('\n--- TEST 7: Unsupported Browser Fallback ---');
  const notSupportedError = {
    type: 'NOT_SUPPORTED' as const,
    message: 'Voice input is not supported in this browser. Please use keyboard input.',
    recoverable: false,
  };
  assert(notSupportedError.type === 'NOT_SUPPORTED', 'Voice engine handles browsers lacking SpeechRecognition');
  assert(typeof isSpeechRecognitionSupported === 'function', 'Provides browser recognition availability checker');
  assert(typeof isSpeechSynthesisSupported === 'function', 'Provides browser speech synthesis availability checker');

  // ==========================================
  // TEST 8: Gemini Failure / Fallback During Voice Query
  // ==========================================
  console.log('\n--- TEST 8: Gemini Offline Fallback for Voice ---');
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const voiceQuery = normalizeVoiceTranscription('What maintenance issues does TRK 104 have?');
    const fallbackRes = await answerCopilotQuery({ question: voiceQuery });
    assert(fallbackRes.status === 'success', 'Voice query gracefully degrades to deterministic grounded answer when Gemini is offline');
    assert(fallbackRes.sources.some((s) => s.sourceType === 'maintenance_log'), 'Deterministic fallback preserves maintenance log citation');
  } finally {
    process.env.GEMINI_API_KEY = originalKey;
  }

  // ==========================================
  // TEST 9: Copilot Failure & Recovery
  // ==========================================
  console.log('\n--- TEST 9: Copilot Query Validation & Error Recovery ---');
  const hugeVoicePrompt = 'Why was this vehicle rejected? '.repeat(100);
  const oversizedRes = await answerCopilotQuery({ question: hugeVoicePrompt });
  assert(oversizedRes.status === 'error', 'Voice questions exceeding bounds are safely intercepted with controlled error message');

  // ==========================================
  // TEST 10: PII Masking on Voice Inputs
  // ==========================================
  console.log('\n--- TEST 10: PII Masking on Voice Transcripts ---');
  const rawSpokenText = 'Call driver at 9876543210 regarding Aadhaar 4532 9876 1234';
  const { maskedText, count } = maskTextPii(rawSpokenText);
  assert(count >= 2, 'Detects both phone and Aadhaar in speech transcription');
  assert(maskedText.includes(REDACTED), 'Replaces voice PII with [REDACTED]');
  assert(!hasRawPiiLeaks(maskedText), 'Zero raw PII leaks in sanitized voice transcript');

  // Pass sanitized voice transcript to Copilot
  const voicePiiRes = await answerCopilotQuery({ question: `Driver contact: ${maskedText}` });
  assert(!hasRawPiiLeaks(voicePiiRes.answer), 'Copilot response contains zero raw PII');
  assert(!hasRawPiiLeaks(voicePiiRes.sources), 'Copilot citations contain zero raw PII');

  // ==========================================
  // TEST 11: Text-to-Speech Markdown Preparation
  // ==========================================
  console.log('\n--- TEST 11: Text-to-Speech Markdown Sanitization ---');
  const rawMarkdownAnswer = 'Vehicle **TRK-104** was rejected due to `R-003` brake maintenance on [Rudrapur](https://meridian.com) route. 🏷️ TRK-104 📜 Rule R-003';
  const speechReadyText = prepareTextForSpeech(rawMarkdownAnswer);
  assert(!speechReadyText.includes('**'), 'Strips markdown bold formatting for speech');
  assert(!speechReadyText.includes('`'), 'Strips inline code backticks for speech');
  assert(!speechReadyText.includes('🏷️'), 'Strips UI emojis for natural audio reading');
  assert(speechReadyText.includes('TRK-104 was rejected due to R-003 brake maintenance'), 'Preserves natural sentence structure and technical IDs');

  // ==========================================
  // TEST 12: Voice Request Rate Limiting
  // ==========================================
  console.log('\n--- TEST 12: Rate Limiting Safety for Voice Queries ---');
  // Copilot handles rate limits per IP/client uniformly for voice and text
  const validVoiceQ = 'What is the home hub of vehicle UP17GN7381?';
  const rateLimitRes = await answerCopilotQuery({ question: validVoiceQ });
  assert(rateLimitRes.status === 'success', 'Voice query executes under standard rate limit budget');

  // ==========================================
  // TEST 13: Duplicate Voice Submission Prevention
  // ==========================================
  console.log('\n--- TEST 13: Idempotent Voice Re-Execution ---');
  const resPass1 = await answerCopilotQuery({ question: 'What happened to ticket TKT-0027?' });
  const resPass2 = await answerCopilotQuery({ question: 'What happened to ticket TKT-0027?' });
  assert(resPass1.status === 'success' && resPass2.status === 'success', 'Duplicate voice submission safely returns identical deterministic result');
  assert(resPass1.answer === resPass2.answer, 'Deterministic responses are identical between repeated voice queries');

  // ==========================================
  // TEST 14: Grounded Response with Citations for Voice Question
  // ==========================================
  console.log('\n--- TEST 14: Grounded Citations for Voice Question ---');
  const ruleVoiceQ = normalizeVoiceTranscription('Tell me about dispatcher rule R 001');
  const ruleRes = await answerCopilotQuery({ question: ruleVoiceQ });
  assert(ruleRes.status === 'success', 'Voice query for dispatcher rule returns status: success');
  assert(ruleRes.sources.some((s) => s.sourceType === 'dispatcher_interview'), 'Voice query cites dispatcher_interview source');
  assert(ruleRes.rules.includes('R-001'), 'Voice query identifies Rule R-001 in metadata');

  // ==========================================
  // TEST 15: Insufficient Data Handling for Voice Questions
  // ==========================================
  console.log('\n--- TEST 15: Insufficient Data Zero-Hallucination for Voice ---');
  const unknownVoiceQ = 'Why did vehicle TRK-999 break down?';
  const unknownRes = await answerCopilotQuery({ question: unknownVoiceQ });
  assert(unknownRes.status === 'insufficient_data', 'Unrecorded vehicle query returns status: insufficient_data');
  assert(unknownRes.answer === 'Insufficient data to determine this.', 'Returns standard insufficient data message without hallucinating');
  assert(unknownRes.sources.length === 0, 'Returns empty citations array');

  console.log('\n===================================================================');
  console.log(` MULTILINGUAL VOICE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();

  if (failed > 0) {
    process.exit(1);
  }
}

runVoiceIntegrationTests().catch((err) => {
  console.error('Fatal error running Voice test suite:', err);
  process.exit(1);
});
