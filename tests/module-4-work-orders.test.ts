/**
 * Module 4: Work Order & Idempotency Test Suite
 * Validates MongoDB-backed idempotency keys, single-creation guarantees,
 * re-processing safety, and zero duplicate creation under concurrency.
 */

import {
  createWorkOrderIdempotent,
  getWorkOrderByTicket,
  getWorkOrderByIdempotencyKey,
  WorkOrderService,
  CreateWorkOrderInput,
} from '../lib/work-orders';
import { closeMongoDb } from '../lib/db/mongodb';

async function runWorkOrderTests() {
  console.log('===================================================================');
  console.log(' MERIDIAN RESOLVE - MODULE 4: WORK ORDER & IDEMPOTENCY TEST SUITE');
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

  const service = WorkOrderService.getInstance();
  await service.clearAll();

  const ticket1Input: CreateWorkOrderInput = {
    ticketId: 'TKT-WO-001',
    action: 'VEHICLE_REPLACEMENT',
    severity: 'HIGH',
    client: 'Vertex Retail',
    vehicleAssigned: 'UP40IM3144',
    replacementVehicle: 'DL01AB9999',
    driverAssigned: 'DRV-001',
    slaDeadlineHours: 24,
    instructions: ['Dispatch replacement from Lucknow hub', 'Tow broken vehicle to depot'],
    rulesApplied: ['R-004', 'R-012'],
  };

  console.log('--- TEST 1: Run 1 - Work Order Creation ---');
  const run1 = await createWorkOrderIdempotent(ticket1Input);
  assert(run1.status === 'created', 'Run 1: Work order status is "created"');
  assert(run1.workOrderId === 'WO-TKT-WO-001', 'Work order ID matches deterministic scheme');
  assert(run1.idempotencyKey === 'WORK_ORDER:TKT-WO-001', 'Idempotency key is WORK_ORDER:TKT-WO-001');

  const countAfterRun1 = await service.getCount();
  assert(countAfterRun1 === 1, 'Collection count is exactly 1 after Run 1');

  console.log('\n--- TEST 2: Run 2 - Existing Work Order Returned (Idempotent Rerun) ---');
  const run2 = await createWorkOrderIdempotent(ticket1Input);
  assert(run2.status === 'existing', 'Run 2: Re-processing returns status "existing"');
  assert(run2.workOrderId === run1.workOrderId, 'Returned work order ID matches original run 1 ID');
  assert(run2.idempotencyKey === run1.idempotencyKey, 'Returned idempotency key matches original key');

  const countAfterRun2 = await service.getCount();
  assert(countAfterRun2 === 1, 'New work orders created on second run: 0 (count remains 1)');

  console.log('\n--- TEST 3: Retrieval Functions Verification ---');
  const fetchedByTicket = await getWorkOrderByTicket('TKT-WO-001');
  assert(fetchedByTicket !== null, 'getWorkOrderByTicket successfully retrieves work order');
  assert(fetchedByTicket?.workOrderId === 'WO-TKT-WO-001', 'Retrieved work order ID matches');
  assert(fetchedByTicket?.client === 'Vertex Retail', 'Retrieved work order contains client context');

  const fetchedByKey = await getWorkOrderByIdempotencyKey('WORK_ORDER:TKT-WO-001');
  assert(fetchedByKey !== null, 'getWorkOrderByIdempotencyKey successfully retrieves work order');
  assert(fetchedByKey?.ticketId === 'TKT-WO-001', 'Retrieved work order ticketId matches');

  const missingTicket = await getWorkOrderByTicket('TKT-NONEXISTENT');
  assert(missingTicket === null, 'Non-existent ticket returns null without throwing');

  console.log('\n--- TEST 4: High-Concurrency Duplicate Attack ---');
  // Trigger 10 simultaneous concurrent requests for the exact same ticket
  const concurrentInputs = Array.from({ length: 10 }, () => ({ ...ticket1Input, ticketId: 'TKT-CONCURRENT-001' }));
  const concurrentResults = await Promise.all(
    concurrentInputs.map((input) => createWorkOrderIdempotent(input))
  );

  const createdCount = concurrentResults.filter((r) => r.status === 'created').length;
  const existingCount = concurrentResults.filter((r) => r.status === 'existing').length;
  const allIdsMatch = concurrentResults.every((r) => r.workOrderId === 'WO-TKT-CONCURRENT-001');

  assert(createdCount === 1, 'Exactly 1 concurrent request succeeded with status: "created"');
  assert(existingCount === 9, 'All remaining 9 concurrent requests safely returned status: "existing"');
  assert(allIdsMatch, 'All concurrent requests returned the identical canonical workOrderId');

  console.log('\n--- TEST 5: Batch Queue Simulation (Double Processing) ---');
  // Process 5 distinct tickets in batch 1
  const batchTickets: CreateWorkOrderInput[] = [1, 2, 3, 4, 5].map((i) => ({
    ticketId: `TKT-BATCH-00${i}`,
    action: 'VEHICLE_REPLACEMENT',
    severity: 'MEDIUM',
    client: 'Shakti Cement',
    vehicleAssigned: `VEH-00${i}`,
  }));

  const batchRun1 = await Promise.all(batchTickets.map((t) => createWorkOrderIdempotent(t)));
  const batch1Created = batchRun1.filter((r) => r.status === 'created').length;
  assert(batch1Created === 5, 'Batch Pass 1: Exactly 5 work orders created');

  // Re-process the exact same 5 tickets in batch 2
  const batchRun2 = await Promise.all(batchTickets.map((t) => createWorkOrderIdempotent(t)));
  const batch2Created = batchRun2.filter((r) => r.status === 'created').length;
  const batch2Existing = batchRun2.filter((r) => r.status === 'existing').length;

  assert(batch2Created === 0, 'Batch Pass 2: Exactly 0 new work orders created');
  assert(batch2Existing === 5, 'Batch Pass 2: All 5 return status: "existing"');

  const totalFinalCount = await service.getCount();
  // 1 from Test 1 + 1 from Test 4 + 5 from Test 5 = 7 total
  assert(totalFinalCount === 7, `Final work order collection count is exactly 7 (actual: ${totalFinalCount})`);

  console.log('\n===================================================================');
  console.log(` MODULE 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();
  process.exit(failed > 0 ? 1 : 0);
}

runWorkOrderTests().catch((err) => {
  console.error('Module 4 tests failed:', err);
  process.exit(1);
});
