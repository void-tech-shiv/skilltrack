import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['GOVERNMENT_ADMIN']));

router.get('/dashboard', getDashboardStats);

export default router;
