async function testPaginationAndSearch() {
  console.log('--- Testing Trainees API Pagination, Search, and Filtering ---');
  
  // 1. Login as Admin
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@maha.gov.in', password: 'password123' })
  });
  const { token } = await loginRes.json();
  if (!token) throw new Error('Login failed');
  console.log('✅ Admin login successful');

  const headers = { Authorization: `Bearer ${token}` };

  // 2. Test Pagination (page 1, pageSize 5)
  const page1Res = await fetch('http://localhost:5000/api/trainees?page=1&pageSize=5', { headers });
  const page1Data = await page1Res.json();
  console.log(`✅ Page 1: Received ${page1Data.trainees.length} items. Total: ${page1Data.pagination.total}, TotalPages: ${page1Data.pagination.totalPages}`);
  if (page1Data.trainees.length !== 5 || page1Data.pagination.page !== 1) {
    throw new Error('Page 1 test failed');
  }

  // 3. Test Pagination (page 2, pageSize 5)
  const page2Res = await fetch('http://localhost:5000/api/trainees?page=2&pageSize=5', { headers });
  const page2Data = await page2Res.json();
  console.log(`✅ Page 2: Received ${page2Data.trainees.length} items. Page: ${page2Data.pagination.page}`);
  if (page2Data.trainees[0].id === page1Data.trainees[0].id) {
    throw new Error('Page 2 returned same items as Page 1');
  }

  // 4. Test Search (Search by name)
  const searchRes = await fetch('http://localhost:5000/api/trainees?search=Trainee2&page=1&pageSize=10', { headers });
  const searchData = await searchRes.json();
  console.log(`✅ Search for "Trainee2": Found ${searchData.pagination.total} matching records`);
  if (!searchData.trainees.every((t: any) => t.firstName.includes('Trainee2') || t.lastName.includes('Trainee2') || t.canonicalId.includes('Trainee2'))) {
    throw new Error('Search filter returned non-matching records');
  }

  // 5. Test Status Filter
  const statusRes = await fetch('http://localhost:5000/api/trainees?status=EMPLOYED', { headers });
  const statusData = await statusRes.json();
  console.log(`✅ Status Filter "EMPLOYED": Found ${statusData.pagination.total} records`);

  // 6. Test District Filter
  const districtRes = await fetch('http://localhost:5000/api/trainees?district=Pune', { headers });
  const districtData = await districtRes.json();
  console.log(`✅ District Filter "Pune": Found ${districtData.pagination.total} records`);
  if (!districtData.trainees.every((t: any) => t.district.toLowerCase() === 'pune')) {
    throw new Error('District filter returned records outside Pune');
  }

  console.log('--- All Pagination & Filter Tests Passed Successfully! ---');
}

testPaginationAndSearch().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
