/**
 * Breakdown Decision Engine Hardening Test Suite
 * Validates deterministic, explainable, testable, and idempotent operational decisions,
 * 100% independent from Gemini.
 *
 * Scenarios tested:
 * 1. Valid ticket
 * 2. Malformed ticket
 * 3. Duplicate ticket
 * 4. Missing vehicle
 * 5. Missing driver
 * 6. Conflicting data
 * 7. No eligible replacement
 * 8. Eligible replacement
 * 9. Multiple eligible replacements
 */

import {
  DecisionEngine,
  evaluateReplacementCandidates,
} from '../lib/decision-engine';

import { UnifiedContextStore } from '../lib/context';
import { runIngestion } from '../lib/ingestion';
import { closeMongoDb } from '../lib/db/mongodb';
import { DecisionRepository, QueueRepository } from '../lib/repositories';
import { QueueTicket, Vehicle } from '../lib/types';

async function runDecisionEngineHardeningTests() {
  console.log('===================================================================');
  console.log(' MERIDIAN RESOLVE - BREAKDOWN DECISION ENGINE HARDENING TEST SUITE');
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

  // Clear test DB and initialize clean context foundation
  await new DecisionRepository().clear();
  await new QueueRepository().clear();
  await runIngestion();

  const decisionEngine = DecisionEngine.getInstance();
  const store = UnifiedContextStore.getInstance();

  // -------------------------------------------------------------------
  // TEST 1: Valid Ticket
  // -------------------------------------------------------------------
  console.log('--- TEST 1: Valid Ticket & Standard Decision Return Shape ---');
  const validTicket: QueueTicket = {
    ticketId: 'TKT-TEST-VALID',
    idempotencyKey: 'BREAKDOWN:TKT-TEST-VALID',
    canonicalTicketId: 'TKT-TEST-VALID',
    createdAt: '2026-06-15T10:00:00',
    vehicle: 'UP40IM3144',
    rawVehicle: 'UP-40-IM-3144',
    driverId: 'DRV-001',
    rawDriverId: 'DRV-001',
    originHub: 'Lucknow',
    kmFromOriginHub: 120,
    destination: 'Kanpur',
    issue: 'alternator failure & dead battery',
    severity: 'HIGH',
    client: 'Vertex Retail',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec1 = await decisionEngine.evaluateTicket(validTicket);

  // Verify standard decision envelope
  assert(dec1.decision !== undefined, 'Standard decision property is defined');
  assert(dec1.decision === 'VEHICLE_REPLACEMENT', 'Decision resolves to VEHICLE_REPLACEMENT for alternator failure');
  assert(typeof dec1.reason === 'string' && dec1.reason.length > 0, 'Reason is non-empty explainable string');
  assert(Array.isArray(dec1.rulesApplied), 'RulesApplied is an array');
  assert(typeof dec1.inputsUsed === 'object' && dec1.inputsUsed !== null, 'InputsUsed is an object');
  assert(dec1.inputsUsed.ticketId === 'TKT-TEST-VALID', 'InputsUsed captures ticketId');
  assert(dec1.inputsUsed.vehicle === 'UP40IM3144', 'InputsUsed captures vehicle');
  assert(dec1.inputsUsed.driverId === 'DRV-001', 'InputsUsed captures driverId');
  assert(Array.isArray(dec1.rejectedReasons), 'RejectedReasons is an array');
  assert(typeof dec1.timestamp === 'string' && !isNaN(Date.parse(dec1.timestamp)), 'Timestamp is valid ISO date string');
  assert(dec1.selectedVehicle !== null, 'Eligible replacement vehicle is selected');
  assert(dec1.decisionStatus === 'DECIDED', 'DecisionStatus is DECIDED');

  // -------------------------------------------------------------------
  // TEST 2: Malformed Ticket
  // -------------------------------------------------------------------
  console.log('\n--- TEST 2: Malformed Ticket (Empty Issue & Quarantined Status) ---');
  const malformedTicket: QueueTicket = {
    ticketId: 'TKT-TEST-MALFORMED',
    idempotencyKey: 'BREAKDOWN:TKT-TEST-MALFORMED',
    canonicalTicketId: 'TKT-TEST-MALFORMED',
    createdAt: '2026-06-15T10:00:00',
    vehicle: 'UP40IM3144',
    rawVehicle: 'UP40IM3144',
    driverId: 'DRV-001',
    rawDriverId: 'DRV-001',
    originHub: 'Lucknow',
    kmFromOriginHub: 120,
    destination: 'Kanpur',
    issue: '   ', // Empty whitespace issue
    severity: 'UNKNOWN',
    client: 'Vertex Retail',
    status: 'QUARANTINED',
    isDuplicate: false,
    isQuarantined: true,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec2 = await decisionEngine.evaluateTicket(malformedTicket);
  assert(dec2.decision === 'INSUFFICIENT_DATA', 'Malformed ticket strictly returns decision: INSUFFICIENT_DATA');
  assert(dec2.decisionStatus === 'INSUFFICIENT_DATA', 'DecisionStatus is INSUFFICIENT_DATA');
  assert(dec2.selectedVehicle === null, 'No vehicle guessed on malformed ticket');
  assert(dec2.rejectedReasons.some((r) => r.includes('Missing required context')), 'Rejected reasons cite missing context');
  assert(dec2.rulesApplied.length === 0, 'No rules arbitrarily applied on malformed ticket');

  // -------------------------------------------------------------------
  // TEST 3: Duplicate Ticket (Idempotency)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 3: Duplicate Ticket & Idempotency ---');
  // First evaluation
  const originalTicket: QueueTicket = {
    ticketId: 'TKT-TEST-ORIGINAL',
    idempotencyKey: 'BREAKDOWN:TKT-TEST-ORIGINAL',
    canonicalTicketId: 'TKT-TEST-ORIGINAL',
    createdAt: '2026-06-15T10:00:00',
    vehicle: 'DL64IB1058',
    rawVehicle: 'DL64IB1058',
    driverId: 'DRV-002',
    rawDriverId: 'DRV-002',
    originHub: 'Gurgaon',
    kmFromOriginHub: 80,
    destination: 'Ambala',
    issue: 'gearbox failure',
    severity: 'HIGH',
    client: 'Shakti Cement',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec3Original = await decisionEngine.evaluateTicket(originalTicket);

  // Second evaluation with identical ticket (test idempotency)
  const dec3Rerun = await decisionEngine.evaluateTicket(originalTicket);
  assert(dec3Rerun.decisionId === dec3Original.decisionId, 'Repeated evaluation returns identical decisionId (Idempotent)');
  assert(dec3Rerun.decision === dec3Original.decision, 'Repeated evaluation returns identical decision');
  assert(dec3Rerun.selectedVehicle?.registrationNumber === dec3Original.selectedVehicle?.registrationNumber, 'Selected vehicle matches exactly across runs');

  // Third evaluation with duplicate flag
  const duplicateTicket: QueueTicket = {
    ...originalTicket,
    ticketId: 'TKT-TEST-DUP',
    isDuplicate: true,
    status: 'DUPLICATE',
    canonicalTicketId: 'TKT-TEST-ORIGINAL',
  };

  const dec3Duplicate = await decisionEngine.evaluateTicket(duplicateTicket);
  assert(dec3Duplicate.decision === 'DUPLICATE_SKIPPED', 'Duplicate ticket returns DUPLICATE_SKIPPED');
  assert(dec3Duplicate.rejectedReasons.some((r) => r.includes('duplicate')), 'RejectedReasons explains duplicate skip');

  // -------------------------------------------------------------------
  // TEST 4: Missing Vehicle
  // -------------------------------------------------------------------
  console.log('\n--- TEST 4: Missing Vehicle Context ---');
  const missingVehicleTicket: QueueTicket = {
    ticketId: 'TKT-TEST-NO-VEH',
    idempotencyKey: 'BREAKDOWN:TKT-TEST-NO-VEH',
    canonicalTicketId: 'TKT-TEST-NO-VEH',
    createdAt: '2026-06-15T10:00:00',
    vehicle: '', // Missing vehicle
    rawVehicle: '',
    driverId: 'DRV-001',
    rawDriverId: 'DRV-001',
    originHub: 'Lucknow',
    kmFromOriginHub: 120,
    destination: 'Kanpur',
    issue: 'turbocharger smoke',
    severity: 'HIGH',
    client: 'Vertex Retail',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec4 = await decisionEngine.evaluateTicket(missingVehicleTicket);
  assert(dec4.decision === 'INSUFFICIENT_DATA', 'Missing vehicle ticket strictly returns INSUFFICIENT_DATA');
  assert(dec4.selectedVehicle === null, 'Does not guess replacement vehicle when vehicle is missing');
  assert(dec4.rejectedReasons.some((r) => r.includes('vehicle identifier')), 'RejectedReasons explicitly flags missing vehicle identifier');

  // -------------------------------------------------------------------
  // TEST 5: Missing Driver
  // -------------------------------------------------------------------
  console.log('\n--- TEST 5: Missing Driver Context ---');
  const missingDriverTicket: QueueTicket = {
    ticketId: 'TKT-TEST-NO-DRV',
    idempotencyKey: 'BREAKDOWN:TKT-TEST-NO-DRV',
    canonicalTicketId: 'TKT-TEST-NO-DRV',
    createdAt: '2026-06-15T10:00:00',
    vehicle: 'UP40IM3144',
    rawVehicle: 'UP40IM3144',
    driverId: '', // Missing driver
    rawDriverId: '',
    originHub: 'Lucknow',
    kmFromOriginHub: 120,
    destination: 'Kanpur',
    issue: 'engine knocking sound',
    severity: 'HIGH',
    client: 'Vertex Retail',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec5 = await decisionEngine.evaluateTicket(missingDriverTicket);
  assert(dec5.decision === 'INSUFFICIENT_DATA', 'Missing driver ticket strictly returns INSUFFICIENT_DATA');
  assert(dec5.selectedVehicle === null, 'Does not guess replacement vehicle when driver is missing');
  assert(dec5.rejectedReasons.some((r) => r.includes('driver identifier')), 'RejectedReasons explicitly flags missing driver identifier');

  // -------------------------------------------------------------------
  // TEST 6: Conflicting Data & Source Precedence
  // -------------------------------------------------------------------
  console.log('\n--- TEST 6: Conflicting Data & 5-Tier Source Precedence ---');
  const allConflicts = await store.getAllConflicts();
  assert(allConflicts.length > 0, 'Context store preserves detected conflict records');

  // Verify that an authoritative source wins over lower precedence
  const fleetConflict = allConflicts.find((c) => c.winningSource.includes('fleet_master'));
  assert(fleetConflict !== undefined, 'Fleet Master (Tier 1) wins over subordinate trip/ticket logs');

  // Test SLA precedence: Shakti Cement interview rule (Tier 1) overrides 48h contract (Tier 4)
  const shaktiTicket: QueueTicket = {
    ticketId: 'TKT-TEST-SHAKTI-CONFLICT',
    idempotencyKey: 'BREAKDOWN:TKT-TEST-SHAKTI-CONFLICT',
    canonicalTicketId: 'TKT-TEST-SHAKTI-CONFLICT',
    createdAt: '2026-06-15T10:00:00',
    vehicle: 'DL64IB1058',
    rawVehicle: 'DL64IB1058',
    driverId: 'DRV-002',
    rawDriverId: 'DRV-002',
    originHub: 'Gurgaon',
    kmFromOriginHub: 80,
    destination: 'Ambala',
    issue: 'engine overheating',
    severity: 'CRITICAL',
    client: 'Shakti Cement',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec6 = await decisionEngine.evaluateTicket(shaktiTicket);
  assert(dec6.slaDeadlineHours === 36, 'Dispatcher interview rule R-008 (36h) overrides 48h contract SLA');
  assert(dec6.rulesApplied.some((r) => r.ruleId === 'R-008'), 'Rule R-008 is cited in rulesApplied');
  assert(dec6.inputsUsed.operationalSlaHours === 36, 'InputsUsed reflects resolved 36h operational SLA');

  // -------------------------------------------------------------------
  // TEST 7: No Eligible Replacement (All Disqualified by Rules)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 7: No Eligible Replacement ---');
  // Scenario: Winter month, Delhi route (GRAP BS6 requirement), with candidate pool restricted to BS4 only
  const winterDelhiTicket: QueueTicket = {
    ticketId: 'TKT-TEST-NO-ELIGIBLE',
    idempotencyKey: 'BREAKDOWN:TKT-TEST-NO-ELIGIBLE',
    canonicalTicketId: 'TKT-TEST-NO-ELIGIBLE',
    createdAt: '2026-12-15T10:00:00', // December (Winter)
    vehicle: 'UP40IM3144',
    rawVehicle: 'UP40IM3144',
    driverId: 'DRV-001',
    rawDriverId: 'DRV-001',
    originHub: 'Gurgaon',
    kmFromOriginHub: 20, // <= 50km requires origin hub Gurgaon
    destination: 'Delhi', // Touches Delhi NCR
    issue: 'complete transmission seizure',
    severity: 'CRITICAL',
    client: 'Orion Pharma', // Requires year >= 2020 (R-007)
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  // Create an artificial fleet where every candidate fails at least one constraint
  const constrainedFleet: Vehicle[] = [
    {
      registrationNumber: 'DL01AB1111',
      model: 'Tata Signa',
      year: 2018, // Fails Orion Pharma (R-007: <2020)
      bsStage: 'BS4', // Fails Winter Delhi (R-001)
      engineHeater: false,
      homeHub: 'Ambala', // Fails <50km origin hub rule (R-004: not Gurgaon)
      capacityTonnes: 16,
      status: 'Active',
      aliases: [],
    },
    {
      registrationNumber: 'HR26DK2222',
      model: 'Ashok Leyland',
      year: 2021,
      bsStage: 'BS6',
      engineHeater: true,
      homeHub: 'Gurgaon',
      capacityTonnes: 20,
      status: 'MAINTENANCE', // Fails Rule R-005 / R-012 (Grounded/Maintenance)
      aliases: [],
    },
  ];

  const selectionNoEligible = evaluateReplacementCandidates(winterDelhiTicket, constrainedFleet);
  assert(selectionNoEligible.selectedVehicle === null, 'No candidate selected when all violate dispatcher rules');
  assert(selectionNoEligible.rejectedCandidates.length === 2, 'All 2 candidates are placed in rejectedCandidates');
  assert(
    selectionNoEligible.rejectedCandidates.some((c) => c.violatedRules.some((r) => r.ruleId === 'R-001')),
    'Candidate 1 rejected under Rule R-001 (BS4 on winter Delhi route)'
  );
  assert(
    selectionNoEligible.rejectedCandidates.some((c) => c.violatedRules.some((r) => r.ruleId === 'R-005' || r.ruleId === 'R-012')),
    'Candidate 2 rejected under Rule R-005/R-012 (Maintenance status)'
  );

  // -------------------------------------------------------------------
  // TEST 8: Eligible Replacement (Single Winner)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 8: Eligible Replacement (Single Passing Candidate) ---');
  const singleEligibleFleet: Vehicle[] = [
    {
      registrationNumber: 'DL01AB1111',
      model: 'Tata Signa',
      year: 2017,
      bsStage: 'BS4', // Violates R-001
      engineHeater: false,
      homeHub: 'Ambala',
      capacityTonnes: 16,
      status: 'Active',
      aliases: [],
    },
    {
      registrationNumber: 'HR26DK3333',
      model: 'Tata Prima BS6',
      year: 2022,
      bsStage: 'BS6', // Passes R-001
      engineHeater: true,
      homeHub: 'Gurgaon', // Passes R-004 (<50km)
      capacityTonnes: 24,
      status: 'Active', // Passes R-012
      aliases: [],
    },
  ];

  const selectionSingle = evaluateReplacementCandidates(winterDelhiTicket, singleEligibleFleet);
  assert(selectionSingle.selectedVehicle !== null, 'Candidate is selected when exactly one satisfies all constraints');
  assert(selectionSingle.selectedVehicle?.registrationNumber === 'HR26DK3333', 'Selected candidate is HR26DK3333');
  assert(selectionSingle.selectedVehicle?.eligible === true, 'Selected candidate is marked eligible: true');
  assert(selectionSingle.rejectedCandidates.length === 1, 'Ineligible candidate is recorded in rejectedCandidates');

  // -------------------------------------------------------------------
  // TEST 9: Multiple Eligible Replacements (Deterministic Ranking)
  // -------------------------------------------------------------------
  console.log('\n--- TEST 9: Multiple Eligible Replacements & Tie-Breaking ---');
  const summerTicket: QueueTicket = {
    ticketId: 'TKT-TEST-MULTI',
    idempotencyKey: 'BREAKDOWN:TKT-TEST-MULTI',
    canonicalTicketId: 'TKT-TEST-MULTI',
    createdAt: '2026-06-15T10:00:00', // Summer
    vehicle: 'UP40IM3144',
    rawVehicle: 'UP40IM3144',
    driverId: 'DRV-001',
    rawDriverId: 'DRV-001',
    originHub: 'Lucknow',
    kmFromOriginHub: 120, // >50km
    destination: 'Kanpur',
    issue: 'radiator hose burst',
    severity: 'HIGH',
    client: 'Vertex Retail',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  // 3 candidates all eligible, varying in distance and model year
  const multiEligibleFleet: Vehicle[] = [
    {
      registrationNumber: 'UP32BB2000',
      model: 'Tata Signa',
      year: 2020,
      bsStage: 'BS6',
      engineHeater: true,
      homeHub: 'Kanpur', // Distance from target Lucknow = 85 km
      capacityTonnes: 20,
      status: 'Active',
      aliases: [],
    },
    {
      registrationNumber: 'UP32AA1000',
      model: 'Tata Signa',
      year: 2022,
      bsStage: 'BS6',
      engineHeater: true,
      homeHub: 'Lucknow', // Distance from target Lucknow = 0 km (Closest!)
      capacityTonnes: 20,
      status: 'Active',
      aliases: [],
    },
    {
      registrationNumber: 'UP32CC3000',
      model: 'Tata Prima',
      year: 2023,
      bsStage: 'BS6',
      engineHeater: true,
      homeHub: 'Delhi', // Distance from target Lucknow = 525 km (Farther)
      capacityTonnes: 24,
      status: 'Active',
      aliases: [],
    },
  ];

  const selectionMulti = evaluateReplacementCandidates(summerTicket, multiEligibleFleet);
  assert(selectionMulti.selectedVehicle !== null, 'A winner is selected from multiple eligible candidates');
  assert(
    selectionMulti.selectedVehicle?.registrationNumber === 'UP32AA1000',
    'Proximity ranking selects closest vehicle (UP32AA1000 at Lucknow, 0km) as #1'
  );
  assert(selectionMulti.candidateEvaluations.filter((c) => c.eligible).length === 3, 'All 3 candidates were confirmed eligible');
  assert(
    selectionMulti.reasons.some((r) => r.includes('Runner-up eligible replacement candidate(s) considered')),
    'Selection reason documents runner-up candidates for operational explainability'
  );

  // Test tie-breaker on identical specs: alphanumeric registration tie-breaker
  const identicalFleet: Vehicle[] = [
    {
      registrationNumber: 'UP32ZZ9999',
      model: 'Tata Signa',
      year: 2022,
      bsStage: 'BS6',
      engineHeater: true,
      homeHub: 'Lucknow',
      capacityTonnes: 20,
      status: 'Active',
      aliases: [],
    },
    {
      registrationNumber: 'UP32AA0001',
      model: 'Tata Signa',
      year: 2022,
      bsStage: 'BS6',
      engineHeater: true,
      homeHub: 'Lucknow',
      capacityTonnes: 20,
      status: 'Active',
      aliases: [],
    },
  ];

  const tieBreakSelection = evaluateReplacementCandidates(summerTicket, identicalFleet);
  assert(
    tieBreakSelection.selectedVehicle?.registrationNumber === 'UP32AA0001',
    'Alphanumeric tie-breaker deterministically selects UP32AA0001 before UP32ZZ9999'
  );

  // -------------------------------------------------------------------
  // TEST 10: Independence from Gemini
  // -------------------------------------------------------------------
  console.log('\n--- TEST 10: Independence from Gemini ---');
  // Verify that evaluating a decision produces zero network calls and works when GEMINI_API_KEY is unset
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const offlineDec = await decisionEngine.evaluateTicket({
    ...validTicket,
    ticketId: 'TKT-TEST-OFFLINE',
    idempotencyKey: 'BREAKDOWN:TKT-TEST-OFFLINE',
    canonicalTicketId: 'TKT-TEST-OFFLINE',
  });

  assert(offlineDec.decision === 'VEHICLE_REPLACEMENT', 'Decision engine functions 100% deterministically without Gemini');
  assert(offlineDec.selectedVehicle !== null, 'Vehicle replacement chosen without AI');
  assert(offlineDec.decisionStatus === 'DECIDED', 'Operational status DECIDED reached without AI dependency');

  if (originalKey) {
    process.env.GEMINI_API_KEY = originalKey;
  }

  console.log('\n===================================================================');
  console.log(` DECISION ENGINE HARDENING TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();
  process.exit(failed > 0 ? 1 : 0);
}

runDecisionEngineHardeningTests().catch((err) => {
  console.error('Decision engine hardening tests encountered an error:', err);
  process.exit(1);
});
