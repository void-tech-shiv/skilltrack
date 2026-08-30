import { Router } from 'express';
import { getRiskPrediction } from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Only Government Admins, Analysts, and Training Providers can request AI risk scores
router.get('/risk/:traineeId', authenticate, authorize(['GOVERNMENT_ADMIN', 'ANALYST', 'TRAINING_PROVIDER']), getRiskPrediction);

export default router;
