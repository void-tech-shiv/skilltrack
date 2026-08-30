import { Router } from 'express';
import {
  login,
  registerTrainee,
  registerEmployer,
  getPendingUsers,
  approveUser,
  rejectUser,
  getMe,
  sendEmailOtp,
  verifyEmailOtp,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword
} from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Email Verification & OTP Challenge Endpoints
router.post('/email/send-otp', sendEmailOtp);
router.post('/email/verify-otp', verifyEmailOtp);

// Forgot Password & Reset Password Endpoints
router.post('/forgot-password/send-otp', sendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);

// Authentication & Registration
router.post('/login', login);
router.post('/register/trainee', registerTrainee);
router.post('/register/employer', registerEmployer);

// Profile & Administrative Approval Workflows
router.get('/me', authenticate, getMe);
router.get('/pending-users', authenticate, authorize(['GOVERNMENT_ADMIN']), getPendingUsers);
router.post('/approve-user', authenticate, authorize(['GOVERNMENT_ADMIN']), approveUser);
router.post('/reject-user', authenticate, authorize(['GOVERNMENT_ADMIN']), rejectUser);

export default router;
