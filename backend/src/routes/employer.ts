import { Router } from 'express';
import { getVerifications, updateVerification } from '../controllers/employer.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/verifications', getVerifications);
router.put('/verifications/:id', updateVerification);

export default router;
