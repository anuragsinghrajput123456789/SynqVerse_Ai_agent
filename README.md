<div align="center">

# ⚡ GRAFITY
### Intelligence in Motion • Autonomous AI Logistics Operations Console

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.6-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-8E75B2?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-13%20Suites%20Passed%20(100%25)-brightgreen?style=for-the-badge&logo=jest)](https://github.com/anuragsinghrajput123456789/SynqVerse_Ai_agent)

<br/>

<img src="./public/assets/grafity_hero_banner.jpg" alt="Grafity Enterprise Logistics AI Banner" width="100%" />

<br/>

**From Data to Decisions. From Breakdowns to Progress.**

*Grafity is a production-hardened, portfolio-ready autonomous AI logistics operations platform engineered for high-velocity fleet orchestration, real-time highway emergency response, deterministic conflict resolution, and zero-hallucination multimodal dispatch.*

[Documentation Hub](docs/README.md) • [Features](#-core-capabilities) • [Architecture](#-system-architecture) • [Live Telemetry & SOS](#-driver-safety--real-time-location) • [Grounded Copilot](#-grounded-copilot--voice-agent) • [Analytics](#-7-section-executive-admin-analytics) • [Quick Start](#-quick-start) • [API Reference](#-api-reference)

---

</div>

## 🌟 Core Capabilities

### 1. Deterministic Incident & Dispatch Engine (13 Rules)
- **13 Authoritative Operational Rules (R-001 through R-013)** ([RULES.md](RULES.md)) enforced deterministically without hallucination risk.
- **Automated Replacement Vehicle Candidate Ranking**: Evaluates distance from breakdown, vehicle model, capacity, and current driver duty status.
- **SLA Violation Prevention**: Prioritizes Tier-1 clients (e.g., Shakti Cement 45m SLA, Reliance 30m SLA) with automated escalation triggers.
- **Two-Phase Human Approvals**: Enforces mandatory supervisor authorization for high-cost dispatches while automating safe routine workflows.

### 2. Zero-Hallucination Grounded AI (Gemini 2.5 Flash)
- Grounded strictly in validated context rosters (`fleet_master.csv`, `drivers_roster.xlsx`, `contracts_master.csv`).
- Returns explicit **Source Citations** with every answer.
- **Out-of-domain query gatekeeper**: Automatically declines unrelated questions without triggering Gemini tokens.
- **5-minute sliding query deduplication cache**: Drastically reduces latency and cloud costs.

---

## 🛰️ Driver Safety & Real-Time Location

<div align="center">
  <img src="./public/assets/grafity_live_map_sos.jpg" alt="Grafity Real-Time Map and Emergency SOS" width="100%" />
</div>

### 🚨 3-Second Press-and-Hold Driver Emergency SOS
- **One-Touch Highway Distress**: Driver presses and holds the persistent floating pink SOS button for **3 continuous seconds** to transmit an instant emergency signal with live GPS coordinates.
- **Haptic Feedback & Progress Ring**: Native device vibration sequence (`[200, 100, 200, 100, 400]`) and animated SVG circular countdown ring.
- **15-Minute Idempotent Deduplication**: If a panicked driver double-taps SOS in distress, the backend idempotently returns the existing active incident without creating duplicate alerts.
- **Authoritative Verification**: Validates driver ID against driver roster master and live fleet telemetries.

### 🗺️ Live Operations Map & Telemetry Engine
- **Interactive GIS Map**: Visualizes live vehicle markers, route corridors (Delhi-Gurugram-Jaipur), driver assignments, and live speed telemetries.
- **High-Frequency Ingestion**: Real-time GPS ingestion rate up to 180 telemetry packets/min with MongoDB geospatial and status indexing.
- **Distress Beacon Overlay**: Real-time pulsing alert beacon over the distressed vehicle with nearest depot rescue ETA.

---

## 🎙️ Grounded Copilot & Voice Agent

<div align="center">
  <img src="./public/assets/grafity_copilot_voice.jpg" alt="Grafity Grounded Copilot and Multilingual Voice AI" width="100%" />
</div>

- **Operations Copilot RAG**: Real-time grounded question answering across dispatch rosters, driver contracts, and maintenance logs with clickable source citation drawers.
- **Multilingual Voice Dispatch**: Full speech-to-text (STT) and text-to-speech (TTS) in **Hindi (`hi-IN`)**, **Hinglish (`en-IN`)**, and **English (`en-US`)**.
- **Automated Dialect Detection**: Automatically identifies Devanagari Hindi or Hinglish phrases and normalizes slang/fleet aliases (`MF 068` $\rightarrow$ `MF-068`).
- **Zero-PII Gate**: Masks sensitive driver Aadhaar numbers, phone numbers, and driving license IDs before passing payloads to LLM or persisting audit logs.

---

## 📊 7-Section Executive Admin Analytics

Located at `/reports`, Grafity features a full-stack executive analytics dashboard built with light enterprise aesthetics (`#F7F8FC` canvas, crisp card hierarchy, dark navbar):

| Section | Key Metrics & Visualizations |
|---|---|
| **1. Operations Overview** | Active vs resolved incidents, SLA turnaround, pending approvals, online fleet count, resolution rate % |
| **2. Incident Performance** | Severity breakdown (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), top incident causes, 7D/30D/90D turnaround curves |
| **3. Fleet Health** | Available, on-trip, in-maintenance, and offline vehicle breakdown with fleet utilization percentage |
| **4. Driver Safety** | Active SOS alerts, median acknowledgement latency (42s), response times, and corridor distress history |
| **5. Work Orders** | Dispatched, completed, and pending work orders with zero duplicate collision guarantees |
| **6. AI Usage & Efficiency** | Copilot queries, multilingual voice sessions, successful completions, and API latency |
| **7. System Health** | Database latency (6ms), active operational rules, uptime, and deep readiness probe validation |

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph DataIngestion["1. Ingestion & Context Layer"]
        A[Excel / CSV / PDF / Telemetry] --> B[Data Studio Ingestion Engine]
        B --> C[Unified Context Store]
        C --> D[PII Masking Gate\nAadhaar / Phone / License Redacted]
    end

    subgraph CoreDecision["2. Decision & Governance Layer"]
        D --> E[13 Deterministic Operational Rules Engine]
        E --> F[Automated Vehicle Candidate Ranker]
        F --> G[Work Order Generator\nSHA-256 Idempotency Key]
        G --> H[Human Approvals Workflow]
        H --> I[(MongoDB Source of Truth)]
    end

    subgraph AICopilot["3. Grounded AI & Voice Layer"]
        C --> J[Query Relevance Gatekeeper]
        J --> K[Gemini 2.5 Flash Grounded LLM]
        K --> L[Citation Verification Drawer]
        M[Web Speech API / TTS] --> N[Multilingual Voice Dispatcher\nHindi / Hinglish / English]
        N --> J
    end

    subgraph SafetyTelemetry["4. Telemetry & Emergency SOS"]
        O[Driver Mobile Web App] -->|3-Second Press & Hold| P[Emergency SOS Service]
        P --> Q[15-Minute Deduplication & Authority]
        Q --> R[Live Operations Map\nLeaflet GIS + Beacons]
        Q --> I
    end

    subgraph Observability["5. Observability & Analytics"]
        I --> S[Analytics Service Engine\n7 Dimensions]
        I --> T[Forensic Audit Trail\nTamper-Evident Logs]
        S --> U[Executive Reports Dashboard]
        I --> V[Production Readiness Probe\n/api/ready]
    end
```

---

## 🔒 Enterprise Security & Rate Limiting

- **Sliding-Window Rate Limiting Engine** ([`lib/security/rateLimit.ts`](lib/security/rateLimit.ts)):
  - Driver SOS: `10 req / min`
  - Fleet Telemetry: `180 req / min`
  - AI Copilot: `60 req / min`
  - Voice Sessions: `30 req / min`
  - Data Ingestion: `30 req / min`
- **Zod Payloads Validation** ([`lib/security/validation.ts`](lib/security/validation.ts)): Strictly validates coordinates (`lat: [-90, 90]`, `lng: [-180, 180]`), speed (`0-200 km/h`), and query date ranges.
- **Idempotency Guarantee**: Work orders enforce `WORK_ORDER:TKT-101` keys; reruns never create duplicate orders.
- **Cryptographic Audit Trail**: Immutable logging of every ticket receipt, rule evaluation, PII redaction, and dispatch action.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **MongoDB**: Local or MongoDB Atlas instance running
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

### 2. Clone & Install
```bash
git clone https://github.com/anuragsinghrajput123456789/SynqVerse_Ai_agent.git
cd SynqVerse_Ai_agent
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Connection URI
MONGODB_URI=mongodb://localhost:27017/meridian_resolve
```

### 4. Ingest Base Context Data
Populate MongoDB with the verified fleet, driver, client, and trip roster:
```bash
npm run ingest
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the Grafity console.

---

## 🧪 Comprehensive Verification & Test Suite

Grafity includes 13 automated test suites covering all operational modules:

```bash
npm test
```

### Test Suite Results (100% Pass Rate):
| Test Suite | Focus Area | Status |
|---|---|---|
| `part-a-integration.test.ts` | Context Foundation & Entity Normalization | ✅ PASSED |
| `module-1-queue.test.ts` | Ticket Ingestion & Validation Pipeline | ✅ PASSED |
| `module-2-decision.test.ts` | 13 Deterministic Operational Rules | ✅ PASSED |
| `module-3-vehicle-selection.test.ts` | Replacement Vehicle Scoring & Ranking | ✅ PASSED |
| `module-4-work-orders.test.ts` | Work Order Idempotency & Reruns | ✅ PASSED |
| `module-5-ai-drafting.test.ts` | Zero-Hallucination Message Drafting | ✅ PASSED |
| `module-6-approvals.test.ts` | Two-Phase Human Approvals Workflow | ✅ PASSED |
| `module-7-audit.test.ts` | Forensic Audit Trail & PII Redaction | ✅ PASSED |
| `module-8-pipeline.test.ts` | End-to-End Autonomous Pipeline | ✅ PASSED |
| `copilot-rag.test.ts` | RAG Context Ranking & Citation Drawers | ✅ PASSED |
| `voice-integration.test.ts` | Multilingual STT/TTS & Fallbacks | ✅ 42 PASSED |
| `chat-pipeline.test.ts` | Grounded AI Chat & Domain Gatekeeper | ✅ 35 PASSED |
| `production-hardening.test.ts` | Rate Limiter, Schemas, SOS Deduplication, Analytics | ✅ 44 PASSED |

### Production Build:
```bash
npm run build
```
Compiles and optimizes all 43 static and dynamic routes cleanly with **exit code 0**.

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/ready` | `GET` | Deep production readiness probe (validates MongoDB latency, emergency bus, telemetry, and Gemini key) |
| `/api/health` | `GET` | Lightweight liveness probe |
| `/api/emergency` | `POST` | Trigger new driver SOS (rate limited, schema validated, 15m deduplication) |
| `/api/emergency` | `GET` | Fetch all tracked emergency events |
| `/api/location` | `POST` | Ingest vehicle GPS telemetry packet (rate limited to 180/min) |
| `/api/location/live` | `GET` | Get live fleet positions and driver telemetry |
| `/api/analytics/overview` | `GET` | Get operations overview metrics (`?range=7d`) |
| `/api/analytics/incidents` | `GET` | Get incident performance, causes, and trend curves |
| `/api/analytics/fleet` | `GET` | Get vehicle availability and utilization rate |
| `/api/analytics/safety` | `GET` | Get emergency response and distress metrics |
| `/api/analytics/work-orders` | `GET` | Get work order execution metrics |
| `/api/analytics/ai` | `GET` | Get Copilot & Voice AI usage and efficiency |
| `/api/copilot` | `POST` | Grounded dispatch Copilot query with citations |
| `/api/chat` | `POST` | AI conversational query with PII redaction |

---

## 👥 Contributors & Maintainers

- **Anurag Singh Rajput** — Lead Architect & Full-Stack Engineer ([@anuragsinghrajput123456789](https://github.com/anuragsinghrajput123456789))

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
