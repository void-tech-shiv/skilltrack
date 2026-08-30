import { Router } from 'express';
import { getProviders, createProvider, authorizeProviderCourse } from '../controllers/providers.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getProviders);
router.post('/', authenticate, authorize(['GOVERNMENT_ADMIN']), createProvider);
router.post('/authorize-course', authenticate, authorize(['GOVERNMENT_ADMIN']), authorizeProviderCourse);

export default router;
