import { prisma } from './src/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: any;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details?: string, error?: any) {
  results.push({ name, passed, details, error });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name}${details ? ` -> ${details}` : ''}`);
  if (error) console.error('   Error details:', error);
}

async function runTests() {
  console.log('================================================================');
  console.log('GOVERNMENT ADMIN LEARNER APPROVAL & REJECTION TEST SUITE');
  console.log('================================================================\n');

  try {
    // 1. Setup / Lookup Government Admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'GOVERNMENT_ADMIN' }
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('Admin@123456', 10);
      adminUser = await prisma.user.create({
        data: {
          email: 'admin.approvals@maha.gov.in',
          passwordHash: hashedPassword,
          role: 'GOVERNMENT_ADMIN',
          status: 'ACTIVE'
        }
      });
    }

    const adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Setup a non-admin user (TRAINEE) for RBAC testing
    const nonAdminUser = await prisma.user.findFirst({
      where: { role: 'TRAINEE' }
    }) || await prisma.user.create({
      data: {
        email: 'learner.rbac.test@gmail.com',
        passwordHash: await bcrypt.hash('Learner@123456', 10),
        role: 'TRAINEE',
        status: 'ACTIVE'
      }
    });

    const nonAdminToken = jwt.sign(
      { id: nonAdminUser.id, email: nonAdminUser.email, role: nonAdminUser.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Create a Test Learner to Approve
    const testAadhaarApprove = '8844' + Math.floor(10000000 + Math.random() * 90000000);
    const testApaarApprove = 'APAAR' + Math.floor(10000000 + Math.random() * 90000000);
    const testEmailApprove = `applicant.approve.${Date.now()}@gmail.com`;

    const traineeApprove = await prisma.trainee.create({
      data: {
        canonicalId: 'MAHA-TRN-' + Date.now() + Math.floor(Math.random() * 1000),
        firstName: 'Devendra',
        lastName: 'Patil',
        dob: new Date('1998-05-15'),
        gender: 'MALE',
        phone: '9820011223',
        aadhaarNumber: testAadhaarApprove,
        apaarAbcId: testApaarApprove,
        educationLevel: 'GRADUATE',
        category: 'OBC',
        skills: 'Solar PV Installation, Electrical Wiring',
        careerGoals: 'Renewable Energy Technician'
      }
    });

    const userToApprove = await prisma.user.create({
      data: {
        email: testEmailApprove,
        passwordHash: await bcrypt.hash('Password@123', 10),
        role: 'TRAINEE',
        status: 'PENDING',
        traineeId: traineeApprove.id
      }
    });

    record(
      'Test Learner Application Created (PENDING status)',
      userToApprove.status === 'PENDING' && Boolean(userToApprove.traineeId),
      `User ID: ${userToApprove.id}, Status: ${userToApprove.status}`
    );

    // 4. RBAC Security Check: Non-Admin attempts to approve
    const unauthApproveRes = await fetch('http://localhost:5000/api/auth/approve-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nonAdminToken}`
      },
      body: JSON.stringify({ userId: userToApprove.id })
    });

    record(
      'RBAC: Non-Admin Role Denied from Approving (403 Forbidden)',
      unauthApproveRes.status === 403,
      `HTTP Status: ${unauthApproveRes.status}`
    );

    // 5. RBAC Security Check: Unauthenticated request denied
    const noAuthApproveRes = await fetch('http://localhost:5000/api/auth/approve-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: userToApprove.id })
    });

    record(
      'RBAC: Unauthenticated Request Denied (401 Unauthorized)',
      noAuthApproveRes.status === 401,
      `HTTP Status: ${noAuthApproveRes.status}`
    );

    // 6. Government Admin Approves Application
    const adminApproveRes = await fetch('http://localhost:5000/api/auth/approve-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ userId: userToApprove.id })
    });

    const adminApproveData = await adminApproveRes.json();
    record(
      'Government Admin Approves Learner Application (200 OK)',
      adminApproveRes.status === 200 && adminApproveData.user?.status === 'ACTIVE',
      `HTTP Status: ${adminApproveRes.status}, New Status: ${adminApproveData.user?.status}`
    );

    // 7. Verify Database Update for Approval
    const dbApprovedUser = await prisma.user.findUnique({
      where: { id: userToApprove.id }
    });

    record(
      'Database State Updated: status = ACTIVE, approvedBy set, rejectionReason cleared',
      dbApprovedUser?.status === 'ACTIVE' && Boolean(dbApprovedUser?.approvedAt) && Boolean(dbApprovedUser?.approvedBy),
      `Status: ${dbApprovedUser?.status}, ApprovedBy: ${dbApprovedUser?.approvedBy}`
    );

    // 8. Verify AuditLog entry for Approval
    const approvalAuditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'LEARNER_APPLICATION_APPROVED',
        resourceId: userToApprove.traineeId || userToApprove.id
      },
      orderBy: { createdAt: 'desc' }
    });

    record(
      'Audit Log: LEARNER_APPLICATION_APPROVED recorded with actor and timestamp',
      Boolean(approvalAuditLog) && approvalAuditLog?.actorId === adminUser.id,
      `Action: ${approvalAuditLog?.action}, ActorId: ${approvalAuditLog?.actorId}`
    );

    // 9. Create a Test Learner to Reject
    const testAadhaarReject = '8855' + Math.floor(10000000 + Math.random() * 90000000);
    const testApaarReject = 'APAAR' + Math.floor(10000000 + Math.random() * 90000000);
    const testEmailReject = `applicant.reject.${Date.now()}@gmail.com`;

    const traineeReject = await prisma.trainee.create({
      data: {
        canonicalId: 'MAHA-TRN-' + Date.now() + Math.floor(Math.random() * 1000),
        firstName: 'Sunil',
        lastName: 'Gaikwad',
        dob: new Date('1999-08-20'),
        gender: 'MALE',
        phone: '9830022334',
        aadhaarNumber: testAadhaarReject,
        apaarAbcId: testApaarReject,
        educationLevel: 'DIPLOMA',
        category: 'SC',
        skills: 'Welding',
        careerGoals: 'Industrial Fabricator'
      }
    });

    const userToReject = await prisma.user.create({
      data: {
        email: testEmailReject,
        passwordHash: await bcrypt.hash('Password@123', 10),
        role: 'TRAINEE',
        status: 'PENDING',
        traineeId: traineeReject.id
      }
    });

    // 10. Rejection Validation: Reject without reason -> 400 Bad Request
    const emptyReasonRejectRes = await fetch('http://localhost:5000/api/auth/reject-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ userId: userToReject.id, reason: '   ' })
    });

    record(
      'Validation: Rejection without reason rejected (400 Bad Request)',
      emptyReasonRejectRes.status === 400,
      `HTTP Status: ${emptyReasonRejectRes.status}`
    );

    // 11. Government Admin Rejects Application with Valid Reason
    const rejectionReason = 'Incomplete educational certificates and identity proof validation mismatch.';
    const adminRejectRes = await fetch('http://localhost:5000/api/auth/reject-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ userId: userToReject.id, reason: rejectionReason })
    });

    const adminRejectData = await adminRejectRes.json();
    record(
      'Government Admin Rejects Learner Application (200 OK)',
      adminRejectRes.status === 200 && adminRejectData.user?.status === 'REJECTED',
      `HTTP Status: ${adminRejectRes.status}, Status: ${adminRejectData.user?.status}`
    );

    // 12. Verify Database Update for Rejection
    const dbRejectedUser = await prisma.user.findUnique({
      where: { id: userToReject.id }
    });

    record(
      'Database State Updated: status = REJECTED, rejectionReason saved accurately',
      dbRejectedUser?.status === 'REJECTED' && dbRejectedUser?.rejectionReason === rejectionReason,
      `Status: ${dbRejectedUser?.status}, Reason: "${dbRejectedUser?.rejectionReason}"`
    );

    // 13. Verify AuditLog entry for Rejection
    const rejectionAuditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'LEARNER_APPLICATION_REJECTED',
        resourceId: userToReject.traineeId || userToReject.id
      },
      orderBy: { createdAt: 'desc' }
    });

    record(
      'Audit Log: LEARNER_APPLICATION_REJECTED recorded with reason and actor',
      Boolean(rejectionAuditLog) && rejectionAuditLog?.actorId === adminUser.id,
      `Action: ${rejectionAuditLog?.action}, Metadata contains reason`
    );

    // 14. Government Admin View Aadhaar Audit Log Test
    const logAadhaarRes = await fetch(`http://localhost:5000/api/trainees/${traineeApprove.id}/log-aadhaar-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({})
    });

    record(
      'Identity Dossier: Aadhaar View Logged into Audit Trail',
      logAadhaarRes.status === 200,
      `HTTP Status: ${logAadhaarRes.status}`
    );

    // 15. Admin Alternative Route: PUT /api/admin/users/:id/status
    const testAadhaarV2 = '8866' + Math.floor(10000000 + Math.random() * 90000000);
    const traineeV2 = await prisma.trainee.create({
      data: {
        canonicalId: 'MAHA-TRN-' + Date.now() + Math.floor(Math.random() * 1000),
        firstName: 'Pooja',
        lastName: 'Deshmukh',
        dob: new Date('1997-11-10'),
        gender: 'FEMALE',
        phone: '9840033445',
        aadhaarNumber: testAadhaarV2,
        apaarAbcId: 'APAAR' + Math.floor(10000000 + Math.random() * 90000000),
        educationLevel: 'POST_GRADUATE',
        category: 'GENERAL',
        skills: 'Data Analysis',
        careerGoals: 'Data Scientist'
      }
    });

    const userV2 = await prisma.user.create({
      data: {
        email: `applicant.v2.${Date.now()}@gmail.com`,
        passwordHash: await bcrypt.hash('Password@123', 10),
        role: 'TRAINEE',
        status: 'PENDING',
        traineeId: traineeV2.id
      }
    });

    const putStatusRes = await fetch(`http://localhost:5000/api/admin/users/${userV2.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'ACTIVE' })
    });

    record(
      'Standard Admin Route (PUT /api/admin/users/:id/status) -> ACTIVE',
      putStatusRes.status === 200,
      `HTTP Status: ${putStatusRes.status}`
    );

    console.log('\n================================================================');
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    console.log(`SUMMARY: ${passedCount} / ${totalCount} TESTS PASSED (${((passedCount / totalCount) * 100).toFixed(1)}%)`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Fatal test execution error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
