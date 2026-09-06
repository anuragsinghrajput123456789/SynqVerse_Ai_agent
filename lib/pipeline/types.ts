/**
 * Meridian Resolve End-to-End Pipeline Types
 */

import { QueueTicket, DecisionRecord } from '../types';
import { CandidateEvaluationResult } from '../vehicle-selection/types';
import { WorkOrder } from '../work-orders/types';
import { ClientMessageDraft } from '../ai/types';
import { ApprovalRecord } from '../approvals/types';
import { AuditEvent } from '../audit/types';

export type TicketProcessingOutcome =
  | 'COMPLETED'
  | 'DUPLICATE_SKIPPED'
  | 'QUARANTINED'
  | 'INSUFFICIENT_DATA'
  | 'ERROR';

export interface ProcessTicketResult {
  ticketId: string;
  outcome: TicketProcessingOutcome;
  queueTicket?: QueueTicket;
  decision?: DecisionRecord;
  selectedVehicle?: CandidateEvaluationResult | null;
  workOrder?: WorkOrder | null;
  workOrderStatus?: 'created' | 'existing' | 'skipped';
  clientMessageDraft?: ClientMessageDraft | null;
  approvalRecord?: ApprovalRecord | null;
  auditEvents: AuditEvent[];
  error?: string;
}

export interface QueueProcessingStatistics {
  total: number;
  processed: number;
  duplicates: number;
  quarantined: number;
  errors: number;
  workOrdersCreated: number;
  workOrdersExisting: number;
  messagesDrafted: number;
  approvalsPending: number;
}

export interface ProcessQueueResult {
  stats: QueueProcessingStatistics;
  results: ProcessTicketResult[];
}
