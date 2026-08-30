import { Router } from 'express';
import { getConsentHistory, updateConsent } from '../controllers/consent.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize(['TRAINEE']), getConsentHistory);
router.put('/', authenticate, authorize(['TRAINEE']), updateConsent);

export default router;
