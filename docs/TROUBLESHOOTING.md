# Troubleshooting & Operational Guide

## 1. Rate Limiter Returning HTTP 429
- **Symptoms:** API calls fail with `429 Too Many Requests`.
- **Cause:** Exceeded rate threshold during heavy batch testing or automated tooling.
- **Resolution:** Rate limit is configured at 1000 requests per 15-minute window in `server.ts`. Adjust window or max limit as needed for high-throughput ingress.

## 2. ML Service Unavailable
- **Symptoms:** `/api/ai/risk/:traineeId` returns HTTP 500 (`Prediction service unavailable`).
- **Cause:** Python FastAPI microservice is not running on port 8000.
- **Resolution:** Start the microservice with `python -m uvicorn main:app --port 8000` in `ml_service/`. Check `/health` endpoint to confirm status.

## 3. Database Connection Issues
- **Symptoms:** `PrismaClientInitializationError: Can't reach database server`.
- **Cause:** Neon serverless compute suspend or network connectivity issue.
- **Resolution:** Verify `DATABASE_URL` parameter in `backend/.env` with `sslmode=require`. Run `npx prisma db push` or `npx prisma validate`.
