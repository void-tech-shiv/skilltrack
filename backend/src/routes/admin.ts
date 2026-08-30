import { Router } from 'express';
import { approveUser, rejectUser, getPendingUsers } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// Strictly Government Admin only
router.use(authenticate);
router.use(authorize(['GOVERNMENT_ADMIN']));

// Learner / User approval & rejection endpoints
router.get('/pending-users', getPendingUsers);
router.post('/users/approve', approveUser);
router.post('/users/reject', rejectUser);
router.put('/users/:id/status', async (req, res) => {
  const { status, reason } = req.body;
  if (status === 'ACTIVE' || status === 'APPROVED') {
    return approveUser(req, res);
  } else if (status === 'REJECTED') {
    return rejectUser(req, res);
  }
  return res.status(400).json({ error: 'Invalid status value' });
});

router.patch('/learners/:learnerId/approve', approveUser);
router.patch('/learners/:learnerId/reject', rejectUser);

export default router;
