# Meridian Resolve & Grafity — Dispatcher Operating Rules & Overrides Registry

This document catalogues the formal operational rules, seasonal constraints, client SLA agreements, and non-obvious override cases implemented in the Meridian Resolve Decision Engine (`lib/decision-engine/rules.ts`).

All rules are structured, deterministic, and queryable. Operational decisions are computed without runtime LLM invocations.

---

## 1. Documented Override Cases (Non-Obvious Choices)

The following operational cases explicitly override default optimization metrics (such as geographical proximity, standard contract text, or nominal vehicle availability):

### Override Case 1: Winter Delhi NCR BS6 Mandate (Rule R-001)
* **Rule ID**: `R-001`
* **Category**: Seasonal / Regulatory
* **Condition**: Dispatch route origin or destination touches Delhi NCR (`Delhi`, `Gurgaon`, `Noida`, `Faridabad`) during winter months (`October` through `February`) AND vehicle emissions standard is `BS4`.
* **Decision**: `INELIGIBLE` (Candidate Vehicle Rejected)
* **Non-Obvious Override Behavior**:
  * Normally, the closest available vehicle to the breakdown is selected.
  * Under Rule `R-001`, a nearby `BS4` truck parked at the same hub (e.g. 5 km away) is **strictly rejected** in favor of a `BS6` truck dispatched from a farther hub (e.g. 120 km away).
* **Authoritative Source Citation**:
  * Source File: `dispatcher_interview.txt`
  * Citation: *Rajender Pal Yadav (Senior Dispatch Manager), Interview Lines 14–15*:
    > *"October to February, no BS4 vehicle goes on any Delhi NCR route — Delhi, Gurgaon, Faridabad, Noida, none of it. CAQM and Supreme Court GRAP restrictions. BS6 only on Delhi routes in winter, I don't care if the BS4 truck is parked twenty meters from the loading dock."*

---

### Override Case 2: Shakti Cement 36-Hour Operational SLA (Rule R-008)
* **Rule ID**: `R-008`
* **Category**: Client SLA
* **Condition**: Client account is `Shakti Cement`.
* **Decision**: `APPLIED` (Enforce 36-Hour Window)
* **Non-Obvious Override Behavior**:
  * Nominal paper contract specifies a 48-hour delivery window (`contracts_master.csv`).
  * Under Rule `R-008`, the operational decision engine **overrides the 48-hour contract** and enforces a strict **36-hour resolution target**.
* **Authoritative Source Citation**:
  * Source File: `dispatcher_interview.txt`
  * Citation: *Rajender Pal Yadav, Interview Line 22*:
    > *"Shakti Cement's contract says 48 hour delivery window. Forget the contract. If a Shakti load crosses 36 hours, their plant head calls our MD directly... Plan everything to 36."*

---

### Override Case 3: Origin Hub Sourcing for <50km Breakdowns (Rule R-004)
* **Rule ID**: `R-004`
* **Category**: Route / Inventory Protection
* **Condition**: Breakdown occurs within 50 km of origin hub (`kmFromOriginHub <= 50`) AND candidate replacement is located at an intermediate hub.
* **Decision**: `INELIGIBLE` (Candidate Vehicle Rejected)
* **Non-Obvious Override Behavior**:
  * If a breakdown occurs 40 km from Lucknow origin hub and an intermediate hub has a truck 15 km away, the closer intermediate truck is **rejected**. The replacement vehicle must be sourced from the origin hub to protect regional inventory buffers.
* **Authoritative Source Citation**:
  * Source File: `dispatcher_interview.txt`
  * Citation: *Rajender Pal Yadav, Interview Line 36*:
    > *"If a vehicle breaks down within 50 kilometers of its origin hub, the replacement comes from the origin hub. Always. Do not pull a vehicle from an intermediate hub for a breakdown near the origin... You empty out a small hub for a breakdown 40 km away and then a Shakti order lands there in the evening and you have nothing."*

---

### Override Case 4: Orion Pharma Model Year Audit Requirement (Rule R-007)
* **Rule ID**: `R-007`
* **Category**: Client Compliance
* **Condition**: Client account is `Orion Pharma` AND candidate vehicle model year is older than `2020` (`year < 2020`).
* **Decision**: `INELIGIBLE` (Candidate Vehicle Rejected)
* **Non-Obvious Override Behavior**:
  * A well-maintained 2018 or 2019 BS6 vehicle is **rejected** for Orion Pharma consignments regardless of proximity, because pharma quality audits inspect RC copies at the receiver gate.
* **Authoritative Source Citation**:
  * Source File: `dispatcher_interview.txt`
  * Citation: *Rajender Pal Yadav, Interview Line 28*:
    > *"Orion Pharma... their consignments always get the newest available vehicle, 2020 or later. Pharma audit requirement, they check the RC copy. Send a 2016 truck and the load is rejected at the gate."*

---

## 2. Complete Dispatcher Rule Index (`R-001` to `R-013`)

| Rule ID | Rule Name | Category | Priority | Condition Summary | Source |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `R-001` | Winter Delhi NCR BS6 Restriction | Seasonal | 100 | Prohibit BS4 vehicles on Delhi NCR routes (Oct–Feb) | `dispatcher_interview.txt:L14-15` |
| `R-002` | Hill Route Winter Engine Heater | Seasonal | 95 | Mandate engine heater for hill routes (Rudrapur/Nainital, Nov–Feb) | `dispatcher_interview.txt:L18` |
| `R-003` | Hill Route 30-Day Brake Recency | Maintenance | 95 | Prohibit hill dispatch if brake work occurred in last 30 days | `dispatcher_interview.txt:L18` |
| `R-004` | <50km Origin Hub Sourcing | Route | 90 | Source replacement from origin hub if breakdown $\le 50\text{ km}$ | `dispatcher_interview.txt:L36` |
| `R-005` | Service Overdue Grounding Rule | Maintenance | 100 | Ground vehicles $>30$ days overdue for scheduled service | `dispatcher_interview.txt:L38` |
| `R-006` | Temporary Repair 7-Day Boundary | Maintenance | 85 | Temporary roadside patch (*jugaad*) restricted to home region & $\le 7$ days | `dispatcher_interview.txt:L42` |
| `R-007` | Orion Pharma Model Year $\ge 2020$ | Client | 90 | Mandate vehicle model year $\ge 2020$ for Orion Pharma | `dispatcher_interview.txt:L28` |
| `R-008` | Shakti Cement 36h Operational SLA | SLA | 80 | Enforce 36h delivery SLA (overriding 48h contract) | `dispatcher_interview.txt:L22` |
| `R-009` | Vertex Ludhiana 18:00 Gate Cutoff | Client | 80 | Vertex Ludhiana warehouse gate closes at 18:00; hold for morning delivery | `dispatcher_interview.txt:L24` |
| `R-010` | Apex Chemicals Plate Rotation | Client | 85 | Rotate vehicle plate if involved in previous breakdown on Apex run | `dispatcher_interview.txt:L26` |
| `R-011` | Monsoon Eastern Route +20% Buffer | Seasonal | 75 | Add 20% transit buffer for routes east of Lucknow in monsoon (Jul–Sep) | `dispatcher_interview.txt:L32` |
| `R-012` | Active Fleet & Capacity Eligibility | Vehicle | 100 | Vehicle status must be Active/AVAILABLE and payload capacity $\ge 10\text{ T}$ | `fleet_master.csv` |
| `R-013` | Driver Night Solo Tenure $\ge 6$ Mo | Driver | 80 | Drivers $<6$ months tenure prohibited from solo night runs | `dispatcher_interview.txt:L46` |
