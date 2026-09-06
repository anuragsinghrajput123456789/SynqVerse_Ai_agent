/**
 * Deterministic Candidate Vehicle Evaluation & Selection Engine
 */

import { QueueTicket, Vehicle, Conflict, SourceCitation } from '../types';
import { CandidateVehicleEvaluation, VehicleSelectionResult } from './types';
import { evaluateVehicleRestrictions } from './evaluateRestrictions';

// Meridian Freight Northern Hub Distance Matrix (km)
const HUB_DISTANCES: Record<string, Record<string, number>> = {
  Gurgaon: { Gurgaon: 0, Delhi: 35, Faridabad: 40, Noida: 50, Ambala: 240, Ludhiana: 330, Kanpur: 480, Lucknow: 540, Rudrapur: 270 },
  Delhi: { Delhi: 0, Gurgaon: 35, Faridabad: 30, Noida: 25, Ambala: 210, Ludhiana: 310, Kanpur: 470, Lucknow: 525, Rudrapur: 245 },
  Ambala: { Ambala: 0, Ludhiana: 110, Delhi: 210, Gurgaon: 240, Rudrapur: 290, Kanpur: 670, Lucknow: 720, Faridabad: 235, Noida: 225 },
  Ludhiana: { Ludhiana: 0, Ambala: 110, Delhi: 310, Gurgaon: 330, Rudrapur: 390, Kanpur: 780, Lucknow: 830, Faridabad: 335, Noida: 325 },
  Kanpur: { Kanpur: 0, Lucknow: 85, Delhi: 470, Gurgaon: 480, Rudrapur: 380, Ambala: 670, Ludhiana: 780, Faridabad: 460, Noida: 450 },
  Lucknow: { Lucknow: 0, Kanpur: 85, Delhi: 525, Gurgaon: 540, Rudrapur: 320, Gorakhpur: 270, Varanasi: 310, Ambala: 720, Ludhiana: 830 },
  Rudrapur: { Rudrapur: 0, Delhi: 245, Gurgaon: 270, Noida: 235, Lucknow: 320, Kanpur: 380, Ambala: 290, Ludhiana: 390, Faridabad: 260 },
};

export function getHubDistance(hubA: string, hubB: string): number {
  if (!hubA || !hubB) return 300;
  if (hubA === hubB) return 0;
  if (HUB_DISTANCES[hubA]?.[hubB] !== undefined) return HUB_DISTANCES[hubA][hubB];
  if (HUB_DISTANCES[hubB]?.[hubA] !== undefined) return HUB_DISTANCES[hubB][hubA];
  return 350;
}

export function evaluateReplacementCandidates(
  ticket: QueueTicket,
  availableVehicles: Vehicle[],
  conflicts: Conflict[] = []
): VehicleSelectionResult {
  const candidateEvaluations: CandidateVehicleEvaluation[] = [];
  const brokenCleanReg = (ticket.vehicle || '').replace(/[\s\-]+/g, '').toUpperCase();
  const isUnder50km = (ticket.kmFromOriginHub || 0) <= 50;
  const targetHub = isUnder50km ? ticket.originHub : (ticket.originHub || 'Gurgaon');

  for (const cand of availableVehicles) {
    const candCleanReg = cand.registrationNumber.replace(/[\s\-]+/g, '').toUpperCase();
    // Exclude the broken vehicle itself
    if (candCleanReg === brokenCleanReg) {
      continue;
    }

    const restrictionResult = evaluateVehicleRestrictions(cand, ticket, conflicts);
    const distanceKm = getHubDistance(cand.homeHub, targetHub);

    candidateEvaluations.push({
      vehicleId: cand.vehicleId || cand.registrationNumber,
      registrationNumber: cand.registrationNumber,
      model: cand.model,
      year: cand.year,
      bsStage: cand.bsStage,
      homeHub: cand.homeHub,
      capacityTonnes: cand.capacityTonnes,
      engineHeater: cand.engineHeater,
      eligible: !restrictionResult.isRestricted,
      distanceKm,
      reasons: restrictionResult.reasons,
      violatedRules: restrictionResult.violatedRules,
      matchedRules: restrictionResult.matchedRules,
      sources: restrictionResult.sources,
      conflicts,
    });
  }

  const eligibleCandidates = candidateEvaluations.filter((c) => c.eligible);
  const rejectedCandidates = candidateEvaluations.filter((c) => !c.eligible);

  // Deterministic candidate ranking:
  // 1. Distance (closest first)
  // 2. Model Year (newer first)
  // 3. Capacity (higher first)
  eligibleCandidates.sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }
    if (b.year !== a.year) {
      return b.year - a.year;
    }
    return b.capacityTonnes - a.capacityTonnes;
  });

  const selectedVehicle = eligibleCandidates.length > 0 ? eligibleCandidates[0] : null;

  const matchedRules = selectedVehicle ? selectedVehicle.matchedRules : [];
  const reasons = selectedVehicle
    ? [`Selected best eligible replacement ${selectedVehicle.registrationNumber} from '${selectedVehicle.homeHub}' (${selectedVehicle.distanceKm} km).`]
    : ['No eligible replacement vehicle satisfies all active dispatcher constraints.'];
  const sources: SourceCitation[] = selectedVehicle ? selectedVehicle.sources : [];

  return {
    decision: selectedVehicle,
    selectedVehicle,
    candidateEvaluations,
    rejectedCandidates,
    matchedRules,
    reasons,
    sources,
    conflicts,
  };
}
