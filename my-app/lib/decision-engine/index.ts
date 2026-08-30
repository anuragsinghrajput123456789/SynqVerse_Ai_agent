/**
 * Module 2: Decision Engine Service
 * Coordinates deterministic evaluation of severity, action, SLA, restrictions, and vehicle selection.
 */

import crypto from 'crypto';
import {
  DecisionRecord,
  QueueTicket,
  SourceCitation,
  Vehicle,
  Driver,
  Client,
  Conflict,
} from '../types';
import { UnifiedContextStore } from '../context';
import { evaluateSeverity } from './evaluateSeverity';
import { evaluateAction } from './evaluateAction';
import { evaluateSLA } from './evaluateSLA';
import { evaluateReplacementCandidates } from './evaluateVehicle';
import { FullOperationalDecision } from './types';

export * from './types';
export * from './rules';
export * from './evaluateSeverity';
export * from './evaluateAction';
export * from './evaluateSLA';
export * from './evaluateRestrictions';
export * from './evaluateVehicle';

export class DecisionEngine {
  private static instance: DecisionEngine;
  private store = UnifiedContextStore.getInstance();

  public static getInstance(): DecisionEngine {
    if (!DecisionEngine.instance) {
      DecisionEngine.instance = new DecisionEngine();
    }
    return DecisionEngine.instance;
  }

