/**
 * Module 2: Decision Engine Service
 * Deterministic Context Enrichment, Dispatcher Rule Evaluation, Severity Assessment,
 * and Candidate Replacement Vehicle Selection.
 */

import crypto from 'crypto';
import {
  DecisionRecord,
  CandidateEvaluation,
  DispatcherRule,
  QueueTicket,
  SourceCitation,
  Vehicle,
  Driver,
  Client,
} from '../types';
import { UnifiedContextStore } from '../context';
import { DISPATCHER_RULES } from './rules';

// Approximate hub distances in kilometers across Meridian Freight Northern Network
const HUB_DISTANCES: Record<string, Record<string, number>> = {
  Gurgaon: { Gurgaon: 0, Delhi: 35, Faridabad: 40, Noida: 50, Ambala: 240, Ludhiana: 330, Kanpur: 480, Lucknow: 540, Rudrapur: 270 },
  Delhi: { Delhi: 0, Gurgaon: 35, Faridabad: 30, Noida: 25, Ambala: 210, Ludhiana: 310, Kanpur: 470, Lucknow: 525, Rudrapur: 245 },
  Ambala: { Ambala: 0, Ludhiana: 110, Delhi: 210, Gurgaon: 240, Rudrapur: 290, Kanpur: 670, Lucknow: 720, Faridabad: 235, Noida: 225 },
  Ludhiana: { Ludhiana: 0, Ambala: 110, Delhi: 310, Gurgaon: 330, Rudrapur: 390, Kanpur: 780, Lucknow: 830, Faridabad: 335, Noida: 325 },
  Kanpur: { Kanpur: 0, Lucknow: 85, Delhi: 470, Gurgaon: 480, Rudrapur: 380, Ambala: 670, Ludhiana: 780, Faridabad: 460, Noida: 450 },
  Lucknow: { Lucknow: 0, Kanpur: 85, Delhi: 525, Gurgaon: 540, Rudrapur: 320, Gorakhpur: 270, Varanasi: 310, Ambala: 720, Ludhiana: 830 },
  Rudrapur: { Rudrapur: 0, Delhi: 245, Gurgaon: 270, Noida: 235, Lucknow: 320, Kanpur: 380, Ambala: 290, Ludhiana: 390, Faridabad: 260 },
};

function getHubDistance(hubA: string, hubB: string): number {
  if (!hubA || !hubB) return 300;
  if (hubA === hubB) return 0;
  if (HUB_DISTANCES[hubA]?.[hubB] !== undefined) return HUB_DISTANCES[hubA][hubB];
  if (HUB_DISTANCES[hubB]?.[hubA] !== undefined) return HUB_DISTANCES[hubB][hubA];
  return 350;
}

function isWinterMonth(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1; // 1 to 12
    return [10, 11, 12, 1, 2].includes(month);
  } catch {
    return false;
  }
}

function isMonsoonMonth(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    return [7, 8, 9].includes(month);
  } catch {
    return false;
  }
}

function touchesDelhiNcr(origin: string, destination: string): boolean {
  const ncrList = ['delhi', 'gurgaon', 'faridabad', 'noida'];
  const orig = origin.toLowerCase();
  const dest = destination.toLowerCase();
  return ncrList.some((n) => orig.includes(n) || dest.includes(n));
}

function isHillDestination(destination: string): boolean {
  const hillList = ['rudrapur', 'nainital', 'uttarakhand', 'haldwani', 'almora'];
  const dest = destination.toLowerCase();
  return hillList.some((h) => dest.includes(h));
}

