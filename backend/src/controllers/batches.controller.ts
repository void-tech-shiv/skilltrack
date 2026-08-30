import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

export const getBatches = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const where: any = {};

    if (user.role === 'TRAINING_PROVIDER') {
      where.providerId = user.organizationId;
    } else if (user.role === 'TRAINER') {
      where.trainerId = user.trainerId;
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        course: { include: { program: true } },
        provider: true,
        trainer: true,
        _count: { select: { enrollments: true, sessions: true } }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json({ batches });
  } catch (error) {
    console.error('getBatches Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBatchById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        course: { include: { program: true, modules: true } },
        provider: true,
        trainer: true,
        sessions: { orderBy: { date: 'asc' } },
        enrollments: {
          include: {
            trainee: true,
            moduleProgress: { include: { module: true } },
            evidenceSubmissions: true
          }
        }
      }
    });

    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json({ batch });
  } catch (error) {
    console.error('getBatchById Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { name, courseId, providerId, trainerId, capacity, trainingMode, location, schedule, startDate, endDate } = req.body;

    if (!name || !courseId || !providerId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Batch name, course, provider, start date, and end date are required' });
    }

    // MANDATORY REQUIREMENT: Verify that Provider is AUTHORIZED for this Course
    const authorization = await prisma.providerCourseAuthorization.findUnique({
      where: {
        providerId_courseId: { providerId, courseId }
      }
    });

    if (!authorization || authorization.status !== 'AUTHORIZED') {
      return res.status(400).json({
        error: 'Validation failed: The selected Training Provider is NOT authorized by Government Admin to deliver this course.'
      });
    }

    // If trainerId is supplied, verify trainer belongs to this Provider and is APPROVED
    if (trainerId) {
      const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } });
      if (!trainer || trainer.organizationId !== providerId || trainer.status !== 'APPROVED') {
        return res.status(400).json({
          error: 'Validation failed: Trainer must be an approved trainer affiliated with the selected Training Provider.'
        });
      }
    }

    const batch = await prisma.batch.create({
      data: {
        name,
        courseId,
        providerId,
        trainerId: trainerId || null,
        capacity: parseInt(capacity) || 30,
        trainingMode: trainingMode || 'OFFLINE',
        location,
        schedule,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'ACTIVE'
      },
      include: {
        course: true,
        provider: true,
        trainer: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || 'system',
        action: 'CREATE_BATCH',
        resource: 'Batch',
        resourceId: batch.id,
        metadata: JSON.stringify({ name: batch.name, course: batch.course.name, provider: batch.provider.name })
      }
    });

    res.status(201).json({ message: 'Batch created successfully', batch });
  } catch (error) {
    console.error('createBatch Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBatchRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, preferredDistrict, preferredMode } = req.query;

    const where: any = { status: 'ACTIVE' };
    if (courseId) where.courseId = courseId as string;

    const batches = await prisma.batch.findMany({
      where,
      include: {
        course: true,
        provider: true,
        trainer: true,
        _count: { select: { enrollments: true } }
      }
    });

    const recommendations = batches.map(b => {
      let matchScore = 70;
      const reasons: string[] = [];

      // Check capacity
      const availableSeats = b.capacity - b._count.enrollments;
      if (availableSeats > 0) {
        matchScore += 10;
        reasons.push(`${availableSeats} seats available`);
      } else {
        matchScore -= 20;
        reasons.push('Batch at capacity');
      }

      // Check mode match
      if (preferredMode && b.trainingMode.toLowerCase() === (preferredMode as string).toLowerCase()) {
        matchScore += 10;
        reasons.push(`Preferred mode (${b.trainingMode})`);
      }

      // Check location match
      if (preferredDistrict && b.location?.toLowerCase().includes((preferredDistrict as string).toLowerCase())) {
        matchScore += 10;
        reasons.push(`Located in ${preferredDistrict}`);
      }

      return {
        batch: b,
        matchScore: Math.min(99, Math.max(20, matchScore)),
        reasons
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json({ recommendations });
  } catch (error) {
    console.error('getBatchRecommendations Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requestEnrollment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { batchId } = req.body;

    if (!user || !user.traineeId) {
      return res.status(403).json({ error: 'Only registered trainees can request enrollment' });
    }

    if (!batchId) return res.status(400).json({ error: 'Batch ID is required' });

    // Check existing enrollment
    const existing = await prisma.enrollment.findFirst({
      where: { traineeId: user.traineeId, batchId }
    });

    if (existing) {
      return res.status(409).json({ error: 'You have already requested enrollment for this batch' });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        traineeId: user.traineeId,
        batchId,
        status: 'REQUESTED'
      },
      include: {
        batch: { include: { course: true, provider: true } }
      }
    });

    res.status(201).json({ message: 'Enrollment request submitted for Course Manager approval', enrollment });
  } catch (error) {
    console.error('requestEnrollment Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveEnrollment = async (req: AuthRequest, res: Response) => {
  try {
    const { enrollmentId, action, rejectionReason } = req.body; // action: 'APPROVED' | 'REJECTED'
    if (!enrollmentId) return res.status(400).json({ error: 'Enrollment ID is required' });

    const status = action === 'REJECTED' ? 'REJECTED' : 'ENROLLED';

    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status,
        approvedAt: action !== 'REJECTED' ? new Date() : null,
        approvedBy: req.user?.email || 'coursemanager@maha.gov.in',
        rejectionReason: action === 'REJECTED' ? (rejectionReason || 'Prerequisites not met') : null
      },
      include: {
        batch: { include: { course: { include: { modules: true } } } },
        trainee: true
      }
    });

    // If approved, initialize module progress records
    if (status === 'ENROLLED' && enrollment.batch.course.modules?.length > 0) {
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

    res.json({ message: `Enrollment ${status.toLowerCase()} successfully`, enrollment });
  } catch (error) {
    console.error('approveEnrollment Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