  /**
   * Deterministically evaluates a breakdown ticket and creates a DecisionRecord
   */
  public async evaluateTicket(ticket: QueueTicket): Promise<DecisionRecord> {
    const decisionId = `DEC_${ticket.ticketId}_${crypto.randomBytes(3).toString('hex')}`;
    const createdAt = new Date().toISOString();

    // 1. Context Enrichment from Context Store
    const vehicleContext: Vehicle | null = ticket.vehicle ? await this.store.getVehicle(ticket.vehicle) : null;
    const driverContext: Driver | null = ticket.driverId ? await this.store.getDriver(ticket.driverId) : null;
    const clientContext: Client | null = ticket.client ? await this.store.getClient(ticket.client) : null;
    const allConflicts: Conflict[] = await this.store.getAllConflicts();

    // 2. Evaluator Pipelines
    const severityResult = evaluateSeverity(ticket, clientContext, allConflicts);
    const actionResult = evaluateAction(ticket, severityResult, allConflicts);
    const slaResult = evaluateSLA(ticket, clientContext, allConflicts);

    // 3. Candidate Vehicles Evaluation
    const allVehicles = await this.store.getAllVehicles();
    const vehicleSelectionResult = evaluateReplacementCandidates(ticket, allVehicles, allConflicts);

    // 4. Combine Sources & Rules
    const allSources: SourceCitation[] = [
      ...severityResult.sources,
      ...actionResult.sources,
      ...slaResult.sources,
      ...vehicleSelectionResult.sources,
    ];
    // Deduplicate sources by sourceId
    const uniqueSources = Array.from(new Map(allSources.map((s) => [s.sourceId, s])).values());

    const allMatchedRules = [
      ...severityResult.matchedRules,
      ...actionResult.matchedRules,
      ...slaResult.matchedRules,
      ...vehicleSelectionResult.matchedRules,
    ];
    const uniqueRules = Array.from(new Map(allMatchedRules.map((r) => [r.ruleId, r])).values());

    const allReasons = [
      ...severityResult.reasons,
      ...actionResult.reasons,
      ...slaResult.reasons,
      ...vehicleSelectionResult.reasons,
    ];

    // 5. Build Decision Status
    let decisionStatus: 'DECIDED' | 'INSUFFICIENT_DATA' | 'MANUAL_OVERRIDE_REQUIRED' = 'DECIDED';
    if (severityResult.decision === 'INSUFFICIENT_DATA' || actionResult.decision === 'INSUFFICIENT_DATA') {
      decisionStatus = 'INSUFFICIENT_DATA';
    } else if (actionResult.decision === 'VEHICLE_REPLACEMENT' && !vehicleSelectionResult.selectedVehicle) {
      decisionStatus = 'MANUAL_OVERRIDE_REQUIRED';
    }

    const selectedVehicleCompat = vehicleSelectionResult.selectedVehicle
      ? {
          vehicleId: vehicleSelectionResult.selectedVehicle.vehicleId,
          registrationNumber: vehicleSelectionResult.selectedVehicle.registrationNumber,
          model: vehicleSelectionResult.selectedVehicle.model,
          year: vehicleSelectionResult.selectedVehicle.year,
          bsStage: vehicleSelectionResult.selectedVehicle.bsStage,
          homeHub: vehicleSelectionResult.selectedVehicle.homeHub,
          capacityTonnes: vehicleSelectionResult.selectedVehicle.capacityTonnes,
          engineHeater: vehicleSelectionResult.selectedVehicle.engineHeater,
          eligible: vehicleSelectionResult.selectedVehicle.eligible,
          distanceKm: vehicleSelectionResult.selectedVehicle.distanceKm,
          reasons: vehicleSelectionResult.selectedVehicle.reasons,
          rejectedRules: vehicleSelectionResult.selectedVehicle.violatedRules,
          rulesApplied: vehicleSelectionResult.selectedVehicle.matchedRules,
          sources: vehicleSelectionResult.selectedVehicle.sources,
        }
      : null;

    const candidateEvaluationsCompat = vehicleSelectionResult.candidateEvaluations.map((c) => ({
      vehicleId: c.vehicleId,
      registrationNumber: c.registrationNumber,
      model: c.model,
      year: c.year,
      bsStage: c.bsStage,
      homeHub: c.homeHub,
      capacityTonnes: c.capacityTonnes,
      engineHeater: c.engineHeater,
      eligible: c.eligible,
      distanceKm: c.distanceKm,
      reasons: c.reasons,
      rejectedRules: c.violatedRules,
      rulesApplied: c.matchedRules,
      sources: c.sources,
    }));

    const rejectedCandidatesCompat = vehicleSelectionResult.rejectedCandidates.map((c) => ({
      vehicleId: c.vehicleId,
      registrationNumber: c.registrationNumber,
      model: c.model,
      year: c.year,
      bsStage: c.bsStage,
      homeHub: c.homeHub,
      capacityTonnes: c.capacityTonnes,
      engineHeater: c.engineHeater,
      eligible: c.eligible,
      distanceKm: c.distanceKm,
      reasons: c.reasons,
      rejectedRules: c.violatedRules,
      rulesApplied: c.matchedRules,
      sources: c.sources,
    }));

    let explanation = '';
    if (decisionStatus === 'INSUFFICIENT_DATA') {
      explanation = 'Automated decision aborted: Missing failure issue description or quarantined ticket context.';
    } else if (selectedVehicleCompat) {
      explanation = `Selected replacement vehicle ${selectedVehicleCompat.registrationNumber} (${selectedVehicleCompat.model}, ${selectedVehicleCompat.year}, ${selectedVehicleCompat.bsStage}) from hub '${selectedVehicleCompat.homeHub}' (${selectedVehicleCompat.distanceKm} km). Meets all active route, seasonal, maintenance, and client constraints.`;
    } else {
      explanation = `No eligible replacement vehicle currently meets all active dispatcher constraints (${uniqueRules.map((r) => r.ruleId).join(', ')}). Manual dispatcher intervention required.`;
    }

    const decisionRecord: DecisionRecord = {
      decisionId,
      ticketId: ticket.ticketId,
      createdAt,
      decisionStatus,
      severity: (severityResult.decision === 'INSUFFICIENT_DATA' || severityResult.decision === 'UNKNOWN') ? 'MEDIUM' : severityResult.decision,
      action: (actionResult.decision === 'INSUFFICIENT_DATA') ? 'WORKSHOP_TOW' : actionResult.decision,
      actionReason: actionResult.actionReason,
      selectedVehicle: selectedVehicleCompat,
      candidateEvaluations: candidateEvaluationsCompat,
      rejectedCandidates: rejectedCandidatesCompat,
      rulesApplied: uniqueRules,
      evidence: {
        ticket: {
          ticketId: ticket.ticketId,
          vehicle: ticket.vehicle,
          driverId: ticket.driverId,
          originHub: ticket.originHub,
          destination: ticket.destination,
          kmFromOriginHub: ticket.kmFromOriginHub,
          issue: ticket.issue,
          client: ticket.client,
          createdAt: ticket.createdAt,
        },
        vehicleContext,
        driverContext,
        clientContext,
        slaResult,
        severityResult,
        reasons: allReasons,
      },
      sources: uniqueSources,
      explanation,
      slaDeadlineHours: slaResult.operationalSlaHours,
      transitBufferPercentage: slaResult.transitBufferPercentage,
    };

    await this.store.saveDecision(decisionRecord);
    return decisionRecord;
  }

