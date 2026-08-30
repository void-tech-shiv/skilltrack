# Deployment Guide

This guide outlines deployment procedures for the Maharashtra Longitudinal Outcomes Platform.

## 1. Prerequisites
- **Node.js:** v20+ LTS
- **Python:** 3.10+ (for ML inference microservice)
- **PostgreSQL:** Managed instance (e.g., Neon Serverless Postgres)

## 2. Environment Configuration

Create `.env` in `backend/`:
```env
PORT=5000
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
JWT_SECRET="your-production-jwt-secret-min-32-chars"
```

## 3. Database Migration
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed # For initial demo data
```

## 4. Building & Running Services

### Backend (Node.js/Express)
```bash
cd backend
npm install
npm run build
npm start # runs dist/server.js
```

### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run build # creates optimized dist/ static bundle
```

### ML Inference Service (FastAPI)
```bash
cd ml_service
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
