import { Request, Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

export const calculateEligibility = async (enrollmentId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      trainee: true,
      batch: {
        include: {
          course: { include: { modules: true } }
        }
      },
      moduleProgress: true,
      evidenceSubmissions: true
    }
  });

  if (!enrollment) return null;

  const course = enrollment.batch.course;

  // 1. Calculate Attendance Percentage
  const totalSessions = await prisma.session.count({ where: { batchId: enrollment.batchId } });
  const attendedSessions = await prisma.attendance.count({
    where: {
      session: { batchId: enrollment.batchId },
      traineeId: enrollment.traineeId,
      status: { in: ['PRESENT', 'LATE'] }
    }
  });

  const attendancePercent = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 100;
  const attendanceEligible = attendancePercent >= course.attendanceRequirement;

  // 2. Calculate Module Completion Percentage
  const totalModules = course.modules.length;
  const completedModules = await prisma.moduleProgress.count({
    where: {
      enrollmentId: enrollment.id,
      status: 'VERIFIED'
    }
  });

  const modulePercent = totalModules > 0 ? (completedModules / totalModules) * 100 : 100;
  const moduleEligible = modulePercent >= course.moduleRequirement;

  // 3. Evidence Requirement
  const evidenceRequired = course.evidenceRequired;
  const verifiedEvidenceCount = await prisma.evidenceSubmission.count({
    where: {
      enrollmentId: enrollment.id,
      status: 'VERIFIED'
    }
  });
  const evidenceEligible = !evidenceRequired || verifiedEvidenceCount > 0;

  const isEligible = attendanceEligible && moduleEligible && evidenceEligible && enrollment.status === 'COMPLETED';

  return {
    enrollment,
    course,
    isEligible,
    criteria: {
      attendancePercent: parseFloat(attendancePercent.toFixed(1)),
      attendanceRequired: course.attendanceRequirement,
      attendanceEligible,
      modulePercent: parseFloat(modulePercent.toFixed(1)),
      moduleRequired: course.moduleRequirement,
      moduleEligible,
      evidenceRequired,
      verifiedEvidenceCount,
      evidenceEligible,
      isCourseCompleted: enrollment.status === 'COMPLETED'
    }
  };
};

