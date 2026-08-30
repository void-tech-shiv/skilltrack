# Changelog

## [Version 3.0.0] - Production Ready Release
### Added
- Real Server-side Pagination (`page`, `pageSize`, `total`, `totalPages`) on `/api/trainees`.
- Server-side text search across Trainee ID, First Name, Last Name, Phone, District.
- Multi-field filtering by Status and District with dynamic query composition.
- Interactive Trainees UI with pagination controls, entries counter, and CSV page export.
- Neon Serverless PostgreSQL schema with Prisma ORM.
- Decoupled Python FastAPI RandomForest ML microservice for dropout risk inference.
- Non-blocking asynchronous CSV/Excel ingestion pipeline with real-time status polling.
- Role-Based Portals (`GOVERNMENT_ADMIN`, `TRAINING_PROVIDER`, `TRAINEE`, `EMPLOYER`, `ANALYST`) with row-level data isolation.

### Fixed
- Fixed TypeScript compiler errors in `TraineePortal.tsx`, `App.tsx`, `ai.controller.ts`, `employer.controller.ts`, and `ingestion.controller.ts`.
- Replaced non-existent `@prisma/client` `Role` enum import with string union type in `auth.ts`.
- Wrapped `fetchVerifications` with `useCallback` to prevent cascading hook re-renders.
- Upgraded rate limiter threshold from 100 to 1000 requests/15m to prevent false 429 errors during portal navigation.
- Fixed mobile navigation wrapping in `MainLayout`.
