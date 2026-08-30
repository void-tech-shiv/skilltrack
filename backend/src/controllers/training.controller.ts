import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

// 1. SESSIONS
export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { batchId } = req.query;
    const where: any = {};
    if (batchId) where.batchId = batchId as string;

    const sessions = await prisma.session.findMany({
      where,
      include: {
        batch: { include: { course: true, provider: true } },
        trainer: true,
        attendance: { include: { trainee: true } },
        _count: { select: { attendance: true } }
      },
      orderBy: { date: 'asc' }
    });

    res.json({ sessions });
  } catch (error) {
    console.error('getSessions Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const { batchId, date, startTime, endTime, mode, location, plannedHours, actualHours, topic } = req.body;
    if (!batchId || !date) {
      return res.status(400).json({ error: 'Batch ID and session date are required' });
    }

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const session = await prisma.session.create({
      data: {
        batchId,
        date: new Date(date),
        startTime,
        endTime,
        mode: mode || batch.trainingMode,
        location: location || batch.location,
        trainerId: batch.trainerId,
        plannedHours: parseFloat(plannedHours) || 2.0,
        actualHours: parseFloat(actualHours) || 2.0,
        topic
      }
    });

    res.status(201).json({ message: 'Session scheduled successfully', session });
  } catch (error) {
    console.error('createSession Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 2. ATTENDANCE MARKING
export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, records } = req.body; // records: Array<{ traineeId: string, status: string, trainingHours?: number, notes?: string }>

    if (!sessionId || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Session ID and attendance records array are required' });
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const updatedRecords = [];
    for (const record of records) {
      const hours = record.trainingHours !== undefined ? record.trainingHours : (record.status === 'PRESENT' ? session.actualHours : 0);
      const att = await prisma.attendance.upsert({
        where: {
          sessionId_traineeId: {
            sessionId,
            traineeId: record.traineeId
          }
        },
        create: {
          sessionId,
          traineeId: record.traineeId,
          status: record.status || 'PRESENT',
          trainingHours: hours,
          notes: record.notes,
          verifiedBy: req.user?.trainerId || null
        },
        update: {
          status: record.status,
          trainingHours: hours,
          notes: record.notes,
          verifiedBy: req.user?.trainerId || null
        }
      });
      updatedRecords.push(att);
    }

    res.json({ message: `Attendance marked for ${updatedRecords.length} trainees`, records: updatedRecords });
  } catch (error) {
    console.error('markAttendance Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 3. MODULE PROGRESS
export const updateModuleProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { enrollmentId, moduleId, status, evidenceUrl } = req.body;
    if (!enrollmentId || !moduleId || !status) {
      return res.status(400).json({ error: 'Enrollment ID, Module ID, and status are required' });
    }

    const progress = await prisma.moduleProgress.upsert({
      where: {
        enrollmentId_moduleId: { enrollmentId, moduleId }
      },
      create: {
        enrollmentId,
        moduleId,
        status,
        evidenceUrl,
        verifiedBy: status === 'VERIFIED' ? (req.user?.trainerId || null) : null,
        verifiedAt: status === 'VERIFIED' ? new Date() : null
      },
      update: {
        status,
        evidenceUrl: evidenceUrl !== undefined ? evidenceUrl : undefined,
        verifiedBy: status === 'VERIFIED' ? (req.user?.trainerId || null) : null,
        verifiedAt: status === 'VERIFIED' ? new Date() : null
      }
    });

    res.json({ message: 'Module progress updated successfully', progress });
  } catch (error) {
    console.error('updateModuleProgress Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 4. EVIDENCE SUBMISSION & REVIEW
export const submitEvidence = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { enrollmentId, title, fileUrl, fileType, description } = req.body;

    if (!enrollmentId || !title || !fileUrl) {
      return res.status(400).json({ error: 'Enrollment ID, evidence title, and file URL are required' });
    }

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    const submission = await prisma.evidenceSubmission.create({
      data: {
        enrollmentId,
        traineeId: enrollment.traineeId,
        title,
        fileUrl,
        fileType: fileType || 'PDF',
        description,
        status: 'PENDING'
      }
    });

    res.status(201).json({ message: 'Learning evidence submitted for Trainer verification', submission });
  } catch (error) {
    console.error('submitEvidence Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyEvidence = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string; // evidenceId
    const { status, notes } = req.body; // status: 'VERIFIED' | 'REJECTED'

    if (!status) return res.status(400).json({ error: 'Verification status is required' });

    const submission = await prisma.evidenceSubmission.update({
      where: { id },
      data: {
        status,
        verifiedBy: req.user?.trainerId || null,
        verificationNotes: notes || null,
        verifiedAt: new Date()
      }
    });

    res.json({ message: `Evidence submission ${status.toLowerCase()} successfully`, submission });
  } catch (error) {
    console.error('verifyEvidence Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 5. COMPLETION WORKFLOW
export const recommendCompletion = async (req: AuthRequest, res: Response) => {
  try {
    const { enrollmentId } = req.body;
    if (!enrollmentId) return res.status(400).json({ error: 'Enrollment ID is required' });

    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'COMPLETION_RECOMMENDED',
        completionRecommendedBy: req.user?.email || 'trainer@maha.gov.in',
        completionRecommendedAt: new Date()
      },
      include: { trainee: true, batch: { include: { course: true } } }
    });

    res.json({ message: 'Course completion recommended to Course Manager for final approval', enrollment });
  } catch (error) {
    console.error('recommendCompletion Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveCompletion = async (req: AuthRequest, res: Response) => {
  try {
    const { enrollmentId, action, reason } = req.body; // action: 'APPROVE' | 'REJECT'
    if (!enrollmentId) return res.status(400).json({ error: 'Enrollment ID is required' });

    const status = action === 'REJECT' ? 'IN_PROGRESS' : 'COMPLETED';

    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status,
        completedAt: action !== 'REJECT' ? new Date() : null,
        completedBy: action !== 'REJECT' ? (req.user?.email || 'coursemanager@maha.gov.in') : null,
        rejectionReason: action === 'REJECT' ? (reason || 'Further training required') : null
      },
      include: { trainee: true, batch: { include: { course: true } } }
    });

    res.json({ message: `Course completion ${action === 'REJECT' ? 'returned for revision' : 'approved successfully'}`, enrollment });
  } catch (error) {
    console.error('approveCompletion Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
