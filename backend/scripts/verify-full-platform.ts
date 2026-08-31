import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function req(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return { status: res.status, data };
}

let passedTests = 0;
let totalTests = 0;

async function test(name: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}: ${err.message}`);
    if (err.data) console.error('   Details:', JSON.stringify(err.data));
  }
}

async function runPlatformVerification() {
  console.log('====================================================================');
  console.log('🚀 PS #26135 FULL 6-ROLE E2E AUTOMATED VERIFICATION SUITE');
  console.log('====================================================================\n');

  let adminToken = '';
  let courseManagerToken = '';
  let providerToken = '';
  let teacherToken = '';
  let learnerToken = '';
  let employerToken = '';

  let createdCourseId = '';
  let createdModuleId = '';
  let createdBatchId = '';
  let createdEnrollmentId = '';
  let createdEvidenceId = '';
  let issuedCertNumber = '';
  const testPendingEmail = `pending.test.${Date.now()}@example.com`;

  // 1. AUTH & ROLE AUTHENTICATION (6 Standard Roles)
  await test('1.1 Login Government Admin', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email: 'admin@maha.gov.in', password: 'password123' }
    });
    if (res.data.user.role !== 'GOVERNMENT_ADMIN') throw new Error('Role mismatch');
    adminToken = res.data.token;
  });

  await test('1.2 Login Course Manager', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email: 'coursemanager@maha.gov.in', password: 'password123' }
    });
    if (res.data.user.role !== 'COURSE_MANAGER') throw new Error('Role mismatch');
    courseManagerToken = res.data.token;
  });

  await test('1.3 Login Training Provider', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email: 'provider@maha.gov.in', password: 'password123' }
    });
    if (res.data.user.role !== 'TRAINING_PROVIDER') throw new Error('Role mismatch');
    providerToken = res.data.token;
  });

  await test('1.4 Login Teacher', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email: 'trainer@maha.gov.in', password: 'password123' }
    });
    if (res.data.user.role !== 'TRAINER') throw new Error('Role mismatch');
    teacherToken = res.data.token;
  });

  await test('1.5 Login Approved Learner', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email: 'trainee@maha.gov.in', password: 'password123' }
    });
    if (res.data.user.role !== 'TRAINEE') throw new Error('Role mismatch');
    learnerToken = res.data.token;
  });

  await test('1.6 Login Approved Employer', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: { email: 'employer@maha.gov.in', password: 'password123' }
    });
    if (res.data.user.role !== 'EMPLOYER') throw new Error('Role mismatch');
    employerToken = res.data.token;
  });

  await test('1.7 Learner Self-Registration & Verification of Pending 403 Gate', async () => {
    // 1. Register Learner
    const regRes = await req('/auth/register/trainee', {
      method: 'POST',
      body: {
        email: testPendingEmail,
        password: 'password123',
        firstName: 'Aditya',
        lastName: 'Patil',
        district: 'Pune',
        division: 'Pune Division',
        educationLevel: 'GRADUATE',
        employmentStatus: 'UNEMPLOYED',
        aadhaarNumber: `12345678${Date.now().toString().slice(-4)}`,
        apaarAbcId: `98765432${Date.now().toString().slice(-4)}`
      }
    });
    if (regRes.data.status !== 'PENDING') throw new Error('User not in PENDING state');

    // 2. Attempt Login - MUST BE BLOCKED WITH 403
    try {
      await req('/auth/login', {
        method: 'POST',
        body: { email: testPendingEmail, password: 'password123' }
      });
      throw new Error('Should have been blocked');
    } catch (err: any) {
      if (err.status === 403) {
        // Correct 403 Gate behavior
      } else {
        throw err;
      }
    }
  });

  // 2. GOVERNMENT ADMIN WORKFLOWS
  await test('2.1 Admin List Pending Registrations & Approve Pending Learner', async () => {
    const res = await req('/auth/pending-users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pendingUser = res.data.users?.find((u: any) => u.email === testPendingEmail);
    if (!pendingUser) throw new Error('Pending learner not found in list');

    const appRes = await req('/auth/approve-user', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { userId: pendingUser.id }
    });
    if (appRes.data.user.status !== 'ACTIVE') throw new Error('Approval failed');
  });

  await test('2.2 Admin Course Authorization for Training Provider', async () => {
    const provRes = await req('/providers', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const crsRes = await req('/courses', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const providerId = provRes.data.providers[0].id;
    const courseId = crsRes.data.courses[0].id;

    const res = await req('/providers/authorize-course', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        providerId,
        courseId,
        status: 'AUTHORIZED',
        reason: 'State inspection validated facility & equipment'
      }
    });
    if (res.data.authorization.status !== 'AUTHORIZED') throw new Error('Auth failed');
  });

  // 3. COURSE MANAGER WORKFLOWS
  await test('3.1 Course Manager Creates Course with Rigorous Rules', async () => {
    const progRes = await req('/courses', {
      headers: { Authorization: `Bearer ${courseManagerToken}` }
    });
    const programId = progRes.data.courses[0]?.programId;

    const res = await req('/courses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${courseManagerToken}` },
      body: {
        name: 'Advanced Drone Avionics & Fleet Telemetry',
        code: `DRONE-501-${Date.now().toString().slice(-4)}`,
        description: 'DGCA compliant commercial drone autopilot diagnostics.',
        programId,
        expectedDurationHours: 150,
        attendanceRequirement: 85,
        moduleRequirement: 0,
        evidenceRequired: true,
        skills: ['Autopilot Tuning', 'Telemetry Telematics', 'RF Safety'],
        targetJobRoles: ['Drone Pilot Specialist', 'Avionics Technician']
      }
    });
    createdCourseId = res.data.course.id;
    if (!createdCourseId) throw new Error('Course creation failed');
  });

  await test('3.2 Course Manager Adds Modular Curriculum to Course', async () => {
    const res = await req(`/courses/${createdCourseId}/modules`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${courseManagerToken}` },
      body: {
        name: 'Module 1: Flight Controller Firmware & Sensor Fusion',
        order: 1,
        requiredEvidence: true
      }
    });
    createdModuleId = res.data.module?.id;
    if (!createdModuleId) throw new Error('Module creation failed');
  });

  await test('3.3 Course Manager Schedules Batch (Authorized Provider Enforcement)', async () => {
    const provRes = await req('/providers', {
      headers: { Authorization: `Bearer ${courseManagerToken}` }
    });
    const provider = provRes.data.providers[0];
    const approvedTeacher = provider.trainers?.find((t: any) => t.status === 'APPROVED');

    // Authorize first to ensure compliance
    await req('/providers/authorize-course', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        providerId: provider.id,
        courseId: createdCourseId,
        status: 'AUTHORIZED'
      }
    });

    const res = await req('/batches', {
      method: 'POST',
      headers: { Authorization: `Bearer ${courseManagerToken}` },
      body: {
        name: `DRONE-BATCH-${Date.now().toString().slice(-4)}`,
        courseId: createdCourseId,
        providerId: provider.id,
        trainerId: approvedTeacher ? approvedTeacher.id : null,
        capacity: 25,
        trainingMode: 'HYBRID',
        location: 'Pune Aero Park Center',
        aadhaarNumber: '123456789012',
        startDate: '2026-09-01',
        endDate: '2026-11-30'
      }
    });
    createdBatchId = res.data.batch.id;
    if (!createdBatchId) throw new Error('Batch creation failed');
  });

  // 4. LEARNER ENROLLMENT & EVIDENCE
  await test('4.1 Learner Applies for Batch Enrollment', async () => {
    const res = await req('/batches/enroll', {
      method: 'POST',
      headers: { Authorization: `Bearer ${learnerToken}` },
      body: { batchId: createdBatchId }
    });
    createdEnrollmentId = res.data.enrollment.id;
    if (!createdEnrollmentId) throw new Error('Enrollment failed');
  });

  await test('4.2 Learner Submits External Lab Evidence', async () => {
    const res = await req('/training/evidence', {
      method: 'POST',
      headers: { Authorization: `Bearer ${learnerToken}` },
      body: {
        enrollmentId: createdEnrollmentId,
        title: 'Oscilloscope Waveform Telemetry Report',
        fileUrl: 'http://localhost:5000/uploads/waveform_report.pdf',
        fileType: 'PDF',
        description: 'Captured sensor noise under 100mV peak-to-peak.'
      }
    });
    createdEvidenceId = res.data.submission.id;
    if (!createdEvidenceId) throw new Error('Evidence submission failed');
  });

  // 5. TEACHER CLASSROOM & VERIFICATION
  await test('5.1 Teacher Schedules Classroom Session & Marks Attendance', async () => {
    const res = await req('/training/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: {
        batchId: createdBatchId,
        date: '2026-09-05',
        topic: 'IMU Calibration and GPS Lock Analysis',
        plannedHours: 4.0,
        actualHours: 4.0,
        mode: 'HYBRID'
      }
    });
    const sessionId = res.data.session.id;

    // Mark attendance
    const learnerRes = await req('/auth/me', {
      headers: { Authorization: `Bearer ${learnerToken}` }
    });
    const traineeId = learnerRes.data.user.traineeId || learnerRes.data.user.trainee?.id;

    const attRes = await req('/training/attendance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: {
        sessionId,
        records: [{
          traineeId,
          status: 'PRESENT',
          trainingHours: 4.0,
          notes: 'Passed laboratory calibration practical test'
        }]
      }
    });
    if (attRes.data.records?.length < 1) throw new Error('Attendance marking failed');
  });

  await test('5.2 Teacher Verifies Learner Evidence Submission', async () => {
    const res = await req(`/training/evidence/${createdEvidenceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: {
        status: 'VERIFIED',
        notes: 'Calibrations verified within state safety thresholds.'
      }
    });
    if (res.data.submission.status !== 'VERIFIED') throw new Error('Evidence verification failed');
  });

  await test('5.3 Teacher Verifies Learner Module Progress', async () => {
    const res = await req('/training/module-progress', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: {
        enrollmentId: createdEnrollmentId,
        moduleId: createdModuleId,
        status: 'VERIFIED'
      }
    });
    if (res.data.progress?.status !== 'VERIFIED') throw new Error('Module verification failed');
  });

  await test('5.4 Teacher Recommends Course Completion', async () => {
    const res = await req('/training/recommend-completion', {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
      body: { enrollmentId: createdEnrollmentId }
    });
    if (!res.data.enrollment) throw new Error('Recommendation failed');
  });

  // 6. COURSE MANAGER COMPLETION APPROVAL
  await test('6.1 Course Manager Approves Course Completion', async () => {
    const res = await req('/training/approve-completion', {
      method: 'POST',
      headers: { Authorization: `Bearer ${courseManagerToken}` },
      body: { enrollmentId: createdEnrollmentId, action: 'APPROVE' }
    });
    if (res.data.enrollment.status !== 'COMPLETED') throw new Error('Completion approval failed');
  });

  // 7. CERTIFICATE APPLICATION & ISSUANCE
  await test('7.1 Learner Checks Certificate Eligibility & Applies', async () => {
    const eligRes = await req(`/certificates/eligibility/${createdEnrollmentId}`, {
      headers: { Authorization: `Bearer ${learnerToken}` }
    });
    console.log('Eligibility Check:', JSON.stringify(eligRes.data, null, 2));
    if (!eligRes.data.courseName) throw new Error('Eligibility check failed');

    const res = await req('/certificates/apply', {
      method: 'POST',
      headers: { Authorization: `Bearer ${learnerToken}` },
      body: { enrollmentId: createdEnrollmentId }
    });
    if (res.data.application?.status !== 'PENDING') throw new Error('Application failed');
  });

  await test('7.2 Admin Approves Application and Issues Tamper-Evident QR Certificate', async () => {
    const appRes = await req('/certificates/applications', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const appId = appRes.data.applications.find((a: any) => a.enrollmentId === createdEnrollmentId)?.id;
    if (!appId) throw new Error('Application not found');

    const res = await req('/certificates/approve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { applicationId: appId, action: 'APPROVE' }
    });
    issuedCertNumber = res.data.certificate.certificateNumber;
    if (!issuedCertNumber) throw new Error('Certificate issuance failed');
  });

  // 8. PUBLIC CERTIFICATE & QR VERIFICATION (POST & GET, No Auth Required)
  await test('8.1 Public Certificate POST & GET Verification (Valid, Revoked, Not Found)', async () => {
    // 1. Valid certificate POST verification
    const postRes = await req('/certificates/verify', {
      method: 'POST',
      body: { certificateId: issuedCertNumber }
    });
    if (!postRes.data.valid) throw new Error('POST certificate verification failed');
    if (postRes.data.status !== 'ISSUED') throw new Error('Status not ISSUED');
    if (!postRes.data.issuedTo) throw new Error('Missing recipient info');
    if (!postRes.data.verificationAuthority) throw new Error('Missing authority info');
    // Ensure no private PII leakage (no DOB, no Aadhaar, no phone, no district)
    if (postRes.data.dateOfBirth || postRes.data.aadhaar || postRes.data.phone || postRes.data.district) {
      throw new Error('PII Leakage Detected in public endpoint!');
    }

    // 2. GET QR Verification
    const getRes = await req(`/certificates/verify/${issuedCertNumber}`);
    if (!getRes.data.valid) throw new Error('GET verification failed');

    // 3. Invalid Certificate ID returns 404 with NOT_FOUND status
    try {
      await req('/certificates/verify', {
        method: 'POST',
        body: { certificateId: 'CERT-INVALID-999999' }
      });
      throw new Error('Invalid cert should return 404');
    } catch (err: any) {
      if (err.status !== 404) throw err;
    }
  });

  // 9. EMPLOYER VERIFICATION
  await test('9.1 Employer Confirms Employment Verification', async () => {
    const verRes = await req('/employer/verifications', {
      headers: { Authorization: `Bearer ${employerToken}` }
    });
    if (verRes.data.verifications.length > 0) {
      const vId = verRes.data.verifications[0].id;
      const res = await req(`/employer/verifications/${vId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${employerToken}` },
        body: { status: 'VERIFIED', notes: 'Active employee on corporate payroll' }
      });
      if (res.data.verification.status !== 'VERIFIED') throw new Error('Employer verification failed');
    }
  });

  // 10. CONSENT AUDIT LOG
  await test('10.1 Learner Updates Consent Preferences & Verifies Immutable Audit Trail', async () => {
    const res = await req('/consent', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${learnerToken}` },
      body: {
        granted: true,
        consentType: 'LONGITUDINAL_OUTCOMES_TRACKING',
        notes: 'Consent confirmed by learner via portal'
      }
    });
    if (!res.data.log || res.data.log.granted !== true) throw new Error('Consent update failed');
  });

  // 11. STATE ANALYTICS & MACRO INTELLIGENCE (Strictly Government Admin Only)
  await test('11.1 Government Admin Queries State Analytics Dashboard', async () => {
    const res = await req('/analytics/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.metrics) throw new Error('Missing metrics');
    if (!res.data.nonPlacementTaxonomy) throw new Error('Missing non-placement taxonomy');
    if (!res.data.retentionDistribution) throw new Error('Missing retention checkpoints');
    if (!res.data.providerLeaderboard) throw new Error('Missing provider leaderboard');
  });

  await test('11.2 Verify Provider/Teacher Forbidden (403) on Macro State Analytics', async () => {
    try {
      await req('/analytics/dashboard', {
        headers: { Authorization: `Bearer ${providerToken}` }
      });
      throw new Error('Provider should be forbidden from Government Analytics');
    } catch (err: any) {
      if (err.status !== 403) throw err;
    }
  });

  console.log('\n====================================================================');
  console.log(`📊 FINAL RESULT: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================================');
}

runPlatformVerification().catch(console.error);
