/**
 * Deterministic Breakdown Severity Evaluator
 */

import { QueueTicket, SourceCitation, Conflict, Client } from '../types';
import { SeverityEvaluationResult, DispatcherRule } from './types';
import { DISPATCHER_RULES } from './rules';

export function evaluateSeverity(
  ticket: QueueTicket,
  clientContext: Client | null,
  conflicts: Conflict[] = []
): SeverityEvaluationResult {
  const matchedRules: DispatcherRule[] = [];
  const reasons: string[] = [];
  const sources: SourceCitation[] = [];

  sources.push({
    sourceId: `ticket_${ticket.ticketId}`,
    sourceFile: ticket.sourceFile || 'tickets.json',
    sourceType: 'tickets',
    recordId: ticket.ticketId,
    field: 'severity_assessment',
    originalValueMasked: ticket.issue,
    resolvedValue: ticket.issue,
    precedence: 3,
    resolutionReason: 'Breakdown ticket failure description',
  });

  // Guard: Check for missing context
  if (!ticket.issue || !ticket.issue.trim() || ticket.isQuarantined) {
    return {
      decision: 'INSUFFICIENT_DATA',
      isMajorMechanicalFailure: false,
      requiresImmediateReplacement: false,
      matchedRules: [],
      reasons: ['Breakdown ticket is missing failure issue description or is quarantined'],
      sources,
      conflicts,
    };
  }

  const issueLower = ticket.issue.toLowerCase();

  const isMajorMechanicalFailure =
    issueLower.includes('overheating') ||
    issueLower.includes('turbo') ||
    issueLower.includes('gearbox') ||
    issueLower.includes('transmission') ||
    issueLower.includes('fuel line') ||
    issueLower.includes('engine') ||
    issueLower.includes('suspension');

  const isHighSlaClient = ticket.client === 'Shakti Cement' || ticket.client === 'Orion Pharma';

  if (isMajorMechanicalFailure && isHighSlaClient) {
    if (ticket.client === 'Shakti Cement') {
      matchedRules.push(DISPATCHER_RULES['R-008']);
      reasons.push(`Major mechanical powertrain failure ('${ticket.issue}') on high-priority client (Shakti Cement) classified as CRITICAL under Rule R-008 (36h window).`);
    } else {
      matchedRules.push(DISPATCHER_RULES['R-007']);
      reasons.push(`Major mechanical powertrain failure ('${ticket.issue}') on pharma client (Orion Pharma) classified as CRITICAL.`);
    }

    return {
      decision: 'CRITICAL',
      isMajorMechanicalFailure: true,
      requiresImmediateReplacement: true,
      matchedRules,
      reasons,
      sources,
      conflicts,
    };
  }

  if (isMajorMechanicalFailure) {
    reasons.push(`Major mechanical failure ('${ticket.issue}') classified as HIGH severity requiring replacement.`);
    return {
      decision: 'HIGH',
      isMajorMechanicalFailure: true,
      requiresImmediateReplacement: true,
      matchedRules,
      reasons,
      sources,
      conflicts,
    };
  }

  if (
    issueLower.includes('clutch') ||
    issueLower.includes('radiator') ||
    issueLower.includes('alternator') ||
    issueLower.includes('brake')
  ) {
    reasons.push(`Component failure ('${ticket.issue}') prevents safe continuous long-haul transit; classified as HIGH.`);
    return {
      decision: 'HIGH',
      isMajorMechanicalFailure: false,
      requiresImmediateReplacement: true,
      matchedRules,
      reasons,
      sources,
      conflicts,
    };
  }

  if (issueLower.includes('sensor') || issueLower.includes('electrical') || issueLower.includes('jugaad')) {
    reasons.push(`Minor/medium electrical or temporary patch issue ('${ticket.issue}') classified as MEDIUM.`);
    return {
      decision: 'MEDIUM',
      isMajorMechanicalFailure: false,
      requiresImmediateReplacement: false,
      matchedRules,
      reasons,
      sources,
      conflicts,
    };
  }

  reasons.push(`Minor failure ('${ticket.issue}') classified as LOW severity.`);
  return {
    decision: 'LOW',
    isMajorMechanicalFailure: false,
    requiresImmediateReplacement: false,
    matchedRules,
    reasons,
    sources,
    conflicts,
  };
}
