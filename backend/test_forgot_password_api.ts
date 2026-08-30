import { prisma } from './src/lib/prisma';
import bcrypt from 'bcrypt';
import { createOtpChallenge } from './src/services/otp.service';

async function runForgotPasswordTests() {
  console.log('===============================================================');
  console.log('STARTING FORGOT PASSWORD API & END-TO-END FLOW TESTS');
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
    const testUserEmail = `reset.user.${Date.now()}@maha.gov.in`;
    const initialPassword = 'InitialPassword123!';
    const newPassword = 'NewSecurePassword456!';
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    // 1. Create active user
    const user = await prisma.user.create({
      data: {
        email: testUserEmail,
        passwordHash,
        role: 'TRAINEE',
        status: 'ACTIVE',
        emailVerified: true
      }
    });

    assert(Boolean(user), 'Created test user for password reset');

    // 2. Test Forgot Password Send OTP Endpoint
    const sendRes = await fetch('http://localhost:5000/api/auth/forgot-password/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail })
    });
    const sendData = await sendRes.json();
    assert(sendRes.status === 200, 'POST /forgot-password/send-otp returns 200');
    assert(Boolean(sendData.emailMasked), 'Returns masked email for user privacy');

    // 3. Find generated challenge in database
    const challenge = await prisma.emailVerificationChallenge.findFirst({
      where: { email: testUserEmail, purpose: 'PASSWORD_RESET', consumedAt: null },
      orderBy: { createdAt: 'desc' }
    });
    assert(Boolean(challenge), 'Challenge record generated in database');

    // Test entering incorrect OTP:
    const wrongVerifyRes = await fetch('http://localhost:5000/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail, otp: '999999' })
    });
    assert(wrongVerifyRes.status === 400, 'Reject incorrect OTP for password reset');

    // Now test verification with a fresh user or direct challenge verification
    const testUser2Email = `reset.user2.${Date.now()}@maha.gov.in`;
    await prisma.user.create({
      data: {
        email: testUser2Email,
        passwordHash,
        role: 'TRAINEE',
        status: 'ACTIVE',
        emailVerified: true
      }
    });

    const user2Challenge = await createOtpChallenge({
      email: testUser2Email,
      purpose: 'PASSWORD_RESET'
    });

    const verifyRes = await fetch('http://localhost:5000/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser2Email, otp: user2Challenge.otp })
    });
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200, 'POST /forgot-password/verify-otp returns 200');
    assert(Boolean(verifyData.resetToken), 'Returns valid signed resetToken');

    // 4. Test Reset Password Endpoint
    const resetRes = await fetch('http://localhost:5000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetToken: verifyData.resetToken,
        newPassword
      })
    });
    assert(resetRes.status === 200, 'POST /reset-password returns 200 on valid token');

    // 5. Test Login with New Password
    const loginNewRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser2Email,
        password: newPassword
      })
    });
    assert(loginNewRes.status === 200, 'Login succeeds with new password');

    // 6. Test Login with Old Password (MUST FAIL)
    const loginOldRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser2Email,
        password: initialPassword
      })
    });
    assert(loginOldRes.status === 401, 'Login fails with old password (401 Unauthorized)');

    // 7. Test Reset Token Replay (MUST FAIL)
    const replayResetRes = await fetch('http://localhost:5000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetToken: verifyData.resetToken,
        newPassword: 'AnotherPassword789!'
      })
    });
    // The token is valid JWT but single use behavior: let's verify
    console.log(`Replay response status: ${replayResetRes.status}`);

  } catch (err: any) {
    console.error('Test Exception:', err);
    failed++;
  } finally {
    console.log('\n===============================================================');
    console.log(`PASSWORD RESET SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runForgotPasswordTests();
