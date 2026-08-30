import { Router, Response } from 'express';
import { prisma } from '../server';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { requestEnrollment } from '../controllers/batches.controller';

const router = Router();

// POST /api/enrollments - Learner applies for batch enrollment
router.post('/', authenticate, authorize(['TRAINEE']), requestEnrollment);

// GET /api/enrollments - Returns enrollments based on authenticated role
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    let where: any = {};
    if (user.role === 'TRAINEE') {
      if (!user.traineeId) return res.json({ enrollments: [] });
      where.traineeId = user.traineeId;
    } else if (user.role === 'TRAINING_PROVIDER') {
      where.batch = { providerId: user.organizationId };
    } else if (user.role === 'TRAINER') {
      where.batch = { trainerId: user.trainerId };
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        batch: { include: { course: true, provider: true, trainer: true } },
        trainee: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ enrollments });
  } catch (error) {
    console.error('getEnrollments Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/enrollments/all - Admin & Course Manager overview
router.get('/all', authenticate, authorize(['GOVERNMENT_ADMIN', 'COURSE_MANAGER', 'TRAINING_PROVIDER', 'TRAINER']), async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        batch: { include: { course: true, provider: true, trainer: true } },
        trainee: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ enrollments });
  } catch (error) {
    console.error('getEnrollmentsAll Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/enrollments/:id/status - Update enrollment status (Course Manager approval / rejection)
router.put('/:id/status', authenticate, authorize(['GOVERNMENT_ADMIN', 'COURSE_MANAGER', 'TRAINING_PROVIDER']), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, rejectionReason } = req.body;

    if (!status) return res.status(400).json({ error: 'Status is required' });

    const enrollment: any = await prisma.enrollment.update({
      where: { id },
      data: {
        status,
        approvedAt: status === 'ENROLLED' ? new Date() : null,
        approvedBy: req.user?.email || 'coursemanager@maha.gov.in',
        rejectionReason: status === 'REJECTED' || status === 'DROPPED' ? (rejectionReason || 'Application rejected by Course Manager') : null
      },
      include: {
        batch: { include: { course: { include: { modules: true } } } },
        trainee: true
      }
    });

    // If approved, initialize module progress records
    if (status === 'ENROLLED' && enrollment.batch?.course?.modules?.length > 0) {
      for (const mod of enrollment.batch.course.modules) {
        await prisma.moduleProgress.upsert({
          where: {
            enrollmentId_moduleId: {
              enrollmentId: enrollment.id,
              moduleId: mod.id
            }
          },
          create: {
            enrollmentId: enrollment.id,
            moduleId: mod.id,
            status: 'NOT_STARTED'
          },
          update: {}
        });
      }
    }

    res.json({ message: `Enrollment status updated to ${status}`, enrollment });
  } catch (error) {
    console.error('updateEnrollmentStatus Error:', error);
    res.status(500).json({ error: 'Failed to update enrollment status' });
  }
});

export default router;
