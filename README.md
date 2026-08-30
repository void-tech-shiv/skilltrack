# Maharashtra Longitudinal Skill & Employment Outcomes Intelligence Platform

A production-grade web platform for the **Government of Maharashtra** (Maharashtra State Innovation Society, Department of Skills, Employment, Entrepreneurship and Innovation) designed for tracking longitudinal skill and employment outcomes across the state.

---

## 🌟 Key Features

1. **Role-Based Portals & RBAC:**
   - **Government Admin:** Global state KPIs, interactive trainees database with server-side pagination/search/filtering, trainee longitudinal profile view, and non-blocking CSV/Excel ingestion.
   - **Training Provider:** Scoped dashboard showing batch outcomes, placement rates, and trainee records restricted to the provider's organization.
   - **Trainee:** Secure personal portal showing enrollments, certifications, outcome tracking, and consent management.
   - **Employer:** Dedicated verification portal to review and approve trainee employment claims.
   - **Analyst:** State-wide macro analytics, placement trends, and skill gap supply vs. demand modeling.

2. **Server-Side Data Engine (24,500+ Capacity):**
   - High-performance server-side pagination (`page`, `pageSize`, `total`, `totalPages`).
   - Case-insensitive multi-field search across ID, First Name, Last Name, Phone, and District.
   - Dynamic multi-filter engine (District, Employment Status, Provider).
   - Direct CSV export of active result sets.

3. **Machine Learning Inference:**
   - Decoupled Python FastAPI microservice running a trained `RandomForestClassifier`.
   - Real-time dropout risk scoring with deterministic contributing factor attribution.

4. **Robust Ingestion Pipeline:**
   - Background asynchronous streaming parser (`csv-parse`) with real-time status polling and error tracking.

---

## 🚀 Getting Started

### Architecture & Default Ports
- **Frontend:** Vite + React + Tailwind CSS (`http://localhost:5174`)
- **Backend:** Express.js + Prisma ORM + PostgreSQL (`http://localhost:5000`)
- **ML Microservice:** FastAPI + Scikit-Learn (`http://localhost:8000`)

### Role Test Credentials
All accounts use password: `password123`

| Role | Email | Scope / Features |
|---|---|---|
| **Government Admin** | `admin@maha.gov.in` | Global State Dashboard, Full Trainees Database, Bulk Ingestion |
| **Training Provider** | `provider@maha.gov.in` | Scoped Batches (25 Trainees), Provider Placement KPIs |
| **Trainee** | `trainee@maha.gov.in` | Personal Enrollments & Employment History |
| **Employer** | `employer@maha.gov.in` | Employment Verification Approval Workflow |
| **Analyst** | `analyst@maha.gov.in` | Macro State Analytics & Skill Gap Insights |

---

## 🧪 Testing & Verification

### Run Backend Regression Suites
```bash
cd backend
npx tsx test-rbac.ts
npx tsx test-pagination-search.ts
```

### Build Verification
```bash
# Frontend
cd frontend
npx tsc -b
npm run lint
npm run build

# Backend
cd backend
npx tsc --noEmit
npm run build
```

---

## 📚 Documentation Links
- [Testing & QA Guide](file:///e:/SIH%20F/docs/TESTING.md)
- [Security Architecture](file:///e:/SIH%20F/docs/SECURITY.md)
- [Deployment Guide](file:///e:/SIH%20F/docs/DEPLOYMENT.md)
- [Troubleshooting Guide](file:///e:/SIH%20F/docs/TROUBLESHOOTING.md)
- [Known Issues & Considerations](file:///e:/SIH%20F/docs/KNOWN_ISSUES.md)
- [Changelog](file:///e:/SIH%20F/docs/CHANGELOG.md)
- [Final QA Report](file:///e:/SIH%20F/docs/FINAL_QA_REPORT.md)
