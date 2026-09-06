import { runIngestion } from '../lib/ingestion';
import { UnifiedContextStore } from '../lib/context';
import { normalizeVehicleReg } from '../lib/normalization';
import { maskPii, REDACTED } from '../lib/pii';
import { answerContextQuery } from '../lib/query';
import { ConflictResolver, FieldCandidate } from '../lib/conflict-resolution';

async function runTests() {
  console.log('====================================================');
  console.log(' RUNNING MANDATORY TEST SUITE - PART A: CONTEXT FOUNDATION');
  console.log('====================================================\n');

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

  const runStatus = await runIngestion();
  const store = UnifiedContextStore.getInstance();

  // Test 1: Duplicate Entity Formats Normalization & Resolution
  console.log('--- TEST GROUP 1: Duplicate Entity Formats ---');
  const reg1 = normalizeVehicleReg('UP-40-IM-3144');
  const reg2 = normalizeVehicleReg('up40im3144');
  const reg3 = normalizeVehicleReg('UP 40 IM 3144');
  assert(reg1 === 'UP40IM3144' && reg2 === 'UP40IM3144' && reg3 === 'UP40IM3144', 'Plate normalization standardizes hyphenated, lowercase, spaced formats');

  const trk1 = normalizeVehicleReg('TRUCK-104');
  const trk2 = normalizeVehicleReg('Truck 104');
  const trk3 = normalizeVehicleReg('TRK104');
  assert(trk1 === 'TRK-104' && trk2 === 'TRK-104' && trk3 === 'TRK-104', 'Truck aliases normalize cleanly to TRK-104');

  const mf1 = normalizeVehicleReg('MF-068');
  const mf2 = normalizeVehicleReg('MF 068');
  assert(mf1 === 'MF-068' && mf2 === 'MF-068', 'Fleet ID aliases normalize cleanly to MF-068');

  // Test 2: PII Masking
  console.log('\n--- TEST GROUP 2: PII Protection Gate ---');
  const rawDriver = {
    name: 'Advik Maharaj',
    phone: '+91 9876543210',
    dl_number: 'HR16 20128663605',
    aadhaar: '6515 3369 7284',
    notes: 'Driver call +91 93118 40522 for pairing',
  };
  const maskedDriver = maskPii(rawDriver).data;

  assert(maskedDriver.phone === REDACTED, 'Structured phone field is masked');
  assert(maskedDriver.dl_number === REDACTED, 'Structured DL number field is masked');
  assert(maskedDriver.aadhaar === REDACTED, 'Structured Aadhaar field is masked');
  assert(maskedDriver.notes.includes(REDACTED), 'Free-text phone number in notes is masked');

  // Test 3: Conflicting Source Records Precedence Rule
  console.log('\n--- TEST GROUP 3: Conflicting Source Records ---');
  const conflictResolver = new ConflictResolver();
  const yearCandidates: FieldCandidate[] = [
    { value: 2018, sourceType: 'fleet_master', sourceFile: 'fleet_master.csv', sourceId: 'fleet_master_RJ43DD3546', recordId: 'RJ43DD3546' },
    { value: 2021, sourceType: 'email_thread', sourceFile: 'thread_21.txt', sourceId: 'thread_21', recordId: 't21' },
  ];
  const resolvedYear = conflictResolver.resolveField<number>('vehicle', 'RJ43DD3546', 'year', yearCandidates, runStatus.ingestionRunId);
  assert(resolvedYear.winningValue === 2018, 'Fleet master precedence overrides email claim for vehicle model year');

  const slaCandidates: FieldCandidate[] = [
    { value: 36, sourceType: 'email_thread', sourceFile: 'thread_01.txt', sourceId: 'thread_01', recordId: 't01' },
    { value: 48, sourceType: 'fleet_master', sourceFile: 'contract', sourceId: 'contract_shakti', recordId: 'shakti' },
  ];
  const resolvedSla = conflictResolver.resolveField<number>('client', 'Shakti Cement', 'operationalSlaHours', slaCandidates, runStatus.ingestionRunId);
  assert(resolvedSla.winningValue === 36, 'Operational SLA agreement overrides paper contract for dispatch planning');

  // Test 4: Missing Data & Quarantine Handling
  console.log('\n--- TEST GROUP 4: Missing Data & Quarantine ---');
  const status = store.getStatus();
  assert(status !== null && status.quarantinedRecords.length > 0, 'Broken records are quarantined cleanly rather than crashing run');
  const badTicket = status?.quarantinedRecords.find((q) => q.recordIdentifier === 'TKT-9102');
  assert(badTicket !== undefined && badTicket.reason !== '', 'Quarantined ticket has explicit reason logged');

  // Test 5: Unsupported Query Handling
  console.log('\n--- TEST GROUP 5: Unsupported Query Handling ---');
  const ungroundedRes = await answerContextQuery('What is the favorite color of the dispatch manager?');
  assert(ungroundedRes.status === 'insufficient_data', 'Unsupported query returns status: insufficient_data');

  // Summary
  console.log('\n====================================================');
  console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
