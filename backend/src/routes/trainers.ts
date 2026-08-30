import { Router } from 'express';
import { getTrainers, requestTrainerOnboarding, approveTrainer, reassignBatchTrainer } from '../controllers/trainers.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getTrainers);
router.post('/request-onboarding', authenticate, authorize(['GOVERNMENT_ADMIN', 'TRAINING_PROVIDER']), requestTrainerOnboarding);
router.post('/approve', authenticate, authorize(['GOVERNMENT_ADMIN']), approveTrainer);
router.post('/reassign-batch', authenticate, authorize(['GOVERNMENT_ADMIN', 'TRAINING_PROVIDER']), reassignBatchTrainer);

export default router;
