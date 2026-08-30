# Problem Statement 26135 — Gap Analysis & Roadmap Report

**Department:** Maharashtra State Innovation Society, Department of Skills, Employment, Entrepreneurship and Innovation  
**Problem Statement:** #26135 — Difficulties in tracking employment outcomes, skill gaps, and the impact of skilling initiatives  
**Audit Release:** Version 3.0.0 (Production Verified)

---

## 1. Executive Summary

A comprehensive compliance audit was conducted across the database schema, Express REST APIs, Python ML microservice, React frontend components, RBAC middleware, and test suites.

Out of **26 granular Problem Statement requirements**:
- **14 are FULLY COVERED (53.8%)**
- **10 are PARTIALLY COVERED (38.5%)**
- **2 are MISSING (7.7%)**

The core functional foundation (identity, authentication, role portals, server-side pagination, database relations, AI/ML risk scoring, CSV ingestion, and employer verification) is rock-solid. The remaining gaps relate to deeper longitudinal analytics, interactive intervention management, and domain relevance scoring.

---

## 2. Gap Classification

### 🚨 Critical Gaps (0)
*No core architectural or critical security gaps remain. All primary role portals, database relations, builds, and server-side pagination workflows are functioning.*

---

### ⚠️ High Gaps (4)

#### GAP-H1: Non-Placement Taxonomy & Analytics (PS-11)
- **Status:** MISSING
- **Requirement:** System must capture structured reasons why trainees were not placed (e.g. `SKILL_MISMATCH`, `LOCATION_CONSTRAINT`, `WAGE_EXPECTATION`, `FURTHER_STUDIES`, `HEALTH_PERSONAL`).
- **Current State:** The database and UI only record status as `UNEMPLOYED` with optional free-form text `notes`.
- **Impact:** Policy makers cannot systematically analyze the root causes of unemployment across districts or training programs.
- **Recommended Fix:** 
  1. Add `nonPlacementReason` enum to `Outcome` model in `schema.prisma`.
  2. Expose aggregate non-placement distribution in `analytics.controller.ts`.
  3. Render a non-placement pie/donut chart on Government Admin and Analyst dashboards.

#### GAP-H2: Longitudinal Retention Rate Checkpoints (PS-06)
- **Status:** PARTIALLY COVERED
- **Requirement:** Measure retention at 3-month, 6-month, and 12-month post-placement intervals.
- **Current State:** The `FollowUp` table has `type` (`3_MONTH`, `6_MONTH`, `12_MONTH`), but there is no aggregate query computing longitudinal retention curves (e.g. % of placed trainees still employed at 6 months).
- **Impact:** Retention is captured as individual records but not summarized as a macro KPI.
- **Recommended Fix:** Add a `getRetentionMetrics` service calculating 30/90/180/365-day retention percentage cohorts.

#### GAP-H3: Interactive Follow-Up Workflow (PS-09)
- **Status:** PARTIALLY COVERED
- **Requirement:** Conduct assisted and automated follow-ups with survey response tracking.
- **Current State:** `FollowUp` model exists, but there is no operational API endpoint or UI modal for counselors/providers to log call attempts, record answers, or update outcomes directly.
- **Impact:** Follow-ups cannot be performed or logged through the web UI.
- **Recommended Fix:** Add `POST /api/followups` and `PUT /api/followups/:id` endpoints with a "Log Follow-Up" modal in `Trainees.tsx` and `TraineePortal.tsx`.

#### GAP-H4: Targeted Remedial Action / Intervention Workflows (PS-20)
- **Status:** PARTIALLY COVERED
- **Requirement:** Allow administrators/providers to assign, record, and track targeted interventions for high-risk or dropped trainees.
- **Current State:** `ai.controller.ts` generates recommendation text (e.g., "Assign dedicated counselor"), and `Dashboard.tsx` shows a "View Interventions" link, but no interactive ticket tracking exists.
- **Impact:** Recommendations are informational rather than actionable workflows.
- **Recommended Fix:** Add an `Intervention` model (`traineeId`, `actionType`, `assignedTo`, `status`, `notes`) and an Interventions Management drawer.

---

### 🔍 Medium Gaps (5)

#### GAP-M1: Interactive Consent Management (PS-01)
- **Status:** PARTIALLY COVERED
- **Current State:** Trainees are created with `consentStatus: true, consentDate: now()` during CSV import, but `TraineePortal.tsx` does not have a toggle allowing the trainee to view consent terms, modify data-sharing permissions, or revoke consent.
- **Recommended Fix:** Add `PUT /api/trainees/consent` and a "Privacy & Consent" tab in `TraineePortal.tsx`.

