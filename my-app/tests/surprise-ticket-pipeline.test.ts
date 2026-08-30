/**
 * Surprise Ticket Format & Controlled Schema Adapter Integration Test Suite
 * 
 * Tests the complete end-to-end pipeline against surprise / changed ticket formats:
 * - Field variations: ticket_id / ticketId / id, vehicle_id / vehicleId / vehicle, client / client_name / clientName, etc.
 * - Unknown field preservation
 * - Strict required field validation
 * - Quarantine classification of uninterpretable records
 * - Full pipeline integration: Validation -> PII Redaction -> Entity Resolution -> Decision -> Work Order -> Approvals -> Audit
 */

import { BreakdownQueueService } from '../lib/queue';
import { processQueue } from '../lib/pipeline';
import { runIngestion } from '../lib/ingestion';
import { QueueRepository, DecisionRepository } from '../lib/repositories';
import { WorkOrderRepository } from '../lib/work-orders';
import { ApprovalRepository } from '../lib/approvals';
import { AuditLogRepository } from '../lib/audit';
import { closeMongoDb } from '../lib/db/mongodb';
import { hasRawPiiLeaks } from '../lib/pii';
import { TicketSchemaAdapter } from '../lib/adapters/ticket-schema-adapter';

async function runSurpriseTicketPipelineTests() {
  console.log('===================================================================');
  console.log(' MERIDIAN RESOLVE / GRAFITY - SURPRISE TICKET PIPELINE TEST SUITE');
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

  // Ingest base fleet master, drivers roster, maintenance logs
  await runIngestion();

  // Clear queue, decisions, work orders, approvals, audit logs for clean isolated surprise feed testing
  await new QueueRepository().clear();
  await new DecisionRepository().clear();
  await new WorkOrderRepository().clear();
  await new ApprovalRepository().clear();
  await new AuditLogRepository().clear();

  // Test Fixture: Surprise ticket payloads with varied formats
  const surpriseTicketBatch: Record<string, unknown>[] = [
    // 1. CamelCase format with alternate keys & extra telematics field + PII phone
    {
      ticketId: 'TKT-SURP-001',
      vehicleId: 'UP40IM3144',
      driverId: 'DRV-001',
      clientName: 'Vertex Retail',
      issueDescription: 'alternator failure & total electrical outage on highway',
      priority: 'HIGH',
      sourceHub: 'Lucknow',
      targetHub: 'Kanpur',
      distanceKm: 120,
      reportedAt: '2026-07-10T11:00:00Z',
      telematicsFaultCode: 'SPN-168-FMI-1',
      driverPhone: '9876543210',
    },
    // 2. Hybrid format with id, vehicle, customer, problem & extra temp field + PII Aadhaar
    {
      id: 'TKT-SURP-002',
      vehicle: 'RJ43DD3546',
      driver: 'DRV-002',
      customer: 'Shakti Cement',
      problem: 'radiator hose burst and engine overheating',
      severity_level: 'HIGH',
      from_hub: 'Jaipur',
      delivery_location: 'Delhi',
      distance_from_hub: 40,
      timestamp: '2026-07-10T12:00:00Z',
      ambientTempCelsius: 43.5,
      driverAadhaar: '2345-6789-0123',
    },
    // 3. Malformed: Missing issue description (cannot be safely interpreted)
    {
      id: 'TKT-SURP-003-BAD',
      vehicleId: 'UP33PG6813',
      clientName: 'Orion Pharma',
      issue: '',
      sourceHub: 'Lucknow',
    },
    // 4. Malformed: Unrecognized ghost vehicle (cannot resolve entity)
    {
      ticketNumber: 'TKT-SURP-004-GHOST',
      vehicle: 'GHOST_VEHICLE_9999',
      driverId: 'DRV-003',
      clientName: 'Apex Chemicals',
      issue: 'brake lining worn out',
      originHub: 'Delhi',
      destination: 'Jaipur',
      kmFromOriginHub: 80,
    },
  ];

  console.log('--- TEST 1: Controlled Schema Adapter Unit Analysis ---');
  const adaptRes1 = TicketSchemaAdapter.adapt(surpriseTicketBatch[0]);
  assert(adaptRes1.success === true, 'Adapter succeeds on CamelCase schema');
  assert(adaptRes1.adaptedRecord?.ticketId === 'TKT-SURP-001', 'Mapped ticketId correctly from ticketId');
  assert(adaptRes1.adaptedRecord?.vehicle === 'UP40IM3144', 'Mapped vehicle correctly from vehicleId');
  assert(adaptRes1.adaptedRecord?.client === 'Vertex Retail', 'Mapped client correctly from clientName');
  assert(
    adaptRes1.adaptedRecord?.issue === 'alternator failure & total electrical outage on highway',
    'Mapped issue correctly from issueDescription'
  );
  assert(adaptRes1.adaptedRecord?.kmFromOriginHub === 120, 'Mapped kmFromOriginHub correctly from distanceKm');
  assert(
    adaptRes1.adaptedRecord?.preservedUnknownFields['telematicsFaultCode'] === 'SPN-168-FMI-1',
    'Preserved unknown telematicsFaultCode field without data loss'
  );

  const adaptRes2 = TicketSchemaAdapter.adapt(surpriseTicketBatch[1]);
  assert(adaptRes2.success === true, 'Adapter succeeds on Hybrid schema');
  assert(adaptRes2.adaptedRecord?.ticketId === 'TKT-SURP-002', 'Mapped ticketId from id');
  assert(adaptRes2.adaptedRecord?.client === 'Shakti Cement', 'Mapped client from customer');
  assert(
    adaptRes2.adaptedRecord?.preservedUnknownFields['ambientTempCelsius'] === 43.5,
    'Preserved unknown ambientTempCelsius field'
  );

  const adaptRes3 = TicketSchemaAdapter.adapt(surpriseTicketBatch[2]);
  assert(adaptRes3.success === false, 'Adapter rejects payload with empty issue');
  assert(
    adaptRes3.validationErrors.some((e) => e.includes('Missing required breakdown issue')),
    'Validation error explicitly flags missing breakdown issue'
  );

  console.log('\n--- TEST 2: Ingest Surprise Tickets Through Breakdown Queue ---');
  const queueService = BreakdownQueueService.getInstance();
  const ingestResult = await queueService.ingestTickets({
    customTickets: surpriseTicketBatch,
    sourceFile: 'surprise_tickets_feed.json',
  });

  console.log('ingestResult Valid Tickets:', ingestResult.validTickets.map(t => ({ id: t.ticketId, status: t.status })));
  console.log('ingestResult Quarantined Tickets:', ingestResult.quarantinedTickets.map(t => ({ id: t.ticketId, status: t.status, errors: t.validationErrors })));

  assert(ingestResult.totalRecordsProcessed === 4, 'Ingested all 4 surprise records');
  assert(ingestResult.validTickets.length === 2, 'Exactly 2 valid surprise tickets classified as READY');
  assert(ingestResult.quarantinedTickets.length === 2, 'Exactly 2 malformed surprise tickets QUARANTINED');

  console.log('\n--- TEST 3: Full Pipeline Execution on Surprise Tickets ---');
  const pipelineResult = await processQueue();

  assert(pipelineResult.stats.total === 4, 'Pipeline processed full batch of 4 tickets');
  assert(pipelineResult.stats.processed === 2, 'Processed 2 valid surprise tickets');
  assert(pipelineResult.stats.quarantined === 2, 'Quarantined 2 malformed surprise tickets');
  assert(pipelineResult.stats.workOrdersCreated === 2, 'Created exactly 2 work orders for valid tickets');
  assert(pipelineResult.stats.approvalsPending === 2, 'Queued 2 dispatcher approvals');

  console.log('\n--- TEST 4: PII Masking & Security Invariants Verification ---');
  const workOrderRepo = new WorkOrderRepository();
  const approvalRepo = new ApprovalRepository();
  const auditRepo = new AuditLogRepository();

  const allWOs = await workOrderRepo.findAll();
  const allApprovals = await approvalRepo.findAll();
  const allAuditLogs = await auditRepo.findAll();

  let piiDetected = false;
  for (const wo of allWOs) {
    if (hasRawPiiLeaks(wo)) piiDetected = true;
  }
  for (const ap of allApprovals) {
    if (hasRawPiiLeaks(ap)) piiDetected = true;
  }
  for (const log of allAuditLogs) {
    if (hasRawPiiLeaks(log)) piiDetected = true;
  }
  assert(!piiDetected, 'Security Leak Audit: Zero raw PII detected across work orders, approvals, and audit logs');

  console.log('\n--- TEST 5: Entity Resolution & Rule Execution Verification ---');
  const decisionRepo = new DecisionRepository();
  const dec1 = await decisionRepo.findByTicketId('TKT-SURP-001');
  const dec2 = await decisionRepo.findByTicketId('TKT-SURP-002');

  assert(dec1 !== null, 'Decision generated for TKT-SURP-001');
  assert(dec1?.action === 'VEHICLE_REPLACEMENT', 'Decision action evaluated as VEHICLE_REPLACEMENT');
  assert(dec1?.selectedVehicle !== null, 'Replacement vehicle selected for TKT-SURP-001');
  assert(dec1?.rulesApplied.length ? dec1.rulesApplied.length > 0 : false, 'Dispatcher rules evaluated for TKT-SURP-001');

  assert(dec2 !== null, 'Decision generated for TKT-SURP-002');
  assert(dec2?.selectedVehicle !== null, 'Replacement vehicle selected for TKT-SURP-002');

  console.log('\n--- TEST 6: Work Order Idempotency (Run 2 Reprocessing Safety) ---');
  const rerunResult = await processQueue();
  assert(rerunResult.stats.workOrdersCreated === 0, 'Rerun Pass: Exactly 0 new work orders created');
  assert(rerunResult.stats.workOrdersExisting === 2, 'Rerun Pass: All 2 existing work orders recognized idempotently');

  console.log('\n--- TEST 7: Comprehensive Audit Trail Creation ---');
  const auditTkt1 = await auditRepo.findByTicketId('TKT-SURP-001');
  assert(auditTkt1.length >= 6, 'Full lifecycle audit events created for TKT-SURP-001');
  assert(
    auditTkt1.some((e) => e.eventType === 'RULE_EVALUATED'),
    'Audit trail contains RULE_EVALUATED event'
  );
  assert(
    auditTkt1.some((e) => e.eventType === 'WORK_ORDER_CREATED'),
    'Audit trail contains WORK_ORDER_CREATED event'
  );

  console.log('\n===================================================================');
  console.log(` SURPRISE TICKET TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();
  if (failed > 0) {
    throw new Error(`Surprise ticket tests failed with ${failed} failure(s)`);
  }
}

runSurpriseTicketPipelineTests().catch((err) => {
  console.error('Surprise ticket test suite encountered an error:', err);
  process.exit(1);
});
