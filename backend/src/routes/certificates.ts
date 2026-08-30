import { Router } from 'express';
import {
  checkEligibility,
  applyForCertificate,
  getCertificateApplications,
  approveCertificate,
  revokeCertificate,
  verifyCertificatePublic
} from '../controllers/certificates.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// PUBLIC CERTIFICATE & QR VERIFICATION ROUTES (No auth required)
router.get('/verify/:certNumber', verifyCertificatePublic);
router.post('/verify', verifyCertificatePublic);

// Authenticated certificate lifecycle routes
router.get('/eligibility/:enrollmentId', authenticate, checkEligibility);
router.post('/apply', authenticate, authorize(['TRAINEE']), applyForCertificate);
router.get('/applications', authenticate, authorize(['GOVERNMENT_ADMIN', 'COURSE_MANAGER']), getCertificateApplications);
router.post('/approve', authenticate, authorize(['GOVERNMENT_ADMIN']), approveCertificate);
router.post('/revoke', authenticate, authorize(['GOVERNMENT_ADMIN']), revokeCertificate);

export default router;
