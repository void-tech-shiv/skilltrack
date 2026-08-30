import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

export const getFollowUps = async (req: AuthRequest, res: Response) => {
  try {
    const { traineeId, type } = req.query;
    const where: any = {};
    if (traineeId) where.traineeId = traineeId as string;
    if (type) where.type = type as string;

    const followUps = await prisma.followUp.findMany({
      where,
      include: { trainee: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ followUps });
  } catch (error) {
    console.error('getFollowUps Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createFollowUp = async (req: AuthRequest, res: Response) => {
  try {
    const { traineeId, type, status, responses, notes } = req.body;

    if (!traineeId || !type) {
      return res.status(400).json({ error: 'Trainee ID and follow-up type (e.g. 3_MONTH, 6_MONTH) are required' });
    }

    const followUp = await prisma.followUp.create({
      data: {
        traineeId,
        type,
        status: status || 'COMPLETED',
        responses: typeof responses === 'string' ? responses : JSON.stringify(responses || {}),
        loggedBy: req.user?.email || 'admin@maha.gov.in',
        notes
      },
      include: { trainee: true }
    });

    res.status(201).json({ message: 'Follow-up survey logged successfully', followUp });
  } catch (error) {
    console.error('createFollowUp Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
