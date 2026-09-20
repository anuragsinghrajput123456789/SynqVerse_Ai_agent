# Grafity Operations Copilot - RAG Architecture & Hardening Guide

**System**: Meridian Resolve / Grafity  
**Module**: Operations Copilot (Grounded Operations Intelligence RAG)  
**Date**: September 2026  
**Status**: Stabilized, Production-Hardened, Fully Verified  

---

## 1. System Architecture

The Operations Copilot adheres strictly to a single canonical RAG architecture without introducing external vector databases. All retrieval operations are deterministic, querying MongoDB collections, structured CSV/XLSX master records, and the in-memory `UnifiedContextStore`.

```
User Question (Web / Voice / API)
              │
              ▼
   [1. Request Validation] ─── Zod Schema (1–1000 chars), Role Authentication (RBAC), Rate Limiting
              │
              ▼
   [2. Query Parsing] ──────── Plate/Driver/Ticket/Client/Hub entity extraction + Conversational Memory Resolution
              │
              ▼
   [3. Deterministic Retrieval] Multi-source targeted lookup (Fleet Master, Maintenance, Trips, Tickets, Rules, Conflicts)
              │
              ▼
   [4. PII Protection Guard] ── 0-Leak Boundary Redaction (Phone, Aadhaar, License numbers masked to [REDACTED])
              │
              ▼
   [5. Context Ranking] ────── Strict 5-tier Precedence Sorting + 8,000-char Evidence Budget Allocation
              │
              ▼
   [6. Grounded Gemini Prompt] XML-bounded prompt encapsulation + Prompt Injection Neutralization
              │
              ▼
   [7. Gemini Invocation] ──── Gemini 2.0 Flash with 8.5s Timeout + 2-Attempt Exponential Backoff + Deterministic Fallback
              │
              ▼
   [8. Response Validation] ── JSON Parsing, Anti-Hallucination Citation Verification, PII Leak Audit
              │
              ▼
   [9. Response Delivery] ──── Standardized JSON Payload: { answer, citations, confidence, insufficientData, sourcesUsed }
```

### Deterministic Operational Boundaries
The Copilot RAG pipeline is purely an **explanatory intelligence layer**. It **never** autonomously makes dispatch or operational decisions:
- Vehicle eligibility filtering is executed by `lib/vehicle-selection/engine.ts`.
- Dispatcher rule evaluations (`R-001` through `R-013`) are executed by `lib/decision-engine/rules.ts`.
- Candidate scoring and replacement selection are executed by `lib/vehicle-selection/scorer.ts`.
- Work order creation, status transitions, and idempotency locks are handled by `lib/work-orders/repository.ts`.
- Emergency SOS deduplication is handled by `lib/emergency/repository.ts`.

The AI only synthesizes, explains, and cites the outcomes produced by these deterministic engines.

---

## 2. Deterministic Retrieval Strategy

The Copilot employs targeted, deterministic entity and fact retrieval from existing operational databases rather than approximate semantic nearest-neighbor search:

1. **Entity Extraction**:
   - Indian vehicle registration plates (`RJ43DD3546`, `UP-17-GN-7381`, `MF-068`, `TRK-104`).
   - Driver IDs (`DRV-001` through `DRV-060`).
   - Ticket & Incident IDs (`TKT-0001` through `TKT-9999`, `BRK-1042`).
   - Client Names (`Shakti Cement`, `Vertex Pharmaceuticals`, `Apex Logistics`, `Orion Chemicals`).
   - Operational Hubs (`Delhi`, `Gurgaon`, `Kanpur`, `Lucknow`, `Jaipur`, `Ludhiana`, `Rudrapur`, etc.).
   - Dispatcher Rules (`R-001` through `R-013`).

2. **Conversational Pronoun & Follow-up Resolution**:
   - Queries containing pronouns (*"it"*, *"this truck"*, *"why was it rejected?"*, *"iska driver kaun hai"*) look up previous turns from `conversationHistory` to resolve antecedents without hallucination.

