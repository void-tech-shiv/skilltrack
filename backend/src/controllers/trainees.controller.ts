import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Helper to mask sensitive identity fields according to Role-Based Access Control
 */
function sanitizeTraineeData(trainee: any, role: string, isSelf: boolean) {
  if (!trainee) return trainee;
  const isGovernmentAdmin = role === 'GOVERNMENT_ADMIN';
  const isAuthorizedSelf = role === 'TRAINEE' && isSelf;

  if (isGovernmentAdmin || isAuthorizedSelf) {
    return trainee;
  }

  // Mask or redact Aadhaar and APAAR for other roles (Employer, Trainer, Training Provider, Course Manager)
  return {
    ...trainee,
    aadhaarNumber: trainee.aadhaarNumber ? `XXXX XXXX ${trainee.aadhaarNumber.slice(-4)}` : null,
    apaarAbcId: trainee.apaarAbcId ? `XXXX XXXX ${trainee.apaarAbcId.slice(-4)}` : null
  };
}

export const getTrainees = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10));
    const search = (req.query.search as string)?.trim();
    const status = (req.query.status as string)?.trim();
    const district = (req.query.district as string)?.trim();
    const providerId = (req.query.providerId as string)?.trim();
    
    // RBAC logic to scope data based on role
    const andConditions: any[] = [];

    if (user.role === 'TRAINING_PROVIDER') {
      andConditions.push({
        enrollments: {
          some: {
            batch: { providerId: user.organizationId }
          }
        }
      });
    } else if (user.role === 'TRAINER') {
      andConditions.push({
        enrollments: {
          some: {
            batch: { trainerId: user.trainerId }
          }
        }
      });
    } else if (user.role === 'TRAINEE') {
      andConditions.push({ id: user.traineeId });
    }

    if (providerId && user.role !== 'TRAINING_PROVIDER') {
      andConditions.push({
        enrollments: {
          some: {
            batch: { providerId }
          }
        }
      });
    }

    if (district && district !== 'All' && district !== 'All Districts') {
      andConditions.push({
        district: { equals: district, mode: 'insensitive' }
      });
    }

    if (status && status !== 'All' && status !== 'ALL') {
      andConditions.push({
        OR: [
          { outcomes: { some: { status: { equals: status, mode: 'insensitive' } } } },
          { enrollments: { some: { status: { equals: status, mode: 'insensitive' } } } }
        ]
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { canonicalId: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    const [total, trainees] = await Promise.all([
      prisma.trainee.count({ where: whereClause }),
      prisma.trainee.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, email: true, status: true, role: true, approvedAt: true, approvedBy: true, rejectionReason: true } },
          enrollments: { include: { batch: { include: { course: true, provider: true } } } },
          outcomes: { orderBy: { date: 'desc' }, take: 1 },
          certificates: { select: { certificateNumber: true, status: true } }
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const sanitizedTrainees = trainees.map(t =>
      sanitizeTraineeData(t, user.role, user.traineeId === t.id)
    );

    const totalPages = Math.ceil(total / pageSize) || 1;
    
    res.json({
      trainees: sanitizedTrainees,
      pagination: {
        total,
        page,
        pageSize,
        totalPages
      }
    });
  } catch (error) {
    console.error('getTrainees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTraineeById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    if (!id) {
      return res.status(400).json({ error: 'Trainee ID is required' });
    }
    
    let targetId = id;
    if (id === 'me') {
      if (user.role !== 'TRAINEE' || !user.traineeId) {
        return res.status(403).json({ error: 'Forbidden: Only trainees can use the "me" identifier' });
      }
      targetId = user.traineeId;
    }
    
    let whereClause: any = { id: targetId };
    
    if (user.role === 'TRAINING_PROVIDER') {
      whereClause = {
        id: targetId,
        enrollments: {
          some: {
            batch: { providerId: user.organizationId }
          }
        }
      };
    } else if (user.role === 'TRAINER') {
      whereClause = {
        id: targetId,
        enrollments: {
          some: {
            batch: { trainerId: user.trainerId }
          }
        }
      };
    } else if (user.role === 'TRAINEE') {
      if (user.traineeId !== targetId) {
        return res.status(403).json({ error: 'Forbidden: Cannot access other trainee records' });
      }
      whereClause = { id: user.traineeId };
    }
    
    const trainee = await prisma.trainee.findFirst({
      where: whereClause,
      include: {
        user: { select: { email: true, status: true, emailVerified: true } },
        enrollments: {
          include: {
            batch: {
              include: {
                course: { include: { modules: { orderBy: { order: 'asc' } } } },
                provider: true,
                trainer: true,
                sessions: { orderBy: { date: 'asc' } }
              }
            },
            moduleProgress: { include: { module: true } },
            evidenceSubmissions: { orderBy: { createdAt: 'desc' } },
            certificateApplications: { orderBy: { appliedDate: 'desc' } },
            certificates: true
          }
        },
        attendanceRecords: {
          include: { session: true },
          orderBy: { createdAt: 'desc' }
        },
        certificates: {
          include: { course: true },
          orderBy: { issueDate: 'desc' }
        },
        outcomes: { orderBy: { date: 'desc' } },
        verifications: { include: { organization: true }, orderBy: { createdAt: 'desc' } },
        followUps: { orderBy: { createdAt: 'desc' } },
        interventions: { orderBy: { createdAt: 'desc' } },
        consentLogs: { orderBy: { timestamp: 'desc' } }
      }
    });

    if (!trainee) return res.status(404).json({ error: 'Trainee not found or access denied' });

    const sanitized = sanitizeTraineeData(trainee, user.role, user.traineeId === trainee.id);
    res.json({ trainee: sanitized });
  } catch (error) {
    console.error('getTraineeById Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/trainees/:id/log-aadhaar-view
 * Audit logging when an authorized Government Admin unmasks the Aadhaar number
 */
export const logAadhaarView = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user || user.role !== 'GOVERNMENT_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only Government Administrators can audit Aadhaar views.' });
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'AADHAAR_VIEWED',
        resource: 'TRAINEE',
        resourceId: String(id)
      }
    });

    res.json({ success: true, message: 'Aadhaar view audit logged successfully.' });
  } catch (error) {
    console.error('logAadhaarView Error:', error);
    res.status(500).json({ error: 'Internal server error logging audit' });
  }
};