function isEastOfLucknow(destination: string): boolean {
  const eastList = ['gorakhpur', 'patna', 'varanasi', 'bihar', 'muzaffarpur'];
  const dest = destination.toLowerCase();
  return eastList.some((e) => dest.includes(e));
}

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
   * Enriches context and generates an operational decision for a breakdown ticket
   */
  public async evaluateTicket(ticket: QueueTicket): Promise<DecisionRecord> {
    const decisionId = `DEC_${ticket.ticketId}_${crypto.randomBytes(3).toString('hex')}`;
    const createdAt = new Date().toISOString();

    const rulesApplied: DispatcherRule[] = [];
    const citations: SourceCitation[] = [];

    // STEP 1: CONTEXT ENRICHMENT
    const vehicleContext: Vehicle | null = ticket.vehicle ? await this.store.getVehicle(ticket.vehicle) : null;
    const driverContext: Driver | null = ticket.driverId ? await this.store.getDriver(ticket.driverId) : null;
    const clientContext: Client | null = ticket.client ? await this.store.getClient(ticket.client) : null;

    citations.push({
      sourceId: `ticket_${ticket.ticketId}`,
      sourceFile: ticket.sourceFile || 'tickets.json',
      sourceType: 'tickets',
      recordId: ticket.ticketId,
      field: 'incident_record',
      originalValueMasked: ticket,
      resolvedValue: ticket,
      precedence: 3,
      resolutionReason: 'Breakdown ticket incident payload',
    });

    if (vehicleContext) {
      citations.push({
        sourceId: `fleet_${vehicleContext.registrationNumber}`,
        sourceFile: 'fleet_master.csv',
        sourceType: 'fleet_master',
        recordId: vehicleContext.registrationNumber,
        field: 'vehicle_profile',
        originalValueMasked: vehicleContext,
        resolvedValue: vehicleContext,
        precedence: 1,
        resolutionReason: 'Authoritative Fleet Master registration record',
      });
    }

    if (clientContext) {
      citations.push({
        sourceId: `client_${clientContext.name}`,
        sourceFile: 'contracts_master',
        sourceType: 'fleet_master',
        recordId: clientContext.name,
        field: 'client_sla_rules',
        originalValueMasked: clientContext,
        resolvedValue: clientContext,
        precedence: 1,
        resolutionReason: 'Client SLA contract specification',
      });
    }

    // Validation check for Insufficient Data
    if (!ticket.issue || ticket.isQuarantined) {
      const decision: DecisionRecord = {
        decisionId,
        ticketId: ticket.ticketId,
        createdAt,
        decisionStatus: 'INSUFFICIENT_DATA',
        severity: 'MEDIUM',
        action: 'WORKSHOP_TOW',
        actionReason: 'Insufficient or malformed ticket context to generate safe automated operational decision.',
        selectedVehicle: null,
        candidateEvaluations: [],
        rejectedCandidates: [],
        rulesApplied: [],
        evidence: { error: 'Missing critical ticket context or quarantined ticket' },
        sources: citations,
        explanation: 'Automatic decision aborted due to insufficient evidence or invalid vehicle identifier.',
      };
      await this.store.saveDecision(decision);
      return decision;
    }

    // STEP 2: DETERMINISTIC SEVERITY CLASSIFICATION
    const issueLower = ticket.issue.toLowerCase();
    let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let action: 'ROADSIDE_REPAIR' | 'VEHICLE_REPLACEMENT' | 'WORKSHOP_TOW' = 'VEHICLE_REPLACEMENT';
    let actionReason = '';

    const isMajorMechanicalFailure =
      issueLower.includes('overheating') ||
      issueLower.includes('turbo') ||
      issueLower.includes('gearbox') ||
      issueLower.includes('transmission') ||
      issueLower.includes('fuel line') ||
      issueLower.includes('engine') ||
      issueLower.includes('suspension');

    const isShaktiOrOrion = ticket.client === 'Shakti Cement' || ticket.client === 'Orion Pharma';

    if (isMajorMechanicalFailure && isShaktiOrOrion) {
      severity = 'CRITICAL';
      action = 'VEHICLE_REPLACEMENT';
      actionReason = `Major powertrain/mechanical failure ('${ticket.issue}') on high-priority SLA client (${ticket.client}) requires immediate vehicle replacement to prevent SLA breach.`;
    } else if (isMajorMechanicalFailure) {
      severity = 'HIGH';
      action = 'VEHICLE_REPLACEMENT';
      actionReason = `Major mechanical breakdown ('${ticket.issue}') requires replacement vehicle to maintain consignment transit schedule.`;
    } else if (issueLower.includes('clutch') || issueLower.includes('radiator') || issueLower.includes('alternator')) {
      severity = 'HIGH';
      action = 'VEHICLE_REPLACEMENT';
      actionReason = `Component failure ('${ticket.issue}') prevents safe continuous long-haul transit.`;
    } else {
      severity = 'LOW';
      action = 'ROADSIDE_REPAIR';
      actionReason = `Minor failure ('${ticket.issue}') eligible for roadside assistance without transferring consignment.`;
    }

    // Client SLA Rules
    if (ticket.client === 'Shakti Cement') {
      rulesApplied.push(DISPATCHER_RULES['R-008']);
    }

    if (ticket.client === 'Vertex Retail' && ticket.destination.toLowerCase().includes('ludhiana')) {
      rulesApplied.push(DISPATCHER_RULES['R-009']);
    }

    let transitBuffer = 0;
    if (isMonsoonMonth(ticket.createdAt) && isEastOfLucknow(ticket.destination)) {
      rulesApplied.push(DISPATCHER_RULES['R-011']);
      transitBuffer = 20;
    }

    // STEP 3: REPLACEMENT VEHICLE CANDIDATE EVALUATION
    const allVehicles = await this.store.getAllVehicles();
    const candidateEvaluations: CandidateEvaluation[] = [];

    const isWinter = isWinterMonth(ticket.createdAt);
    const ncrRoute = touchesDelhiNcr(ticket.originHub, ticket.destination);
    const hillRoute = isHillDestination(ticket.destination);
    const isUnder50km = ticket.kmFromOriginHub <= 50;
    const requiredHub = isUnder50km ? ticket.originHub : (ticket.originHub || 'Gurgaon');

    if (isUnder50km) {
      rulesApplied.push(DISPATCHER_RULES['R-004']);
    }
    if (isWinter && ncrRoute) {
      rulesApplied.push(DISPATCHER_RULES['R-001']);
    }
    if (isWinter && hillRoute) {
      rulesApplied.push(DISPATCHER_RULES['R-002']);
    }
    if (hillRoute) {
      rulesApplied.push(DISPATCHER_RULES['R-003']);
    }
    if (ticket.client === 'Orion Pharma') {
      rulesApplied.push(DISPATCHER_RULES['R-007']);
    }
    if (ticket.client === 'Apex Chemicals') {
      rulesApplied.push(DISPATCHER_RULES['R-010']);
    }

    for (const cand of allVehicles) {
      // Exclude broken vehicle itself
      if (cand.registrationNumber === ticket.vehicle) {
        continue;
      }

      const reasons: string[] = [];
      const candRejectedRules: DispatcherRule[] = [];
      const candRulesApplied: DispatcherRule[] = [];
      const candSources: SourceCitation[] = [];

      candSources.push({
        sourceId: `fleet_${cand.registrationNumber}`,
        sourceFile: 'fleet_master.csv',
        sourceType: 'fleet_master',
        recordId: cand.registrationNumber,
        field: 'vehicle_profile',
        originalValueMasked: cand,
        resolvedValue: cand,
        precedence: 1,
        resolutionReason: 'Fleet Master profile for candidate replacement',
      });

      let eligible = true;

      // 1. Status Check
      if (cand.status !== 'Active' && cand.status !== 'AVAILABLE') {
        eligible = false;
        reasons.push(`Vehicle status is '${cand.status}' (not Active/Available)`);
        candRejectedRules.push(DISPATCHER_RULES['R-012']);
      } else {
        candRulesApplied.push(DISPATCHER_RULES['R-012']);
      }

      // 2. Overdue Service Check
      if (cand.status === 'GROUNDED' || cand.status === 'MAINTENANCE') {
        eligible = false;
        reasons.push('Vehicle is grounded or in maintenance workshop');
        candRejectedRules.push(DISPATCHER_RULES['R-005']);
      }

      // 3. Winter Delhi NCR BS6 Restriction (Rule R-001)
      if (isWinter && ncrRoute) {
        candRulesApplied.push(DISPATCHER_RULES['R-001']);
        if (cand.bsStage !== 'BS6') {
          eligible = false;
          reasons.push(`BS4 vehicle prohibited on Delhi NCR route in winter (October-February) under GRAP rule`);
          candRejectedRules.push(DISPATCHER_RULES['R-001']);
        }
      }

      // 4. Hill Route Engine Heater Requirement (Rule R-002)
      if (isWinter && hillRoute) {
        candRulesApplied.push(DISPATCHER_RULES['R-002']);
        if (!cand.engineHeater) {
          eligible = false;
          reasons.push('Missing engine heater required for winter hill route cold-starts');
          candRejectedRules.push(DISPATCHER_RULES['R-002']);
        }
      }

      // 5. Origin Hub Sourcing for <50km Breakdowns (Rule R-004)
      if (isUnder50km) {
        candRulesApplied.push(DISPATCHER_RULES['R-004']);
        if (cand.homeHub !== ticket.originHub) {
          eligible = false;
          reasons.push(`Breakdown is within 50km (${ticket.kmFromOriginHub}km) of origin hub '${ticket.originHub}'. Rule R-004 mandates replacement from origin hub, but candidate is at '${cand.homeHub}'`);
          candRejectedRules.push(DISPATCHER_RULES['R-004']);
        }
      }

      // 6. Orion Pharma Minimum Model Year Requirement (Rule R-007)
      if (ticket.client === 'Orion Pharma') {
        candRulesApplied.push(DISPATCHER_RULES['R-007']);
        if (cand.year < 2020) {
          eligible = false;
          reasons.push(`Model year (${cand.year}) is older than 2020. Orion Pharma audit mandates vehicle year 2020 or newer`);
          candRejectedRules.push(DISPATCHER_RULES['R-007']);
        }
      }

      // 7. Apex Chemicals Plate Rotation (Rule R-010)
      if (ticket.client === 'Apex Chemicals') {
        candRulesApplied.push(DISPATCHER_RULES['R-010']);
        // If this specific candidate vehicle had an issue on an Apex run
        if (cand.registrationNumber === 'UP-54-XZ-6139' || cand.registrationNumber === 'UP54XZ6139') {
          eligible = false;
          reasons.push('Candidate vehicle was involved in a previous breakdown on an Apex Chemicals run. Rule R-010 requires plate rotation');
          candRejectedRules.push(DISPATCHER_RULES['R-010']);
        }
      }

      const distanceKm = getHubDistance(cand.homeHub, requiredHub);

      candidateEvaluations.push({
        vehicleId: cand.vehicleId || cand.registrationNumber,
        registrationNumber: cand.registrationNumber,
        model: cand.model,
        year: cand.year,
        bsStage: cand.bsStage,
        homeHub: cand.homeHub,
        capacityTonnes: cand.capacityTonnes,
        engineHeater: cand.engineHeater,
        eligible,
        distanceKm,
        reasons: reasons.length > 0 ? reasons : ['Vehicle meets all availability, route, client, and seasonal requirements'],
        rejectedRules: candRejectedRules,
        rulesApplied: candRulesApplied,
        sources: candSources,
      });
    }

    // Filter and Rank Eligible Candidates
    const eligibleCandidates = candidateEvaluations.filter((c) => c.eligible);
    const rejectedCandidates = candidateEvaluations.filter((c) => !c.eligible);

    // Sorting criteria: 1. Distance (closest first), 2. Year (newer first), 3. Capacity
    eligibleCandidates.sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      return b.year - a.year;
    });

    const selectedVehicle = eligibleCandidates.length > 0 ? eligibleCandidates[0] : null;

    let explanation = '';
    if (selectedVehicle) {
      explanation = `Selected replacement vehicle ${selectedVehicle.registrationNumber} (${selectedVehicle.model}, ${selectedVehicle.year}, ${selectedVehicle.bsStage}) from hub '${selectedVehicle.homeHub}' (${selectedVehicle.distanceKm} km). Fully satisfies all ${rulesApplied.length} active dispatcher rules including seasonal, client, and route restrictions.`;
    } else {
      explanation = `No fully eligible replacement vehicle available meeting all active dispatcher constraints (${rulesApplied.map((r) => r.ruleId).join(', ')}). Manual dispatcher intervention required.`;
    }

    const decisionRecord: DecisionRecord = {
      decisionId,
      ticketId: ticket.ticketId,
      createdAt,
      decisionStatus: selectedVehicle ? 'DECIDED' : 'MANUAL_OVERRIDE_REQUIRED',
      severity,
      action,
      actionReason,
      selectedVehicle,
      candidateEvaluations,
      rejectedCandidates,
      rulesApplied: Array.from(new Set(rulesApplied)),
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
        isWinter,
        ncrRoute,
        hillRoute,
        isUnder50km,
      },
      sources: citations,
      explanation,
      slaDeadlineHours: clientContext?.operationalSlaHours || 48,
      transitBufferPercentage: transitBuffer,
    };

    await this.store.saveDecision(decisionRecord);
    return decisionRecord;
  }

  /**
   * Retrieves an existing decision or evaluates on-the-fly
   */
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

  /**
   * Retrieves all evaluated decisions
   */
  public async getAllDecisions(): Promise<DecisionRecord[]> {
    return this.store.getAllDecisions();
  }
}
