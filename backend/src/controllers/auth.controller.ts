import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { validateEmail, maskEmail } from '../services/validation.service';
import {
  createOtpChallenge,
  verifyOtpChallenge,
  generateAuthorizationToken,
  verifyAuthorizationToken
} from '../services/otp.service';
import {
  sendAccountVerificationEmail,
  sendPasswordResetOtpEmail,
  sendEmailChangeOtpEmail,
  sendLearnerApprovalEmail,
  sendLearnerRejectionEmail
} from '../services/email.service';

/**
 * Helper to record security audit entries
 */
async function createSecurityAuditLog(params: {
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId || null
      }
    });
  } catch (err: any) {
    console.error('[AuditLog] Failed to record security log:', err.message);
  }
}

/**
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        organization: true,
        trainee: true,
        trainer: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status === 'PENDING' || user.status === 'UNDER_REVIEW') {
      return res.status(403).json({
        error: 'Your account is pending Administrator review and approval. You will receive access once approved.',
        status: user.status
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        error: `Your registration application was rejected. Reason: ${user.rejectionReason || 'Document criteria not met.'}`,
        status: user.status
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Your account has been suspended by the Government Administrator.',
        status: user.status
      });
    }

    const secret = process.env.JWT_SECRET || 'maha_sih_production_secret_key';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        organizationId: user.organizationId,
        traineeId: user.traineeId,
        trainerId: user.trainerId
      },
      secret,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        organizationId: user.organizationId,
        organizationName: user.organization?.name,
        traineeId: user.traineeId,
        trainerId: user.trainerId,
        name: user.trainee ? `${user.trainee.firstName} ${user.trainee.lastName}` : user.trainer ? user.trainer.name : user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/auth/register/trainee
 */
export const registerTrainee = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      aadhaarNumber,
      apaarAbcId,
      educationLevel,
      highestQualification,
      category,
      socialCategory,
      skills,
      existingSkills,
      careerGoals,
      targetCareerGoal,
      verificationToken
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Aadhaar Number Validation (Exactly 12 digits, numeric only)
    const rawAadhaar = String(aadhaarNumber || '').replace(/\s+/g, '').replace(/-/g, '').trim();
    if (!rawAadhaar || !/^\d{12}$/.test(rawAadhaar)) {
      return res.status(400).json({ error: 'Aadhaar number must contain exactly 12 digits.' });
    }

    // 2. APAAR / ABC ID Validation (Exactly 12 digits, numeric only)
    const rawApaar = String(apaarAbcId || '').replace(/\s+/g, '').replace(/-/g, '').trim();
    if (!rawApaar || !/^\d{12}$/.test(rawApaar)) {
      return res.status(400).json({ error: 'APAAR / ABC ID must contain exactly 12 digits.' });
    }

    // 3. Email Verification Check
    let isEmailVerified = false;
    if (verificationToken) {
      const tokenResult = verifyAuthorizationToken(verificationToken, 'ACCOUNT_CREATION');
      if (tokenResult.valid && tokenResult.email === normalizedEmail) {
        isEmailVerified = true;
      }
    }

    // 4. Duplicate Checks (Email, Aadhaar, APAAR)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email address already exists' });
    }

    const existingAadhaar = await prisma.trainee.findFirst({
      where: { aadhaarNumber: rawAadhaar }
    });
    if (existingAadhaar) {
      return res.status(409).json({ error: 'A learner with this Aadhaar number is already registered.' });
    }

    const existingApaar = await prisma.trainee.findFirst({
      where: { apaarAbcId: rawApaar }
    });
    if (existingApaar) {
      return res.status(409).json({ error: 'A learner with this APAAR / ABC ID is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const canonicalId = `TR-${Date.now().toString().slice(-6)}`;

    const finalEducation = educationLevel || highestQualification || 'Graduate (B.Tech / B.Sc / B.Com)';
    const finalCategory = category || socialCategory || 'General / Open';
    const rawSkills = skills || existingSkills || '';
    const finalSkills = Array.isArray(rawSkills) ? rawSkills.join(', ') : rawSkills || 'Technical Skills';
    const finalGoals = careerGoals || targetCareerGoal || 'Skilled Employment';

    const trainee = await prisma.trainee.create({
      data: {
        canonicalId,
        firstName,
        lastName,
        dob: new Date('2000-01-01'),
        gender: 'Not Specified',
        phone: phone || null,
        aadhaarNumber: rawAadhaar,
        apaarAbcId: rawApaar,
        educationLevel: finalEducation,
        category: finalCategory,
        skills: finalSkills,
        careerGoals: finalGoals,
        consentStatus: true,
        consentDate: new Date()
      }
    });

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: 'TRAINEE',
        status: 'PENDING',
        emailVerified: isEmailVerified,
        emailVerifiedAt: isEmailVerified ? new Date() : null,
        traineeId: trainee.id
      }
    });

    await createSecurityAuditLog({
      actorId: user.id,
      action: 'TRAINEE_REGISTERED',
      resource: 'TRAINEE',
      resourceId: trainee.id,
      metadata: { emailVerified: isEmailVerified, educationLevel: finalEducation }
    });

    res.status(201).json({
      message: 'Learner registration submitted successfully. Application is pending Government Admin review.',
      userId: user.id,
      traineeId: trainee.id,
      status: user.status,
      emailVerified: isEmailVerified
    });
  } catch (error) {
    console.error('registerTrainee Error:', error);
    res.status(500).json({ error: 'Internal server error during trainee registration' });
  }
};

