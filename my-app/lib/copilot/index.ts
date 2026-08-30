/**
 * Grafity Operations Copilot - Unified Entry Point
 * Orchestrates: Query Parsing -> Targeted Retrieval -> Precedence Ranking -> PII Safety -> Gemini -> Validation
 */

import { parseQuery } from './queryParser';
import { retrieveTargetedContext } from './retrieveContext';
import { rankAndOrganizeContext } from './rankContext';
import { generateCopilotAnswer } from './generateAnswer';
import { validateCopilotResponse } from './validateResponse';
import {
  CopilotQueryRequest,
  CopilotQueryRequestSchema,
  CopilotQueryResponse,
} from './types';

export async function answerCopilotQuery(
  rawRequest: CopilotQueryRequest
): Promise<CopilotQueryResponse> {
  // 1. Validate incoming request with Zod
  const validation = CopilotQueryRequestSchema.safeParse(rawRequest);
  if (!validation.success) {
    const errorMsg = validation.error.issues.map((i) => i.message).join('; ');
    return {
      answer: `Invalid question: ${errorMsg}`,
      status: 'error',
      sources: [],
      entities: [],
      rules: [],
      conflicts: [],
      confidence: 'low',
      error: errorMsg,
    };
  }

  const { question, conversationHistory } = validation.data;

  // 2. Query Parsing & Conversational Follow-up Resolution
  const { entities, intent } = parseQuery(question, conversationHistory);

  // 3. Targeted Multi-Source Retrieval
  const retrievedContext = await retrieveTargetedContext(entities, intent);

  // 4. Precedence Ranking & Conflict Evaluation
  const rankedContext = rankAndOrganizeContext(retrievedContext);

  // 5. Answer Generation (Gemini with deterministic fallback)
  const rawOutput = await generateCopilotAnswer(question, rankedContext, conversationHistory);

  // 6. Response Validation, Citation Verification & PII Leak Guard
  const validatedResponse = validateCopilotResponse(rawOutput, rankedContext, entities);

  return validatedResponse;
}

export * from './types';
export * from './queryParser';
export * from './retrieveContext';
export * from './rankContext';
export * from './piiGuard';
export * from './buildPrompt';
export * from './generateAnswer';
export * from './validateResponse';
