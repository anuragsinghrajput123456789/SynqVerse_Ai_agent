/**
 * Replacement Vehicle Selection Module Types
 */

import { Vehicle, QueueTicket, SourceCitation, DispatcherRule, Conflict } from '../types';

export type VehicleCheckName =
  | 'is_available'
  | 'correct_capacity'
  | 'route_permitted'
  | 'seasonal_restrictions_satisfied'
  | 'maintenance_valid'
  | 'not_already_assigned'
  | 'client_requirements_satisfied'
  | 'dispatcher_rules_satisfied';

export interface CheckFailure {
  check: VehicleCheckName;
  reason: string;
  ruleId?: string;
}

export interface CandidateEvaluationResult {
  vehicleId: string;
  registrationNumber: string;
  model: string;
  year: number;
  bsStage: string;
  homeHub: string;
  capacityTonnes: number;
  engineHeater: boolean;
  status: string;
  eligible: boolean;
  distanceKm: number;
  failedChecks: string[]; // e.g. ['maintenance_valid', 'already_assigned']
  failureDetails: CheckFailure[];
  matchedRules: DispatcherRule[];
  reasons: string[];
  sources: SourceCitation[];
}

export interface VehicleSelectionResult {
  status: 'SUCCESS' | 'NO_ELIGIBLE_VEHICLE';
  selectedVehicle: CandidateEvaluationResult | null;
  candidateEvaluations: CandidateEvaluationResult[];
  eligibleCandidates: CandidateEvaluationResult[];
  rejectedCandidates: CandidateEvaluationResult[];
  selectionReason: string;
  rules: DispatcherRule[];
  sources: SourceCitation[];
  conflicts: Conflict[];
}

export interface VehicleSelectionQuery {
  ticket: QueueTicket;
  requiredCapacityTonnes?: number;
  candidatePool?: Vehicle[];
  activeTripVehicleIds?: Set<string>;
}
