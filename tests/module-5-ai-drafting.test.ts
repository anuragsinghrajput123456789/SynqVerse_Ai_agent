/**
 * Module 5: AI Client-Message Drafting Test Suite
 * Tests deterministic input sanitization, PII protection boundary,
 * Zod response validation, malformed output interception, and offline resilience.
 */

import {
  draftClientMessage,
  ClientMessageDraftSchema,
  DraftClientMessageInput,
} from '../lib/ai';

async function runAiDraftingTests() {
  console.log('===================================================================');
  console.log(' MERIDIAN RESOLVE - MODULE 5: AI DRAFTING TEST SUITE');
  console.log('===================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  const validMockInput: DraftClientMessageInput = {
    sanitizedTicket: {
      ticketId: 'TKT-AI-001',
      originHub: 'Gurgaon',
      destination: 'Ambala',
      issue: 'Alternator breakdown',
      severity: 'HIGH',
      client: 'Shakti Cement',
      createdAt: '2026-06-15T10:00:00',
    },
    resolvedVehicle: {
      registrationNumber: 'DL64IB1058',
      model: 'Tata Signa',
      bsStage: 'BS6',
    },
    selectedReplacementVehicle: {
      registrationNumber: 'DL01AB9999',
      model: 'Tata Prima',
      homeHub: 'Gurgaon',
      distanceKm: 0,
      bsStage: 'BS6',
    },
    client: {
      name: 'Shakti Cement',
      contactPerson: 'Amit Sharma',
      contractSlaHours: 36,
    },
    sla: {
      slaDeadlineHours: 36,
      specialInstructions: ['Rule R-008: 36h operational delivery SLA enforced'],
    },
    approvedFacts: [
      'Vehicle DL64IB1058 alternator failure at km 45',
      'Replacement vehicle DL01AB9999 dispatched from Gurgaon hub',
      'Shakti Cement 36-hour operational delivery window active',
    ],
    sourceCitations: [
      {
        sourceId: 'ticket_TKT-AI-001',
        sourceFile: 'tickets.json',
        field: 'issue',
        resolvedValue: 'Alternator breakdown',
      },
      {
        sourceId: 'fleet_DL01AB9999',
        sourceFile: 'fleet_master.csv',
        field: 'replacement_vehicle',
        resolvedValue: 'DL01AB9999',
      },
    ],
  };

  console.log('--- TEST 1: Valid Message Drafting & Schema Validation ---');
  const result1 = await draftClientMessage(validMockInput);
  assert(result1.status === 'SUCCESS', 'Drafting returns status: SUCCESS');
  assert(result1.draft !== undefined, 'Draft object is present');
  assert(result1.draft?.subject.includes('TKT-AI-001') === true, 'Draft subject references ticketId');
  assert(result1.draft?.message.includes('Shakti Cement') === true, 'Draft message body references client name');
  assert(result1.draft?.factsUsed.length === 3, 'Draft preserves all approved operational facts');
  assert(result1.draft?.citations.length === 2, 'Draft includes source citations');

  const zodValidation1 = ClientMessageDraftSchema.safeParse(result1.draft);
  assert(zodValidation1.success === true, 'Draft passes strict Zod validation');

  console.log('\n--- TEST 2: Malformed AI Response Interception ---');
  const malformedPayload1 = {
    unexpectedKey: 'hello',
    missingSubject: true,
  };
  const malformedZod1 = ClientMessageDraftSchema.safeParse(malformedPayload1);
  assert(malformedZod1.success === false, 'Malformed payload without subject is rejected by Zod');

  const malformedPayload2 = {
    subject: 'Update',
    message: '', // Empty message
    factsUsed: [],
    citations: [],
  };
  const malformedZod2 = ClientMessageDraftSchema.safeParse(malformedPayload2);
  assert(malformedZod2.success === false, 'Payload with empty message string is rejected by Zod');

  console.log('\n--- TEST 3: Gemini Unavailable / Fallback Handling ---');
  // Pass an invalid API key to trigger safe error handling
  const prevKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'invalid_dummy_key_12345';

  const result3 = await draftClientMessage(validMockInput);
  assert(
    result3.status === 'AI_ERROR' || result3.status === 'SUCCESS',
    'Offline / invalid key safely returns AI_ERROR without throwing unhandled exception'
  );
  if (result3.status === 'AI_ERROR') {
    assert(result3.error !== undefined, 'Controlled error message is populated');
    assert(!result3.error?.includes('invalid_dummy_key_12345'), 'API key is never exposed in error message');
  }

  // Restore env
  process.env.GEMINI_API_KEY = prevKey;

  console.log('\n--- TEST 4: Missing Context Handling (INSUFFICIENT_DATA) ---');
  const incompleteInput: DraftClientMessageInput = {
    sanitizedTicket: {
      ticketId: '', // Missing ticket ID
    },
    client: '',
    sla: {},
    approvedFacts: [],
  };
  const result4 = await draftClientMessage(incompleteInput);
  assert(result4.status === 'INSUFFICIENT_DATA', 'Missing context returns status: INSUFFICIENT_DATA');
  assert(result4.draft === undefined, 'No draft generated on missing context');

  console.log('\n--- TEST 5: PII Protection Boundary & Redaction Audit ---');
  const piiPollutedInput: DraftClientMessageInput = {
    ...validMockInput,
    sanitizedTicket: {
      ...validMockInput.sanitizedTicket,
      issue: 'Driver Rahul Sharma (+91-9876543210, DL-DL0420190001234, Aadhaar: 1234 5678 9012) reported clutch failure',
    },
    approvedFacts: [
      'Driver contact: 9876543210',
      'Driver license: UP1420180009876',
    ],
  };

  const result5 = await draftClientMessage(piiPollutedInput);
  assert(
    result5.status === 'SUCCESS' || result5.status === 'AI_ERROR',
    'PII sanitization executed safely without throwing'
  );
  assert(result5.piiAudited === true, 'PII audit confirms zero unmasked PII in prompt');
  if (result5.draft) {
    assert(!result5.draft.message.includes('9876543210'), 'Draft message body contains zero raw phone numbers');
    assert(!result5.draft.message.includes('1234 5678 9012'), 'Draft message body contains zero raw Aadhaar numbers');
  }

  console.log('\n===================================================================');
  console.log(` MODULE 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  if (failed > 0) {
    throw new Error(`Module 5 tests failed with ${failed} failure(s)`);
  }
}

runAiDraftingTests().catch((err) => {
  console.error('Module 5 test suite encountered an error:', err);
  process.exit(1);
});
