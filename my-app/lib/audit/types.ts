/**
 * Audit Trail Module Types & Event Schemas
 */

export type AuditEventType =
  | 'TICKET_RECEIVED'
  | 'TICKET_VALIDATED'
  | 'TICKET_QUARANTINED'
  | 'PII_MASKED'
  | 'ENTITY_RESOLVED'
  | 'CONTEXT_BUILT'
  | 'RULE_EVALUATED'
  | 'VEHICLE_REJECTED'
  | 'VEHICLE_SELECTED'
  | 'WORK_ORDER_CREATED'
  | 'WORK_ORDER_ALREADY_EXISTS'
  | 'MESSAGE_DRAFTED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVED'
  | 'REJECTED';

export interface AuditEvent {
  eventId: string;
  ticketId: string;
  eventType: AuditEventType;
  timestamp: string;
  actor: string;
  reason: string;
  ruleId: string | null;
  sourceReferences: string[];
  safeMetadata: Record<string, unknown>;
}

export interface CreateAuditEventInput {
  ticketId: string;
  eventType: AuditEventType;
  actor?: string;
  reason: string;
  ruleId?: string | null;
  sourceReferences?: string[];
  safeMetadata?: Record<string, unknown>;
  timestamp?: string;
  customEventId?: string;
}
