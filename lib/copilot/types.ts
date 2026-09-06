/**
 * Grafity Operations Copilot - Type Definitions and Zod Schemas
 */

import { z } from 'zod';
import { Conflict } from '../types';

export const SourceCitationDetailSchema = z.object({
  sourceType: z.enum([
    'fleet_master',
    'drivers_roster',
    'maintenance_log',
    'tickets',
    'meridian_trips',
    'email_thread',
    'dispatcher_interview',
    'decision_record',
    'work_order',
    'approval_record',
    'audit_log',
  ]),
  sourceId: z.string(),
  title: z.string(),
  recordId: z.string().optional(),
  field: z.string().optional(),
  originalValueMasked: z.unknown().optional(),
  resolvedValue: z.unknown().optional(),
  precedence: z.number().min(1).max(5).default(3),
  resolutionReason: z.string().optional(),
  relevance: z.string().optional(),
  timestamp: z.string().optional(),
});

export type SourceCitationDetail = z.infer<typeof SourceCitationDetailSchema>;

export const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().optional(),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export const CopilotQueryRequestSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(1000, 'Question exceeds maximum length of 1000 characters'),
  conversationHistory: z.array(ConversationMessageSchema).max(10).optional().default([]),
});

export interface CopilotQueryRequest {
  question: string;
  conversationHistory?: ConversationMessage[];
}

export const CopilotQueryResponseSchema = z.object({
  answer: z.string(),
  status: z.enum(['success', 'insufficient_data', 'error']),
  sources: z.array(SourceCitationDetailSchema),
  entities: z.array(z.string()),
  rules: z.array(z.string()),
  conflicts: z.array(z.custom<Conflict>()),
  confidence: z.enum(['high', 'medium', 'low']).or(z.number()),
  error: z.string().optional(),
});

export type CopilotQueryResponse = z.infer<typeof CopilotQueryResponseSchema>;

export type QueryIntent =
  | 'vehicle_status'
  | 'vehicle_rejection'
  | 'maintenance_issue'
  | 'trip_history'
  | 'client_info'
  | 'replacement_selection'
  | 'dispatcher_rule'
  | 'decision_evidence'
  | 'vehicle_conflicts'
  | 'ticket_status'
  | 'breakdown_eligibility'
  | 'work_order'
  | 'audit_trail'
  | 'general_query';

export interface ExtractedEntities {
  vehicleIds: string[];
  driverIds: string[];
  ticketIds: string[];
  clientNames: string[];
  ruleIds: string[];
  locations: string[];
  hasPronounOrFollowUp: boolean;
  rawQuestion: string;
}

export interface RetrievedContext {
  evidenceStatements: string[];
  citations: SourceCitationDetail[];
  conflicts: Conflict[];
  entities: ExtractedEntities;
  intent: QueryIntent;
}

export interface RankedContext {
  groundedEvidence: string;
  rankedCitations: SourceCitationDetail[];
  conflicts: Conflict[];
  explanations: string[];
}