/**
 * POST /api/auth/register/employer
 */
export const registerEmployer = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      companyName,
      industry,
      contactPerson,
      phone,
      location,
      verificationToken
    } = req.body;

    if (!email || !password || !companyName) {
      return res.status(400).json({ error: 'Company name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let isEmailVerified = false;
    if (verificationToken) {
      const tokenResult = verifyAuthorizationToken(verificationToken, 'ACCOUNT_CREATION');
      if (tokenResult.valid && tokenResult.email === normalizedEmail) {
        isEmailVerified = true;
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email address already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const org = await prisma.organization.create({
      data: {
        name: companyName,
        type: 'EMPLOYER',
        status: 'PENDING'
      }
    });

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: 'EMPLOYER',
        status: 'PENDING',
        emailVerified: isEmailVerified,
        emailVerifiedAt: isEmailVerified ? new Date() : null,
        organizationId: org.id
      }
    });

    await createSecurityAuditLog({
      actorId: user.id,
      action: 'EMPLOYER_REGISTERED',
      resource: 'ORGANIZATION',
      resourceId: org.id,
      metadata: { emailVerified: isEmailVerified, companyName }
    });

    res.status(201).json({
      message: 'Employer registration submitted successfully. Your organization verification is pending Administrator approval.',
      userId: user.id,
      organizationId: org.id,
      status: user.status,
      emailVerified: isEmailVerified
    });
  } catch (error) {
    console.error('registerEmployer Error:', error);
    res.status(500).json({ error: 'Internal server error during employer registration' });
  }
};

/**
 * POST /api/auth/email/send-otp
 */
export const sendEmailOtp = async (req: Request, res: Response) => {
  try {
    const { email, purpose = 'ACCOUNT_CREATION' } = req.body;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Email Format & Disposable Domain Validation
    const validation = await validateEmail(normalizedEmail, false);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // 2. Create Challenge with Rate Limiting
    const challenge = await createOtpChallenge({
      email: normalizedEmail,
      purpose,
      ipAddress,
      userAgent
    });

    if (challenge.error) {
      await createSecurityAuditLog({
        actorId: normalizedEmail,
        action: 'EMAIL_OTP_RATE_LIMITED',
        resource: 'AUTH_CHALLENGE',
        metadata: { ipAddress, purpose }
      });
      return res.status(429).json({
        error: challenge.error,
        retryAfter: challenge.retryAfter || 60
      });
    }

    // 3. Dispatch Email via Resend
    let emailResult;
    if (purpose === 'ACCOUNT_CREATION') {
      emailResult = await sendAccountVerificationEmail(normalizedEmail, challenge.otp);
    } else {
      emailResult = await sendEmailChangeOtpEmail(normalizedEmail, challenge.otp);
    }

    if (!emailResult.success) {
      console.error(`[Auth] Resend failed for domain ${normalizedEmail.split('@')[1] || 'unknown'}:`, emailResult.error);
      
      if (emailResult.error?.toLowerCase().includes('suppressed')) {
        return res.status(400).json({
          error: 'This email address cannot currently receive verification messages. Please use another email address or contact support.'
        });
      }
      if (emailResult.error?.toLowerCase().includes('bounced') || emailResult.error?.toLowerCase().includes('invalid')) {
        return res.status(400).json({
          error: "We couldn't deliver the verification email. Please check your email address or try another email address."
        });
      }

      return res.status(500).json({
        error: 'Unable to send verification email at this time. Please check your email address or try again later.'
      });
    }

    // 4. Update challenge with Resend message ID
    if (emailResult.messageId) {
      await prisma.emailVerificationChallenge.update({
        where: { id: challenge.challengeId },
        data: {
          resendMessageId: emailResult.messageId,
          deliveryStatus: 'sent'
        }
      });
    }

    // 5. Log Audit Event
    await createSecurityAuditLog({
      actorId: normalizedEmail,
      action: 'EMAIL_OTP_SENT',
      resource: 'AUTH_CHALLENGE',
      resourceId: challenge.challengeId,
      metadata: { purpose, ipAddress, isMocked: emailResult.isMocked, messageId: emailResult.messageId }
    });

    return res.status(200).json({
      message: 'A 6-digit verification code has been sent to your email address.',
      emailMasked: maskEmail(normalizedEmail),
      cooldownSeconds: 60,
      expiresInMinutes: 10,
      challengeId: challenge.challengeId
    });
  } catch (error: any) {
    console.error('sendEmailOtp Error:', error);
    return res.status(500).json({ error: 'Internal server error processing email verification request' });
  }
};

