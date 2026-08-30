import { Router } from 'express';
import { getCourses, getCourseById, createCourse, addModule } from '../controllers/courses.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getCourses);
router.get('/:id', authenticate, getCourseById);
router.post('/', authenticate, authorize(['GOVERNMENT_ADMIN', 'COURSE_MANAGER']), createCourse);
router.post('/:id/modules', authenticate, authorize(['GOVERNMENT_ADMIN', 'COURSE_MANAGER']), addModule);

export default router;
