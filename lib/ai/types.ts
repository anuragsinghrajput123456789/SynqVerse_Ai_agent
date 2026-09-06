/**
 * AI Drafting Module Types & Zod Schemas
 */

import { z } from 'zod';

export const SourceCitationDraftSchema = z.object({
  sourceId: z.string(),
  sourceFile: z.string(),
  field: z.string(),
  resolvedValue: z.unknown(),
});

export const ClientMessageDraftSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message body is required'),
  factsUsed: z.array(z.string()),
  citations: z.array(SourceCitationDraftSchema),
});

export type ClientMessageDraft = z.infer<typeof ClientMessageDraftSchema>;

export interface DraftClientMessageInput {
  sanitizedTicket: {
    ticketId: string;
    originHub?: string;
    destination?: string;
    issue?: string;
    severity?: string;
    client?: string;
    createdAt?: string;
    driverId?: string;
  };
  resolvedVehicle?: {
    registrationNumber: string;
    model?: string;
    bsStage?: string;
  } | null;
  selectedReplacementVehicle?: {
    registrationNumber: string;
    model?: string;
    homeHub?: string;
    distanceKm?: number;
    bsStage?: string;
  } | null;
  client:
    | {
        name: string;
        contactPerson?: string;
        contractSlaHours?: number;
      }
    | string;
  sla: {
    slaDeadlineHours?: number;
    gateCutoffTime?: string;
    specialInstructions?: string[];
  };
  approvedFacts: string[];
  relevantEvidence?: string;
  sourceCitations?: Array<{
    sourceId: string;
    sourceFile: string;
    field: string;
    resolvedValue: unknown;
  }>;
}

export interface DraftClientMessageResult {
  status: 'SUCCESS' | 'AI_ERROR' | 'INSUFFICIENT_DATA';
  draft?: ClientMessageDraft;
  error?: string;
  piiAudited: boolean;
}

export interface Fact {
  text: string;
  source_ref: string;
  relevanceScore?: number;
  metadata?: Record<string, unknown>;
}

