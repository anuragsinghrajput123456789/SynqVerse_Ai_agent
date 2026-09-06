/**
 * PII Safety & Redaction Boundary Guard for Operations Copilot
 * Enforces strict 0-leak privacy protection on all prompts, citations, responses, and audit records.
 */

import { maskPii, maskTextPii, hasRawPiiLeaks, REDACTED } from '../pii';
import { SourceCitationDetail, CopilotQueryResponse } from './types';

export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return maskTextPii(text).maskedText;
}

export function sanitizeCitations(citations: SourceCitationDetail[]): SourceCitationDetail[] {
  return citations.map((c) => {
    const maskedOriginal = c.originalValueMasked ? maskPii(c.originalValueMasked).data : undefined;
    const maskedResolved = c.resolvedValue ? maskPii(c.resolvedValue).data : undefined;
    const maskedTitle = sanitizeText(c.title);
    const maskedReason = c.resolutionReason ? sanitizeText(c.resolutionReason) : undefined;
    const maskedRelevance = c.relevance ? sanitizeText(c.relevance) : undefined;

    return {
      ...c,
      title: maskedTitle,
      originalValueMasked: maskedOriginal,
      resolvedValue: maskedResolved,
      resolutionReason: maskedReason,
      relevance: maskedRelevance,
    };
  });
}

export function sanitizeCopilotResponse(res: CopilotQueryResponse): CopilotQueryResponse {
  const sanitizedAnswer = sanitizeText(res.answer);
  const sanitizedSources = sanitizeCitations(res.sources);

  return {
    ...res,
    answer: sanitizedAnswer,
    sources: sanitizedSources,
  };
}

export function assertZeroPiiLeaks(payload: unknown, contextName = 'Payload'): void {
  if (hasRawPiiLeaks(payload)) {
    throw new Error(`Security Exception: Raw PII leak detected in ${contextName}. Operation aborted.`);
  }
}

export { REDACTED, hasRawPiiLeaks };
