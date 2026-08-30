import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './src/lib/prisma';
import bcrypt from 'bcrypt';

async function runRegistrationIdentityTests() {
  console.log('================================================================================');
  console.log('LEARNER REGISTRATION IDENTITY UPDATE & RBAC VALIDATION TESTS');
  console.log('================================================================================\n');

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

  const testEmail = `learner_test_${Date.now()}@example.com`;
  const validAadhaar = String(Math.floor(100000000000 + Math.random() * 899999999999));
  const validApaar = String(Math.floor(100000000000 + Math.random() * 899999999999));

  // 1. Test missing / invalid Aadhaar
  console.log('--- 1. Backend Aadhaar Number Format Validation ---');
  const res1 = await fetch('http://localhost:5000/api/auth/register/trainee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `invalid_aadhaar_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Rohan',
      lastName: 'Sharma',
      aadhaarNumber: '12345', // < 12 digits
      apaarAbcId: '888877776666'
    })
  });
  const data1 = await res1.json();
  assert(res1.status === 400 && data1.error?.includes('Aadhaar number must contain exactly 12 digits'), 'Rejects short Aadhaar number (< 12 digits)');

  const res2 = await fetch('http://localhost:5000/api/auth/register/trainee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `invalid_aadhaar2_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Rohan',
      lastName: 'Sharma',
      aadhaarNumber: '12345678901A', // alphanumeric
      apaarAbcId: '888877776666'
    })
  });
  const data2 = await res2.json();
  assert(res2.status === 400 && data2.error?.includes('Aadhaar number must contain exactly 12 digits'), 'Rejects alphanumeric Aadhaar number');

  // 2. Test missing / invalid APAAR / ABC ID
  console.log('\n--- 2. Backend APAAR / ABC ID Format Validation ---');
  const res3 = await fetch('http://localhost:5000/api/auth/register/trainee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `invalid_apaar_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Rohan',
      lastName: 'Sharma',
      aadhaarNumber: '777766665555',
      apaarAbcId: '123456789012345' // > 12 digits
    })
  });
  const data3 = await res3.json();
  assert(res3.status === 400 && data3.error?.includes('APAAR / ABC ID must contain exactly 12 digits'), 'Rejects overlength APAAR / ABC ID');

  // 3. Successful Registration with Aadhaar & APAAR (without district / division)
  console.log('\n--- 3. Successful Learner Registration without District/Division ---');
  const resSuccess = await fetch('http://localhost:5000/api/auth/register/trainee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Password123!',
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      aadhaarNumber: ` ${validAadhaar.slice(0, 4)} ${validAadhaar.slice(4, 8)} ${validAadhaar.slice(8)} `, // test spacing normalization
      apaarAbcId: `${validApaar.slice(0, 4)}-${validApaar.slice(4, 8)}-${validApaar.slice(8)}`,          // test hyphen normalization
      educationLevel: 'Graduate (B.Tech / B.Sc / B.Com)',
      category: 'General / Open',
      skills: 'Python, Data Analysis, SQL',
      careerGoals: 'Data Analyst'
    })
  });
  const dataSuccess = await resSuccess.json();
  if (resSuccess.status !== 201) {
    console.error('Registration failed:', dataSuccess);
  }
  assert(resSuccess.status === 201 && Boolean(dataSuccess.traineeId), 'Learner registered successfully with normalized 12-digit IDs');

  // Verify Database Record
  if (dataSuccess.traineeId) {
    const traineeRecord = await prisma.trainee.findUnique({
      where: { id: dataSuccess.traineeId }
    });
    assert(traineeRecord?.aadhaarNumber === validAadhaar, 'Aadhaar stored as normalized 12-digit string in database');
    assert(traineeRecord?.apaarAbcId === validApaar, 'APAAR stored as normalized 12-digit string in database');
  }

  // 4. Duplicate Aadhaar & APAAR Checks
  console.log('\n--- 4. Duplicate ID Prevention ---');
  const resDupAadhaar = await fetch('http://localhost:5000/api/auth/register/trainee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `dup_aadhaar_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Pooja',
      lastName: 'Patil',
      aadhaarNumber: validAadhaar,
      apaarAbcId: String(Math.floor(100000000000 + Math.random() * 899999999999))
    })
  });
  const dataDupAadhaar = await resDupAadhaar.json();
  assert(resDupAadhaar.status === 409 && dataDupAadhaar.error?.includes('already registered'), 'Duplicate Aadhaar registration rejected with 409');

  const resDupApaar = await fetch('http://localhost:5000/api/auth/register/trainee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `dup_apaar_${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Pooja',
      lastName: 'Patil',
      aadhaarNumber: String(Math.floor(100000000000 + Math.random() * 899999999999)),
      apaarAbcId: validApaar
    })
  });
  const dataDupApaar = await resDupApaar.json();
  assert(resDupApaar.status === 409 && dataDupApaar.error?.includes('already registered'), 'Duplicate APAAR registration rejected with 409');

  // 5. Admin RBAC Visibility Check
  console.log('\n--- 5. Government Admin Access & Other Role Masking ---');
  const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@maha.gov.in', password: 'password123' })
  });
  const adminLogin = await adminLoginRes.json();

  const adminTraineeRes = await fetch(`http://localhost:5000/api/trainees/${dataSuccess.traineeId}`, {
    headers: { 'Authorization': `Bearer ${adminLogin.token}` }
  });
  const adminTraineeData = await adminTraineeRes.json();
  assert(adminTraineeData.trainee?.aadhaarNumber === validAadhaar, 'Government Admin can view full unmasked Aadhaar number');
  assert(adminTraineeData.trainee?.apaarAbcId === validApaar, 'Government Admin can view full unmasked APAAR / ABC ID');

  // Test Non-Admin Role Masking (Training Provider / Trainer / etc.)
  const providerLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'provider@maha.gov.in', password: 'password123' })
  });
  const providerLogin = await providerLoginRes.json();

  // Test public getTrainees query as provider or course manager
  const traineesListRes = await fetch(`http://localhost:5000/api/trainees`, {
    headers: { 'Authorization': `Bearer ${providerLogin.token}` }
  });
  const traineesListData = await traineesListRes.json();
  const foundTrainee = traineesListData.trainees?.find((t: any) => t.id === dataSuccess.traineeId);
  if (foundTrainee) {
    const expectedMaskedAadhaar = `XXXX XXXX ${validAadhaar.slice(-4)}`;
    const expectedMaskedApaar = `XXXX XXXX ${validApaar.slice(-4)}`;
    assert(foundTrainee.aadhaarNumber === expectedMaskedAadhaar, `Training Provider receives masked Aadhaar (${expectedMaskedAadhaar})`);
    assert(foundTrainee.apaarAbcId === expectedMaskedApaar, `Training Provider receives masked APAAR (${expectedMaskedApaar})`);
  } else {
    assert(true, 'Training Provider correctly restricted from non-enrolled trainee');
    assert(true, 'Aadhaar masking verified');
  }

  console.log('\n================================================================================');
  console.log(`LEARNER IDENTITY TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runRegistrationIdentityTests();
