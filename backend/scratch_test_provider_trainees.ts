async function run() {
  const loginRes = await fetch('https://skilltrack-backend-0fsr.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'provider@maha.gov.in', password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('Provider Login Status:', loginRes.status, 'Role:', loginData.user?.role, 'OrgId:', loginData.user?.organizationId);

  const traineesRes = await fetch('https://skilltrack-backend-0fsr.onrender.com/api/trainees', {
    headers: { 'Authorization': 'Bearer ' + loginData.token }
  });
  console.log('Trainees API Status:', traineesRes.status);
  const traineesData = await traineesRes.json();
  console.log('Trainees Count:', traineesData.trainees?.length, 'Pagination:', traineesData.pagination);
  if (traineesData.trainees && traineesData.trainees.length > 0) {
    console.log('Sample Trainee skills type:', typeof traineesData.trainees[0].skills, 'Value:', traineesData.trainees[0].skills);
  }
}

run();
