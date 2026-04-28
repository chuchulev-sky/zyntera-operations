# Estimator Feature README

This document explains the Estimator feature end-to-end:

- where inputs come from
- how values are computed
- where data is fetched/saved
- how capacity fitting works
- what is accurate vs heuristic
- known limitations and recommended improvements

---

## 1) What the Estimator is for

The Estimator is an internal decision tool for pre-sales / planning.

It helps answer:

- **How big is the job?** (estimated hours)
- **How long should it take?** (timeline days)
- **What should we charge?** (minimum vs recommended price)
- **Can the team take it now?** (capacity impact + next slot)
- **How risky is it?** (risk level + risk factors)

The user can then:

- save the estimate as a **Draft Offer** (`/api/offers`)
- create a **Commitment Project** directly (`/api/projects`)

---

## 2) Code structure

Estimator code is split between UI orchestration and pure/domain logic.

### UI + feature orchestration (`src/app/estimator`)

- `page.tsx`
  - owns form state and rendering
  - builds `EstimatorInput`
  - calls `estimateAll(...)`
  - wires capacity schedule and action buttons
- `_hooks/use-estimator-capacity.ts`
  - loads active projects from `/api/projects`
  - computes current-week department usage
- `_hooks/use-estimator-actions.ts`
  - handles "Save as Offer" and "Create Project"
- `_lib/helpers.ts`
  - small shared helpers (notes builders, date/class helpers, category->dept mapping)
- `_lib/constants.ts`
  - checkbox option lists
- `_components/estimator-ui.tsx`
  - presentational primitives (`Field`, `Metric`, `Pill`, etc.)

### Domain calculation logic (`src/lib/estimator`)

- `types.ts`
  - strongly-typed input/output contracts
- `logic.ts`
  - all computation logic:
    - `calculateEstimatedHours`
    - `calculateTimelineDays`
    - `calculatePricing`
    - `calculateRiskLevel`
    - `calculateCapacityImpact`
    - `estimateAll`

### Shared capacity engine

- `src/lib/capacity/forecast.ts`
  - used by Estimator and Dashboard
  - distributes commitment hours across weeks
  - finds earliest feasible slot (`scheduleWork`)

---

## 3) Data sources

## 3.1 User-entered estimator input

From `page.tsx`:

- common fields: client/company/project name, category, complexity, urgency, notes, selected services
- website/design fields: website type, page count, multilingual, CMS, custom features, content readiness, SEO/UIUX/branding flags, expected revisions
- marketing fields: channels, creatives per month, reporting level, campaign complexity, landing page support

These are assembled into `EstimatorInput`.

## 3.2 Live capacity context

`useEstimatorCapacity` fetches:

- `GET /api/projects`

Then keeps only non-archived projects and computes current week usage via:

- `buildCapacityTimeline({ projects, weeks: 1 })`

Department capacities are fixed constants in `forecast.ts`:

- Development: **80h/week**
- Design: **40h/week**
- Marketing: **60h/week**

## 3.3 Persistence targets

When saving:

- `POST /api/offers` (manual draft offer)
- `POST /api/projects` (manual commitment project)

Both payloads include estimator-generated notes + numbers.

---

## 4) Calculation model

This section describes exact formulas and coefficients currently used.

## 4.1 Hour estimation (`calculateEstimatedHours`)

The model starts with base hours, adds modifiers, applies multipliers, then clamps where applicable.

### A) Website category

Base by website type:

- Landing Page: **30h** (commented target range 20-40)
- Corporate Website: **90h** (range 60-120)
- E-commerce: **160h** (range 120-200)
- Custom Web App: **220h** (higher custom baseline)

Adders:

- extra pages above 5: `+1h/page`
- multilingual: `+12h`
- CMS required: `+8h`
- custom features: `+7h * count`
- content not ready: `+8h`
- SEO setup included: `+4h`
- UI/UX included: `+22h`
- branding included: `+25h`
- expected revisions:
  - Medium: `+8h`
  - High: `+16h`

### B) Design category

Size is inferred from `websiteType`:

- Landing Page -> Small -> **15h**
- Corporate Website -> Medium -> **30h**
- E-commerce/Custom Web App -> Large -> **60h**
- missing/other -> Medium -> **30h**

### C) Marketing category

Base monthly hours by tier:

- tier derived from reporting level / campaign complexity
- Basic: **15h**
- Medium: **30h**
- Advanced: **60h**

Adders:

- channels: `+3h each`, capped at `+18h`
- creatives: `+0.3h each`, capped at `+20h`
- landing page support: `+6h`

### D) Global multipliers

Complexity multiplier:

- Low: `0.9`
- Medium: `1.0`
- High: `1.15`
- Custom: `1.25`

Urgency multiplier:

- Normal: `1.0`
- Fast: `1.15`
- Urgent: `1.3`

Final: `hours = hours * complexityMult * urgencyMult`

### E) Clamps and rounding

For Website category, hours are clamped to realistic bounds:

- Landing Page: 20..40
- Corporate Website: 60..120
- E-commerce: 120..200
- Custom Web App: 140..320

Then final rounding:

- `Math.round(hours)`
- floor minimum: **8h**

---

## 4.2 Timeline (`calculateTimelineDays`)

Uses urgency-specific weekly throughput:

- Normal: 30h/week
- Fast: 36h/week
- Urgent: 42h/week

