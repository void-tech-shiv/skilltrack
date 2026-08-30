import { Router } from 'express';
import { getBatches, getBatchById, createBatch, getBatchRecommendations, requestEnrollment, approveEnrollment } from '../controllers/batches.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getBatches);
router.get('/recommendations', authenticate, getBatchRecommendations);
router.get('/:id', authenticate, getBatchById);
router.post('/', authenticate, authorize(['GOVERNMENT_ADMIN', 'COURSE_MANAGER']), createBatch);
router.post('/enroll', authenticate, authorize(['TRAINEE']), requestEnrollment);
router.post('/approve-enrollment', authenticate, authorize(['GOVERNMENT_ADMIN', 'COURSE_MANAGER']), approveEnrollment);

export default router;
