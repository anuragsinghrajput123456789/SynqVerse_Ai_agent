/**
 * Module 8: End-to-End Meridian Resolve Pipeline Integration Test Suite
 * Tests full end-to-end integration:
 * Ticket -> Ingestion -> Validation -> PII Redaction -> Normalization -> Deduplication ->
 * Decision Engine -> Vehicle Selection -> Idempotent Work Order -> AI Drafting -> Human Approvals -> Audit
 */

import {
  processTicket,
  processQueue,
} from '../lib/pipeline';
import { runIngestion } from '../lib/ingestion';
import { QueueRepository, DecisionRepository } from '../lib/repositories';
import { WorkOrderRepository } from '../lib/work-orders';
import { ApprovalRepository } from '../lib/approvals';
import { AuditLogRepository } from '../lib/audit';
import { closeMongoDb } from '../lib/db/mongodb';
import { QueueTicket } from '../lib/types';
import { hasRawPiiLeaks } from '../lib/pii';

async function runPipelineIntegrationTests() {
  console.log('===================================================================');
  console.log(' MERIDIAN RESOLVE - MODULE 8: END-TO-END PIPELINE TEST SUITE');
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

  // Clear all collections and initialize fresh data
  await new QueueRepository().clear();
  await new DecisionRepository().clear();
  await new WorkOrderRepository().clear();
  await new ApprovalRepository().clear();
  await new AuditLogRepository().clear();

  // Ingest canonical data files into Context Foundation and Breakdown Queue
  await runIngestion();

  console.log('--- TEST 1: Single Valid Ticket Processing ---');
  const validTicket: QueueTicket = {
    ticketId: 'TKT-PIPE-001',
    idempotencyKey: 'BREAKDOWN:TKT-PIPE-001',
    canonicalTicketId: 'TKT-PIPE-001',
    createdAt: '2026-06-15T14:00:00',
    vehicle: 'UP40IM3144',
    rawVehicle: 'UP-40-IM-3144',
    driverId: 'DRV-001',
    rawDriverId: 'DRV-001',
    originHub: 'Lucknow',
    kmFromOriginHub: 120,
    destination: 'Kanpur',
    issue: 'alternator failure & electrical outage',
    severity: 'HIGH',
    client: 'Vertex Retail',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'pipe_test',
    sourceFile: 'tickets.json',
  };

  const res1 = await processTicket(validTicket);
  assert(res1.outcome === 'COMPLETED', 'Valid ticket processes to outcome: COMPLETED');
  assert(res1.decision !== undefined, 'Operational decision is computed deterministically');
  assert(res1.selectedVehicle !== null, 'Replacement vehicle is evaluated and selected');
  assert(res1.workOrder !== null, 'Work order is generated');
  assert(res1.workOrderStatus === 'created', 'Work order status is "created" on first run');
  assert(res1.clientMessageDraft !== null, 'Client update draft is composed');
  assert(res1.approvalRecord?.status === 'PENDING', 'Approval record is queued in PENDING status');
  assert(res1.auditEvents.length >= 6, 'Complete audit trail is logged for the ticket');

  console.log('\n--- TEST 2: Duplicate Ticket Handling (Safe Skip) ---');
  const duplicateTicket: QueueTicket = {
    ...validTicket,
    ticketId: 'TKT-PIPE-001-COPY',
    isDuplicate: true,
    status: 'DUPLICATE',
  };
  const res2 = await processTicket(duplicateTicket);
  assert(res2.outcome === 'DUPLICATE_SKIPPED', 'Duplicate ticket is marked DUPLICATE_SKIPPED');
  assert(res2.workOrderStatus === 'skipped', 'Work order creation is skipped for duplicate');
  assert(res2.clientMessageDraft === undefined, 'No client draft created for duplicate');

  console.log('\n--- TEST 3: Quarantined / Malformed Ticket Handling ---');
  const quarantinedTicket: QueueTicket = {
    ...validTicket,
    ticketId: 'TKT-PIPE-BAD',
    issue: '',
    isQuarantined: true,
    status: 'QUARANTINED',
    validationErrors: ['Missing required field: issue'],
  };
  const res3 = await processTicket(quarantinedTicket);
  assert(res3.outcome === 'QUARANTINED', 'Malformed ticket is safely quarantined');
  assert(res3.workOrder === undefined, 'No work order created for quarantined ticket');

  console.log('\n--- TEST 4: Full Queue Batch Processing ---');
  const queueRepo = new QueueRepository();
  const workOrderRepo = new WorkOrderRepository();
  await queueRepo.clear();
  await workOrderRepo.clear();

  const batchValidTicket: QueueTicket = {
    ...validTicket,
    ticketId: 'TKT-BATCH-001',
    idempotencyKey: 'BREAKDOWN:TKT-BATCH-001',
    canonicalTicketId: 'TKT-BATCH-001',
  };
  const batchDupTicket: QueueTicket = {
    ...duplicateTicket,
    ticketId: 'TKT-BATCH-002-DUP',
    idempotencyKey: 'BREAKDOWN:TKT-BATCH-002-DUP',
    canonicalTicketId: 'TKT-BATCH-001',
  };
  const batchQuarantineTicket: QueueTicket = {
    ...quarantinedTicket,
    ticketId: 'TKT-BATCH-003-BAD',
    idempotencyKey: 'BREAKDOWN:TKT-BATCH-003-BAD',
  };

  // Add the test tickets to repository for batch processing
  await queueRepo.upsertQueueTicket(batchValidTicket);
  await queueRepo.upsertQueueTicket(batchDupTicket);
  await queueRepo.upsertQueueTicket(batchQuarantineTicket);

  const batch1 = await processQueue();
  assert(batch1.stats.total === 3, `Processed full queue batch of ${batch1.stats.total} tickets`);
  assert(batch1.stats.processed === 1, `Processed ${batch1.stats.processed} valid tickets`);
  assert(batch1.stats.quarantined === 1, `Identified ${batch1.stats.quarantined} quarantined tickets`);
  assert(batch1.stats.workOrdersCreated === 1, `Created ${batch1.stats.workOrdersCreated} unique work orders`);
  assert(batch1.stats.approvalsPending === 1, `Queued ${batch1.stats.approvalsPending} pending dispatcher approvals`);
  assert(
    batch1.stats.total === batch1.stats.processed + batch1.stats.duplicates + batch1.stats.quarantined + batch1.stats.errors,
    'Queue statistics accounting is 100% consistent (total === sum of outcomes)'
  );

  console.log('\n--- TEST 5: Queue Reprocessing Idempotency (Run 2 Safety) ---');
  const batch2 = await processQueue();
  assert(batch2.stats.workOrdersCreated === 0, 'Run 2: Exactly 0 new work orders created on rerun');
  assert(
    batch2.stats.workOrdersExisting === batch1.stats.workOrdersCreated,
    `Run 2: All existing work orders (${batch2.stats.workOrdersExisting}) safely recognized and returned`
  );

  console.log('\n--- TEST 6: Strict PII Redaction Audit Across Entire Pipeline ---');
  const allWorkOrders = await workOrderRepo.findAll();
  const approvalRepo = new ApprovalRepository();
  const allApprovals = await approvalRepo.findAll();
  const auditRepo = new AuditLogRepository();
  const allAuditLogs = await auditRepo.findAll();

  let piiDetected = false;
  for (const wo of allWorkOrders) {
    if (hasRawPiiLeaks(wo)) piiDetected = true;
  }
  for (const ap of allApprovals) {
    if (hasRawPiiLeaks(ap)) piiDetected = true;
  }
  for (const log of allAuditLogs) {
    if (hasRawPiiLeaks(log)) piiDetected = true;
  }

  assert(!piiDetected, 'Security Leak Audit: Zero raw PII detected across work orders, approvals, and audit logs');

  console.log('\n===================================================================');
  console.log(` MODULE 8 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();
  if (failed > 0) {
    throw new Error(`Module 8 tests failed with ${failed} failure(s)`);
  }
}

runPipelineIntegrationTests().catch((err) => {
  console.error('Module 8 test suite encountered an error:', err);
  process.exit(1);
});
