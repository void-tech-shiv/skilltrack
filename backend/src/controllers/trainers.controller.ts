import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

export const getTrainers = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const where: any = {};
    if (user.role === 'TRAINING_PROVIDER') {
      where.organizationId = user.organizationId;
    } else if (user.role === 'TRAINER') {
      where.id = user.trainerId;
    }

    const trainers = await prisma.trainer.findMany({
      where,
      include: {
        organization: true,
        batches: { include: { course: true } },
        _count: { select: { batches: true, sessions: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ trainers });
  } catch (error) {
    console.error('getTrainers Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requestTrainerOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { name, email, phone, specialization, organizationId } = req.body;

    const targetOrgId = user?.role === 'TRAINING_PROVIDER' ? user.organizationId : organizationId;
    if (!targetOrgId || !name || !email) {
      return res.status(400).json({ error: 'Trainer name, email, and provider organization are required' });
    }

    const existingTrainer = await prisma.trainer.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingTrainer) {
      return res.status(409).json({ error: 'A trainer with this email already exists' });
    }

    const trainer = await prisma.trainer.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        phone,
        specialization,
        organizationId: targetOrgId,
        status: user?.role === 'GOVERNMENT_ADMIN' ? 'APPROVED' : 'PENDING'
      },
      include: { organization: true }
    });

    // Create User login for trainer
    const passwordHash = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'TRAINER',
        status: user?.role === 'GOVERNMENT_ADMIN' ? 'ACTIVE' : 'PENDING',
        organizationId: targetOrgId,
        trainerId: trainer.id
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || 'system',
        action: 'ONBOARD_TRAINER_REQUEST',
        resource: 'Trainer',
        resourceId: trainer.id,
        metadata: JSON.stringify({ name: trainer.name, provider: trainer.organization.name })
      }
    });

    res.status(201).json({ message: 'Trainer onboarding submitted successfully', trainer });
  } catch (error) {
    console.error('requestTrainerOnboarding Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveTrainer = async (req: AuthRequest, res: Response) => {
  try {
    const { trainerId, action } = req.body; // action: 'APPROVED' | 'REJECTED'
    if (!trainerId) return res.status(400).json({ error: 'Trainer ID is required' });

    const status = action === 'REJECTED' ? 'REJECTED' : 'APPROVED';

    const trainer = await prisma.trainer.update({
      where: { id: trainerId },
      data: { status }
    });

    await prisma.user.updateMany({
      where: { trainerId },
      data: { status: action === 'REJECTED' ? 'REJECTED' : 'ACTIVE' }
    });

    res.json({ message: `Trainer ${status.toLowerCase()} successfully`, trainer });
  } catch (error) {
    console.error('approveTrainer Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const reassignBatchTrainer = async (req: AuthRequest, res: Response) => {
  try {
    const { batchId, newTrainerId, reason } = req.body;
    if (!batchId || !newTrainerId) {
      return res.status(400).json({ error: 'Batch ID and New Trainer ID are required' });
    }

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const newTrainer = await prisma.trainer.findUnique({ where: { id: newTrainerId } });
    if (!newTrainer || newTrainer.organizationId !== batch.providerId || newTrainer.status !== 'APPROVED') {
      return res.status(400).json({ error: 'New trainer must be an approved trainer affiliated with the same provider' });
    }

    const oldTrainerId = batch.trainerId;

    const updatedBatch = await prisma.batch.update({
      where: { id: batchId },
      data: { trainerId: newTrainerId },
      include: { trainer: true }
    });

    // Log immutable historical reassignment
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || 'system',
        action: 'REASSIGN_BATCH_TRAINER',
        resource: 'Batch',
        resourceId: batchId,
        metadata: JSON.stringify({
          batchName: batch.name,
          previousTrainerId: oldTrainerId,
          newTrainerId: newTrainer.id,
          newTrainerName: newTrainer.name,
          reason: reason || 'Operational reassignment',
          effectiveDate: new Date()
        })
      }
    });

    res.json({ message: 'Trainer reassigned successfully with historical audit preserved', batch: updatedBatch });
  } catch (error) {
    console.error('reassignBatchTrainer Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
