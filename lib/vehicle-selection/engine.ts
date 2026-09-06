/**
 * Replacement Vehicle Selection Engine
 */

import { Vehicle, QueueTicket, SourceCitation, DispatcherRule } from '../types';
import { DISPATCHER_RULES } from '../decision-engine/rules';
import { getHubDistance } from '../decision-engine/evaluateVehicle';
import {
  checkIsAvailable,
  checkCorrectCapacity,
  checkNotAlreadyAssigned,
  checkMaintenanceValid,
  checkRouteAndSeasonalRestrictions,
  checkClientRequirements,
  checkDispatcherRules,
} from './checks';
import {
  CandidateEvaluationResult,
  CheckFailure,
  VehicleSelectionResult,
  VehicleSelectionQuery,
} from './types';

export function evaluateCandidateVehicle(
  candidate: Vehicle,
  ticket: QueueTicket,
  requiredCapacityTonnes: number = 10,
  activeTripVehicleIds?: Set<string>
): CandidateEvaluationResult {
  const failureDetails: CheckFailure[] = [];
  const matchedRules: DispatcherRule[] = [];
  const reasons: string[] = [];
  const sources: SourceCitation[] = [];

  sources.push({
    sourceId: `fleet_${candidate.registrationNumber}`,
    sourceFile: 'fleet_master.csv',
    sourceType: 'fleet_master',
    recordId: candidate.registrationNumber,
    field: 'vehicle_profile',
    originalValueMasked: candidate,
    resolvedValue: candidate,
    precedence: 1,
    resolutionReason: 'Fleet Master profile for candidate replacement',
  });

  // Check 1: Availability
  const availFail = checkIsAvailable(candidate);
  if (availFail) {
    failureDetails.push(availFail);
  } else {
    matchedRules.push(DISPATCHER_RULES['R-012']);
  }

  // Check 2: Capacity
  const capFail = checkCorrectCapacity(candidate, requiredCapacityTonnes);
  if (capFail) {
    failureDetails.push(capFail);
  }

  // Check 3: Assignment status
  const assignFail = checkNotAlreadyAssigned(candidate, ticket, activeTripVehicleIds);
  if (assignFail) {
    failureDetails.push(assignFail);
  }

  // Check 4: Maintenance
  const maintFail = checkMaintenanceValid(candidate, ticket);
  if (maintFail) {
    failureDetails.push(maintFail);
  }

  // Check 5: Route & Seasonal
  const routeFail = checkRouteAndSeasonalRestrictions(candidate, ticket);
  if (routeFail) {
    failureDetails.push(routeFail);
  }

  // Check 6: Client Requirements
  const clientFail = checkClientRequirements(candidate, ticket);
  if (clientFail) {
    failureDetails.push(clientFail);
  }

  // Check 7: Dispatcher Rules
  const dispFail = checkDispatcherRules(candidate, ticket);
  if (dispFail) {
    failureDetails.push(dispFail);
  }

  const isUnder50km = (ticket.kmFromOriginHub || 0) <= 50;
  const targetHub = isUnder50km ? ticket.originHub : (ticket.originHub || 'Gurgaon');
  const distanceKm = getHubDistance(candidate.homeHub, targetHub);

  const eligible = failureDetails.length === 0;
  const failedChecks = failureDetails.map((f) => f.check);

  if (eligible) {
    reasons.push(`Vehicle satisfies all availability, capacity, maintenance, route, seasonal, and client requirements (${distanceKm} km away).`);
  } else {
    for (const fail of failureDetails) {
      reasons.push(fail.reason);
    }
  }

  return {
    vehicleId: candidate.vehicleId || candidate.registrationNumber,
    registrationNumber: candidate.registrationNumber,
    model: candidate.model,
    year: candidate.year,
    bsStage: candidate.bsStage,
    homeHub: candidate.homeHub,
    capacityTonnes: candidate.capacityTonnes,
    engineHeater: candidate.engineHeater,
    status: candidate.status,
    eligible,
    distanceKm,
    failedChecks,
    failureDetails,
    matchedRules,
    reasons,
    sources,
  };
}

export function selectReplacementVehicle(
  query: VehicleSelectionQuery
): VehicleSelectionResult {
  const { ticket, requiredCapacityTonnes = 10, candidatePool = [], activeTripVehicleIds } = query;

  const candidateEvaluations: CandidateEvaluationResult[] = candidatePool.map((cand) =>
    evaluateCandidateVehicle(cand, ticket, requiredCapacityTonnes, activeTripVehicleIds)
  );

  const eligibleCandidates = candidateEvaluations.filter((c) => c.eligible);
  const rejectedCandidates = candidateEvaluations.filter((c) => !c.eligible);

  // Deterministic candidate ranking:
  // 1. Proximity / distanceKm (closest first)
  // 2. Model Year (newer first)
  // 3. Payload Capacity (higher first)
  eligibleCandidates.sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }
    if (b.year !== a.year) {
      return b.year - a.year;
    }
    return b.capacityTonnes - a.capacityTonnes;
  });

  if (eligibleCandidates.length === 0) {
    return {
      status: 'NO_ELIGIBLE_VEHICLE',
      selectedVehicle: null,
      candidateEvaluations,
      eligibleCandidates: [],
      rejectedCandidates,
      selectionReason: `No candidate vehicle satisfies all required operational constraints (${candidateEvaluations.length} candidate(s) evaluated, all rejected).`,
      rules: [],
      sources: candidateEvaluations.flatMap((c) => c.sources),
      conflicts: [],
    };
  }

  const best = eligibleCandidates[0];
  const allRules = best.matchedRules;
  const uniqueRules = Array.from(new Map(allRules.map((r) => [r.ruleId, r])).values());

  return {
    status: 'SUCCESS',
    selectedVehicle: best,
    candidateEvaluations,
    eligibleCandidates,
    rejectedCandidates,
    selectionReason: `Selected replacement vehicle ${best.registrationNumber} (${best.model}, ${best.year}, ${best.bsStage}) from hub '${best.homeHub}' (${best.distanceKm} km away). Ranked #1 among ${eligibleCandidates.length} eligible candidate(s).`,
    rules: uniqueRules,
    sources: best.sources,
    conflicts: [],
  };
}