3. **Multi-Source Cross-Referencing**:
   - **Vehicle Profiles**: Master specifications (`model`, `year`, `bsStage`, `engineHeater`, `homeHub`, `capacityTonnes`, `status`).
   - **Vehicle-Driver Association**: Scans recent trips (`meridian_trips.csv`) and breakdown tickets (`tickets.json`) for the vehicle, extracts driver IDs, and cross-references `drivers_roster.csv` to identify the current or most recent driver.
   - **Maintenance History**: Reads physical workshop inspections, odometer readings, mechanic names, and part overhaul notes from `maintenance_log.xlsx`.
   - **Operational Trips**: Reads origin, destination, distance in km, cargo client, billing, and completion status from `meridian_trips.csv`.
   - **Breakdown Incidents**: Queries live breakdown tickets, deterministic decision outcomes, work orders, human approval records, and immutable audit trails.
   - **Source Discrepancies & Conflicts**: Retrieves field-level conflicts logged in `UnifiedContextStore` and explains the winning vs. rejected values.

---

## 3. Grounding & Anti-Hallucination Strategy

To prevent hallucinations:
1. **Relevance Threshold Gating**:
   - If a query fails to match any operational entities or records (e.g. *"Why did TRK-999 break down on Mars?"*), the pipeline bypasses Gemini entirely and returns:
     ```json
     {
       "answer": "Insufficient data to determine this.",
       "status": "insufficient_data",
       "citations": [],
       "insufficientData": true,
       "sourcesUsed": [],
       "confidence": "low"
     }
     ```
2. **Strict Citation Filtering**:
   - Any source ID returned by Gemini that was not in the `<available_sources>` set provided in the prompt is automatically stripped and discarded during response validation.
3. **Deterministic Grounded Fallback**:
   - If Gemini is unreachable, times out, or receives an invalid API key, the system synthesizes a high-fidelity answer directly from the ranked, verified operational evidence and citations.

---

## 4. 5-Tier Source Precedence Hierarchy

Operational records are ranked and resolved according to a strict 5-tier order of truth:

| Tier | Source Category | Authoritative Files | Operational Purpose |
|:---:|---|---|---|
| **Tier 1** | **Master Records** | `fleet_master.csv`, `drivers_roster.csv` | Highest legal authority for vehicle technical specs, regulatory compliance, and driver contractual profiles. |
| **Tier 2** | **Workshop Records** | `maintenance_log.xlsx` | Physical inspections, scheduled overhauls, odometer readings, mechanic notes, and component wear. |
| **Tier 3** | **Operational Logs & Telematics** | `meridian_trips.csv`, `tickets.json`, `work_orders`, `approvals`, `audit_events` | Live operational execution, incident tickets, dispatched orders, and supervisor approval logs. |
| **Tier 4** | **Confirmed Operational Agreements** | Email threads (`thread_*.txt`) | Client-specific operational delivery windows (e.g., Shakti Cement 36h SLA override) and hub gate cutoffs. |
| **Tier 5** | **Free-text Interview Transcripts** | `dispatcher_interview.txt` | Dispatcher knowledge capture heuristics and operational rules (`R-001` through `R-013`). |

Conflicts between sources are never silently resolved. The pipeline surfaces the winning value, the rejected value, and the governing precedence tier reasoning.

---

## 5. Gemini 2.0 Flash Integration & Bounded Fallbacks

