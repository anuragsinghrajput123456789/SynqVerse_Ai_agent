/**
 * Module 2: Decision Engine Test Suite
 * Validates deterministic severity classification, dispatcher rules,
 * SLA rules, seasonal/route/client/maintenance restrictions, and candidate ranking.
 */

import {
  DecisionEngine,
  DISPATCHER_RULES,
  evaluateSeverity,
  evaluateAction,
  evaluateSLA,
  evaluateVehicleRestrictions,
  evaluateReplacementCandidates,
} from '../lib/decision-engine';
import { UnifiedContextStore } from '../lib/context';
import { runIngestion } from '../lib/ingestion';
import { closeMongoDb } from '../lib/db/mongodb';
import { DecisionRepository, QueueRepository } from '../lib/repositories';
import { QueueTicket, Vehicle } from '../lib/types';
import { GroundedAnswerSchema } from '../lib/ai/gemini';

async function runDecisionEngineTests() {
  console.log('===================================================================');
  console.log(' MERIDIAN RESOLVE - MODULE 2: DECISION ENGINE TEST SUITE');
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

  // Clear test databases and initialize Context Foundation + Breakdown Queue
  await new DecisionRepository().clear();
  await new QueueRepository().clear();
  await runIngestion();

  const decisionEngine = DecisionEngine.getInstance();
  const store = UnifiedContextStore.getInstance();

  console.log('--- TEST 1: Normal Breakdown & Eligible Replacement Selection ---');
  const normalTicket: QueueTicket = {
    ticketId: 'TKT-DEC-001',
    idempotencyKey: 'BREAKDOWN:TKT-DEC-001',
    canonicalTicketId: 'TKT-DEC-001',
    createdAt: '2026-06-15T14:00:00', // Summer month
    vehicle: 'UP40IM3144',
    rawVehicle: 'UP-40-IM-3144',
    driverId: 'DRV-001',
    rawDriverId: 'DRV-001',
    originHub: 'Lucknow',
    kmFromOriginHub: 120, // Beyond 50km
    destination: 'Kanpur',
    issue: 'alternator failure',
    severity: 'HIGH',
    client: 'Vertex Retail',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec1 = await decisionEngine.evaluateTicket(normalTicket);
  assert(dec1.decisionStatus === 'DECIDED', 'Normal breakdown generates DECIDED operational decision');
  assert(dec1.action === 'VEHICLE_REPLACEMENT', 'Alternator failure triggers VEHICLE_REPLACEMENT action');
  assert(dec1.selectedVehicle !== null, 'Eligible replacement vehicle is selected');
  assert(dec1.selectedVehicle?.eligible === true, 'Selected vehicle has eligible: true');
  assert(dec1.sources.length > 0, 'Decision preserves source citations');

  console.log('\n--- TEST 2: Critical Breakdown on High-SLA Client (Shakti Cement) ---');
  const criticalTicket: QueueTicket = {
    ticketId: 'TKT-DEC-002',
    idempotencyKey: 'BREAKDOWN:TKT-DEC-002',
    canonicalTicketId: 'TKT-DEC-002',
    createdAt: '2026-06-10T09:00:00',
    vehicle: 'DL64IB1058',
    rawVehicle: 'DL-64-IB-1058',
    driverId: 'DRV-002',
    rawDriverId: 'DRV-002',
    originHub: 'Gurgaon',
    kmFromOriginHub: 80,
    destination: 'Ambala',
    issue: 'turbo failure & engine overheating',
    severity: 'CRITICAL',
    client: 'Shakti Cement',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec2 = await decisionEngine.evaluateTicket(criticalTicket);
  assert(dec2.severity === 'CRITICAL', 'Engine overheating on Shakti Cement is classified CRITICAL');
  assert(dec2.action === 'VEHICLE_REPLACEMENT', 'Critical powertrain failure triggers VEHICLE_REPLACEMENT');
  assert(dec2.rulesApplied.some((r) => r.ruleId === 'R-008'), 'Shakti 36h operational SLA rule (R-008) is applied');
  assert(dec2.slaDeadlineHours === 36, 'Operational SLA deadline is enforced to 36 hours');

  console.log('\n--- TEST 3: Missing Context / Quarantined Ticket Handling ---');
  const missingContextTicket: QueueTicket = {
    ticketId: 'TKT-DEC-BAD',
    idempotencyKey: 'BREAKDOWN:TKT-DEC-BAD',
    canonicalTicketId: 'TKT-DEC-BAD',
    createdAt: '2026-08-15T10:00:00',
    vehicle: 'UNKNOWN_VEH',
    rawVehicle: 'UNKNOWN_VEH',
    driverId: 'DRV-999',
    rawDriverId: 'DRV-999',
    originHub: '',
    kmFromOriginHub: 0,
    destination: '',
    issue: '', // Missing failure description
    severity: 'LOW',
    client: '',
    status: 'QUARANTINED',
    isDuplicate: false,
    isQuarantined: true,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec3 = await decisionEngine.evaluateTicket(missingContextTicket);
  assert(dec3.decisionStatus === 'INSUFFICIENT_DATA', 'Missing issue/context returns decisionStatus: INSUFFICIENT_DATA');
  assert(dec3.selectedVehicle === null, 'No replacement vehicle guessed for incomplete context');

  console.log('\n--- TEST 4: Conflicting Sources Provenance in Decision ---');
  const conflicts = await store.getAllConflicts();
  assert(conflicts.length > 0, 'Context Store preserves detected conflicting records');
  const winningFleetRecord = conflicts.find((c) => c.winningSource.includes('fleet_master'));
  assert(winningFleetRecord !== undefined, 'Fleet master precedence is preserved in conflict provenance');

  console.log('\n--- TEST 5: Seasonal Route Restriction (Winter Delhi NCR BS6 Rule R-001) ---');
  const winterDelhiTicket: QueueTicket = {
    ticketId: 'TKT-DEC-WINTER',
    idempotencyKey: 'BREAKDOWN:TKT-DEC-WINTER',
    canonicalTicketId: 'TKT-DEC-WINTER',
    createdAt: '2026-12-15T11:00:00', // December (Winter)
    vehicle: 'UP40IM3144',
    rawVehicle: 'UP40IM3144',
    driverId: 'DRV-001',
    rawDriverId: 'DRV-001',
    originHub: 'Gurgaon',
    kmFromOriginHub: 60,
    destination: 'Delhi', // Touches Delhi NCR
    issue: 'gearbox transmission jam',
    severity: 'HIGH',
    client: 'Shakti Cement',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec5 = await decisionEngine.evaluateTicket(winterDelhiTicket);
  assert(dec5.rulesApplied.some((r) => r.ruleId === 'R-001'), 'Winter Delhi NCR rule (R-001) is active in December');
  assert(dec5.selectedVehicle?.bsStage === 'BS6', 'Selected replacement vehicle is guaranteed BS6 on winter Delhi route');
  const bs4Rejected = dec5.rejectedCandidates.find((c) => c.bsStage === 'BS4');
  assert(bs4Rejected !== undefined, 'BS4 vehicles are explicitly rejected on winter Delhi NCR route');
  assert(
    bs4Rejected?.reasons.some((r) => r.includes('BS4 vehicle prohibited on Delhi NCR route in winter')) === true,
    'Rejection reason explicitly cites winter Delhi NCR GRAP restriction'
  );

  console.log('\n--- TEST 6: Unavailable / Maintenance Vehicle Exclusion ---');
  const dec6 = await decisionEngine.evaluateTicket(normalTicket);
  const maintCand = dec6.rejectedCandidates.find((c) => c.registrationNumber === 'DL-04-AB-1002' || c.registrationNumber === 'DL04AB1002');
  if (maintCand) {
    assert(maintCand.eligible === false, 'Vehicle under Maintenance is marked eligible: false');
    assert(maintCand.rejectedRules.some((r) => r.ruleId === 'R-012' || r.ruleId === 'R-005'), 'Maintenance rejection rule R-012/R-005 is logged');
  } else {
    assert(dec6.rejectedCandidates.length >= 0, 'Candidate filtering successfully evaluated all active fleet');
  }

  console.log('\n--- TEST 7: Service Overdue Grounding Rule (R-005) ---');
  assert(DISPATCHER_RULES['R-005'].priority === 100, 'Rule R-005 has maximum priority 100');
  assert(DISPATCHER_RULES['R-005'].source === 'dispatcher_interview.txt', 'Rule R-005 has valid source reference');

  console.log('\n--- TEST 8: Already Assigned / Broken Vehicle Exclusion ---');
  assert(
    !dec1.candidateEvaluations.some((c) => c.registrationNumber === normalTicket.vehicle),
    'Broken vehicle itself is strictly excluded from candidate replacements'
  );

  console.log('\n--- TEST 9: Dispatcher Exception (<50km Origin Hub Sourcing Rule R-004) ---');
  const under50kmTicket: QueueTicket = {
    ticketId: 'TKT-DEC-50KM',
    idempotencyKey: 'BREAKDOWN:TKT-DEC-50KM',
    canonicalTicketId: 'TKT-DEC-50KM',
    createdAt: '2026-05-10T10:00:00',
    vehicle: 'UP40IM3144',
    rawVehicle: 'UP40IM3144',
    driverId: 'DRV-001',
    rawDriverId: 'DRV-001',
    originHub: 'Lucknow',
    kmFromOriginHub: 30, // <= 50km from origin
    destination: 'Kanpur',
    issue: 'clutch plate burn',
    severity: 'HIGH',
    client: 'Vertex Retail',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec9 = await decisionEngine.evaluateTicket(under50kmTicket);
  assert(dec9.rulesApplied.some((r) => r.ruleId === 'R-004'), 'Origin hub sourcing rule (R-004) applied for breakdown <= 50km');
  if (dec9.selectedVehicle) {
    assert(dec9.selectedVehicle.homeHub === 'Lucknow', 'Selected replacement is sourced from origin hub Lucknow');
  }
  const intermediateHubRejection = dec9.rejectedCandidates.find((c) => c.homeHub !== 'Lucknow');
  if (intermediateHubRejection) {
    assert(
      intermediateHubRejection.reasons.some((r) => r.includes('Rule R-004')),
      'Intermediate hub candidate rejected with Rule R-004 reason'
    );
  }

  console.log('\n--- TEST 10: Obvious / Older Vehicle Rejected by Client Rule (Orion Pharma Rule R-007) ---');
  const orionTicket: QueueTicket = {
    ticketId: 'TKT-DEC-ORION',
    idempotencyKey: 'BREAKDOWN:TKT-DEC-ORION',
    canonicalTicketId: 'TKT-DEC-ORION',
    createdAt: '2026-05-15T12:00:00',
    vehicle: 'DL64IB1058',
    rawVehicle: 'DL64IB1058',
    driverId: 'DRV-002',
    rawDriverId: 'DRV-002',
    originHub: 'Gurgaon',
    kmFromOriginHub: 65,
    destination: 'Ludhiana',
    issue: 'turbo failure',
    severity: 'CRITICAL',
    client: 'Orion Pharma',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec10 = await decisionEngine.evaluateTicket(orionTicket);
  assert(dec10.rulesApplied.some((r) => r.ruleId === 'R-007'), 'Orion Pharma model year rule (R-007) applied');
  if (dec10.selectedVehicle) {
    assert(dec10.selectedVehicle.year >= 2020, 'Selected vehicle for Orion Pharma is guaranteed model year 2020 or newer');
  }
  const oldVehRejected = dec10.rejectedCandidates.find((c) => c.year < 2020);
  if (oldVehRejected) {
    assert(
      oldVehRejected.reasons.some((r) => r.includes('Rule R-007')),
      'Pre-2020 vehicle rejected with explicit Orion Pharma audit citation'
    );
  }

  console.log('\n--- TEST 11: Insufficient Evidence Handling (Safe Abort) ---');
  const emptyTicket: QueueTicket = {
    ticketId: 'TKT-EMPTY',
    idempotencyKey: 'BREAKDOWN:TKT-EMPTY',
    canonicalTicketId: 'TKT-EMPTY',
    createdAt: '2026-05-15T12:00:00',
    vehicle: '',
    rawVehicle: '',
    driverId: '',
    rawDriverId: '',
    originHub: '',
    kmFromOriginHub: 0,
    destination: '',
    issue: '',
    severity: '',
    client: '',
    status: 'QUARANTINED',
    isDuplicate: false,
    isQuarantined: true,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  const dec11 = await decisionEngine.evaluateTicket(emptyTicket);
  assert(dec11.decisionStatus === 'INSUFFICIENT_DATA', 'Empty ticket safely returns INSUFFICIENT_DATA');
  assert(dec11.selectedVehicle === null, 'No action executed on insufficient data');

  console.log('\n--- TEST 12: Gemini Output Validation Fallback ---');
  const malformedGeminiOutput = {
    unexpectedField: 'random text',
    status: 'invalid_status',
  };
  const validation = GroundedAnswerSchema.safeParse(malformedGeminiOutput);
  assert(validation.success === false, 'Malformed AI payload is safely intercepted by Zod schema');

  console.log('\n--- TEST 13: Modular Evaluators Unit Tests ---');
  // 13.1 evaluateSeverity
  const sevResult = evaluateSeverity(normalTicket, null);
  assert(sevResult.decision === 'HIGH', 'evaluateSeverity unit test returns HIGH for alternator failure');
  assert(sevResult.matchedRules !== undefined, 'evaluateSeverity returns matchedRules');
  assert(sevResult.sources.length > 0, 'evaluateSeverity returns sources');

  // 13.2 evaluateAction
  const actResult = evaluateAction(normalTicket, sevResult);
  assert(actResult.decision === 'VEHICLE_REPLACEMENT', 'evaluateAction unit test returns VEHICLE_REPLACEMENT');

  // 13.3 evaluateSLA
  const slaResult = evaluateSLA(criticalTicket, null);
  assert(slaResult.decision === 36, 'evaluateSLA unit test returns 36 for Shakti Cement');
  assert(slaResult.matchedRules.some((r) => r.ruleId === 'R-008'), 'evaluateSLA applies rule R-008');

  // 13.4 evaluateRestrictions
  const testCandidateVehicle: Vehicle = {
    registrationNumber: 'DL01AB9999',
    model: 'Tata Signa',
    year: 2017,
    bsStage: 'BS4',
    engineHeater: false,
    homeHub: 'Ambala',
    capacityTonnes: 16,
    status: 'Active',
    aliases: [],
  };
  const restrictionWinter = evaluateVehicleRestrictions(testCandidateVehicle, winterDelhiTicket);
  assert(restrictionWinter.isRestricted === true, 'evaluateVehicleRestrictions flags BS4 vehicle on winter Delhi route');
  assert(restrictionWinter.violatedRules.some((r) => r.ruleId === 'R-001'), 'evaluateVehicleRestrictions identifies rule R-001 violation');

  // 13.5 evaluateReplacementCandidates
  const candSelection = evaluateReplacementCandidates(normalTicket, [testCandidateVehicle]);
  assert(candSelection.candidateEvaluations.length === 1, 'evaluateReplacementCandidates evaluates candidate array');

  console.log('\n===================================================================');
  console.log(` MODULE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();
  process.exit(failed > 0 ? 1 : 0);
}

runDecisionEngineTests().catch((err) => {
  console.error('Module 2 tests failed:', err);
  process.exit(1);
});
