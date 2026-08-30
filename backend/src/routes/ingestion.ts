import { Router } from 'express';
import multer from 'multer';
import { uploadCsv, getJobStatus } from '../controllers/ingestion.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Store files in memory buffer for processing
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Only GOVERNMENT_ADMIN can upload bulk data
router.post('/upload', authenticate, authorize(['GOVERNMENT_ADMIN']), upload.single('file'), uploadCsv);
router.get('/status/:jobId', authenticate, getJobStatus);

export default router;