Formula:

`days = max(3, round((estimatedHours / throughputPerWeek) * 7))`

---

## 4.3 Pricing (`calculatePricing`)

Constants:

- `INTERNAL_BASE_RATE_EUR = 18`
- `TARGET_RATE_EUR = 35`
- `TARGET_MULTIPLIER = 1.1`

Formulas:

- minimum price = `estimatedHours * 18`
- recommended price = `estimatedHours * 35 * 1.1`
- suggested range = `[minimum, recommended]`

Notes:

- category/complexity parameters are currently unused in pricing logic by design.

---

## 4.4 Risk (`calculateRiskLevel`)

Rule-based score:

- complexity: High +2, Custom +3
- urgency: Fast +1, Urgent +2
- size: >=120h +2, >=200h +2

Website risk adders:

- content not ready +1
- >=3 custom features +2
- high revisions +2
- multilingual +1

Marketing risk adders:

- advanced reporting +1
- high campaign complexity +2

Risk level buckets:

- score <= 2 -> Low
- score <= 5 -> Moderate
- else -> High

---

## 4.5 Capacity impact (`calculateCapacityImpact`)

Given `estimatedHours` and current `freeCapacityHours`:

- if free <= 0 -> High
- ratio = `estimatedHours / freeCapacityHours`
- ratio <= 0.35 -> Low
- ratio <= 0.75 -> Medium
- else -> High

---

## 4.6 End-to-end (`estimateAll`)

Pipeline:

1. estimated hours (+ factors)
2. timeline
3. pricing
4. risk
5. capacity impact
6. derived EUR/hour = `recommendedPrice / estimatedHours`
7. merge risk factors from hours stage + risk stage (deduplicated)

Output type: `EstimatorResult`.

---

## 5) Capacity scheduling and "next slot"

`page.tsx` uses:

- `scheduleWork(...)` from `forecast.ts`
- department chosen from estimator category:
  - Website -> Development
  - Design -> Design
  - Marketing -> Marketing

How it works:

1. Build timeline over 26 weeks.
2. For each possible start week, greedily consume free hours week by week.
3. First start index that fits all required hours is returned.

Output includes:

- start week
- duration in weeks
- finish date (end of finish week)

This is intentionally simple and deterministic.

---

## 6) Save flows and payload mapping

## 6.1 Save as Offer

From `useEstimatorActions.saveAsOffer`:

- saves Draft offer with `manual: true` so backend does not recompute
- uses recommended price, estimated hours, timeline
- maps workload department simply by category
- appends estimator metadata lines into notes

Redirect: `/offers`

## 6.2 Create Project

From `useEstimatorActions.createProject`:

- creates manual commitment project
- `estimatedHours = committedHours = result.estimatedHours`
- `priceTotal = result.recommendedPrice`
- payment status defaults to Unpaid
- workload status:
  - High capacity impact -> AtRisk
  - else -> Healthy

Redirect: `/projects`

---

## 7) Accuracy assessment

The estimator is **directionally useful** for quick internal decisions, but not a statistically calibrated model yet.

### What is relatively strong

- transparent, deterministic formulas
- category-specific logic reflects real operational differences
- urgency and complexity are consistently applied
- capacity integrates live project load
- risk explanation is explicit and inspectable

### What is approximate / heuristic

- all coefficients are manually chosen constants (not learned from historical actuals)
- website clamping may hide extreme scopes
- marketing estimation models monthly effort but output is still treated as generic project estimate
- pricing does not currently vary by category margin strategy, client segment, or team composition
- "next slot" assumes evenly distributed committed hours and fixed weekly capacities

### Expected error profile

- small/standard scopes: usually reasonable for triage
- complex/custom scopes: can under/over-shoot materially depending on omitted constraints
- projects with irregular workload distribution across weeks: capacity projection can be optimistic or pessimistic

---

## 8) Known structural limitations

1. **No historical calibration loop**
   - no automated backtesting vs actual delivered hours
2. **No confidence interval**
   - returns point estimates only
3. **Simple workload mapping on save**
   - saved offer/project workload is coarse by category, not full service decomposition
4. **Capacity model is fixed constants**
   - no PTO, part-time, seasonality, or role-level dynamic capacity
5. **Marketing horizon mismatch**
   - retainer-like effort modeled together with project-like outputs

---

## 9) Recommended next improvements

1. Add `estimator_run` audit records (input/output/saved entity id).
2. Compare estimates vs actuals and report MAPE/error by category.
3. Move coefficients to DB-configurable tables (versioned).
4. Add confidence bands (P50/P80) rather than single hour number.
5. Distinguish retainer estimation mode from one-off project mode in output semantics.
6. Improve workload decomposition when persisting offers/projects.
7. Add automated tests for representative scenarios and boundary conditions.

---

## 10) Quick file map

- UI orchestration: `src/app/estimator/page.tsx`
- actions: `src/app/estimator/_hooks/use-estimator-actions.ts`
- capacity hook: `src/app/estimator/_hooks/use-estimator-capacity.ts`
- constants/helpers: `src/app/estimator/_lib/*`
- calc engine: `src/lib/estimator/logic.ts`
- calc contracts: `src/lib/estimator/types.ts`
- capacity engine: `src/lib/capacity/forecast.ts`
- persistence APIs:
  - `src/app/api/offers/route.ts`
  - `src/app/api/projects/route.ts`

