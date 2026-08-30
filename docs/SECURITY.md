# Security Architecture & Best Practices

## 1. Authentication
- **Password Storage:** Salted and hashed using `bcrypt` (10 rounds).
- **Session Tokens:** Stateless JSON Web Tokens (`jsonwebtoken`) signed with server-side secrets (`JWT_SECRET`) with 24-hour expiration.
- **Client Handling:** Tokens stored in `localStorage` and sent via `Authorization: Bearer <token>` HTTP headers.

## 2. Server-Side Authorization (RBAC)
- Middleware-enforced permissions (`authenticate`, `authorize`) on all protected routes.
- Row-level data isolation based on `req.user.organizationId` and `req.user.traineeId`.
- Training providers cannot access trainees outside their organization's assigned batches.
- Trainees cannot view other trainees' profiles (HTTP 403 Forbidden).
- Employers can only review and verify outcomes assigned to their organization.

## 3. Network & Transport Security
- **HTTP Security Headers:** Implemented via `helmet()` middleware.
- **CORS Protection:** Configured in `server.ts`.
- **API Rate Limiting:** Enforced via `express-rate-limit` (1000 req / 15 min window) to prevent brute-force attacks and abuse.

## 4. Ingestion Security
- File size capped at 10 MB per upload.
- Multipart parsing directly in-memory buffer (`multer.memoryStorage()`) to prevent unauthenticated disk writes.
- Background asynchronous streaming parsing via `csv-parse` to prevent Node event-loop starvation.
- Audit logging recorded in `AuditLog` table on all bulk modifications.
