/**
 * Audit Trail Service
 * Records immutable, chronological lifecycle audit events in MongoDB collection 'auditLogs'.
 * Strictly enforces PII redaction on all stored metadata and reasons.
 */

import { maskPii } from '../pii';
import { AuditLogRepository } from './repository';
import {
  AuditEvent,
  CreateAuditEventInput,
} from './types';

export * from './types';
export * from './repository';

const repository = new AuditLogRepository();
let sequenceCounter = 0;

/**
 * Creates an immutable audit event for a ticket lifecycle action.
 * Strictly guarantees that reason, sources, and metadata are sanitized with zero raw PII leaks.
 */
export async function createAuditEvent(
  input: CreateAuditEventInput
): Promise<AuditEvent> {
  const now = input.timestamp || new Date().toISOString();
  sequenceCounter++;
  const eventId = input.customEventId || `AUD-${input.ticketId}-${Date.now()}-${sequenceCounter}`;

  // Enforce PII masking boundary on all incoming fields
  const { data: sanitizedReason } = maskPii(input.reason);
  const { data: sanitizedSources } = maskPii(input.sourceReferences || []);
  const { data: sanitizedMetadata } = maskPii(input.safeMetadata || {});

  const auditEvent: AuditEvent = {
    eventId,
    ticketId: input.ticketId,
    eventType: input.eventType,
    timestamp: now,
    actor: input.actor || 'system',
    reason: String(sanitizedReason),
    ruleId: input.ruleId || null,
    sourceReferences: Array.isArray(sanitizedSources) ? sanitizedSources.map(String) : [],
    safeMetadata: typeof sanitizedMetadata === 'object' && sanitizedMetadata !== null ? (sanitizedMetadata as Record<string, unknown>) : {},
  };

  return repository.insert(auditEvent);
}

/**
 * Retrieves the complete chronological audit timeline for a specific breakdown ticket.
 * Allows evaluators and dispatchers to inspect:
 * - what happened (eventType, timestamp, actor)
 * - why it happened (reason)
 * - which rule was used (ruleId)
 * - which source supported the decision (sourceReferences)
 * - what action occurred (safeMetadata)
 */
export async function getTicketAuditTimeline(
  ticketId: string
): Promise<AuditEvent[]> {
  return repository.findByTicketId(ticketId);
}

export interface FullTicketAuditTrail {
  ticketId: string;
  totalEvents: number;
  timeline: AuditEvent[];
  decisions: AuditEvent[];
  rulesApplied: string[];
  sourcesCited: string[];
  firstEventTimestamp: string | null;
  lastEventTimestamp: string | null;
}

/**
 * Retrieves the complete chronological audit timeline and decision trail for a specific ticket in one call.
 */
export async function auditLookup(ticketId: string): Promise<FullTicketAuditTrail> {
  const timeline = await repository.findByTicketId(ticketId);
  const decisionEvents = timeline.filter(
    (e) =>
      e.eventType === 'RULE_EVALUATED' ||
      e.eventType === 'VEHICLE_SELECTED' ||
      e.eventType === 'WORK_ORDER_CREATED'
  );
  const rulesApplied = Array.from(
    new Set(timeline.map((e) => e.ruleId).filter((r): r is string => Boolean(r)))
  );
  const sourcesCited = Array.from(
    new Set(timeline.flatMap((e) => e.sourceReferences).filter(Boolean))
  );

  return {
    ticketId,
    totalEvents: timeline.length,
    timeline,
    decisions: decisionEvents,
    rulesApplied,
    sourcesCited,
    firstEventTimestamp: timeline.length > 0 ? timeline[0].timestamp : null,
    lastEventTimestamp: timeline.length > 0 ? timeline[timeline.length - 1].timestamp : null,
  };
}

export class AuditService {
  private static instance: AuditService;
  private repo = new AuditLogRepository();

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public async logEvent(input: CreateAuditEventInput): Promise<AuditEvent> {
    return createAuditEvent(input);
  }

  public async getTimeline(ticketId: string): Promise<AuditEvent[]> {
    return getTicketAuditTimeline(ticketId);
  }

  public async auditLookup(ticketId: string): Promise<FullTicketAuditTrail> {
    return auditLookup(ticketId);
  }

  public async getAllEvents(): Promise<AuditEvent[]> {
    return this.repo.findAll();
  }

  public async getCount(): Promise<number> {
    return this.repo.count();
  }

  public async clearAll(): Promise<void> {
    await this.repo.clear();
  }
}
