import { Router } from 'express';
import { getFollowUps, createFollowUp } from '../controllers/followups.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getFollowUps);
router.post('/', authenticate, authorize(['GOVERNMENT_ADMIN', 'ANALYST']), createFollowUp);

export default router;
