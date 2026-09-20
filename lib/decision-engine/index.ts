/**
 * Module 2: Decision Engine Service
 * Coordinates deterministic evaluation of severity, action, SLA, restrictions, and vehicle selection.
 */


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
import { FullOperationalDecision, DispatcherRule } from './types';

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
   * Deterministically evaluates a breakdown ticket and creates an explainable, idempotent DecisionRecord
   */
  public async evaluateTicket(ticket: QueueTicket): Promise<DecisionRecord> {
    const canonicalId = ticket.ticketId || ticket.canonicalTicketId;
    const decisionId = `DEC_${canonicalId}`;
    const createdAt = new Date().toISOString();

    // 1. Idempotency Guard: return existing decision if previously evaluated
    const existing = await this.store.getDecisionByTicketId(canonicalId);
    if (existing) {
      return existing;
    }

    // 2. Deduplication Guard: if ticket is marked duplicate, return idempotent duplicate resolution
    if (ticket.isDuplicate || ticket.status === 'DUPLICATE') {
      const duplicateRecord: DecisionRecord = {
        decisionId,
        ticketId: canonicalId,
        createdAt,
        timestamp: createdAt,
        decision: 'DUPLICATE_SKIPPED',
        reason: `Duplicate ticket detected for canonical ticket '${ticket.canonicalTicketId || canonicalId}'. Idempotent re-evaluation skipped.`,
        rulesApplied: [],
        inputsUsed: {
          ticketId: canonicalId,
          canonicalTicketId: ticket.canonicalTicketId,
          isDuplicate: true,
          status: ticket.status,
        },
        rejectedReasons: ['Ticket is flagged as duplicate of an existing active dispatch.'],
        decisionStatus: 'DECIDED',
        severity: 'LOW',
        action: 'ROADSIDE_REPAIR',
        actionReason: 'Duplicate ticket skipped',
        selectedVehicle: null,
        candidateEvaluations: [],
        rejectedCandidates: [],
        evidence: { duplicate: true, canonicalTicketId: ticket.canonicalTicketId },
        sources: [],
        explanation: `Duplicate ticket detected for canonical ticket '${ticket.canonicalTicketId || canonicalId}'.`,
      };
      await this.store.saveDecision(duplicateRecord);
      return duplicateRecord;
    }

    // 3. Missing Information Guard: Do NOT guess. Return INSUFFICIENT_DATA.
    const missingFields: string[] = [];
    if (!ticket.issue || !ticket.issue.trim()) missingFields.push('failure issue description');
    if (!ticket.vehicle || !ticket.vehicle.trim()) missingFields.push('vehicle identifier');
    if (!ticket.driverId || !ticket.driverId.trim()) missingFields.push('driver identifier');
    if (ticket.isQuarantined || ticket.status === 'QUARANTINED') missingFields.push('quarantined status');

    const inputsUsed: Record<string, unknown> = {
      ticketId: canonicalId,
      vehicle: ticket.vehicle || '',
      driverId: ticket.driverId || '',
      client: ticket.client || '',
      originHub: ticket.originHub || '',
      destination: ticket.destination || '',
      kmFromOriginHub: ticket.kmFromOriginHub ?? null,
      issue: ticket.issue || '',
      reportedSeverity: ticket.severity || '',
      createdAt: ticket.createdAt || createdAt,
    };

    if (missingFields.length > 0) {
      const reason = `Automated operational decision aborted: Breakdown ticket has missing required context (${missingFields.join(', ')}).`;
      const insufficientRecord: DecisionRecord = {
        decisionId,
        ticketId: canonicalId,
        createdAt,
        timestamp: createdAt,
        decision: 'INSUFFICIENT_DATA',
        reason,
        rulesApplied: [],
        inputsUsed,
        rejectedReasons: missingFields.map((f) => `Missing required context: ${f}`),
        decisionStatus: 'INSUFFICIENT_DATA',
        severity: 'MEDIUM',
        action: 'WORKSHOP_TOW',
        actionReason: 'Cannot determine operational action due to missing context.',
        selectedVehicle: null,
        candidateEvaluations: [],
        rejectedCandidates: [],
        evidence: { missingFields, ticket },
        sources: [],
        explanation: reason,
      };
      await this.store.saveDecision(insufficientRecord);
      return insufficientRecord;
    }

    // 4. Context Enrichment from Context Store
    const vehicleContext: Vehicle | null = await this.store.getVehicle(ticket.vehicle);
    const driverContext: Driver | null = await this.store.getDriver(ticket.driverId);
    const clientContext: Client | null = ticket.client ? await this.store.getClient(ticket.client) : null;
    const allConflicts: Conflict[] = await this.store.getAllConflicts();

    inputsUsed.resolvedVehicle = vehicleContext
      ? {
          registrationNumber: vehicleContext.registrationNumber,
          model: vehicleContext.model,
          year: vehicleContext.year,
          bsStage: vehicleContext.bsStage,
          homeHub: vehicleContext.homeHub,
        }
      : null;
    inputsUsed.resolvedDriver = driverContext
      ? {
          driverId: driverContext.driverId,
          name: driverContext.name,
        }
      : null;
    inputsUsed.contractSlaHours = clientContext?.contractSlaHours ?? 48;

    // 5. Modular Evaluator Pipelines (100% Deterministic)
    const severityResult = evaluateSeverity(ticket, clientContext, allConflicts);
    const actionResult = evaluateAction(ticket, severityResult, allConflicts);
    const slaResult = evaluateSLA(ticket, clientContext, allConflicts);

    inputsUsed.operationalSlaHours = slaResult.operationalSlaHours;
    inputsUsed.transitBufferPercentage = slaResult.transitBufferPercentage;
    if (slaResult.deliveryCutoffTime) {
      inputsUsed.deliveryCutoffTime = slaResult.deliveryCutoffTime;
    }

    // 6. Candidate Replacement Vehicles Evaluation
    const allVehicles = await this.store.getAllVehicles();
    inputsUsed.totalFleetEvaluated = allVehicles.length;
    const vehicleSelectionResult = evaluateReplacementCandidates(ticket, allVehicles, allConflicts);

    // 7. Sources & Rules Aggregation
    const allSources: SourceCitation[] = [
      ...severityResult.sources,
      ...actionResult.sources,
      ...slaResult.sources,
      ...vehicleSelectionResult.sources,
    ];
    const uniqueSources = Array.from(new Map(allSources.map((s) => [s.sourceId, s])).values());

    const allMatchedRules: DispatcherRule[] = [
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

    // 8. Rejected Reasons Compilation
    const rejectedReasons: string[] = [];

    // Log candidate rejection reasons
    for (const rejected of vehicleSelectionResult.rejectedCandidates) {
      const violatedRuleIds = rejected.violatedRules.map((r) => r.ruleId).join(', ') || 'unspecified';
      rejectedReasons.push(
        `Candidate ${rejected.registrationNumber} (${rejected.model}, ${rejected.homeHub}) rejected under rule(s) [${violatedRuleIds}]: ${rejected.reasons.join('; ')}`
      );
    }

    // If roadside repair was rejected in favor of replacement
    if (actionResult.decision === 'VEHICLE_REPLACEMENT') {
      rejectedReasons.push(
        `Roadside repair rejected: ${severityResult.decision} failure (${ticket.issue}) cannot be safely resolved roadside within committed SLA.`
      );
    }

    // If multiple candidates were eligible, capture runner-up rankings
    const eligiblePool = vehicleSelectionResult.candidateEvaluations.filter((c) => c.eligible);
    if (eligiblePool.length > 1) {
      for (let i = 1; i < eligiblePool.length; i++) {
        rejectedReasons.push(
          `Eligible candidate ${eligiblePool[i].registrationNumber} ranked #${i + 1} behind ${eligiblePool[0].registrationNumber} on proximity/year/capacity.`
        );
      }
    }

    // 9. Build Decision Status and Primary Standard Decision
    let decisionStatus: 'DECIDED' | 'INSUFFICIENT_DATA' | 'MANUAL_OVERRIDE_REQUIRED' = 'DECIDED';
    let standardDecision: 'VEHICLE_REPLACEMENT' | 'ROADSIDE_REPAIR' | 'WORKSHOP_TOW' | 'INSUFFICIENT_DATA' | 'MANUAL_OVERRIDE_REQUIRED' | 'DUPLICATE_SKIPPED';

    if (severityResult.decision === 'INSUFFICIENT_DATA' || actionResult.decision === 'INSUFFICIENT_DATA') {
      decisionStatus = 'INSUFFICIENT_DATA';
      standardDecision = 'INSUFFICIENT_DATA';
    } else if (actionResult.decision === 'VEHICLE_REPLACEMENT' && !vehicleSelectionResult.selectedVehicle) {
      decisionStatus = 'MANUAL_OVERRIDE_REQUIRED';
      standardDecision = 'MANUAL_OVERRIDE_REQUIRED';
    } else if (actionResult.decision === 'VEHICLE_REPLACEMENT') {
      standardDecision = 'VEHICLE_REPLACEMENT';
    } else if (actionResult.decision === 'WORKSHOP_TOW') {
      standardDecision = 'WORKSHOP_TOW';
    } else {
      standardDecision = 'ROADSIDE_REPAIR';
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
    } else if (actionResult.decision === 'VEHICLE_REPLACEMENT') {
      explanation = `No eligible replacement vehicle currently meets all active dispatcher constraints (${uniqueRules.map((r) => r.ruleId).join(', ')}). Manual dispatcher intervention required.`;
    } else {
      explanation = `Action ${actionResult.decision} authorized for issue '${ticket.issue}'. ${actionResult.actionReason}`;
    }

    const decisionRecord: DecisionRecord = {
      decisionId,
      ticketId: canonicalId,
      createdAt,
      timestamp: createdAt,
      decision: standardDecision,
      reason: explanation,
      rulesApplied: uniqueRules,
      inputsUsed,
      rejectedReasons,
      decisionStatus,
      severity: (severityResult.decision === 'INSUFFICIENT_DATA' || severityResult.decision === 'UNKNOWN') ? 'MEDIUM' : severityResult.decision,
      action: (actionResult.decision === 'INSUFFICIENT_DATA') ? 'WORKSHOP_TOW' : actionResult.decision,
      actionReason: actionResult.actionReason,
      selectedVehicle: selectedVehicleCompat,
      candidateEvaluations: candidateEvaluationsCompat,
      rejectedCandidates: rejectedCandidatesCompat,
      evidence: {
        ticket: {
          ticketId: canonicalId,
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
    const decRecord = await this.evaluateTicket(ticket);
    const clientContext: Client | null = ticket.client ? await this.store.getClient(ticket.client) : null;
    const allConflicts: Conflict[] = await this.store.getAllConflicts();
    const severity = evaluateSeverity(ticket, clientContext, allConflicts);
    const action = evaluateAction(ticket, severity, allConflicts);
    const sla = evaluateSLA(ticket, clientContext, allConflicts);
    const allVehicles = await this.store.getAllVehicles();
    const vehicleSelection = evaluateReplacementCandidates(ticket, allVehicles, allConflicts);

    const reasons = (decRecord.evidence?.reasons as string[]) || decRecord.reason ? [decRecord.reason] : [];

    return {
      decisionId: decRecord.decisionId,
      ticketId: decRecord.ticketId,
      createdAt: decRecord.createdAt,
      timestamp: decRecord.timestamp,
      decision: decRecord.decision,
      reason: decRecord.reason,
      rulesApplied: decRecord.rulesApplied,
      inputsUsed: decRecord.inputsUsed,
      rejectedReasons: decRecord.rejectedReasons,
      decisionStatus: decRecord.decisionStatus,
      severity,
      action,
      sla,
      vehicleSelection,
      matchedRules: decRecord.rulesApplied,
      reasons,
      sources: decRecord.sources,
      conflicts: allConflicts,
      explanation: decRecord.explanation,
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
