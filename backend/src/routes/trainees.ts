import { Router } from 'express';
import { getTrainees, getTraineeById, logAadhaarView, getTraineeEvidence, getTraineeEmployment, requestEmploymentVerification } from '../controllers/trainees.controller';
import { approveUser, rejectUser } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getTrainees);
router.get('/:id', getTraineeById);
router.post('/:id/log-aadhaar-view', authorize(['GOVERNMENT_ADMIN']), logAadhaarView);
router.post('/:id/approve', authorize(['GOVERNMENT_ADMIN']), approveUser);
router.patch('/:id/approve', authorize(['GOVERNMENT_ADMIN']), approveUser);
router.post('/:id/reject', authorize(['GOVERNMENT_ADMIN']), rejectUser);
router.patch('/:id/reject', authorize(['GOVERNMENT_ADMIN']), rejectUser);

router.get('/:id/evidence', getTraineeEvidence);
router.get('/:id/employment', getTraineeEmployment);
router.post('/:id/employment/request', requestEmploymentVerification);

export default router;

