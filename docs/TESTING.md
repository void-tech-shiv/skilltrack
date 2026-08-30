# Testing & QA Guide

This document outlines the testing strategy, test suites, and instructions for verifying the Maharashtra Longitudinal Skill & Employment Outcomes Intelligence Platform.

## 1. Automated Test Suites

### API RBAC & Data Isolation Suite
Verifies server-side authorization, JWT verification, and data scoping across all 5 roles (`GOVERNMENT_ADMIN`, `TRAINING_PROVIDER`, `TRAINEE`, `EMPLOYER`, `ANALYST`).
```bash
cd backend
npx tsx test-rbac.ts
```
**Coverage:**
- Multi-role JWT login
- Analytics scoping (e.g. Training Provider sees 25 trainees vs Government Admin seeing all 50)
- Cross-trainee unauthorized profile access denial (403)
- Unauthorized verification queue access denial (403)

### Server-Side Pagination, Search & Filter Suite
Verifies server-side pagination metadata and filtering operations.
```bash
cd backend
npx tsx test-pagination-search.ts
```
**Coverage:**
- Page 1 & Page 2 limit and offset checks
- Substring search across `canonicalId`, `firstName`, `lastName`, `phone`, `district`
- Status filtering (`EMPLOYED`, `TRAINING`, `APPRENTICESHIP`, `DROPPED`, `UNEMPLOYED`, `STUDYING`, `SELF_EMPLOYED`)
- District filtering (`Mumbai`, `Pune`, `Nagpur`, `Thane`, `Nashik`, `Aurangabad`)

## 2. Compilation & Linting Checks

### Frontend Typecheck & Build
```bash
cd frontend
npx tsc -b
npm run lint
npm run build
```

### Backend Typecheck & Build
```bash
cd backend
npx tsc --noEmit
npm run build
```

## 3. Real Browser QA
Interactive testing performed via Chrome DevTools protocol on `http://localhost:5174`:
- **Desktop (1440x900):** High-density data views, responsive navigation, SVG trend charts.
- **Tablet (768x1024):** Grid reflow for metrics and tables.
- **Mobile (390x844):** Single-column stacked layout with accessible dropdown filters and pagination controls.
