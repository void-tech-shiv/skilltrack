import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'maha_sih_production_secret_key';
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const HOURLY_MAX_REQUESTS = 10;

export interface GenerateOtpResult {
  otp: string;
  challengeId: string;
  expiresAt: DateTime;
  cooldownSeconds: number;
}

type DateTime = Date;

/**
 * Creates a salted SHA-256 HMAC hash of the 6-digit OTP
 */
export function hashOtp(otp: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

/**
 * Generates a cryptographically secure 6-digit OTP and persists a challenge record
 */
export async function createOtpChallenge(params: {
  email: string;
  purpose: 'ACCOUNT_CREATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ otp: string; challengeId: string; error?: string; retryAfter?: number }> {
  const { email, purpose, userId, ipAddress, userAgent } = params;
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check Rate Limits (Cooldown: 1 per 60s)
  const recentChallenge = await prisma.emailVerificationChallenge.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000) }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (recentChallenge) {
    const elapsedSeconds = Math.floor((Date.now() - recentChallenge.createdAt.getTime()) / 1000);
    const retryAfter = Math.max(1, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
    return {
      otp: '',
      challengeId: '',
      error: `Please wait ${retryAfter} seconds before requesting a new verification code.`,
      retryAfter
    };
  }

  // 2. Check Hourly Rate Limit (Max 10 per hour)
  const hourlyCount = await prisma.emailVerificationChallenge.count({
    where: {
      email: normalizedEmail,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
    }
  });

  if (hourlyCount >= HOURLY_MAX_REQUESTS) {
    return {
      otp: '',
      challengeId: '',
      error: 'Too many verification code requests for this email address. Please try again in an hour.'
    };
  }

  // 3. Generate Cryptographically Secure 6-digit OTP (100000 - 999999)
  const otp = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHash = hashOtp(otp, salt);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 4. Persist Challenge (Invalidate any previous active unconsumed challenges for this email & purpose)
  await prisma.emailVerificationChallenge.updateMany({
    where: {
      email: normalizedEmail,
      purpose,
      consumedAt: null
    },
    data: {
      consumedAt: new Date() // Invalidate old outstanding challenges
    }
  });

  const challenge = await prisma.emailVerificationChallenge.create({
    data: {
      email: normalizedEmail,
      purpose,
      userId,
      otpHash,
      salt,
      expiresAt,
      maxAttempts: MAX_ATTEMPTS,
      ipAddress,
      userAgent
    }
  });

  return {
    otp,
    challengeId: challenge.id
  };
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
  verificationToken?: string;
  email?: string;
  purpose?: string;
}

/**
 * Validates the submitted OTP against the active challenge and issues a short-lived authorization token
 */
export async function verifyOtpChallenge(params: {
  email: string;
  otp: string;
  purpose: 'ACCOUNT_CREATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE';
}): Promise<VerifyOtpResult> {
  const { email, otp, purpose } = params;
  const normalizedEmail = email.toLowerCase().trim();
  const cleanedOtp = otp.trim();

  if (!cleanedOtp || cleanedOtp.length !== 6 || !/^\d{6}$/.test(cleanedOtp)) {
    return { success: false, error: 'Please enter a valid 6-digit numeric verification code.' };
  }

  // Find the latest active challenge for this email and purpose
  const challenge = await prisma.emailVerificationChallenge.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      consumedAt: null
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!challenge) {
    return {
      success: false,
      error: 'No active verification request found for this email. Please request a new code.'
    };
  }

  // Check Expiry (10 minutes)
  if (new Date() > challenge.expiresAt) {
    await prisma.emailVerificationChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() }
    });
    return {
      success: false,
      error: 'Verification code has expired. Please request a new code.'
    };
  }

  // Check Max Attempts (5 attempts)
  if (challenge.attempts >= challenge.maxAttempts) {
    await prisma.emailVerificationChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() }
    });
    return {
      success: false,
      error: 'Too many incorrect attempts. This verification code has been invalidated. Please request a new code.'
    };
  }

  // Compare Hashes using constant-time comparison
  const candidateHash = hashOtp(cleanedOtp, challenge.salt);
  const storedHashBuf = Buffer.from(challenge.otpHash, 'hex');
  const candidateHashBuf = Buffer.from(candidateHash, 'hex');

  const isMatch = storedHashBuf.length === candidateHashBuf.length &&
    crypto.timingSafeEqual(storedHashBuf, candidateHashBuf);

  if (!isMatch) {
    const updated = await prisma.emailVerificationChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } }
    });

    const remaining = Math.max(0, updated.maxAttempts - updated.attempts);
    if (remaining === 0) {
      await prisma.emailVerificationChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() }
      });
      return {
        success: false,
        error: 'Too many incorrect attempts. This code is now invalidated. Please request a new code.'
      };
    }

    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
    };
  }

  // Successful Verification: Generate short-lived signed authorization token (15-minute validity)
  const verificationToken = jwt.sign(
    {
      email: normalizedEmail,
      purpose,
      challengeId: challenge.id,
      verifiedAt: Date.now()
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Mark challenge consumed
  await prisma.emailVerificationChallenge.update({
    where: { id: challenge.id },
    data: {
      consumedAt: new Date(),
      verifiedToken: verificationToken
    }
  });

  return {
    success: true,
    verificationToken,
    email: normalizedEmail,
    purpose
  };
}

/**
 * Generates a signed authorization token (e.g. for password reset session)
 */
export function generateAuthorizationToken(params: {
  email: string;
  purpose: string;
  expiresInMinutes?: number;
}): string {
  const { email, purpose, expiresInMinutes = 15 } = params;
  return jwt.sign(
    {
      email: email.toLowerCase().trim(),
      purpose,
      verifiedAt: Date.now()
    },
    JWT_SECRET,
    { expiresIn: `${expiresInMinutes}m` }
  );
}

/**
 * Validates a signed verification token (for completing registration or password reset)
 */
export function verifyAuthorizationToken(token: string, expectedPurpose: string): { valid: boolean; email?: string; error?: string } {
  if (!token) return { valid: false, error: 'Verification token missing. Please verify your email first.' };

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.purpose !== expectedPurpose) {
      return { valid: false, error: 'Invalid verification token purpose.' };
    }
    return { valid: true, email: decoded.email };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Email verification session has expired. Please verify your email again.' };
    }
    return { valid: false, error: 'Invalid verification token.' };
  }
}

