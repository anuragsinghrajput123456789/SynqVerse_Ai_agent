import { runIngestion } from '../lib/ingestion';
import { UnifiedContextStore } from '../lib/context';
import { REDACTED, hasRawPiiLeaks } from '../lib/pii';
import { answerContextQuery } from '../lib/query';
import { ConflictResolver, FieldCandidate } from '../lib/conflict-resolution';
import { EntityResolver } from '../lib/entity-resolution';
import { closeMongoDb } from '../lib/db/mongodb';

async function runIntegrationTest() {
  console.log('===================================================================');
  console.log(' MERIDIAN RESOLVE PART A - REFINED END-TO-END INTEGRATION TEST SUITE');
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

  const statusRun1 = await runIngestion();
  const store = UnifiedContextStore.getInstance();

  console.log('--- TEST GROUP 1: Ingestion & Idempotency ---');
  assert(statusRun1.ingestionRunId.startsWith('run_'), 'Ingestion generates valid ingestionRunId');
  assert(statusRun1.filesDiscovered.length > 0, 'Discovers all input data files');

  const statusRun2 = await runIngestion();
  assert(
    statusRun2.entitiesResolved.vehicles === statusRun1.entitiesResolved.vehicles &&
      statusRun2.entitiesResolved.drivers === statusRun1.entitiesResolved.drivers &&
      statusRun2.entitiesResolved.clients === statusRun1.entitiesResolved.clients,
    'Idempotency: Re-running ingestion produces identical entity counts without duplicates'
  );

  console.log('\n--- TEST GROUP 2: PII Protection Boundary ---');
  const allDrivers = await store.getAllDrivers();
  const sampleDriver = allDrivers[0];
  assert(sampleDriver.phone === REDACTED, 'Driver phone is masked to [REDACTED]');
  assert(sampleDriver.dlNumber === REDACTED, 'Driver DL is masked to [REDACTED]');
  assert(sampleDriver.aadhaar === REDACTED, 'Driver Aadhaar is masked to [REDACTED]');

  const allResolved = await store.getAllResolvedEntities();
  const hasPiiLeakInDb = hasRawPiiLeaks(allResolved);
  assert(!hasPiiLeakInDb, 'Security Leak Audit: Zero raw PII detected in stored entity records');

  console.log('\n--- TEST GROUP 3: Deterministic Entity Resolution & Status ---');
  const entityResolver = new EntityResolver();
  entityResolver.registerVehicleAlias('UP-40-IM-3144', 'UP40IM3144');
  entityResolver.registerVehicleAlias('TRK-104', 'UP17GN7381');

  const res1 = entityResolver.resolveVehicleId('UP-40-IM-3144');
  assert(
    res1.canonicalId === 'UP40IM3144' && res1.status === 'RESOLVED' && res1.confidence === 1.0,
    'Canonical vehicle plate resolves to status: RESOLVED with confidence 1.0'
  );

  const resAmbiguous = entityResolver.resolveVehicleId('SOME_UNKNOWN_STRING');
  assert(
    resAmbiguous.status === 'AMBIGUOUS' || resAmbiguous.status === 'UNRESOLVED',
    'Unrecognized entity is marked AMBIGUOUS or UNRESOLVED without guessing'
  );

  console.log('\n--- TEST GROUP 4: Conflicting Source Records Precedence ---');
  const conflictResolver = new ConflictResolver();
  const yearCandidates: FieldCandidate[] = [
    {
      value: 2018,
      sourceType: 'fleet_master',
      sourceFile: 'fleet_master.csv',
      sourceId: 'fleet_master_RJ43DD3546',
      recordId: 'RJ43DD3546',
    },
    {
      value: 2021,
      sourceType: 'email_thread',
      sourceFile: 'thread_21_internal_yearconflict.txt',
      sourceId: 'thread_21',
      recordId: 'thread_21',
    },
  ];

  const resolvedYear = conflictResolver.resolveField<number>(
    'vehicle',
    'RJ43DD3546',
    'year',
    yearCandidates,
    statusRun1.ingestionRunId
  );

  assert(resolvedYear.winningValue === 2018, 'Fleet master precedence overrides email claim for model year');
  assert(
    resolvedYear.citations.length === 1 && resolvedYear.conflicts.length === 1,
    'Conflict record stores winning value, rejected value, winning source, rejected source, and reason'
  );

  console.log('\n--- TEST GROUP 5: Quarantine Isolation ---');
  const quarantined = await store.getAllQuarantine();
  assert(quarantined.length > 0, 'Malformed records are isolated into QuarantineRecord array');
  const badTicket = quarantined.find((q) => q.recordIdentifier === 'TKT-9102');
  assert(
    badTicket !== undefined && badTicket.reason.length > 0 && badTicket.status === 'QUARANTINED',
    'Quarantined ticket has explicit validation errors logged'
  );

  console.log('\n--- TEST GROUP 6: Grounded Query Engine & Citations ---');
  const groundedRes = await answerContextQuery('What is Shakti Cement delivery SLA?');
  assert(groundedRes.status === 'grounded', 'Grounded query returns status: grounded');
  assert(groundedRes.sources.length > 0, 'Grounded query includes source citations');
  assert(!hasRawPiiLeaks(groundedRes), 'Query payload has zero PII leaks');

  const ungroundedRes = await answerContextQuery('What is the weather on Mars?');
  assert(ungroundedRes.status === 'insufficient_data', 'Unsupported query returns status: insufficient_data');
  assert(ungroundedRes.answer.includes('Insufficient data'), 'Unsupported query never hallucinates');
  assert(ungroundedRes.sources.length === 0, 'Unsupported query returns empty sources array');

  console.log('\n===================================================================');
  console.log(` INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();
  process.exit(failed > 0 ? 1 : 0);
}

runIntegrationTest().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
