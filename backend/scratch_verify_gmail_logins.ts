const accounts = [
  { label: 'Government Admin', email: 'admin@gmail.com' },
  { label: 'Course Manager', email: 'coursemanager@gmail.com' },
  { label: 'Course Manager (alt)', email: 'courcemanager@gmail.com' },
  { label: 'Training Provider', email: 'provider@gmail.com' },
  { label: 'Trainer', email: 'trainer@gmail.com' },
  { label: 'Teacher', email: 'teacher@gmail.com' },
  { label: 'State Analyst', email: 'analyst@gmail.com' },
  { label: 'Employer', email: 'employer@gmail.com' },
  { label: 'Learner', email: 'learner@gmail.com' },
  { label: 'Trainee', email: 'trainee@gmail.com' }
];

async function verifyAll() {
  console.log('Testing live Render backend logins for all @gmail.com accounts with password PS135:\n');
  for (const acc of accounts) {
    try {
      const res = await fetch('https://skilltrack-backend-0fsr.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: 'PS135' })
      });
      const data = await res.json();
      const pass = res.status === 200 && data.token && data.user;
      console.log(`[${pass ? 'PASS' : 'FAIL'}] ${acc.label} (${acc.email}) -> Status: ${res.status} | Role: ${data.user?.role} | Token Received: ${!!data.token}`);
    } catch (err: any) {
      console.log(`[ERROR] ${acc.label}: ${err.message}`);
    }
  }
}

verifyAll();
