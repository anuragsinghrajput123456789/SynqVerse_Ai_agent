/**
 * Module 3: Replacement Vehicle Selection Test Suite
 * Tests deterministic candidate evaluation, failure check mapping,
 * rule applications, and deterministic ranking.
 */

import {
  ReplacementVehicleSelectionService,
  selectReplacementVehicle,
  evaluateCandidateVehicle,
} from '../lib/vehicle-selection';
import { runIngestion } from '../lib/ingestion';
import { closeMongoDb } from '../lib/db/mongodb';
import { QueueTicket, Vehicle } from '../lib/types';

async function runVehicleSelectionTests() {
  console.log('===================================================================');
  console.log(' MERIDIAN RESOLVE - REPLACEMENT VEHICLE SELECTION TEST SUITE');
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

  await runIngestion();
  const selectionService = ReplacementVehicleSelectionService.getInstance();

  const standardTicket: QueueTicket = {
    ticketId: 'TKT-SEL-001',
    idempotencyKey: 'BREAKDOWN:TKT-SEL-001',
    canonicalTicketId: 'TKT-SEL-001',
    createdAt: '2026-06-15T10:00:00', // Summer
    vehicle: 'UP40IM3144',
    rawVehicle: 'UP40IM3144',
    driverId: 'DRV-001',
    rawDriverId: 'DRV-001',
    originHub: 'Lucknow',
    kmFromOriginHub: 120, // Beyond 50km
    destination: 'Kanpur',
    issue: 'gearbox failure',
    severity: 'HIGH',
    client: 'Vertex Retail',
    status: 'READY',
    isDuplicate: false,
    isQuarantined: false,
    ingestionRunId: 'test_run',
    sourceFile: 'tickets.json',
  };

  console.log('--- TEST 1: Successful Selection ---');
  const result1 = await selectionService.findReplacementVehicle(standardTicket, 12);
  assert(result1.status === 'SUCCESS', 'Selection returns status: SUCCESS');
  assert(result1.selectedVehicle !== null, 'Selected vehicle is non-null');
  assert(result1.selectedVehicle?.eligible === true, 'Selected vehicle is marked eligible: true');
  assert(result1.selectedVehicle?.failedChecks.length === 0, 'Selected vehicle has 0 failed checks');
  assert(result1.selectionReason.length > 0, 'Selection includes descriptive selection reason');

  console.log('\n--- TEST 2: Maintenance Failure ---');
  const maintVehicle: Vehicle = {
    registrationNumber: 'DL04AB1002',
    model: 'Tata Signa',
    year: 2021,
    bsStage: 'BS6',
    engineHeater: true,
    homeHub: 'Lucknow',
    capacityTonnes: 16,
    status: 'Maintenance', // In Maintenance
    aliases: [],
  };
  const candMaint = evaluateCandidateVehicle(maintVehicle, standardTicket);
  assert(candMaint.eligible === false, 'Vehicle under maintenance is marked eligible: false');
  assert(candMaint.failedChecks.includes('is_available'), 'Failed checks contains is_available');

  const groundedVehicle: Vehicle = {
    registrationNumber: 'HR55AA9999',
    model: 'Tata Prima',
    year: 2022,
    bsStage: 'BS6',
    engineHeater: true,
    homeHub: 'Lucknow',
    capacityTonnes: 16,
    status: 'GROUNDED',
    aliases: [],
  };
  const candGrounded = evaluateCandidateVehicle(groundedVehicle, standardTicket);
  assert(candGrounded.failedChecks.includes('maintenance_valid'), 'Grounded vehicle failed checks contains maintenance_valid');

  console.log('\n--- TEST 3: Route Restriction (<50km Origin Hub Sourcing) ---');
  const under50kmTicket: QueueTicket = {
    ...standardTicket,
    ticketId: 'TKT-SEL-50KM',
    kmFromOriginHub: 35, // Within 50km of origin hub Lucknow
  };
  const ambalaVehicle: Vehicle = {
    registrationNumber: 'HR55XY1111',
    model: 'Eicher Pro',
    year: 2022,
    bsStage: 'BS6',
    engineHeater: true,
    homeHub: 'Ambala', // Not Lucknow
    capacityTonnes: 16,
    status: 'Active',
    aliases: [],
  };
  const candRoute = evaluateCandidateVehicle(ambalaVehicle, under50kmTicket);
  assert(candRoute.eligible === false, 'Intermediate hub vehicle is rejected for breakdown <= 50km');
  assert(candRoute.failedChecks.includes('dispatcher_rules_satisfied'), 'Failed checks contains dispatcher_rules_satisfied (Rule R-004)');

  console.log('\n--- TEST 4: Seasonal Restriction (Winter Delhi NCR BS6 & Winter Hill Heaters) ---');
  const winterDelhiTicket: QueueTicket = {
    ...standardTicket,
    ticketId: 'TKT-SEL-DELHI-WINTER',
    createdAt: '2026-12-10T08:00:00', // December (Winter)
    originHub: 'Gurgaon',
    destination: 'Delhi',
    kmFromOriginHub: 60,
  };
  const bs4Vehicle: Vehicle = {
    registrationNumber: 'DL01AB4444',
    model: 'Ashok Leyland',
    year: 2018,
    bsStage: 'BS4', // BS4
    engineHeater: true,
    homeHub: 'Gurgaon',
    capacityTonnes: 16,
    status: 'Active',
    aliases: [],
  };
  const candWinterDelhi = evaluateCandidateVehicle(bs4Vehicle, winterDelhiTicket);
  assert(candWinterDelhi.eligible === false, 'BS4 vehicle rejected on winter Delhi route');
  assert(candWinterDelhi.failedChecks.includes('seasonal_restrictions_satisfied'), 'Failed checks contains seasonal_restrictions_satisfied (Rule R-001)');

  const winterHillTicket: QueueTicket = {
    ...standardTicket,
    ticketId: 'TKT-SEL-HILL-WINTER',
    createdAt: '2026-01-15T06:00:00', // January (Winter)
    destination: 'Rudrapur', // Hill terrain
    kmFromOriginHub: 80,
  };
  const noHeaterVehicle: Vehicle = {
    registrationNumber: 'UP80AB5555',
    model: 'Tata Signa',
    year: 2021,
    bsStage: 'BS6',
    engineHeater: false, // No engine heater
    homeHub: 'Rudrapur',
    capacityTonnes: 16,
    status: 'Active',
    aliases: [],
  };
  const candWinterHill = evaluateCandidateVehicle(noHeaterVehicle, winterHillTicket);
  assert(candWinterHill.eligible === false, 'Vehicle without engine heater rejected on winter hill route');
  assert(candWinterHill.failedChecks.includes('seasonal_restrictions_satisfied'), 'Failed checks contains seasonal_restrictions_satisfied (Rule R-002)');

  console.log('\n--- TEST 5: Already Assigned / In Transit ---');
  const inTransitVehicle: Vehicle = {
    registrationNumber: 'RJ14XX3333',
    model: 'Tata Prima',
    year: 2021,
    bsStage: 'BS6',
    engineHeater: true,
    homeHub: 'Lucknow',
    capacityTonnes: 16,
    status: 'In Transit',
    aliases: [],
  };
  const candInTransit = evaluateCandidateVehicle(inTransitVehicle, standardTicket);
  assert(candInTransit.eligible === false, 'In Transit vehicle is marked ineligible');
  assert(candInTransit.failedChecks.includes('not_already_assigned'), 'Failed checks contains not_already_assigned');

  // Broken vehicle itself
  const brokenSelfVehicle: Vehicle = {
    registrationNumber: 'UP-40-IM-3144',
    model: 'Tata Signa',
    year: 2020,
    bsStage: 'BS6',
    engineHeater: true,
    homeHub: 'Lucknow',
    capacityTonnes: 16,
    status: 'Active',
    aliases: [],
  };
  const candSelf = evaluateCandidateVehicle(brokenSelfVehicle, standardTicket);
  assert(candSelf.eligible === false, 'Broken vehicle itself is marked ineligible');
  assert(candSelf.failedChecks.includes('not_already_assigned'), 'Broken vehicle fails not_already_assigned check');

  console.log('\n--- TEST 6: Wrong Capacity / Type ---');
  const smallVehicle: Vehicle = {
    registrationNumber: 'DL01AB1111',
    model: 'Tata 407',
    year: 2022,
    bsStage: 'BS6',
    engineHeater: true,
    homeHub: 'Lucknow',
    capacityTonnes: 4, // 4 tonnes < 16 tonnes required
    status: 'Active',
    aliases: [],
  };
  const candCapacity = evaluateCandidateVehicle(smallVehicle, standardTicket, 16);
  assert(candCapacity.eligible === false, 'Vehicle with insufficient capacity is marked ineligible');
  assert(candCapacity.failedChecks.includes('correct_capacity'), 'Failed checks contains correct_capacity');

  console.log('\n--- TEST 7: Client Restriction (Orion Pharma Year >= 2020 & Apex Plate Rotation) ---');
  const orionTicket: QueueTicket = {
    ...standardTicket,
    ticketId: 'TKT-SEL-ORION',
    client: 'Orion Pharma',
  };
  const pre2020Vehicle: Vehicle = {
    registrationNumber: 'UP32AB7777',
    model: 'Tata Signa',
    year: 2017, // < 2020
    bsStage: 'BS6',
    engineHeater: true,
    homeHub: 'Lucknow',
    capacityTonnes: 16,
    status: 'Active',
    aliases: [],
  };
  const candOrion = evaluateCandidateVehicle(pre2020Vehicle, orionTicket);
  assert(candOrion.eligible === false, 'Pre-2020 vehicle rejected for Orion Pharma');
  assert(candOrion.failedChecks.includes('client_requirements_satisfied'), 'Failed checks contains client_requirements_satisfied (Rule R-007)');

  const apexTicket: QueueTicket = {
    ...standardTicket,
    ticketId: 'TKT-SEL-APEX',
    client: 'Apex Chemicals',
  };
  const apexProblemVehicle: Vehicle = {
    registrationNumber: 'UP-54-XZ-6139',
    model: 'Tata Prima',
    year: 2022,
    bsStage: 'BS6',
    engineHeater: true,
    homeHub: 'Lucknow',
    capacityTonnes: 16,
    status: 'Active',
    aliases: [],
  };
  const candApex = evaluateCandidateVehicle(apexProblemVehicle, apexTicket);
  assert(candApex.eligible === false, 'Previous problem vehicle rejected for Apex Chemicals');
  assert(candApex.failedChecks.includes('client_requirements_satisfied'), 'Failed checks contains client_requirements_satisfied (Rule R-010)');

  console.log('\n--- TEST 8: No Eligible Vehicle Handling ---');
  const allIneligiblePool: Vehicle[] = [smallVehicle, bs4Vehicle, inTransitVehicle];
  const noEligibleResult = selectReplacementVehicle({
    ticket: winterDelhiTicket,
    candidatePool: allIneligiblePool,
    requiredCapacityTonnes: 16,
  });
  assert(noEligibleResult.status === 'NO_ELIGIBLE_VEHICLE', 'Result status is NO_ELIGIBLE_VEHICLE when all candidates fail');
  assert(noEligibleResult.selectedVehicle === null, 'selectedVehicle is null on NO_ELIGIBLE_VEHICLE');
  assert(noEligibleResult.rejectedCandidates.length === 3, 'All 3 candidate vehicles are recorded in rejectedCandidates');

  console.log('\n===================================================================');
  console.log(` MODULE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();
  process.exit(failed > 0 ? 1 : 0);
}

runVehicleSelectionTests().catch((err) => {
  console.error('Module 3 tests failed:', err);
  process.exit(1);
});
