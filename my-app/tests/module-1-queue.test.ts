import { BreakdownQueueService } from '../lib/queue';
import { UnifiedContextStore } from '../lib/context';
import { hasRawPiiLeaks } from '../lib/pii';
import { runIngestion } from '../lib/ingestion';
import { closeMongoDb } from '../lib/db/mongodb';
import { QueueRepository } from '../lib/repositories';

async function runQueueModuleTests() {
  console.log('===================================================================');
  console.log(' MERIDIAN RESOLVE - MODULE 1: BREAKDOWN QUEUE TEST SUITE');
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

  // 0. Ensure clean state & Context Foundation initialized
  const queueRepo = new QueueRepository();
  await queueRepo.clear();
  await runIngestion();

  const queueService = BreakdownQueueService.getInstance();
  const store = UnifiedContextStore.getInstance();

  console.log('--- TEST 1: Valid Ticket Ingestion & READY State ---');
  const customValidTicket = [
    {
      ticket_id: 'TKT-TEST-001',
      created_at: '2026-08-15T10:00:00',
      vehicle: 'UP-40-IM-3144',
      driver_id: 'DRV-001',
      origin_hub: 'Lucknow',
      km_from_origin_hub: 25,
      destination: 'Delhi',
      issue: 'alternator failure',
      severity: 'HIGH',
      client: 'Shakti Cement',
      status: 'OPEN',
      phone: '+91 93118 40522',
      dl_number: 'HR16 20128663605',
    },
  ];

  await queueService.ingestTickets({ customTickets: customValidTicket });
  const tkt1 = await store.getQueueTicket('TKT-TEST-001');

  assert(tkt1 !== null, 'Valid ticket is ingested into store');
  assert(tkt1?.status === 'READY', 'Valid ticket is classified into status: READY');
  assert(tkt1?.vehicle === 'UP40IM3144', 'Vehicle registration is normalized deterministically');
  assert(tkt1?.idempotencyKey === 'BREAKDOWN:TKT-TEST-001', 'Ticket has canonical idempotency key BREAKDOWN:TKT-TEST-001');
  assert(tkt1?.isDuplicate === false, 'Valid ticket is marked isDuplicate: false');
  assert(tkt1?.isQuarantined === false, 'Valid ticket is marked isQuarantined: false');

  console.log('\n--- TEST 2: Duplicate Ticket Detection ---');
  const duplicateFeed = [
    {
      ticket_id: 'TKT-TEST-002',
      vehicle: 'DL-64-IB-1058',
      driver_id: 'DRV-002',
      issue: 'turbo failure',
      client: 'Orion Pharma',
    },
    {
      ticket_id: 'TKT-TEST-002', // Duplicate occurrence
      vehicle: 'DL-64-IB-1058',
      driver_id: 'DRV-002',
      issue: 'turbo failure (sync copy)',
      client: 'Orion Pharma',
    },
  ];

  const resDup = await queueService.ingestTickets({ customTickets: duplicateFeed });
  assert(resDup.validTickets.length === 1, 'First occurrence is classified as valid ticket');
  assert(resDup.duplicateTickets.length === 1, 'Second occurrence is detected as DUPLICATE');
  assert(resDup.duplicateTickets[0].status === 'DUPLICATE', 'Duplicate record has status: DUPLICATE');
  assert(resDup.duplicateTickets[0].duplicateOf === 'TKT-TEST-002', 'Duplicate record references canonical ticket ID');

  console.log('\n--- TEST 3: Multiple Duplicate Copies ---');
  const multiDupFeed = [
    { ticket_id: 'TKT-TEST-003', vehicle: 'CH40IK6238', driver_id: 'DRV-003', issue: 'clutch issue', client: 'Apex' },
    { ticket_id: 'TKT-TEST-003', vehicle: 'CH40IK6238', driver_id: 'DRV-003', issue: 'clutch issue', client: 'Apex' },
    { ticket_id: 'TKT-TEST-003', vehicle: 'CH40IK6238', driver_id: 'DRV-003', issue: 'clutch issue', client: 'Apex' },
  ];

  const resMultiDup = await queueService.ingestTickets({ customTickets: multiDupFeed });
  assert(resMultiDup.validTickets.length === 1, 'Only exactly 1 canonical valid ticket created for multiple copies');
  assert(resMultiDup.duplicateTickets.length === 2, 'All 2 subsequent copies marked as DUPLICATE');

  console.log('\n--- TEST 4: Missing Critical Fields (Quarantine) ---');
  const missingFieldFeed = [
    {
      ticket_id: 'TKT-TEST-BAD1',
      vehicle: 'UP40IM3144',
      issue: '',
      client: 'Shakti Cement',
    },
    {
      ticket_id: '',
      vehicle: 'UP40IM3144',
      issue: 'radiator leak',
      client: 'Shakti Cement',
    },
  ];

  const resMissing = await queueService.ingestTickets({ customTickets: missingFieldFeed });
  assert(resMissing.quarantinedTickets.length === 2, 'Tickets missing required fields are quarantined');
  assert(resMissing.quarantinedTickets[0].status === 'QUARANTINED', 'Quarantined ticket has status: QUARANTINED');
  assert(
    resMissing.quarantinedTickets[0].quarantineReason?.includes('Missing failure/issue description') === true,
    'Quarantine reason accurately reflects missing issue field'
  );

  console.log('\n--- TEST 5: Malformed Vehicle Identification (Quarantine) ---');
  const malformedFeed = [
    {
      ticket_id: 'TKT-TEST-BAD2',
      vehicle: 'hr??unknown_vehicle_xyz',
      issue: 'starter motor failure',
      client: 'Vertex Retail',
    },
  ];

  const resMalformed = await queueService.ingestTickets({ customTickets: malformedFeed });
  assert(resMalformed.quarantinedTickets.length === 1, 'Malformed vehicle record is quarantined');
  assert(
    resMalformed.quarantinedTickets[0].validationErrors?.[0].includes('Unrecognized or invalid vehicle') === true,
    'Validation error explicitly explains unrecognized vehicle'
  );

  console.log('\n--- TEST 6: PII Masking & Security Leak Audit ---');
  const rawPiiTicket = [
    {
      ticket_id: 'TKT-TEST-PII',
      vehicle: 'UP-40-IM-3144',
      driver_id: 'DRV-001',
      issue: 'engine oil leak',
      phone: '+91 93118 40522',
      driver_phone: '9311840522',
      aadhaar: '6515 3369 7284',
      dl_number: 'HR16 20128663605',
    },
  ];

  await queueService.ingestTickets({ customTickets: rawPiiTicket });
  const piiTicket = await store.getQueueTicket('TKT-TEST-PII');
  const allTickets = await store.getAllQueueTickets();

  assert(!hasRawPiiLeaks(piiTicket), 'Single queue ticket contains zero raw PII digits');
  assert(!hasRawPiiLeaks(allTickets), 'Entire queue collection contains zero raw PII leaks');

  console.log('\n--- TEST 7: Ingestion Idempotency (Rerun Safety) ---');
  // First run of challenge tickets.json
  await queueService.ingestTickets();
  const beforeStats = await store.getQueueStats();
  // Second run of challenge tickets.json
  await queueService.ingestTickets();
  const afterStats = await store.getQueueStats();

  assert(
    beforeStats.total === afterStats.total && beforeStats.valid === afterStats.valid,
    'Idempotent Rerun: Total tickets and valid counts remain unchanged after rerun'
  );

  console.log('\n--- TEST 8: Quarantine Isolation & Listing ---');
  const quarantinedList = await queueService.getQuarantineTickets();
  assert(quarantinedList.length > 0, 'Quarantined tickets are queryable');
  assert(
    quarantinedList.every((q) => q.isQuarantined && q.status === 'QUARANTINED'),
    'All quarantined records have isQuarantined: true and status: QUARANTINED'
  );

  console.log('\n--- TEST 9: Ticket Processing & Downstream Duplicate Safety ---');
  const processedTkt = await queueService.processTicket('TKT-TEST-001', 'PROCESSING');
  assert(processedTkt?.status === 'PROCESSING', 'Valid ticket transitions to PROCESSING');

  const dupTktId = resDup.duplicateTickets[0].ticketId;
  const dupAttempt = await queueService.processTicket(dupTktId, 'PROCESSING');
  assert(dupAttempt?.status === 'DUPLICATE', 'Duplicate ticket cannot be processed downstream (safety enforced)');

  console.log('\n--- TEST 10: Ticket Detail Context Linking ---');
  const detail = await queueService.getTicketDetail('TKT-0027');
  assert(detail.ticket !== null, 'Ticket details retrieved successfully');
  assert(detail.ticket?.vehicle === 'UP40IM3144', 'Ticket vehicle is linked');
  assert(detail.driverContext !== null, 'Driver context is resolved from Context Store');
  assert(detail.clientContext !== null, 'Client SLA context is resolved from Context Store');

  console.log('\n===================================================================');
  console.log(` MODULE 1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();
  process.exit(failed > 0 ? 1 : 0);
}

runQueueModuleTests().catch((err) => {
  console.error('Module 1 tests failed:', err);
  process.exit(1);
});
