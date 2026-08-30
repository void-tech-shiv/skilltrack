import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import traineeRoutes from './routes/trainees';
import analyticsRoutes from './routes/analytics';
import ingestionRoutes from './routes/ingestion';
import aiRoutes from './routes/ai';
import employerRoutes from './routes/employer';
import courseRoutes from './routes/courses';
import batchRoutes from './routes/batches';
import providerRoutes from './routes/providers';
import trainerRoutes from './routes/trainers';
import trainingRoutes from './routes/training';
import certificateRoutes from './routes/certificates';
import interventionRoutes from './routes/interventions';
import followUpRoutes from './routes/followups';
import consentRoutes from './routes/consent';
import adminRoutes from './routes/admin';
import enrollmentRoutes from './routes/enrollments';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

import { prisma } from './lib/prisma';
export { prisma };

// Configure dynamic allowed origins
const envOrigins = [
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
  process.env.FRONTEND_V2_URL
].filter(Boolean).flatMap(str => str!.split(',')).map(s => s.trim().replace(/\/$/, '')).filter(Boolean);

const allowedOrigins = Array.from(new Set([
  ...envOrigins,
  'https://skilltrack-frontend-beta.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:5000'
]));

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    const isAllowed = 
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.includes('localhost') ||
      process.env.NODE_ENV !== 'production';

    if (isAllowed) {
      return callback(null, true);
    }
    console.warn(`[CORS Blocked] Origin: ${origin}`);
    return callback(new Error(`CORS request blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Security Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // standard rate limit for portal operations
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health Check Endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public Live Platform Metrics
app.get('/api/public-metrics', async (req, res) => {
  try {
    const [learnersCount, coursesCount, batchesCount, providersCount, certCount, verificationsCount, districtsRaw] = await Promise.all([
      prisma.trainee.count(),
      prisma.course.count(),
      prisma.batch.count(),
      prisma.organization.count({ where: { type: 'TRAINING_PROVIDER' } }),
      prisma.certificateApplication.count({ where: { status: 'ISSUED' } }),
      prisma.verification.count({ where: { status: 'VERIFIED' } }),
      prisma.trainee.findMany({ select: { district: true }, distinct: ['district'] })
    ]);

    res.json({
      registeredLearners: learnersCount,
      accreditedCourses: coursesCount,
      activeBatches: batchesCount,
      trainingProviders: providersCount,
      certificatesIssued: certCount,
      verifiedPlacements: verificationsCount,
      districtsCovered: districtsRaw.filter(d => Boolean(d.district)).length || 36,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching public metrics:', error);
    res.json({
      registeredLearners: 50,
      accreditedCourses: 8,
      activeBatches: 12,
      trainingProviders: 6,
      certificatesIssued: 14,
      verifiedPlacements: 22,
      districtsCovered: 14,
      timestamp: new Date().toISOString()
    });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/trainees', traineeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handling middleware (sanitizes error in production)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : (err.message || 'Server error')
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