  /**
   * Evaluates and returns the full modular operational decision structure
   */
  public async evaluateFullOperationalDecision(ticket: QueueTicket): Promise<FullOperationalDecision> {
    const decisionId = `DEC_${ticket.ticketId}_${crypto.randomBytes(3).toString('hex')}`;
    const createdAt = new Date().toISOString();

    const clientContext: Client | null = ticket.client ? await this.store.getClient(ticket.client) : null;
    const allConflicts: Conflict[] = await this.store.getAllConflicts();

    const severity = evaluateSeverity(ticket, clientContext, allConflicts);
    const action = evaluateAction(ticket, severity, allConflicts);
    const sla = evaluateSLA(ticket, clientContext, allConflicts);

    const allVehicles = await this.store.getAllVehicles();
    const vehicleSelection = evaluateReplacementCandidates(ticket, allVehicles, allConflicts);

    const allSources = [
      ...severity.sources,
      ...action.sources,
      ...sla.sources,
      ...vehicleSelection.sources,
    ];
    const uniqueSources = Array.from(new Map(allSources.map((s) => [s.sourceId, s])).values());

    const allMatchedRules = [
      ...severity.matchedRules,
      ...action.matchedRules,
      ...sla.matchedRules,
      ...vehicleSelection.matchedRules,
    ];
    const uniqueRules = Array.from(new Map(allMatchedRules.map((r) => [r.ruleId, r])).values());

    const allReasons = [
      ...severity.reasons,
      ...action.reasons,
      ...sla.reasons,
      ...vehicleSelection.reasons,
    ];

    let decisionStatus: 'DECIDED' | 'INSUFFICIENT_DATA' | 'MANUAL_OVERRIDE_REQUIRED' = 'DECIDED';
    if (severity.decision === 'INSUFFICIENT_DATA' || action.decision === 'INSUFFICIENT_DATA') {
      decisionStatus = 'INSUFFICIENT_DATA';
    } else if (action.decision === 'VEHICLE_REPLACEMENT' && !vehicleSelection.selectedVehicle) {
      decisionStatus = 'MANUAL_OVERRIDE_REQUIRED';
    }

    return {
      decisionId,
      ticketId: ticket.ticketId,
      createdAt,
      decisionStatus,
      severity,
      action,
      sla,
      vehicleSelection,
      matchedRules: uniqueRules,
      reasons: allReasons,
      sources: uniqueSources,
      conflicts: allConflicts,
      explanation: vehicleSelection.selectedVehicle
        ? `Selected replacement vehicle ${vehicleSelection.selectedVehicle.registrationNumber} from ${vehicleSelection.selectedVehicle.homeHub}.`
        : 'Manual dispatcher override required.',
    };
  }

  public async getOrEvaluateDecision(ticketId: string): Promise<DecisionRecord | null> {
    const existing = await this.store.getDecisionByTicketId(ticketId);
    if (existing) {
      return existing;
    }

    const ticket = await this.store.getQueueTicket(ticketId);
    if (!ticket) {
      return null;
    }

    return this.evaluateTicket(ticket);
  }

  public async getAllDecisions(): Promise<DecisionRecord[]> {
    return this.store.getAllDecisions();
  }
}