#### GAP-M2: Training-to-Job Skill Relevance Scoring (PS-08)
- **Status:** MISSING
- **Current State:** `Course.name` and `Outcome.jobTitle`/`industry` are stored as text, but no relevance score or flag (`skillMatch: HIGH | MEDIUM | LOW`) is derived.
- **Recommended Fix:** Add a lightweight NLP/keyword matching function in backend to tag whether the placed job role matches the trained course curriculum.

#### GAP-M3: Macro Wage Progression Curves (PS-07)
- **Status:** PARTIALLY COVERED
- **Current State:** Individual trainee salaries are recorded in sequential `Outcome` entries, but macro average starting salary vs 12-month salary growth is not plotted on the analytics dashboard.
- **Recommended Fix:** Add `wageProgression` calculation in `analytics.controller.ts` and render a wage trend line chart.

#### GAP-M4: Side-by-Side Training Provider Comparison Leaderboard (PS-15)
- **Status:** PARTIALLY COVERED
- **Current State:** Provider isolation works cleanly and providers view their own metrics, but Government Admins lack a unified comparative table ranking all providers by placement rate and dropout index.
- **Recommended Fix:** Add `/api/analytics/providers` endpoint and a "Provider Leaderboard" component on the Government Admin portal.

#### GAP-M5: Demographic Cross-Tabulation Charts (PS-18)
- **Status:** PARTIALLY COVERED
- **Current State:** Demographic data (`gender`, `dob`, `district`) is stored and used in ML feature vectors, but not aggregated into a visual demographic breakdown chart (e.g. Female vs Male placement rate).
- **Recommended Fix:** Add demographic aggregation in `analytics.controller.ts` and display a demographic distribution widget.

---

### 💡 Low Gaps (3)

#### GAP-L1: Dedicated Self-Employment Business Details (PS-04)
- **Status:** PARTIALLY COVERED
- **Current State:** `SELF_EMPLOYED` outcomes are recorded with `salary` and `notes`, but structured fields for enterprise name, business sector, and monthly revenue can be expanded.

#### GAP-L2: Apprenticeship Contract Terms (PS-05)
- **Status:** PARTIALLY COVERED
- **Current State:** `APPRENTICESHIP` is tracked with employer and stipend, but explicit contract duration and post-apprenticeship conversion status can be modeled as a distinct transition state.

#### GAP-L3: Live External Labor Market Demand Feed (PS-13)
- **Status:** PARTIALLY COVERED
- **Current State:** Supply is dynamically computed from active course batches, while demand is modeled via realistic proxy multipliers. Full live external job board web-scraping can be added in future iterations.

---

## 3. Coverage Summary Scorecard

```
================================================================================
PROBLEM STATEMENT 26135 COMPLIANCE SCORECARD
================================================================================
Total Requirements Audited:        26
Fully Covered:                     14  (53.8%)
Partially Covered:                 10  (38.5%)
Missing:                            2   (7.7%)
Not Applicable:                     0   (0.0%)

Weighted Compliance Index:         73.1%  [ (14 + 10*0.5) / 26 ]
Architectural Completeness:        100.0% [ Database, API, ML, Auth, RBAC, UI ]
================================================================================
```

---

## 4. Recommended Next Implementation Roadmap

To advance compliance from **73.1% to 95%+**, implement in the following prioritized sequence:

1. **Phase 6.1 (High Impact Analytics & Taxonomy):**
   - Implement Non-Placement Reason taxonomy (`schema.prisma` + UI breakdown chart).
   - Implement Longitudinal Retention Checkpoint analytics (30, 90, 180, 365 days).
   - Implement Wage Progression curve computation.

2. **Phase 6.2 (Operational Workflows):**
   - Implement Assisted Follow-Up logging API and modal (`POST /api/followups`).
   - Implement Targeted Remedial Action / Intervention management system.
   - Implement Interactive Consent & Privacy settings in `TraineePortal.tsx`.

3. **Phase 6.3 (Comparative Intelligence & UI Enhancements):**
   - Implement Training Provider Comparison Leaderboard for Government Admins.
   - Implement Training-to-Job Skill Relevance scoring engine.
   - Add Demographic distribution analytics widget.
