import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

export const getInterventions = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, traineeId } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (traineeId) where.traineeId = traineeId as string;

    const interventions = await prisma.intervention.findMany({
      where,
      include: {
        trainee: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ interventions });
  } catch (error) {
    console.error('getInterventions Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createIntervention = async (req: AuthRequest, res: Response) => {
  try {
    const { traineeId, actionType, priority, assignedTo, notes, dueDate } = req.body;

    if (!traineeId || !actionType) {
      return res.status(400).json({ error: 'Trainee ID and action type are required' });
    }

    const intervention = await prisma.intervention.create({
      data: {
        traineeId,
        actionType,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        assignedTo,
        notes,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: req.user?.email || 'admin@maha.gov.in'
      },
      include: { trainee: true }
    });

    res.status(201).json({ message: 'Remedial intervention created successfully', intervention });
  } catch (error) {
    console.error('createIntervention Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateIntervention = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, notes, assignedTo } = req.body;

    const updated = await prisma.intervention.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes || undefined,
        assignedTo: assignedTo || undefined,
        completedAt: status === 'RESOLVED' ? new Date() : undefined
      },
      include: { trainee: true }
    });

    res.json({ message: 'Intervention updated successfully', intervention: updated });
  } catch (error) {
    console.error('updateIntervention Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