/**
 * POST /api/auth/email/verify-otp
 */
export const verifyEmailOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp, purpose = 'ACCOUNT_CREATION' } = req.body;
    const ipAddress = req.ip || '127.0.0.1';

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await verifyOtpChallenge({
      email: normalizedEmail,
      otp,
      purpose
    });

    if (!result.success) {
      await createSecurityAuditLog({
        actorId: normalizedEmail,
        action: 'EMAIL_OTP_FAILED',
        resource: 'AUTH_CHALLENGE',
        metadata: { ipAddress, purpose, error: result.error }
      });
      return res.status(400).json({ error: result.error });
    }

    await createSecurityAuditLog({
      actorId: normalizedEmail,
      action: 'EMAIL_OTP_VERIFIED',
      resource: 'AUTH_CHALLENGE',
      metadata: { ipAddress, purpose }
    });

    return res.status(200).json({
      message: 'Email address verified successfully!',
      verified: true,
      email: normalizedEmail,
      verificationToken: result.verificationToken
    });
  } catch (error: any) {
    console.error('verifyEmailOtp Error:', error);
    return res.status(500).json({ error: 'Internal server error during verification' });
  }
};

/**
 * POST /api/auth/forgot-password/send-otp
 */
export const sendForgotPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const validation = await validateEmail(normalizedEmail, false);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const genericSuccessResponse = {
      message: 'If this email address is registered with an active account, a 6-digit password reset code has been sent.',
      emailMasked: maskEmail(normalizedEmail),
      cooldownSeconds: 60,
      expiresInMinutes: 10
    };

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || user.status === 'SUSPENDED') {
      return res.status(200).json(genericSuccessResponse);
    }

    const challenge = await createOtpChallenge({
      email: normalizedEmail,
      purpose: 'PASSWORD_RESET',
      userId: user.id,
      ipAddress,
      userAgent
    });

    if (challenge.error) {
      return res.status(429).json({
        error: challenge.error,
        retryAfter: challenge.retryAfter || 60
      });
    }

    const emailResult = await sendPasswordResetOtpEmail(normalizedEmail, challenge.otp);
    if (!emailResult.success) {
      console.error(`[Auth] Resend password reset failed for domain ${normalizedEmail.split('@')[1] || 'unknown'}:`, emailResult.error);
      
      if (emailResult.error?.toLowerCase().includes('suppressed')) {
        return res.status(400).json({
          error: 'This email address cannot currently receive verification messages. Please use another email address or contact support.'
        });
      }
      
      return res.status(500).json({
        error: 'Unable to send password reset email at this time. Please try again later.'
      });
    }

    if (emailResult.messageId) {
      await prisma.emailVerificationChallenge.update({
        where: { id: challenge.challengeId },
        data: {
          resendMessageId: emailResult.messageId,
          deliveryStatus: 'sent'
        }
      });
    }

    await createSecurityAuditLog({
      actorId: normalizedEmail,
      action: 'PASSWORD_RESET_REQUESTED',
      resource: 'AUTH_CHALLENGE',
      resourceId: challenge.challengeId,
      metadata: { ipAddress, isMocked: emailResult.isMocked, messageId: emailResult.messageId }
    });

    return res.status(200).json({
      ...genericSuccessResponse,
      challengeId: challenge.challengeId
    });
  } catch (error: any) {
    console.error('sendForgotPasswordOtp Error:', error);
    return res.status(500).json({ error: 'Internal server error processing password reset request' });
  }
};

