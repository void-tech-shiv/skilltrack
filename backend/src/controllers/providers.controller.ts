import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

export const getProviders = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const where: any = { type: 'TRAINING_PROVIDER' };

    // If Training Provider, only see own profile
    if (user.role === 'TRAINING_PROVIDER') {
      where.id = user.organizationId;
    }

    const providers = await prisma.organization.findMany({
      where,
      include: {
        trainers: true,
        authorizations: { include: { course: true } },
        batches: { include: { course: true, _count: { select: { enrollments: true } } } },
        _count: { select: { batches: true, trainers: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ providers });
  } catch (error) {
    console.error('getProviders Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProvider = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Provider organization name and primary contact email are required' });
    }

    const org = await prisma.organization.create({
      data: {
        name,
        type: 'TRAINING_PROVIDER',
        status: 'ACTIVE'
      }
    });

    // Create user login for provider if password provided
    if (password) {
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          role: 'TRAINING_PROVIDER',
          status: 'ACTIVE',
          organizationId: org.id
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || 'system',
        action: 'CREATE_TRAINING_PROVIDER',
        resource: 'Organization',
        resourceId: org.id,
        metadata: JSON.stringify({ name: org.name })
      }
    });

    res.status(201).json({ message: 'Training Provider created successfully', provider: org });
  } catch (error) {
    console.error('createProvider Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const authorizeProviderCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { providerId, courseId, reason, status } = req.body;

    if (!providerId || !courseId) {
      return res.status(400).json({ error: 'Provider ID and Course ID are required' });
    }

    const authRecord = await prisma.providerCourseAuthorization.upsert({
      where: {
        providerId_courseId: { providerId, courseId }
      },
      create: {
        providerId,
        courseId,
        status: status || 'AUTHORIZED',
        authorizedBy: req.user?.email || 'admin@maha.gov.in',
        reason: reason || 'Government Accreditation Verified'
      },
      update: {
        status: status || 'AUTHORIZED',
        authorizedBy: req.user?.email || 'admin@maha.gov.in',
        reason: reason || 'Government Accreditation Updated'
      },
      include: {
        provider: true,
        course: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || 'system',
        action: 'AUTHORIZE_PROVIDER_COURSE',
        resource: 'ProviderCourseAuthorization',
        resourceId: authRecord.id,
        metadata: JSON.stringify({ provider: authRecord.provider.name, course: authRecord.course.name, status: authRecord.status })
      }
    });

    res.json({ message: 'Provider course authorization updated successfully', authorization: authRecord });
  } catch (error) {
    console.error('authorizeProviderCourse Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
