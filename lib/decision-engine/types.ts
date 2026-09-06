/**
 * Module 2: Decision Engine Types
 * Pure deterministic interfaces for operational decision making.
 */

import { SourceCitation, Conflict } from '../types';

export interface DispatcherRule {
  ruleId: string;
  name: string;
  condition: string;
  decision: string;
  priority: number;
  source: string;
  sourceReference: string;
  category?: 'route' | 'seasonal' | 'vehicle' | 'maintenance' | 'client' | 'driver' | 'severity' | 'sla';
}

export interface RuleEvaluationResult<T = unknown> {
  decision: T;
  matchedRules: DispatcherRule[];
  reasons: string[];
  sources: SourceCitation[];
  conflicts: Conflict[];
}

export interface SeverityEvaluationResult extends RuleEvaluationResult<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN' | 'INSUFFICIENT_DATA'> {
  isMajorMechanicalFailure: boolean;
  requiresImmediateReplacement: boolean;
}

export interface ActionEvaluationResult extends RuleEvaluationResult<'ROADSIDE_REPAIR' | 'VEHICLE_REPLACEMENT' | 'WORKSHOP_TOW' | 'INSUFFICIENT_DATA'> {
  actionReason: string;
}

export interface SLAEvaluationResult extends RuleEvaluationResult<number> {
  baseSlaHours: number;
  operationalSlaHours: number;
  transitBufferPercentage: number;
  deliveryCutoffTime?: string;
  specialInstructions: string[];
}

export interface RestrictionEvaluationResult extends RuleEvaluationResult<boolean> {
  isRestricted: boolean;
  violatedRules: DispatcherRule[];
}

export interface CandidateVehicleEvaluation {
  vehicleId: string;
  registrationNumber: string;
  model: string;
  year: number;
  bsStage: string;
  homeHub: string;
  capacityTonnes: number;
  engineHeater: boolean;
  eligible: boolean;
  distanceKm: number;
  reasons: string[];
  violatedRules: DispatcherRule[];
  matchedRules: DispatcherRule[];
  sources: SourceCitation[];
  conflicts: Conflict[];
}

export interface VehicleSelectionResult extends RuleEvaluationResult<CandidateVehicleEvaluation | null> {
  selectedVehicle: CandidateVehicleEvaluation | null;
  candidateEvaluations: CandidateVehicleEvaluation[];
  rejectedCandidates: CandidateVehicleEvaluation[];
}

export interface FullOperationalDecision {
  decisionId: string;
  ticketId: string;
  createdAt: string;
  decisionStatus: 'DECIDED' | 'INSUFFICIENT_DATA' | 'MANUAL_OVERRIDE_REQUIRED';
  severity: SeverityEvaluationResult;
  action: ActionEvaluationResult;
  sla: SLAEvaluationResult;
  vehicleSelection: VehicleSelectionResult;
  matchedRules: DispatcherRule[];
  reasons: string[];
  sources: SourceCitation[];
  conflicts: Conflict[];
  explanation: string;
}