/**
 * POST /api/auth/forgot-password/verify-otp
 */
export const verifyForgotPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const ipAddress = req.ip || '127.0.0.1';

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await verifyOtpChallenge({
      email: normalizedEmail,
      otp,
      purpose: 'PASSWORD_RESET'
    });

    if (!result.success) {
      await createSecurityAuditLog({
        actorId: normalizedEmail,
        action: 'PASSWORD_RESET_OTP_FAILED',
        resource: 'AUTH_CHALLENGE',
        metadata: { ipAddress, error: result.error }
      });
      return res.status(400).json({ error: result.error });
    }

    const resetToken = generateAuthorizationToken({
      email: normalizedEmail,
      purpose: 'PASSWORD_RESET',
      expiresInMinutes: 15
    });

    await createSecurityAuditLog({
      actorId: normalizedEmail,
      action: 'PASSWORD_RESET_VERIFIED',
      resource: 'AUTH_CHALLENGE',
      metadata: { ipAddress }
    });

    return res.status(200).json({
      message: 'Verification code confirmed. You may now reset your password.',
      verified: true,
      resetToken
    });
  } catch (error: any) {
    console.error('verifyForgotPasswordOtp Error:', error);
    return res.status(500).json({ error: 'Internal server error during password reset verification' });
  }
};

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body;
    const ipAddress = req.ip || '127.0.0.1';

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const tokenResult = verifyAuthorizationToken(resetToken, 'PASSWORD_RESET');
    if (!tokenResult.valid || !tokenResult.email) {
      return res.status(400).json({ error: tokenResult.error || 'Invalid or expired password reset session' });
    }

    const normalizedEmail = tokenResult.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: true
      }
    });

    await createSecurityAuditLog({
      actorId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      resource: 'USER',
      resourceId: user.id,
      metadata: { ipAddress }
    });

    return res.status(200).json({
      message: 'Your password has been successfully updated. You can now sign in with your new credentials.'
    });
  } catch (error: any) {
    console.error('resetPassword Error:', error);
    return res.status(500).json({ error: 'Internal server error updating password' });
  }
};

/**
 * POST /api/auth/email/webhook
 */
