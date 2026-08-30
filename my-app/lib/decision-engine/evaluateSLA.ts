/**
 * Deterministic SLA & Timing Evaluator
 */

import { QueueTicket, Client, SourceCitation, Conflict } from '../types';
import { SLAEvaluationResult, DispatcherRule } from './types';
import { DISPATCHER_RULES } from './rules';

function isMonsoonMonth(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    return [7, 8, 9].includes(month);
  } catch {
    return false;
  }
}

function isEastOfLucknow(destination: string): boolean {
  const east = ['gorakhpur', 'patna', 'varanasi', 'bihar', 'muzaffarpur'];
  const dest = (destination || '').toLowerCase();
  return east.some((e) => dest.includes(e));
}

export function evaluateSLA(
  ticket: QueueTicket,
  clientContext: Client | null,
  conflicts: Conflict[] = []
): SLAEvaluationResult {
  const matchedRules: DispatcherRule[] = [];
  const reasons: string[] = [];
  const sources: SourceCitation[] = [];
  const specialInstructions: string[] = [];

  const baseSlaHours = clientContext?.contractSlaHours || 48;
  let operationalSlaHours = clientContext?.operationalSlaHours || baseSlaHours;
  let transitBufferPercentage = 0;
  let deliveryCutoffTime: string | undefined = undefined;

  sources.push({
    sourceId: `client_${ticket.client || 'default'}`,
    sourceFile: 'contracts_master',
    sourceType: 'fleet_master',
    recordId: ticket.client,
    field: 'sla_contract',
    originalValueMasked: baseSlaHours,
    resolvedValue: baseSlaHours,
    precedence: 1,
    resolutionReason: 'Client contract SLA specification',
  });

  // 1. Shakti Cement Rule (R-008): 36 hours operational window
  if (ticket.client === 'Shakti Cement') {
    matchedRules.push(DISPATCHER_RULES['R-008']);
    operationalSlaHours = 36;
    reasons.push('Rule R-008: Shakti Cement delivery window strictly planned to 36 hours (overriding 48h contract).');
    specialInstructions.push('Escalate directly if breakdown exceeds 2 hours delay on Shakti consignment.');
    sources.push({
      sourceId: 'rule_R-008',
      sourceFile: 'dispatcher_interview.txt',
      sourceType: 'dispatcher_interview',
      recordId: 'R-008',
      field: 'operationalSlaHours',
      originalValueMasked: 48,
      resolvedValue: 36,
      precedence: 1,
      resolutionReason: 'Dispatcher interview line 22: "Shakti is a 36 hour client. Plan everything to 36."',
    });
  }

  // 2. Vertex Retail Ludhiana Gate Rule (R-009): 6:00 PM cutoff
  if (ticket.client === 'Vertex Retail' && (ticket.destination || '').toLowerCase().includes('ludhiana')) {
    matchedRules.push(DISPATCHER_RULES['R-009']);
    deliveryCutoffTime = '18:00';
    reasons.push('Rule R-009: Vertex Retail Ludhiana gate strictly closes at 18:00. If arrival > 18:00, schedule morning 08:00 delivery without marking failed.');
    specialInstructions.push('Vertex Ludhiana gate closure at 18:00 strictly enforced. Never mark late delivery as failed; log scheduled morning dispatch.');
    sources.push({
      sourceId: 'rule_R-009',
      sourceFile: 'dispatcher_interview.txt',
      sourceType: 'dispatcher_interview',
      recordId: 'R-009',
      field: 'delivery_gate_cutoff',
      originalValueMasked: 'None',
      resolvedValue: '18:00',
      precedence: 1,
      resolutionReason: 'Dispatcher interview line 24: "Their warehouse at Ludhiana stops accepting after 6 pm."',
    });
  }

  // 3. Monsoon Eastern Route Rule (R-011): +20% buffer
  if (isMonsoonMonth(ticket.createdAt) && isEastOfLucknow(ticket.destination)) {
    matchedRules.push(DISPATCHER_RULES['R-011']);
    transitBufferPercentage = 20;
    reasons.push('Rule R-011: Monsoon season (July-September) on route east of Lucknow requires minimum +20% transit time buffer.');
    specialInstructions.push('Add 20% transit buffer for heavy waterlogging and approach road diversions east of Lucknow.');
    sources.push({
      sourceId: 'rule_R-011',
      sourceFile: 'dispatcher_interview.txt',
      sourceType: 'dispatcher_interview',
      recordId: 'R-011',
      field: 'transit_buffer',
      originalValueMasked: 0,
      resolvedValue: 20,
      precedence: 1,
      resolutionReason: 'Dispatcher interview line 32: "July to September, anything going east of Lucknow, add twenty percent."',
    });
  }

  return {
    decision: operationalSlaHours,
    baseSlaHours,
    operationalSlaHours,
    transitBufferPercentage,
    deliveryCutoffTime,
    specialInstructions,
    matchedRules,
    reasons,
    sources,
    conflicts,
  };
}
