/**
 * Module 7: Audit Trail Test Suite
 * Tests MongoDB-backed audit logging, chronological timeline reconstruction,
 * rule and source provenance traceability, and strict PII protection.
 */

import {
  createAuditEvent,
  getTicketAuditTimeline,
  AuditService,
  AuditEventType,
} from '../lib/audit';
import { closeMongoDb } from '../lib/db/mongodb';

async function runAuditTrailTests() {
  console.log('===================================================================');
  console.log(' MERIDIAN RESOLVE - MODULE 7: AUDIT TRAIL TEST SUITE');
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

  const service = AuditService.getInstance();
  await service.clearAll();

  console.log('--- TEST 1: Create Single Audit Event ---');
  const event1 = await createAuditEvent({
    ticketId: 'TKT-AUD-001',
    eventType: 'TICKET_RECEIVED',
    actor: 'system:ingestion',
    reason: 'Ticket received from tickets.json stream',
    sourceReferences: ['tickets.json'],
    safeMetadata: { sourceFile: 'tickets.json', rawOriginHub: 'Gurgaon' },
  });

  assert(event1.ticketId === 'TKT-AUD-001', 'Audit event ticketId matches');
  assert(event1.eventType === 'TICKET_RECEIVED', 'Audit eventType is TICKET_RECEIVED');
  assert(event1.actor === 'system:ingestion', 'Audit actor is logged');
  assert(event1.sourceReferences.includes('tickets.json'), 'Source references are stored');

  console.log('\n--- TEST 2: Full Ticket Lifecycle (All 15 Event Types) ---');
  const allEventTypes: AuditEventType[] = [
    'TICKET_RECEIVED',
    'TICKET_VALIDATED',
    'PII_MASKED',
    'ENTITY_RESOLVED',
    'CONTEXT_BUILT',
    'RULE_EVALUATED',
    'VEHICLE_REJECTED',
    'VEHICLE_SELECTED',
    'WORK_ORDER_CREATED',
    'WORK_ORDER_ALREADY_EXISTS',
    'MESSAGE_DRAFTED',
    'APPROVAL_REQUESTED',
    'APPROVED',
    'TICKET_QUARANTINED',
    'REJECTED',
  ];

  for (let i = 0; i < allEventTypes.length; i++) {
    const evt = allEventTypes[i];
    const timestamp = new Date(Date.now() + i * 1000).toISOString();
    await createAuditEvent({
      ticketId: 'TKT-AUD-LIFECYCLE',
      eventType: evt,
      actor: i >= 12 ? 'dispatcher_ankit' : 'system',
      reason: `Execution step for ${evt}`,
      ruleId: evt === 'RULE_EVALUATED' || evt === 'VEHICLE_REJECTED' ? 'R-001' : null,
      sourceReferences: ['dispatcher_interview.txt', 'fleet_master.csv'],
      safeMetadata: { stepIndex: i, action: evt },
      timestamp,
    });
  }

  const timeline = await getTicketAuditTimeline('TKT-AUD-LIFECYCLE');
  assert(timeline.length === 15, 'Complete timeline contains all 15 lifecycle events');

  // Verify chronological ordering
  let isChronological = true;
  for (let i = 1; i < timeline.length; i++) {
    if (new Date(timeline[i].timestamp).getTime() < new Date(timeline[i - 1].timestamp).getTime()) {
      isChronological = false;
      break;
    }
  }
  assert(isChronological, 'Timeline events are strictly sorted in chronological order');

  // Verify rule and source provenance
  const ruleEvt = timeline.find((e) => e.eventType === 'RULE_EVALUATED');
  assert(ruleEvt !== undefined, 'RULE_EVALUATED event exists in timeline');
  assert(ruleEvt?.ruleId === 'R-001', 'Rule ID R-001 is preserved in audit trail');
  assert(ruleEvt?.sourceReferences.includes('dispatcher_interview.txt') === true, 'Source citation is preserved');

  console.log('\n--- TEST 3: Evaluator Decision Traceability ---');
  const vehSelEvt = timeline.find((e) => e.eventType === 'VEHICLE_SELECTED');
  assert(vehSelEvt !== undefined, 'VEHICLE_SELECTED event captured');
  assert((vehSelEvt?.reason.length ?? 0) > 0, 'Reason for decision is explicitly recorded');

  const approvalEvt = timeline.find((e) => e.eventType === 'APPROVED');
  assert(approvalEvt !== undefined, 'APPROVED event captured');
  assert(approvalEvt?.actor === 'dispatcher_ankit', 'Dispatcher actor attribution is preserved');

  console.log('\n--- TEST 4: PII Masking & Security Boundary ---');
  const piiPollutedEvent = await createAuditEvent({
    ticketId: 'TKT-AUD-SECURE',
    eventType: 'PII_MASKED',
    actor: 'system:pii_guard',
    reason: 'Driver mobile +91-9876543210 and Aadhaar 1234 5678 9012 reported breakdown',
    sourceReferences: ['Driver DL: DL0420190001234'],
    safeMetadata: {
      driverPhone: '9876543210',
      driverAadhaar: '1234 5678 9012',
      driverLicense: 'DL0420190001234',
      issue: 'Alternator fault',
    },
  });

  assert(!piiPollutedEvent.reason.includes('9876543210'), 'Stored reason contains zero raw phone numbers');
  assert(piiPollutedEvent.reason.includes('[REDACTED]'), 'Stored reason contains [REDACTED] placeholder');
  assert(!piiPollutedEvent.sourceReferences.some((s) => s.includes('DL0420190001234')), 'Source references contain zero raw DL numbers');
  assert(piiPollutedEvent.safeMetadata.driverPhone === '[REDACTED]', 'Metadata driverPhone is masked to [REDACTED]');
  assert(piiPollutedEvent.safeMetadata.driverAadhaar === '[REDACTED]', 'Metadata driverAadhaar is masked to [REDACTED]');
  assert(piiPollutedEvent.safeMetadata.driverLicense === '[REDACTED]', 'Metadata driverLicense is masked to [REDACTED]');
  assert(piiPollutedEvent.safeMetadata.issue === 'Alternator fault', 'Non-PII metadata fields are preserved intact');

  console.log('\n--- TEST 5: Timeline Isolation Across Tickets ---');
  const timeline1 = await getTicketAuditTimeline('TKT-AUD-001');
  const timelineSecure = await getTicketAuditTimeline('TKT-AUD-SECURE');
  assert(timeline1.length === 1, 'Timeline for TKT-AUD-001 contains only its own 1 event');
  assert(timelineSecure.length === 1, 'Timeline for TKT-AUD-SECURE contains only its own 1 event');

  console.log('\n===================================================================');
  console.log(` MODULE 7 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();
  if (failed > 0) {
    throw new Error(`Module 7 tests failed with ${failed} failure(s)`);
  }
}

runAuditTrailTests().catch((err) => {
  console.error('Module 7 test suite encountered an error:', err);
  process.exit(1);
});
