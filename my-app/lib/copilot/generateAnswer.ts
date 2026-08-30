/**
 * Grounded Answer Generation Engine for Operations Copilot
 * Invokes Gemini 2.5 Flash with timeouts, retries, and deterministic grounded fallbacks.
 */

import { GoogleGenAI } from '@google/genai';
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

const GEMINI_TIMEOUT_MS = 9000;

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

  const apiKey = process.env.GEMINI_API_KEY;

  // 2. Deterministic Grounded Fallback (when GEMINI_API_KEY is not set)
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

  if (!apiKey) {
    return buildDeterministicFallback();
  }

  // 3. Gemini Generation with Timeout & Single Retry
  const prompt = buildCopilotPrompt(question, rankedContext, conversationHistory);
  const ai = new GoogleGenAI({ apiKey });

  let rawResponseText = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const generatePromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini request timed out')), GEMINI_TIMEOUT_MS)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      rawResponseText = response.text?.trim() || '';
      if (rawResponseText) break;
    } catch (err: unknown) {
      if (attempt === 2) {
        console.warn('Gemini request failed after retry, utilizing deterministic grounded fallback:', err);
        return buildDeterministicFallback();
      }
    }
  }

  if (!rawResponseText) {
    return buildDeterministicFallback();
  }

  // 4. Parse JSON Response from Gemini
  try {
    let parsed: unknown = null;
    const jsonMatch = rawResponseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      parsed = JSON.parse(rawResponseText);
    }

    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
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
  } catch {
    // If JSON parsing fails, safely use deterministic answer
  }

  return buildDeterministicFallback();
}
