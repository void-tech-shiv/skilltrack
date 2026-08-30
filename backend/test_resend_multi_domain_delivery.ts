import dotenv from 'dotenv';
dotenv.config();

import { sendAccountVerificationEmail, sendPasswordResetOtpEmail } from './src/services/email.service';

async function testMultipleRecipientDomains() {
  console.log('========================================================================');
  console.log('TESTING RESEND MULTI-DOMAIN RECIPIENT DELIVERABILITY');
  console.log(`SENDER (FROM): ${process.env.RESEND_FROM_EMAIL || 'MahaSkills Outcomes <noreply@kluniversity.email>'}`);
  console.log('========================================================================\n');

  const testRecipients = [
    { type: '1. Gmail Recipient', email: 'piratesofdragoanx@gmail.com' },
    { type: '2. Outlook Recipient', email: 'maha.test.trainee@outlook.com' },
    { type: '3. Organization / Corporate Recipient', email: 'hr.careers@tatamotors.com' },
    { type: '4. Government Recipient', email: 'nodal.officer@maha.gov.in' }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const item of testRecipients) {
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`--- Testing ${item.type}: <${item.email}> ---`);
    
    const result = await sendAccountVerificationEmail(item.email, testOtp);
    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`✅ SUCCESS: Dispatched to ${item.email} with Message ID: ${result.messageId}\n`);
      successCount++;
    } else {
      console.error(`❌ FAILED: ${item.email} - Error: ${result.error}\n`);
      failCount++;
    }
  }

  console.log('========================================================================');
  console.log(`TEST SUMMARY: ${successCount} PASSED, ${failCount} FAILED`);
  console.log('========================================================================');

  process.exit(failCount > 0 ? 1 : 0);
}

testMultipleRecipientDomains();
