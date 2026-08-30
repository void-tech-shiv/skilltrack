import dotenv from 'dotenv';
dotenv.config();

import { sendAccountVerificationEmail, sendPasswordResetOtpEmail } from './src/services/email.service';

async function testLiveResend() {
  console.log('Testing live email delivery through Resend to piratesofdragoanx@gmail.com...');
  
  const otp1 = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Sending Account Verification email with OTP: ${otp1}...`);
  const res1 = await sendAccountVerificationEmail('piratesofdragoanx@gmail.com', otp1);
  console.log('Account Verification Email Delivery Result:', JSON.stringify(res1, null, 2));

  const otp2 = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`\nSending Password Reset email with OTP: ${otp2}...`);
  const res2 = await sendPasswordResetOtpEmail('piratesofdragoanx@gmail.com', otp2);
  console.log('Password Reset Email Delivery Result:', JSON.stringify(res2, null, 2));

  if (res1.success && res2.success) {
    console.log('\n✅ LIVE RESEND EMAIL DELIVERY VERIFIED SUCCESSFULLY!');
  } else {
    console.error('\n❌ RESEND EMAIL DELIVERY ENCOUNTERED ISSUES.');
  }
}

testLiveResend();
