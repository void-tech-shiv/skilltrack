import { Router } from 'express';
import { getInterventions, createIntervention, updateIntervention } from '../controllers/interventions.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getInterventions);
router.post('/', authenticate, authorize(['GOVERNMENT_ADMIN', 'ANALYST', 'COURSE_MANAGER']), createIntervention);
router.put('/:id', authenticate, authorize(['GOVERNMENT_ADMIN', 'ANALYST', 'COURSE_MANAGER']), updateIntervention);

export default router;