- **Model**: `gemini-2.0-flash` (configurable via `GEMINI_MODEL` environment variable).
- **Timeout**: Strict 8,500ms timeout enforced via `Promise.race`.
- **Retry Mechanism**: Max 2 attempts with an 800ms exponential backoff delay between attempts.
- **Markdown Code Fence Stripping**: Cleans leading and trailing ```` ```json ```` fences before JSON parsing.
- **Deterministic Synthesis Fallback**: Automatically activates on network failure, 400 Bad Request (invalid API key), 429 Too Many Requests, or timeouts.

---

## 6. Security & PII Protection

### Zero-PII Leak Boundary
Raw Personally Identifiable Information (PII) is strictly prohibited from entering prompts, logs, or external responses:
- **Phone Numbers**: 10-digit mobile numbers matching Indian telecom formats (`+91`, `0`, or bare 10 digits) are replaced with `[REDACTED]`.
- **Aadhaar Numbers**: 12-digit Indian national ID numbers (with or without spaces/hyphens) are replaced with `[REDACTED]`.
- **Driving License Numbers**: State-issued driver license identifiers are replaced with `[REDACTED]`.
- **Automated Assertions**: `assertZeroPiiLeaks()` scans outbound response payloads and raises security exceptions if unredacted PII is discovered.

### Prompt Injection Defense
- **XML Tag Encapsulation**: Context is cleanly separated into `<available_sources>`, `<grounded_operational_records>`, `<recent_conversation_context>`, and `<user_question>`.
- **Marker Neutralization**: Meta-prompt injection tokens such as `<|im_start|>`, `<|system|>`, `System:`, `Assistant:` are stripped from incoming questions.
- **Safety Invariant Instruction**: The system prompt instructs Gemini to strictly disregard any attempts to alter operational boundaries, override safety guidelines, or disclose system configuration.

### Rate Limiting & Request Deduplication
- **Sliding Window Rate Limiter**: Protected via `rateLimiters.ai` with client IP tracking and HTTP 429 status codes.
- **In-Memory Request Deduplication**: Caches question + conversation history hashes for 60 seconds, eliminating duplicate LLM calls during rapid client polling or repeated button clicks.

---

## 7. Canonical API & Response Structure

### Endpoint: `POST /api/copilot`

#### Request Payload
```json
{
  "question": "What maintenance history exists for RJ43DD3546?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Why was TRK-104 rejected?"
    },
    {
      "role": "assistant",
      "content": "TRK-104 was rejected due to overdue brake overhaul."
    }
  ]
}
```

#### Canonical Response Payload
```json
{
  "answer": "Vehicle RJ43DD3546 underwent workshop inspection on 2026-05-18 by Mechanic Suresh Verma at 142,500 km. Notes state that brake disc calipers were overdue for scheduled overhaul. Candidate was disqualified per Rule R-001.",
  "citations": [
    "maintenance_log.xlsx",
    "fleet_master.csv",
    "dispatcher_interview.txt"
  ],
  "confidence": "high",
  "insufficientData": false,
  "sourcesUsed": [
    {
      "sourceType": "maintenance_log",
      "sourceId": "maint_42",
      "title": "maintenance_log.xlsx",
      "precedence": 2,
      "resolutionReason": "Workshop maintenance log entry",
      "relevance": "Overdue brake caliper service at 142,500 km",
      "timestamp": "2026-05-18"
    },
    {
      "sourceType": "dispatcher_interview",
      "sourceId": "rule_R-001",
      "title": "dispatcher_interview.txt",
      "recordId": "R-001",
      "precedence": 5,
      "resolutionReason": "Rule R-001: Winter Delhi NCR BS6 Restriction",
      "relevance": "Candidate disqualification policy"
    }
  ],
  "sources": [ ... ],
  "entities": ["RJ43DD3546"],
  "rules": ["R-001"],
  "conflicts": [],
  "status": "success"
}
```

---

## 8. Frontend Chatbot UI Integration

The frontend workspace at `/copilot` (`app/components/copilot/CopilotWorkspace.tsx`) is fully wired into this architecture:
- **Conversation State**: Sends bounded conversation histories (`role`, `content`) for seamless pronoun resolution.
- **Context & Provenance Drawer**: `CopilotSourceDrawer` renders real records from `sourcesUsed`, showing file provenance, 5-tier authority badges (e.g. `Tier 1 Authority`, `Tier 2 Authority`), and extracted snippets.
- **Message Bubbles**: Displays author badges, markdown formatting, copy-to-clipboard buttons, and authoritative citation badges.
- **Robust Error States**: Provides network recovery alerts, retry buttons, and smooth loading indicators.

---

## 9. Verification & Test Evidence

All automated verification gates pass with zero failures:
- `npx tsx tests/copilot-rag.test.ts`: **17/17 tests, 40/40 assertions passed** (Vehicles, Maintenance, Trips, Clients, Tickets, Rules, Work Orders, Audit Trails, Pronouns, Insufficient Data, Conflicts, PII Redaction, Prompt Injection, Gemini Offline Fallback, Malformed Output Interception, Long Questions, Empty Questions).
- `npx tsx tests/chat-pipeline.test.ts`: **35/35 assertions passed**.
- `npx tsx tests/voice-integration.test.ts`: **42/42 assertions passed**.
- `npm test`: **154/154 passed, 0 failed**.
- `npx tsc --noEmit`: **0 errors**.
- `npm run lint`: **0 errors, 0 warnings**.
- `npm run build`: **38/38 routes compiled successfully**.

---

## 10. Known Architectural Limitations

1. **In-Memory Ingestion Caching**:
   - The Unified Context Store currently caches ingested master datasets in Node.js process memory. For horizontally autoscaled containers without sticky sessions, each container reads from disk or MongoDB on cold start.
2. **Deterministic Fallback vs. Live LLM**:
   - In environments without active `GEMINI_API_KEY` credentials, the engine operates in deterministic fallback mode. Responses are rigorously factual and cited directly from records, but lack generative prose synthesis.
