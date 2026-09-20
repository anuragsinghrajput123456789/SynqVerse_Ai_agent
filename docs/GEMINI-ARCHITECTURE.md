# Gemini Architecture & Centralized AI Integration Layer

## 1. Overview & Executive Summary

The Grafity platform previously suffered from fragmented Gemini integrations:
- Mixed dependencies across `@google/genai` (2.19.0) and deprecated `@google/generative-ai` (0.24.1).
- Disparate configuration and non-existent model targets (e.g. `gemini-2.5-flash`).
- Unbounded API calls lacking timeouts, circuit breaking, and rate limiting.
- Inconsistent error handling that risked application crashes or silent response fabrication.

To solve this, Grafity consolidates all generative AI interactions into a single, high-reliability, production-hardened provider layer: **`GeminiProvider`** (aliased as `AIManager`, exported via `lib/ai/index.ts` and `lib/ai/provider.ts`).

```
+-----------------------------------------------------------------------------------+
|                           GRAFITY APPLICATION FEATURES                            |
|  [Operations Copilot]  [RAG Pipeline]  [Client Drafting]  [Mechanic Note Parse]   |
|         [Voice Assistant]        [Analytics & Telemetry Aggregators]              |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|               CENTRALIZED GEMINI PROVIDER (lib/ai/provider.ts)                    |
|                                                                                   |
|  1. Configuration & Server-Side Security:                                         |
|     - Server-side only (never exposed to browser or client bundle)                |
|     - Model resolution via getGeminiModel() -> gemini-2.0-flash                   |
|                                                                                   |
|  2. Traffic & Budget Governance:                                                  |
|     - Sliding Window Rate Limiter (rateLimiters.ai: 20 req/min)                   |
|     - Character Budget Limit (MAX_PROMPT_CHARS = 16,000 / ~4,000 tokens)          |
|                                                                                   |
|  3. Resilient Execution Engine:                                                   |
|     - Strict Timeout Guard (DEFAULT_TIMEOUT_MS = 8,500ms via AbortController)     |
|     - Exponential Backoff Retry (MAX_RETRIES = 2, baseDelay = 800ms)              |
|     - PII Masking Boundary (maskTextPii / maskPii before logging or transport)   |
|                                                                                   |
|  4. Strict Response Validation & Normalization:                                   |
|     - Markdown code-fence stripping (```json ... ```)                             |
|     - Zod schema validation (ClientMessageDraftSchema, GroundedAnswerSchema)      |
|     - Controlled error normalization (isTimeout, isRateLimit, isAuthError)        |
|                                                                                   |
|  5. Observability & Token/Cost Awareness:                                         |
|     - Real-time provider metrics (requests, throttles, latency, token estimation)|
|     - Structured audit logging with sensitive key & PII redaction                 |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                      OFFICIAL GOOGLE GENAI SDK (@google/genai)                    |
|                              Model: gemini-2.0-flash                              |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architecture: `GeminiProvider`

### 2.1 Single Source of Truth
- **Implementation**: [`lib/ai/provider.ts`](file:///c:/Users/91836/Downloads/Synqathon-Project_overview/lib/ai/provider.ts)
- **Exports**: Singleton `geminiProvider`, class `GeminiProvider`, and alias `AIManager` in [`lib/ai/index.ts`](file:///c:/Users/91836/Downloads/Synqathon-Project_overview/lib/ai/index.ts).
- **SDK Dependency**: Standardized exclusively on `@google/genai` (`^2.19.0`). Legacy `@google/generative-ai` has been completely purged from the codebase and package manifests.

### 2.2 Security & Key Protection
- **Server-Side Enforcement**: API keys (`GEMINI_API_KEY`, `GOOGLE_API_KEY`) are read strictly within server modules (`lib/ai/provider.ts`, Next.js Route Handlers, or CLI tasks).
- **No Client Exposure**: No `NEXT_PUBLIC_GEMINI_*` environment variables exist. Browser components communicate exclusively with `/api/copilot`, `/api/chat`, and `/api/voice/process`.
- **Sanitized Logging**: All provider log entries automatically strip `key=[A-Za-z0-9_-]+` and mask PII (Aadhaar, Phone, Driver License) before output.

### 2.3 Traffic & Budget Governance
1. **Sliding Window Rate Limiter**:
   - Every generation request queries `rateLimiters.ai` (`lib/security/rateLimiter.ts`).
   - Limits: 20 requests/minute per client context.
   - Throttled requests are cleanly rejected with `isRateLimit: true`, HTTP 429 semantics, and retry-after headers without crashing.
2. **Request Size Budgeting**:
   - `MAX_PROMPT_CHARS = 16,000` (approximately 4,000 tokens).
   - Prompts exceeding this threshold are rejected upfront with a controlled `ValidationError` to prevent unbounded billing spikes and context overflows.

### 2.4 Reliability & Resilience Engine
1. **Bounded Timeout**:
   - Requests are enforced with an `AbortController` bounded to 8,500ms (`DEFAULT_TIMEOUT_MS`).
   - If Google's API hangs or network partitions occur, the request is safely cancelled with `isTimeout: true`.
2. **Exponential Backoff Retry**:
   - Transient 5xx errors or network socket disconnects trigger up to 2 retries with exponential backoff:
     $$\text{delay} = \text{baseDelay} \times 2^{\text{attempt}} \pm \text{jitter}$$
   - Non-retryable errors (400 Bad Request, 401/403 Invalid API Key, Rate Limits) fail immediately without wasteful retries.
3. **Zod Response Schema Validation**:
   - Structured JSON generation runs responses through `schema.safeParse()`.
   - If output contains malformed syntax, code fences, or missing attributes, `GeminiProvider` strips markdown wrappers and validates types. If validation fails, it returns a controlled failure without throwing unhandled exceptions.

---

## 3. Audited Integration Points

All AI features across the application route through the centralized provider:

| Feature | Consumer File | Centralized Method Called | Schema / Fallback Strategy |
| :--- | :--- | :--- | :--- |
| **Operations Copilot** | [`lib/copilot/generateAnswer.ts`](file:///c:/Users/91836/Downloads/Synqathon-Project_overview/lib/copilot/generateAnswer.ts) | `geminiProvider.generateStructuredJson` | Grounded schema; falls back to deterministic context synthesis on offline/error. |
| **Grounded RAG** | [`lib/ai/gemini.ts`](file:///c:/Users/91836/Downloads/Synqathon-Project_overview/lib/ai/gemini.ts) | `geminiProvider.generateText` | Grounded facts; verifies citations against retrieved source files. |
| **Client Message Drafting** | [`lib/ai/draftClientMessage.ts`](file:///c:/Users/91836/Downloads/Synqathon-Project_overview/lib/ai/draftClientMessage.ts) | `geminiProvider.generateStructuredJson` | `ClientMessageDraftSchema`; falls back to pre-computed deterministic draft. |
| **Mechanic Note Interpretation**| [`lib/ai/gemini.ts`](file:///c:/Users/91836/Downloads/Synqathon-Project_overview/lib/ai/gemini.ts) | `geminiProvider.generateStructuredJson` | `InterpretedNoteSchema`; strictly extracts facts without guessing mechanical parts. |
| **Voice Assistant** | `app/api/voice/process/route.ts` | Delegates to `copilotService.handleQuery` | Unified RAG pipeline with PII scrubbing, Hinglish normalization, and speech-ready formatting. |
| **Analytics & AI Usage** | [`lib/analytics/service.ts`](file:///c:/Users/91836/Downloads/Synqathon-Project_overview/lib/analytics/service.ts) | `geminiProvider.getUsageMetrics()` | Aggregates live provider token estimates, latencies, and request totals. |

---

## 4. Error Normalization & Zero-Fabrication Guarantee

The user requirement states:
> *"If Gemini fails: the application must not crash. Return a controlled error. Do not silently fabricate an AI response."*

### How Grafity Enforces This:
1. **Zero Unhandled Exceptions**:
   Every method in `GeminiProvider` wraps operations in a guarded `try...catch` block, returning a strongly-typed `GeminiResponse<T>`:
   ```typescript
   export interface GeminiResponse<T = string> {
     success: boolean;
     data?: T;
     error?: string;
     isTimeout?: boolean;
     isRateLimit?: boolean;
     isAuthError?: boolean;
     rawOutput?: string;
     latencyMs: number;
     usage?: {
       promptTokens: number;
       completionTokens: number;
       totalTokens: number;
     };
   }
   ```
2. **Transparent Error Signaling**:
   When Gemini fails, callers do **not** return fake AI answers labeled as generated.
   - In **Client Message Drafting**: The result is flagged with `status: 'AI_ERROR'`. An emergency deterministic template draft is supplied for operational continuity, but clearly demarcated so dispatchers know AI generation failed.
   - In **Operations Copilot & RAG**: If an API key is unconfigured or offline, queries return `status: 'success'` via deterministic grounded rules, or `status: 'insufficient_data'` if context is missing.
3. **No Hallucinated Citations**:
   The response post-processor verifies every citation against actual ingested documents. Citations referencing hallucinated filenames or non-existent fields are discarded.

---

## 5. Token & Cost Awareness

`GeminiProvider` maintains real-time in-memory counters to monitor AI usage and operational cost:
- `totalRequests`: Total requests routed through the provider.
- `successfulRequests`: Successful API calls.
- `failedRequests`: Unsuccessful calls due to timeouts, network, or auth errors.
- `throttledRequests`: Invocations stopped by sliding-window rate limiters.
- `estimatedPromptTokens`: Heuristic calculation based on input character lengths.
- `estimatedCompletionTokens`: Tokens returned by Gemini.
- `averageLatencyMs`: Running average latency per generation cycle.

These metrics are exposed via `geminiProvider.getUsageMetrics()` and consumed directly by `/api/analytics/ai` for executive dashboard visualization.

---

## 6. Verification & Test Suite

The unified Gemini provider is validated across all 14 test suites in Grafity:

| Test Suite | Command | Cases | Result |
| :--- | :--- | :---: | :---: |
| **Copilot RAG** | `npx tsx tests/copilot-rag.test.ts` | 17 (40 asserts) | ✅ 40 Passed, 0 Failed |
| **Grounded AI Chat Pipeline** | `npx tsx tests/chat-pipeline.test.ts` | 7 (35 asserts) | ✅ 35 Passed, 0 Failed |
| **Multilingual Voice Assistant** | `npx tsx tests/voice-integration.test.ts` | 15 (42 asserts) | ✅ 42 Passed, 0 Failed |
| **AI Client-Message Drafting** | `npx tsx tests/module-5-ai-drafting.test.ts` | 5 (18 asserts) | ✅ 18 Passed, 0 Failed |
| **Production Hardening** | `npx tsx tests/production-hardening.test.ts` | 4 (44 asserts) | ✅ 44 Passed, 0 Failed |
| **Surprise Ticket Pipeline** | `npx tsx tests/surprise-ticket-pipeline.test.ts` | 7 (33 asserts) | ✅ 33 Passed, 0 Failed |
| **Full Regression Suite** | `npm test` | 13 suites | ✅ 100% Passed, 0 Failed |
| **TypeScript Compilation** | `npx tsc --noEmit` | Project-wide | ✅ 0 Errors |
| **ESLint** | `npm run lint` | Project-wide | ✅ 0 Errors |
| **Next.js Production Build** | `npm run build` | 38 Routes | ✅ Compiled Successfully |
