import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

export const getCourses = async (req: AuthRequest, res: Response) => {
  try {
    const { programId, search } = req.query;
    
    const where: any = {};
    if (programId) where.programId = programId as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        program: true,
        modules: { orderBy: { order: 'asc' } },
        authorizations: { include: { provider: true } },
        _count: { select: { batches: true, modules: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ courses });
  } catch (error) {
    console.error('getCourses Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCourseById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        program: true,
        modules: { orderBy: { order: 'asc' } },
        batches: { include: { provider: true, trainer: true } },
        authorizations: { include: { provider: true } }
      }
    });

    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ course });
  } catch (error) {
    console.error('getCourseById Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, description, programId, skills, targetJobRoles, expectedDurationHours, attendanceRequirement, moduleRequirement, evidenceRequired } = req.body;

    if (!name || !programId) {
      return res.status(400).json({ error: 'Course name and program are required' });
    }

    const courseCode = code || `CRS-${Date.now().toString().slice(-4)}`;

    const course = await prisma.course.create({
      data: {
        name,
        code: courseCode,
        description,
        programId,
        skills: typeof skills === 'string' ? skills : JSON.stringify(skills || []),
        targetJobRoles: typeof targetJobRoles === 'string' ? targetJobRoles : JSON.stringify(targetJobRoles || []),
        expectedDurationHours: parseInt(expectedDurationHours) || 100,
        attendanceRequirement: parseFloat(attendanceRequirement) || 80.0,
        moduleRequirement: parseFloat(moduleRequirement) || 80.0,
        evidenceRequired: evidenceRequired !== false
      },
      include: { program: true }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || 'system',
        action: 'CREATE_COURSE',
        resource: 'Course',
        resourceId: course.id,
        metadata: JSON.stringify({ name: course.name, code: course.code })
      }
    });

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error('createCourse Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addModule = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string; // courseId
    const { name, order, description, requiredEvidence } = req.body;

    if (!name) return res.status(400).json({ error: 'Module name is required' });

    const module = await prisma.module.create({
      data: {
        courseId: id,
        name,
        order: parseInt(order) || 1,
        description,
        requiredEvidence: Boolean(requiredEvidence)
      }
    });

    res.status(201).json({ message: 'Module added successfully', module });
  } catch (error) {
    console.error('addModule Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
