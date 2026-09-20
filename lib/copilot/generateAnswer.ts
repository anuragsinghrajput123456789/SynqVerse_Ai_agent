/**
 * Grounded Answer Generation Engine for Operations Copilot
 * Invokes GeminiProvider with timeouts, retries, exponential backoff, and deterministic grounded fallbacks.
 */

import { geminiProvider } from '../ai/provider';
import { buildCopilotPrompt } from './buildPrompt';
import { sanitizeText } from './piiGuard';
import { ConversationMessage, RankedContext } from './types';

export interface RawAiOutput {
  answer: string;
  status: 'success' | 'insufficient_data';
  citedSourceIds: string[];
  rulesApplied: string[];
  confidence: 'high' | 'medium' | 'low';
}

export async function generateCopilotAnswer(
  question: string,
  rankedContext: RankedContext,
  conversationHistory: ConversationMessage[] = []
): Promise<RawAiOutput> {
  const { groundedEvidence, rankedCitations } = rankedContext;

  // 1. Immediate Insufficient Data Check
  if (!groundedEvidence || rankedCitations.length === 0) {
    return {
      answer: 'Insufficient data to determine this.',
      status: 'insufficient_data',
      citedSourceIds: [],
      rulesApplied: [],
      confidence: 'low',
    };
  }

  // 2. Deterministic Grounded Fallback (when GEMINI_API_KEY is not set or calls fail)
  const buildDeterministicFallback = (): RawAiOutput => {
    const rulesMatched = rankedCitations
      .filter((c) => c.sourceId.startsWith('rule_'))
      .map((c) => c.recordId || c.sourceId.replace('rule_', ''));

    return {
      answer: `Based on grounded context from Meridian Freight records:\n${groundedEvidence}`,
      status: 'success',
      citedSourceIds: rankedCitations.map((c) => c.sourceId),
      rulesApplied: rulesMatched,
      confidence: 'high',
    };
  };

  if (!geminiProvider.isConfigured()) {
    return buildDeterministicFallback();
  }

  // 3. Centralized Gemini Generation via GeminiProvider
  const prompt = buildCopilotPrompt(question, rankedContext, conversationHistory);

  const res = await geminiProvider.generateStructuredJson<Record<string, unknown>>({
    prompt,
    contextName: 'OperationsCopilot',
    temperature: 0.1,
  });

  if (!res.success || !res.data) {
    // If Gemini failed after bounded retries, return deterministic fallback
    return buildDeterministicFallback();
  }

  // 4. Extract & Normalize JSON Response
  const obj = res.data;
  const answer = sanitizeText(String(obj.answer || ''));
  const status = obj.status === 'insufficient_data' ? 'insufficient_data' : 'success';
  const citedSourceIds = Array.isArray(obj.citedSourceIds) ? obj.citedSourceIds.map(String) : [];
  const rulesApplied = Array.isArray(obj.rulesApplied) ? obj.rulesApplied.map(String) : [];
  const confidence =
    obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low'
      ? (obj.confidence as 'high' | 'medium' | 'low')
      : 'high';

  if (status === 'insufficient_data' || answer.toLowerCase().includes('insufficient data')) {
    return {
      answer: 'Insufficient data to determine this.',
      status: 'insufficient_data',
      citedSourceIds: [],
      rulesApplied: [],
      confidence: 'low',
    };
  }

  return {
    answer,
    status,
    citedSourceIds,
    rulesApplied,
    confidence,
  };
}
