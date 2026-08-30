import { Router } from 'express';
import {
  getSessions,
  createSession,
  markAttendance,
  updateModuleProgress,
  submitEvidence,
  verifyEvidence,
  getPendingCompletions,
  recommendCompletion,
  approveCompletion
} from '../controllers/training.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Sessions
router.get('/sessions', authenticate, getSessions);
router.post('/sessions', authenticate, authorize(['GOVERNMENT_ADMIN', 'COURSE_MANAGER', 'TRAINING_PROVIDER', 'TRAINER']), createSession);

// Attendance
router.post('/attendance', authenticate, authorize(['GOVERNMENT_ADMIN', 'TRAINING_PROVIDER', 'TRAINER']), markAttendance);

// Module Progress
router.put('/module-progress', authenticate, authorize(['GOVERNMENT_ADMIN', 'TRAINER', 'TRAINEE']), updateModuleProgress);

// Evidence Submissions
router.post('/evidence', authenticate, authorize(['TRAINEE']), submitEvidence);
router.put('/evidence/:id', authenticate, authorize(['GOVERNMENT_ADMIN', 'TRAINER']), verifyEvidence);

// Completion Workflows
router.get('/completions/pending', authenticate, authorize(['GOVERNMENT_ADMIN', 'COURSE_MANAGER']), getPendingCompletions);
router.post('/recommend-completion', authenticate, authorize(['GOVERNMENT_ADMIN', 'TRAINER']), recommendCompletion);
router.post('/approve-completion', authenticate, authorize(['GOVERNMENT_ADMIN', 'COURSE_MANAGER']), approveCompletion);

export default router;
