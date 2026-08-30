import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

export const getConsentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.traineeId) {
      return res.status(403).json({ error: 'Only trainees can view personal consent logs' });
    }

    const consentLogs = await prisma.consentLog.findMany({
      where: { traineeId: user.traineeId },
      orderBy: { timestamp: 'desc' }
    });

    const trainee = await prisma.trainee.findUnique({
      where: { id: user.traineeId },
      select: { consentStatus: true, consentDate: true }
    });

    res.json({
      consentStatus: trainee?.consentStatus || false,
      consentDate: trainee?.consentDate,
      logs: consentLogs
    });
  } catch (error) {
    console.error('getConsentHistory Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateConsent = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { granted, consentType, notes } = req.body;

    if (!user || !user.traineeId) {
      return res.status(403).json({ error: 'Only trainees can update consent settings' });
    }

    await prisma.trainee.update({
      where: { id: user.traineeId },
      data: {
        consentStatus: Boolean(granted),
        consentDate: new Date()
      }
    });

    const log = await prisma.consentLog.create({
      data: {
        traineeId: user.traineeId,
        consentType: consentType || 'LONGITUDINAL_OUTCOMES_TRACKING',
        granted: Boolean(granted),
        ipAddress: req.ip || '127.0.0.1',
        notes: notes || (granted ? 'Consent granted by trainee' : 'Consent revoked by trainee')
      }
    });

    res.json({ message: 'Consent preferences updated successfully', log });
  } catch (error) {
    console.error('updateConsent Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