export const checkEligibility = async (req: AuthRequest, res: Response) => {
  try {
    const enrollmentId = req.params.enrollmentId as string;
    if (!enrollmentId) return res.status(400).json({ error: 'Enrollment ID is required' });

    const eligibility = await calculateEligibility(enrollmentId);
    if (!eligibility) return res.status(404).json({ error: 'Enrollment not found' });

    res.json({
      enrollmentId,
      courseName: eligibility.course.name,
      courseCode: eligibility.course.code,
      isEligible: eligibility.isEligible,
      criteria: eligibility.criteria
    });
  } catch (error) {
    console.error('checkEligibility Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const applyForCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { enrollmentId } = req.body;
    if (!enrollmentId) return res.status(400).json({ error: 'Enrollment ID is required' });

    const eligibility = await calculateEligibility(enrollmentId);
    if (!eligibility) return res.status(404).json({ error: 'Enrollment not found' });

    if (!eligibility.isEligible) {
      return res.status(403).json({ error: 'Enrollment is not eligible for a certificate. Please ensure all completion criteria are met and approved by the Course Manager.' });
    }

    // Check existing application
    const existing = await prisma.certificateApplication.findFirst({
      where: { enrollmentId }
    });

    if (existing && existing.status !== 'REJECTED') {
      return res.status(409).json({ error: 'A certificate application is already active for this enrollment' });
    }

    const app = await prisma.certificateApplication.create({
      data: {
        enrollmentId,
        traineeId: eligibility.enrollment.traineeId,
        status: 'PENDING',
        attendancePercent: eligibility.criteria.attendancePercent,
        modulePercent: eligibility.criteria.modulePercent,
        evidenceVerified: eligibility.criteria.evidenceEligible
      },
      include: {
        trainee: true,
        enrollment: { include: { batch: { include: { course: true } } } }
      }
    });

    res.status(201).json({ message: 'Certificate application submitted for Government Admin approval', application: app });
  } catch (error) {
    console.error('applyForCertificate Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCertificateApplications = async (req: AuthRequest, res: Response) => {
  try {
    const apps = await prisma.certificateApplication.findMany({
      include: {
        trainee: true,
        enrollment: {
          include: {
            batch: { include: { course: true, provider: true } }
          }
        }
      },
      orderBy: { appliedDate: 'desc' }
    });

    res.json({ applications: apps });
  } catch (error) {
    console.error('getCertificateApplications Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getIssuedCertificates = async (req: AuthRequest, res: Response) => {
  try {
    const certificates = await prisma.certificate.findMany({
      include: {
        trainee: true,
        course: true,
      },
      orderBy: { issueDate: 'desc' }
    });
    res.json({ certificates });
  } catch (error) {
    console.error('getIssuedCertificates Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId, action, reason } = req.body; // action: 'APPROVE' | 'REJECT'
    if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

    const app = await prisma.certificateApplication.findUnique({
      where: { id: applicationId },
      include: {
        trainee: true,
        enrollment: { include: { batch: { include: { course: true } } } }
      }
    });

    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (action === 'REJECT') {
      const updated = await prisma.certificateApplication.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          decisionReason: reason || 'Prerequisites incomplete',
          decisionBy: req.user?.email || 'admin@maha.gov.in',
          decidedAt: new Date()
        }
      });
      return res.json({ message: 'Certificate application rejected', application: updated });
    }

    // Issue Certificate
    const certNumber = `CERT-MH-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const verificationUrl = `http://localhost:5174/verify-certificate/${certNumber}`;

    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber: certNumber,
        traineeId: app.traineeId,
        courseId: app.enrollment.batch.courseId,
        enrollmentId: app.enrollmentId,
        issueDate: new Date(),
        status: 'ISSUED',
        qrCodeData: verificationUrl,
        verificationUrl,
        approvedBy: req.user?.email || 'admin@maha.gov.in'
      },
      include: {
        trainee: true,
        course: true
      }
    });

    await prisma.certificateApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
        decisionReason: 'Verified government skilling criteria met',
        decisionBy: req.user?.email || 'admin@maha.gov.in',
        decidedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || 'admin',
        action: 'ISSUE_CERTIFICATE',
        resource: 'Certificate',
        resourceId: certificate.id,
        metadata: JSON.stringify({ certNumber: certificate.certificateNumber, trainee: `${app.trainee.firstName} ${app.trainee.lastName}`, course: app.enrollment.batch.course.name })
      }
    });

    res.status(201).json({ message: 'Certificate approved and issued successfully', certificate });
  } catch (error) {
    console.error('approveCertificate Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const revokeCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { certificateId, reason } = req.body;
    if (!certificateId || !reason) {
      return res.status(400).json({ error: 'Certificate ID and revocation reason are required' });
    }

    const certificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: 'REVOKED',
        revokedBy: req.user?.email || 'admin@maha.gov.in',
        revokedReason: reason,
        revokedAt: new Date()
      },
      include: { trainee: true, course: true }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id || 'admin',
        action: 'REVOKE_CERTIFICATE',
        resource: 'Certificate',
        resourceId: certificate.id,
        metadata: JSON.stringify({ certNumber: certificate.certificateNumber, reason, revokedBy: req.user?.email })
      }
    });

    res.json({ message: 'Certificate revoked successfully', certificate });
  } catch (error) {
    console.error('revokeCertificate Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUBLIC QR & ID CERTIFICATE VERIFICATION ENDPOINT
export const verifyCertificatePublic = async (req: Request, res: Response) => {
  try {
    const certNumber = (req.body?.certificateId || req.body?.certNumber || req.params?.certNumber || req.query?.certNumber)?.toString().trim();
    if (!certNumber) {
      return res.status(400).json({ valid: false, status: 'ERROR', message: 'Certificate ID is required for verification' });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { certificateNumber: certNumber },
      include: {
        trainee: true,
        course: {
          include: {
            program: true
          }
        },
        enrollment: {
          include: {
            batch: {
              include: {
                provider: true
              }
            }
          }
        }
      }
    });

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        status: 'NOT_FOUND',
        message: 'The certificate ID you entered could not be verified against the Maharashtra State Certificate Registry.'
      });
    }

    if (certificate.status === 'REVOKED') {
      return res.json({
        valid: false,
        status: 'REVOKED',
        certificateNumber: certificate.certificateNumber,
        issuedTo: `${certificate.trainee.firstName} ${certificate.trainee.lastName}`,
        courseName: certificate.course.name,
        courseCode: certificate.course.code,
        programName: certificate.course.program?.name || 'State Skilling Mission',
        trainingProvider: certificate.enrollment?.batch?.provider?.name || 'Accredited Center',
        issueDate: certificate.issueDate,
        revokedAt: certificate.revokedAt,
        revokedReason: certificate.revokedReason || 'Revoked by Issuing Authority',
        message: 'This certificate was previously issued but has been revoked by the issuing authority.',
        verificationAuthority: 'Maharashtra State Innovation Society (MSInS), Government of Maharashtra'
      });
    }

    if (certificate.status !== 'ISSUED') {
      return res.json({
        valid: false,
        status: certificate.status || 'PENDING',
        certificateNumber: certificate.certificateNumber,
        message: 'Certificate not yet issued.',
        verificationAuthority: 'Maharashtra State Innovation Society (MSInS), Government of Maharashtra'
      });
    }

    // Official Issued Valid Certificate (Masking private PII like Aadhaar, Phone, District, DB IDs)
    res.json({
      valid: true,
      status: 'ISSUED',
      certificateNumber: certificate.certificateNumber,
      issuedTo: `${certificate.trainee.firstName} ${certificate.trainee.lastName}`,
      courseName: certificate.course.name,
      courseCode: certificate.course.code,
      programName: certificate.course.program?.name || 'Maharashtra State Skilling Initiative',
      trainingProvider: certificate.enrollment?.batch?.provider?.name || 'Accredited Training Provider',
      completionDate: certificate.enrollment?.completedAt || certificate.issueDate,
      issueDate: certificate.issueDate,
      verificationAuthority: 'Maharashtra State Innovation Society (MSInS), Government of Maharashtra'
    });
  } catch (error) {
    console.error('verifyCertificatePublic Error:', error);
    res.status(500).json({ valid: false, status: 'ERROR', error: 'Internal server error' });
  }
};

