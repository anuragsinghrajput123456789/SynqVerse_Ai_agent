/**
 * Centralized Gemini Provider & AI Manager
 * Single authoritative integration layer for Google Gemini across all Grafity modules.
 * Handles timeouts, bounded retries with exponential backoff, sliding window rate limits,
 * request size boundaries, response schema validation, PII masking, and token/cost telemetry.
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { getEnv, getGeminiModel } from '../infrastructure/env';
import { logger } from '../infrastructure/logger';
import { maskTextPii } from '../pii';
import { rateLimiters } from '../security/rateLimit';

export interface AiRequestOptions<T = unknown> {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  schema?: z.ZodType<T>;
  timeoutMs?: number;
  maxRetries?: number;
  contextName?: string;
  clientIp?: string;
}

export interface AiTextResult {
  success: boolean;
  text?: string;
  error?: string;
  model: string;
  latencyMs: number;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  isTimeout?: boolean;
  isRateLimit?: boolean;
  isAuthError?: boolean;
}

export interface AiStructuredResult<T = unknown> {
  success: boolean;
  data?: T;
  rawText?: string;
  error?: string;
  model: string;
  latencyMs: number;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  isTimeout?: boolean;
  isRateLimit?: boolean;
  isAuthError?: boolean;
}

export interface AiUsageMetricsSummary {
  isAvailable: boolean;
  model: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  throttledRequests: number;
  successRatePct: number;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  totalEstimatedTokens: number;
  averageLatencyMs: number;
  lastUpdated: string;
}

const DEFAULT_TIMEOUT_MS = 8500;
const MAX_PROMPT_CHARS = 16000; // ~4,000 tokens limit

export class GeminiProvider {
  private static instance: GeminiProvider | null = null;
  private client: GoogleGenAI | null = null;
  private currentApiKey: string | null = null;

  // Cumulative telemetry metrics
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private throttledRequests = 0;
  private totalLatencyMs = 0;
  private estimatedPromptTokens = 0;
  private estimatedCompletionTokens = 0;

  private constructor() {
    this.initClient();
  }

  public static getInstance(): GeminiProvider {
    if (!GeminiProvider.instance) {
      GeminiProvider.instance = new GeminiProvider();
    }
    return GeminiProvider.instance;
  }

  /**
   * Safely initializes the GoogleGenAI client using server-side environment variables.
   * Credentials are never exposed to browser or client bundles.
   */
  private initClient(): GoogleGenAI | null {
    const env = getEnv();
    const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      this.client = null;
      this.currentApiKey = null;
      return null;
    }

    if (this.client && this.currentApiKey === apiKey) {
      return this.client;
    }

    this.currentApiKey = apiKey;
    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  /**
   * Returns whether a valid Gemini API key is configured on the server.
   */
  public isConfigured(): boolean {
    return Boolean(this.initClient());
  }

  /**
   * Generates raw text response from Gemini with timeout, retry, and error normalization.
   */
  public async generateText(options: AiRequestOptions): Promise<AiTextResult> {
    const startTime = Date.now();
    const model = getGeminiModel();
    const context = options.contextName || 'General';

    this.totalRequests++;

    // 1. Check prompt size limits
    if (!options.prompt || !options.prompt.trim()) {
      return {
        success: false,
        error: 'Prompt cannot be empty',
        model,
        latencyMs: 0,
        estimatedPromptTokens: 0,
        estimatedCompletionTokens: 0,
      };
    }

    if (options.prompt.length > MAX_PROMPT_CHARS) {
      this.failedRequests++;
      return {
        success: false,
        error: `Prompt exceeds maximum character budget of ${MAX_PROMPT_CHARS} characters`,
        model,
        latencyMs: 0,
        estimatedPromptTokens: Math.round(options.prompt.length / 4),
        estimatedCompletionTokens: 0,
      };
    }

    const estimatedPromptTokens = Math.round(options.prompt.length / 4);
    this.estimatedPromptTokens += estimatedPromptTokens;

    // 2. Sliding window rate limiting
    const clientIdentifier = options.clientIp || 'internal-system';
    const rateCheck = rateLimiters.ai.check(clientIdentifier);
    if (!rateCheck.allowed) {
      this.throttledRequests++;
      this.failedRequests++;
      logger.warn(`Gemini rate limit exceeded for ${clientIdentifier}`, { context });
      return {
        success: false,
        error: 'AI rate limit exceeded. Please wait before retrying.',
        model,
        latencyMs: Date.now() - startTime,
        estimatedPromptTokens,
        estimatedCompletionTokens: 0,
        isRateLimit: true,
      };
    }

    // 3. Verify server-side API Key configuration
    const aiClient = this.initClient();
    if (!aiClient) {
      this.failedRequests++;
      logger.debug('GEMINI_API_KEY is not configured, returning controlled offline status', { context });
      return {
        success: false,
        error: 'GEMINI_API_KEY is not configured',
        model,
        latencyMs: Date.now() - startTime,
        estimatedPromptTokens,
        estimatedCompletionTokens: 0,
        isAuthError: true,
      };
    }

    // 4. Sanitize prompt text (PII boundary enforcement)
    const sanitizedPrompt = maskTextPii(options.prompt).maskedText;
    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    const maxRetries = options.maxRetries ?? 2;

    let responseText = '';
    let lastError: unknown = null;
    let isTimeout = false;
    let isAuthError = false;

    // 5. Execution loop with bounded retries and exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const backoffDelay = 800 * Math.pow(1.5, attempt - 2);
          logger.info(`Retrying Gemini request (attempt ${attempt}/${maxRetries}) after ${backoffDelay}ms`, { context });
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }

        const requestContents = options.systemInstruction
          ? `${options.systemInstruction}\n\n${sanitizedPrompt}`
          : sanitizedPrompt;

        const generatePromise = aiClient.models.generateContent({
          model,
          contents: requestContents,
          config: {
            temperature: options.temperature ?? 0.1,
            maxOutputTokens: options.maxTokens,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => {
            isTimeout = true;
            reject(new Error(`Gemini request timed out after ${timeoutMs}ms`));
          }, timeoutMs)
        );

        const response = await Promise.race([generatePromise, timeoutPromise]);
        responseText = response.text?.trim() || '';

        if (responseText) {
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        const errStr = String(err);
        if (errStr.includes('API_KEY_INVALID') || errStr.includes('400')) {
          isAuthError = true;
          logger.warn('Gemini API key is invalid or unauthorized', { context });
          break; // Do not retry invalid API keys
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    this.totalLatencyMs += latencyMs;

    if (!responseText) {
      this.failedRequests++;
      const errorMessage = lastError instanceof Error ? lastError.message : 'Empty response received from Gemini';
      logger.warn(`Gemini generation failed: ${errorMessage}`, { context, latencyMs });
      return {
        success: false,
        error: errorMessage,
        model,
        latencyMs,
        estimatedPromptTokens,
        estimatedCompletionTokens: 0,
        isTimeout,
        isAuthError,
      };
    }

    const estimatedCompletionTokens = Math.round(responseText.length / 4);
    this.estimatedCompletionTokens += estimatedCompletionTokens;
    this.successfulRequests++;

    return {
      success: true,
      text: responseText,
      model,
      latencyMs,
      estimatedPromptTokens,
      estimatedCompletionTokens,
    };
  }

  /**
   * Generates structured JSON output from Gemini with schema validation,
   * markdown code block stripping, and controlled error responses.
   */
  public async generateStructuredJson<T = unknown>(
    options: AiRequestOptions<T>
  ): Promise<AiStructuredResult<T>> {
    const rawResult = await this.generateText(options);

    if (!rawResult.success || !rawResult.text) {
      return {
        success: false,
        error: rawResult.error || 'Gemini generation returned empty or failed',
        model: rawResult.model,
        latencyMs: rawResult.latencyMs,
        estimatedPromptTokens: rawResult.estimatedPromptTokens,
        estimatedCompletionTokens: rawResult.estimatedCompletionTokens,
        isTimeout: rawResult.isTimeout,
        isRateLimit: rawResult.isRateLimit,
        isAuthError: rawResult.isAuthError,
      };
    }

    try {
      // 1. Strip markdown fences if Gemini wrapped the JSON
      let cleanJson = rawResult.text.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      let parsed: unknown = null;
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(cleanJson);
      }

      // 2. Validate against schema if provided
      if (options.schema) {
        const validation = options.schema.safeParse(parsed);
        if (!validation.success) {
          const validationError = validation.error.issues.map((i) => i.message).join('; ');
          logger.warn(`Gemini structured response schema mismatch: ${validationError}`, {
            context: options.contextName,
          });
          return {
            success: false,
            rawText: rawResult.text,
            error: `Response schema validation error: ${validationError}`,
            model: rawResult.model,
            latencyMs: rawResult.latencyMs,
            estimatedPromptTokens: rawResult.estimatedPromptTokens,
            estimatedCompletionTokens: rawResult.estimatedCompletionTokens,
          };
        }

        return {
          success: true,
          data: validation.data,
          rawText: rawResult.text,
          model: rawResult.model,
          latencyMs: rawResult.latencyMs,
          estimatedPromptTokens: rawResult.estimatedPromptTokens,
          estimatedCompletionTokens: rawResult.estimatedCompletionTokens,
        };
      }

      return {
        success: true,
        data: parsed as T,
        rawText: rawResult.text,
        model: rawResult.model,
        latencyMs: rawResult.latencyMs,
        estimatedPromptTokens: rawResult.estimatedPromptTokens,
        estimatedCompletionTokens: rawResult.estimatedCompletionTokens,
      };
    } catch (parseErr: unknown) {
      const parseErrorMsg = parseErr instanceof Error ? parseErr.message : 'Invalid JSON format in Gemini response';
      return {
        success: false,
        rawText: rawResult.text,
        error: `JSON parse error: ${parseErrorMsg}`,
        model: rawResult.model,
        latencyMs: rawResult.latencyMs,
        estimatedPromptTokens: rawResult.estimatedPromptTokens,
        estimatedCompletionTokens: rawResult.estimatedCompletionTokens,
      };
    }
  }

  /**
   * Exposes real live AI usage metrics and token cost telemetry for analytics.
   */
  public getUsageMetrics(): AiUsageMetricsSummary {
    const total = this.totalRequests;
    const successful = this.successfulRequests;
    const successRatePct = total > 0 ? Math.round((successful / total) * 100) : 100;
    const averageLatencyMs = total > 0 ? Math.round(this.totalLatencyMs / total) : 0;

    return {
      isAvailable: this.isConfigured(),
      model: getGeminiModel(),
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      throttledRequests: this.throttledRequests,
      successRatePct,
      estimatedPromptTokens: this.estimatedPromptTokens,
      estimatedCompletionTokens: this.estimatedCompletionTokens,
      totalEstimatedTokens: this.estimatedPromptTokens + this.estimatedCompletionTokens,
      averageLatencyMs,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Aliases for unified provider usage
export const AIManager = GeminiProvider;
export const geminiProvider = GeminiProvider.getInstance();