export const handleEmailWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;
    const eventType = event.type;
    const messageId = event.data?.email_id || event.data?.id;

    if (messageId && eventType) {
      let status = 'sent';
      if (eventType === 'email.delivered') status = 'delivered';
      else if (eventType === 'email.bounced') status = 'bounced';
      else if (eventType === 'email.complained') status = 'complained';
      else if (eventType === 'email.suppressed') status = 'suppressed';
      else if (eventType === 'email.delivery_delayed') status = 'delivery_delayed';

      await prisma.emailVerificationChallenge.updateMany({
        where: { resendMessageId: messageId },
        data: {
          deliveryStatus: status,
          deliveryError: event.data?.bounce?.message || event.data?.error || null
        }
      });

      console.log(`[Webhook] Resend event recorded: type=${eventType}, messageId=${messageId}, status=${status}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('[Webhook] Error handling email event:', err.message);
    return res.status(200).json({ received: true });
  }
};

/**
 * GET /api/auth/email/delivery-status
 */
export const getEmailDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { email, purpose, challengeId } = req.query;

    if (!email && !challengeId) {
      return res.status(400).json({ error: 'Email or challengeId query parameter is required' });
    }

    const challenge = await prisma.emailVerificationChallenge.findFirst({
      where: {
        ...(challengeId ? { id: String(challengeId) } : {}),
        ...(email ? { email: String(email).toLowerCase().trim() } : {}),
        ...(purpose ? { purpose: String(purpose) } : {})
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deliveryStatus: true,
        deliveryError: true,
        createdAt: true,
        expiresAt: true,
        consumedAt: true
      }
    });

    if (!challenge) {
      return res.status(404).json({ error: 'No verification challenge found' });
    }

    return res.json({
      status: challenge.deliveryStatus,
      error: challenge.deliveryError,
      isExpired: new Date() > challenge.expiresAt,
      isConsumed: challenge.consumedAt !== null
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unable to fetch delivery status' });
  }
};

/**
 * Administrative Workflows
 */
export const getPendingUsers = async (req: AuthRequest, res: Response) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
      include: {
        organization: true,
        trainee: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users: pendingUsers });
  } catch (error) {
    console.error('getPendingUsers Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, learnerId, id } = req.body;
    const targetId = userId || learnerId || id || req.params.id;
    if (!targetId) return res.status(400).json({ error: 'User or Learner ID is required' });

    // Look up user by user ID or traineeId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetId },
          { traineeId: targetId }
        ]
      },
      include: {
        trainee: true,
        organization: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Applicant record not found' });
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        approvedBy: req.user?.email || 'admin@maha.gov.in',
        rejectionReason: null
      },
      include: {
        trainee: true,
        organization: true
      }
    });

    if (user.organizationId) {
      await prisma.organization.update({
        where: { id: user.organizationId },
        data: { status: 'ACTIVE' }
      });
    }

    // Security & Compliance Audit Log
    await createSecurityAuditLog({
      actorId: req.user?.id || 'admin',
      action: 'LEARNER_APPLICATION_APPROVED',
      resource: user.role === 'TRAINEE' ? 'TRAINEE' : user.role,
      resourceId: user.traineeId || user.id,
      metadata: {
        userEmail: user.email,
        approvedBy: req.user?.email || 'admin@maha.gov.in',
        timestamp: new Date().toISOString()
      }
    });

    // Notify learner asynchronously
    if (user.email) {
      const learnerName = user.trainee ? `${user.trainee.firstName} ${user.trainee.lastName}` : user.email;
      sendLearnerApprovalEmail(user.email, learnerName).catch(err => {
        console.error('[Notification] Failed to send approval email:', err);
      });
    }

    res.json({ message: 'Application officially approved and activated successfully', user });
  } catch (error) {
    console.error('approveUser Error:', error);
    res.status(500).json({ error: 'Unable to approve this application. Please try again.' });
  }
};

export const rejectUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, learnerId, id, reason } = req.body;
    const targetId = userId || learnerId || id || req.params.id;
    if (!targetId) return res.status(400).json({ error: 'User or Learner ID is required' });

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Look up user by user ID or traineeId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetId },
          { traineeId: targetId }
        ]
      },
      include: {
        trainee: true,
        organization: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Applicant record not found' });
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.trim()
      },
      include: {
        trainee: true,
        organization: true
      }
    });

    if (user.organizationId) {
      await prisma.organization.update({
        where: { id: user.organizationId },
        data: { status: 'REJECTED' }
      });
    }

    // Security & Compliance Audit Log
    await createSecurityAuditLog({
      actorId: req.user?.id || 'admin',
      action: 'LEARNER_APPLICATION_REJECTED',
      resource: user.role === 'TRAINEE' ? 'TRAINEE' : user.role,
      resourceId: user.traineeId || user.id,
      metadata: {
        userEmail: user.email,
        rejectedBy: req.user?.email || 'admin@maha.gov.in',
        reason: reason.trim(),
        timestamp: new Date().toISOString()
      }
    });

    // Notify learner asynchronously
    if (user.email) {
      const learnerName = user.trainee ? `${user.trainee.firstName} ${user.trainee.lastName}` : user.email;
      sendLearnerRejectionEmail(user.email, learnerName, reason.trim()).catch(err => {
        console.error('[Notification] Failed to send rejection email:', err);
      });
    }

    res.json({ message: 'Application marked as rejected', user });
  } catch (error) {
    console.error('rejectUser Error:', error);
    res.status(500).json({ error: 'Unable to reject this application. Please try again.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organization: true,
        trainee: true,
        trainer: true
      }
    });

    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
        emailVerified: dbUser.emailVerified,
        organizationId: dbUser.organizationId,
        organizationName: dbUser.organization?.name,
        traineeId: dbUser.traineeId,
        trainerId: dbUser.trainerId,
        name: dbUser.trainee ? `${dbUser.trainee.firstName} ${dbUser.trainee.lastName}` : dbUser.trainer ? dbUser.trainer.name : dbUser.email
      }
    });
  } catch (error) {
    console.error('getMe Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
