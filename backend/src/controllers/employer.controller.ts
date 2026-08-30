import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

export const getVerifications = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    // Only EMPLOYER can access this for now
    if (user.role !== 'EMPLOYER') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const verifications = await prisma.verification.findMany({
      where: {
        organizationId: user.organizationId
      },
      include: {
        trainee: {
          select: {
            id: true,
            canonicalId: true,
            firstName: true,
            lastName: true,
            district: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ verifications });
  } catch (error) {
    console.error('getVerifications Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVerification = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id as string;
    const { status, evidenceNotes, notes } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Verification ID is required' });
    }

    if (user.role !== 'EMPLOYER') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const verification = await prisma.verification.findUnique({ where: { id } });

    if (!verification || verification.organizationId !== user.organizationId) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    const finalNotes = evidenceNotes || notes || 'Verified by employer';

    const updated = await prisma.verification.update({
      where: { id },
      data: {
        status,
        evidenceNotes: finalNotes,
        verifiedBy: user.id
      }
    });

    // Also update outcome status logic could go here if needed, but keeping it simple for MVP

    res.json({ verification: updated });
  } catch (error) {
    console.error('updateVerification Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
