const roles = [
  { role: 'Government Admin', email: 'admin@maha.gov.in' },
  { role: 'Course Manager', email: 'coursemanager@maha.gov.in' },
  { role: 'Training Provider', email: 'provider@maha.gov.in' },
  { role: 'Teacher / Trainer', email: 'trainer@maha.gov.in' },
  { role: 'Employer', email: 'employer@maha.gov.in' },
  { role: 'Learner / Trainee', email: 'learner@maha.gov.in' },
  { role: 'State Analyst', email: 'analyst@maha.gov.in' }
];

async function testAll() {
  console.log('Testing live Render backend logins with Vercel Origin header...\n');
  for (const r of roles) {
    try {
      const res = await fetch('https://skilltrack-backend-0fsr.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://skilltrack-frontend-beta.vercel.app'
        },
        body: JSON.stringify({ email: r.email, password: 'password123' })
      });
      const data = await res.json();
      const corsOrigin = res.headers.get('access-control-allow-origin');
      const pass = res.status === 200 && data.token && data.user;
      console.log(`[${pass ? 'PASS' : 'FAIL'}] ${r.role} (${r.email}) -> Status: ${res.status} | CORS: ${corsOrigin} | Role in DB: ${data.user?.role}`);
    } catch (err: any) {
      console.log(`[ERROR] ${r.role}: ${err.message}`);
    }
  }
}

testAll();
