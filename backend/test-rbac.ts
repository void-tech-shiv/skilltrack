
import { assert } from 'console';

const BASE_URL = 'http://localhost:5000/api';

const USERS = [
  { role: 'GOVERNMENT_ADMIN', email: 'admin@maha.gov.in', password: 'password123' },
  { role: 'TRAINING_PROVIDER', email: 'provider@maha.gov.in', password: 'password123' },
  { role: 'TRAINEE', email: 'trainee@maha.gov.in', password: 'password123' },
  { role: 'EMPLOYER', email: 'employer@maha.gov.in', password: 'password123' },
  { role: 'ANALYST', email: 'analyst@maha.gov.in', password: 'password123' }
];

async function runTests() {
  console.log('--- Starting API E2E RBAC Tests ---');
  let tokens: Record<string, string> = {};

  // 1. Test Logins
  console.log('\\n1. Testing Logins...');
  for (const user of USERS) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password })
      });
      const data = await res.json();
      if (data.token) {
        tokens[user.role] = data.token;
        console.log(`✅ [${user.role}] Login successful`);
      } else {
        console.error(`❌ [${user.role}] Missing token: ${JSON.stringify(data)}`);
      }
    } catch (e: any) {
      console.error(`❌ [${user.role}] Login failed: ${e.message}`);
    }
  }

  // 2. Test Dashboard Analytics
  console.log('\\n2. Testing Analytics Scoping...');
  for (const role of ['GOVERNMENT_ADMIN', 'TRAINING_PROVIDER', 'ANALYST']) {
    try {
      const res = await fetch(`${BASE_URL}/analytics/dashboard`, { headers: { Authorization: `Bearer ${tokens[role]}` } });
      const data = await res.json();
      console.log(`✅ [${role}] Dashboard loaded. Trainees count: ${data.metrics?.totalTrainees}`);
    } catch (e: any) {
      console.error(`❌ [${role}] Dashboard failed: ${e.message}`);
    }
  }

  // 3. Test Trainee Profile Access
  console.log('\\n3. Testing Trainee Profile Access...');
  try {
    const resTrainees = await fetch(`${BASE_URL}/trainees`, { headers: { Authorization: `Bearer ${tokens['GOVERNMENT_ADMIN']}` } });
    const traineesData = await resTrainees.json();
    const traineeId = traineesData.trainees[0].id;
    console.log(`✅ Got sample trainee ID: ${traineeId}`);

    // Gov Admin access
    let res = await fetch(`${BASE_URL}/trainees/${traineeId}`, { headers: { Authorization: `Bearer ${tokens['GOVERNMENT_ADMIN']}` } });
    console.log(`✅ [GOVERNMENT_ADMIN] Accessed trainee profile (${res.status})`);
    
    // Trainee trying to access another trainee should fail
    const traineeRes = await fetch(`${BASE_URL}/trainees/${traineeId}`, { headers: { Authorization: `Bearer ${tokens['TRAINEE']}` } });
    if (traineeRes.status === 403 || traineeRes.status === 404) {
      console.log(`✅ [TRAINEE] Correctly denied access to another trainee profile (Status: ${traineeRes.status})`);
    } else {
      console.error(`❌ [TRAINEE] Was able to access another trainee profile (Status: ${traineeRes.status})`);
    }

  } catch (e: any) {
    console.error(`❌ Trainee Profile test failed: ${e.message}`);
  }

  // 4. Test Employer Verification
  console.log('\\n4. Testing Employer Verifications...');
  try {
    const empRes = await fetch(`${BASE_URL}/employer/verifications`, { headers: { Authorization: `Bearer ${tokens['EMPLOYER']}` } });
    const empData = await empRes.json();
    console.log(`✅ [EMPLOYER] Fetched verifications, count: ${empData.verifications?.length}`);
    
    // Trainee shouldn't access
    const tEmpRes = await fetch(`${BASE_URL}/employer/verifications`, { headers: { Authorization: `Bearer ${tokens['TRAINEE']}` } });
    if (tEmpRes.status === 403) {
      console.log(`✅ [TRAINEE] Correctly denied access to verifications (403)`);
    } else {
       console.log(`❌ [TRAINEE] Fetched verifications (SHOULD FAIL)`);
    }
  } catch (e: any) {
    console.error(`❌ Employer test failed: ${e.message}`);
  }

  console.log('\\n--- Tests Completed ---');
}

runTests();
