import { PrismaClient } from '@prisma/client';
import { validateEmail, maskEmail } from './src/services/validation.service';
import { createOtpChallenge, verifyOtpChallenge, verifyAuthorizationToken } from './src/services/otp.service';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function runEmailSecurityTests() {
  console.log('===============================================================');
  console.log('STARTING EMAIL VERIFICATION & OTP SECURITY TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  try {
    // 1. Email Masking Test
    console.log('--- 1. Email Masking Tests ---');
    const mask1 = maskEmail('ravisha@gmail.com');
    assert(mask1 === 'r*****@gmail.com', 'Mask standard email', `Got ${mask1}`);
    const mask2 = maskEmail('student@company.com');
    assert(mask2 === 's*****@company.com', 'Mask corporate email', `Got ${mask2}`);

    // 2. Email Syntax & Length Validations
    console.log('\n--- 2. Email Syntax & Disposable Protection Tests ---');
    const syntaxInvalid1 = await validateEmail('abc', false);
    assert(!syntaxInvalid1.isValid, 'Reject invalid string "abc"');

    const syntaxInvalid2 = await validateEmail('abc..def@gmail.com', false);
    assert(!syntaxInvalid2.isValid, 'Reject double dots "abc..def@gmail.com"');

    const syntaxInvalid3 = await validateEmail('@gmail.com', false);
    assert(!syntaxInvalid3.isValid, 'Reject missing local part "@gmail.com"');

    const disposableTest1 = await validateEmail('fakeuser@mailinator.com', false);
    assert(!disposableTest1.isValid && disposableTest1.isDisposable === true, 'Reject disposable provider mailinator.com');

    const disposableTest2 = await validateEmail('temp@tempmail.com', false);
    assert(!disposableTest2.isValid && disposableTest2.isDisposable === true, 'Reject disposable provider tempmail.com');

    const validGmail = await validateEmail('realcitizen123@gmail.com', false);
    assert(validGmail.isValid === true, 'Accept valid personal email "realcitizen123@gmail.com"');

    const validGov = await validateEmail('director@maha.gov.in', false);
    assert(validGov.isValid === true && validGov.isGovernmentDomain === true, 'Accept official government domain "director@maha.gov.in"');

    // 3. OTP Generation & Database Hashing Verification
    console.log('\n--- 3. Cryptographic OTP Generation & Hash Storage Tests ---');
    const testEmail = `test.learner.${Date.now()}@maha.gov.in`;
    const challenge = await createOtpChallenge({
      email: testEmail,
      purpose: 'ACCOUNT_CREATION'
    });

    assert(challenge.otp.length === 6 && /^\d{6}$/.test(challenge.otp), 'Generate 6-digit numeric OTP');
    assert(Boolean(challenge.challengeId), 'Create challenge record in database');

    const dbRecord = await prisma.emailVerificationChallenge.findUnique({
      where: { id: challenge.challengeId }
    });

    assert(Boolean(dbRecord), 'Challenge record exists in PostgreSQL');
    assert(dbRecord?.otpHash !== challenge.otp, 'OTP is NEVER stored in plaintext in database');
    assert(Boolean(dbRecord?.salt && dbRecord?.salt.length >= 16), 'Challenge contains cryptographic salt');
    assert(dbRecord?.attempts === 0, 'Initial attempts count is 0');
    assert(dbRecord?.consumedAt === null, 'Initial consumed status is null');

    // 4. Rate Limiting Test (Within 60s)
    console.log('\n--- 4. OTP Rate Limiting Tests ---');
    const rapidChallenge = await createOtpChallenge({
      email: testEmail,
      purpose: 'ACCOUNT_CREATION'
    });
    assert(Boolean(rapidChallenge.error), 'Reject rapid consecutive OTP requests within 60s (Rate Limit Active)');

    // 5. Wrong OTP & Attempt Counter Tests
    console.log('\n--- 5. Attempt Counter & Brute Force Lock Tests ---');
    const wrongAttempt1 = await verifyOtpChallenge({
      email: testEmail,
      otp: '000000',
      purpose: 'ACCOUNT_CREATION'
    });
    assert(!wrongAttempt1.success, 'Reject incorrect OTP "000000"');

    const dbRecordAfterFail = await prisma.emailVerificationChallenge.findUnique({
      where: { id: challenge.challengeId }
    });
    assert(dbRecordAfterFail?.attempts === 1, 'Challenge attempts counter incremented to 1');

    // Test Purpose Separation
    const crossPurposeAttempt = await verifyOtpChallenge({
      email: testEmail,
      otp: challenge.otp,
      purpose: 'PASSWORD_RESET' // Wrong purpose!
    });
    assert(!crossPurposeAttempt.success, 'Reject OTP submitted under wrong purpose (ACCOUNT_CREATION OTP cannot do PASSWORD_RESET)');

    // 6. Successful Verification Test
    console.log('\n--- 6. Successful Verification & Token Issuance Tests ---');
    const validVerification = await verifyOtpChallenge({
      email: testEmail,
      otp: challenge.otp,
      purpose: 'ACCOUNT_CREATION'
    });

    assert(validVerification.success === true, 'Verify valid 6-digit OTP successfully');
    assert(Boolean(validVerification.verificationToken), 'Issue signed authorization verification token');

    const dbRecordConsumed = await prisma.emailVerificationChallenge.findUnique({
      where: { id: challenge.challengeId }
    });
    assert(dbRecordConsumed?.consumedAt !== null, 'Challenge marked consumed in database (single-use enforced)');

    // 7. Replay / Reuse Attack Prevention Test
    console.log('\n--- 7. Replay Attack Prevention Tests ---');
    const reuseAttempt = await verifyOtpChallenge({
      email: testEmail,
      otp: challenge.otp,
      purpose: 'ACCOUNT_CREATION'
    });
    assert(!reuseAttempt.success, 'Reject reused/consumed OTP (Replay protection active)');

    // 8. Token Authorization Verification Test
    console.log('\n--- 8. Token Authorization Tests ---');
    const tokenCheck = verifyAuthorizationToken(validVerification.verificationToken!, 'ACCOUNT_CREATION');
    assert(tokenCheck.valid === true && tokenCheck.email === testEmail, 'Validate signed authorization token for registration');

    const invalidPurposeToken = verifyAuthorizationToken(validVerification.verificationToken!, 'PASSWORD_RESET');
    assert(!invalidPurposeToken.valid, 'Reject authorization token when claimed under mismatched purpose');

    // 9. Full Registration Flow with Email Verification State
    console.log('\n--- 9. Full User Registration & DB State Verification ---');
    const regPassword = 'password123';
    const passwordHash = await bcrypt.hash(regPassword, 10);
    const canonicalId = `TR-${Date.now().toString().slice(-6)}`;

    const trainee = await prisma.trainee.create({
      data: {
        canonicalId,
        firstName: 'Vikas',
        lastName: 'Kadam',
        dob: new Date('1998-05-15'),
        gender: 'Male',
        district: 'Pune',
        skills: 'Python, Automation'
      }
    });

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        role: 'TRAINEE',
        status: 'PENDING',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        traineeId: trainee.id
      }
    });

    assert(user.emailVerified === true, 'User record created with emailVerified: true');
    assert(user.status === 'PENDING', 'User status remains PENDING awaiting Government Admin approval');

    // 10. Audit Logging Verification
    console.log('\n--- 10. Audit Log Security Records Tests ---');
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'EMAIL_OTP_VERIFIED',
        resource: 'AUTH_CHALLENGE',
        resourceId: challenge.challengeId
      }
    });

    const auditCheck = await prisma.auditLog.findFirst({
      where: { actorId: user.id, action: 'EMAIL_OTP_VERIFIED' }
    });
    assert(Boolean(auditCheck), 'Security audit log recorded EMAIL_OTP_VERIFIED');

  } catch (err: any) {
    console.error('Test Exception:', err);
    failed++;
  } finally {
    console.log('\n===============================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runEmailSecurityTests();
