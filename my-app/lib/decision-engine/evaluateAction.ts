/**
 * Deterministic Breakdown Action Evaluator
 */

import { QueueTicket, SourceCitation, Conflict } from '../types';
import { ActionEvaluationResult, SeverityEvaluationResult } from './types';

export function evaluateAction(
  ticket: QueueTicket,
  severityResult: SeverityEvaluationResult,
  conflicts: Conflict[] = []
): ActionEvaluationResult {
  const matchedRules = [...severityResult.matchedRules];
  const reasons: string[] = [];
  const sources: SourceCitation[] = [...severityResult.sources];

  if (severityResult.decision === 'INSUFFICIENT_DATA' || severityResult.decision === 'UNKNOWN') {
    return {
      decision: 'INSUFFICIENT_DATA',
      actionReason: 'Cannot determine operational action due to insufficient or quarantined ticket data.',
      matchedRules: [],
      reasons: ['Insufficient ticket evidence to mandate operational action'],
      sources,
      conflicts,
    };
  }

  if (severityResult.decision === 'CRITICAL' || severityResult.decision === 'HIGH' || severityResult.requiresImmediateReplacement) {
    const actionReason = `Consignment schedule and safety mandate immediate VEHICLE_REPLACEMENT due to ${severityResult.decision} failure (${ticket.issue}).`;
    reasons.push(actionReason);
    return {
      decision: 'VEHICLE_REPLACEMENT',
      actionReason,
      matchedRules,
      reasons,
      sources,
      conflicts,
    };
  }

  if (severityResult.decision === 'MEDIUM') {
    const actionReason = `Component failure (${ticket.issue}) allows temporary ROADSIDE_REPAIR if roadside technician can resolve within SLA window.`;
    reasons.push(actionReason);
    return {
      decision: 'ROADSIDE_REPAIR',
      actionReason,
      matchedRules,
      reasons,
      sources,
      conflicts,
    };
  }

  const actionReason = `Minor issue (${ticket.issue}) eligible for basic ROADSIDE_REPAIR without transferring freight consignment.`;
  reasons.push(actionReason);
  return {
    decision: 'ROADSIDE_REPAIR',
    actionReason,
    matchedRules,
    reasons,
    sources,
    conflicts,
  };
}
