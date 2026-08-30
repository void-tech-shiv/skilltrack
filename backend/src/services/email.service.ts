import { Resend } from 'resend';

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.trim() === '') return null;
  return new Resend(key.trim());
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'MahaSkills Outcomes <noreply@kluniversity.email>';
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isMocked?: boolean;
}

/**
 * Builds the official Government of Maharashtra email layout
 */
function buildGovernmentEmailTemplate(params: {
  title: string;
  subtitle: string;
  heading: string;
  otp: string;
  purposeText: string;
  warningText: string;
}): string {
  const { title, subtitle, heading, otp, purposeText, warningText } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Government Header Bar -->
          <tr>
            <td style="background-color: #002b49; padding: 24px 32px; border-bottom: 3px solid #d97706;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 16px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; text-transform: uppercase;">
                      Government of Maharashtra
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #93c5fd; font-weight: 500;">
                      Maharashtra State Innovation Society (MSInS) • Outcomes Intelligence
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
                ${heading}
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                ${purposeText}
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                      Your Single-Use Verification Code
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #002b49; padding: 8px 0; margin-left: 10px;">
                      ${otp}
                    </div>
                    <div style="font-size: 12px; font-weight: 600; color: #dc2626; margin-top: 8px;">
                      ⏳ Valid for 10 minutes only (single-use)
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; margin: 24px 0 0 0;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #92400e; font-weight: 500;">
                  <strong>Security Advisory:</strong> ${warningText}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6; text-align: center;">
              <p style="margin: 0 0 4px 0;">
                This is an automated system notification from the <strong>Maharashtra Skill & Employment Outcomes Intelligence Platform</strong>.
              </p>
              <p style="margin: 0; color: #94a3b8;">
                Government of Maharashtra • Directorate of Vocational Education and Training (DVET) • MSInS
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends a 6-digit OTP email for Account Creation / Registration Verification
 */
export async function sendAccountVerificationEmail(email: string, otp: string): Promise<SendEmailResult> {
  const html = buildGovernmentEmailTemplate({
    title: 'Verify Your Email — MahaSkills Outcomes Intelligence',
    subtitle: 'State Learner & Citizen Registration',
    heading: 'Verify Your Email Address',
    otp,
    purposeText: 'Thank you for initiating registration on the Maharashtra State Skill & Employment Outcomes Intelligence Platform. Please enter the 6-digit verification code below to verify your email ownership and proceed with your application.',
    warningText: 'Do not disclose this verification code to anyone. Government of Maharashtra administrators or support personnel will never ask for your OTP code.'
  });

  return sendEmailInternal({
    to: email,
    subject: `Verify Your Email: ${otp} — MahaSkills Outcomes Platform`,
    html,
    text: `Your Maharashtra State Outcomes Intelligence Platform verification code is: ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
    purpose: 'ACCOUNT_CREATION'
  });
}

/**
 * Sends a 6-digit OTP email for Password Reset
 */
export async function sendPasswordResetOtpEmail(email: string, otp: string): Promise<SendEmailResult> {
  const html = buildGovernmentEmailTemplate({
    title: 'Password Reset Verification Code — MahaSkills Outcomes',
    subtitle: 'State Security & Access Control',
    heading: 'Password Reset Request',
    otp,
    purposeText: 'We received a request to reset the password for your account on the Maharashtra State Skill & Employment Outcomes Intelligence Platform. Use the 6-digit verification code below to securely authenticate your request.',
    warningText: 'If you did not request a password reset, please ignore this email immediately. Your password will remain unchanged, and your account remains secure.'
  });

  return sendEmailInternal({
    to: email,
    subject: `Password Reset Code: ${otp} — MahaSkills Outcomes Platform`,
    html,
    text: `Your password reset verification code is: ${otp}. It expires in 10 minutes. If you did not request this, please ignore this email.`,
    purpose: 'PASSWORD_RESET'
  });
}

/**
 * Sends a 6-digit OTP email for Email Address Change
 */
export async function sendEmailChangeOtpEmail(email: string, otp: string): Promise<SendEmailResult> {
  const html = buildGovernmentEmailTemplate({
    title: 'Confirm Your New Email Address — MahaSkills Outcomes',
    subtitle: 'State Account Update',
    heading: 'Confirm New Email Address',
    otp,
    purposeText: 'You requested to update your email address on the Maharashtra State Skill & Employment Outcomes Intelligence Platform. Enter the code below to confirm this new mailbox.',
    warningText: 'Do not share this code. If you did not initiate this change, contact the State Government Administrator.'
  });

  return sendEmailInternal({
    to: email,
    subject: `Confirm New Email: ${otp} — MahaSkills Outcomes Platform`,
    html,
    text: `Your email update confirmation code is: ${otp}. It expires in 10 minutes.`,
    purpose: 'EMAIL_CHANGE'
  });
}

/**
 * Sends notification email when Learner Application is Approved by Government Admin
 */
export async function sendLearnerApprovalEmail(email: string, learnerName: string): Promise<SendEmailResult> {
  const html = buildGovernmentEmailTemplate({
    title: 'Application Approved — MahaSkills Outcomes Intelligence',
    subtitle: 'State Learner & Citizen Registration',
    heading: 'Application Approved & Activated',
    otp: 'APPROVED',
    purposeText: `Dear ${learnerName}, your registration application on the Maharashtra State Skill & Employment Outcomes Intelligence Platform has been verified and officially approved by the Government Administrator. Your account is now ACTIVE and you may sign in to access courses, batch enrollments, and state credentials.`,
    warningText: 'Keep your login credentials secure. Government administrators will never ask for your account password.'
  });

  return sendEmailInternal({
    to: email,
    subject: `Application Approved — Maharashtra State Outcomes Platform`,
    html,
    text: `Dear ${learnerName}, your learner application has been approved and activated. You can now sign in to the Maharashtra State Outcomes Intelligence Platform.`,
    purpose: 'APPLICATION_APPROVED'
  });
}

/**
 * Sends notification email when Learner Application is Rejected by Government Admin
 */
export async function sendLearnerRejectionEmail(email: string, learnerName: string, reason: string): Promise<SendEmailResult> {
  const html = buildGovernmentEmailTemplate({
    title: 'Application Status Update — MahaSkills Outcomes Intelligence',
    subtitle: 'State Learner & Citizen Registration',
    heading: 'Application Status: Action Required',
    otp: 'REJECTED',
    purposeText: `Dear ${learnerName}, your registration application on the Maharashtra State Skill & Employment Outcomes Intelligence Platform was reviewed by the Government Administrator and could not be approved at this time. Reason: "${reason}".`,
    warningText: 'You may contact your local District Skill Development Officer or re-apply with corrected documentation.'
  });

  return sendEmailInternal({
    to: email,
    subject: `Application Status Update — Maharashtra State Outcomes Platform`,
    html,
    text: `Dear ${learnerName}, your learner application could not be approved. Reason: ${reason}.`,
    purpose: 'APPLICATION_REJECTED'
  });
}

/**
 * Core internal sender with Resend SDK integration and safe structured logging
 */
async function sendEmailInternal(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  purpose?: string;
}): Promise<SendEmailResult> {
  const { to, subject, html, text, purpose = 'VERIFICATION' } = params;
  const client = getResendClient();
  const fromEmail = getFromEmail();
  const recipientDomain = to.split('@')[1] || 'unknown';

  if (!client) {
    console.warn(`[EmailService] RESEND_API_KEY is not configured in backend/.env. Simulated delivery mode for domain: ${recipientDomain}`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      isMocked: true
    };
  }

  try {
    const response = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text
    });

    if (response.error) {
      // Safe structured logging without logging OTP, tokens, or credentials
      console.error(`[EmailService] Resend Delivery Failure: errorName=${response.error.name}, errorMsg=${response.error.message}, recipientDomain=${recipientDomain}, purpose=${purpose}`);
      
      return {
        success: false,
        error: response.error.message
      };
    }

    console.log(`[EmailService] Resend Delivery Succeeded: messageId=${response.data?.id}, from="${fromEmail}", recipientDomain=${recipientDomain}, purpose=${purpose}`);

    return {
      success: true,
      messageId: response.data?.id
    };
  } catch (err: any) {
    console.error(`[EmailService] Resend Exception: errorMsg=${err.message}, recipientDomain=${recipientDomain}, purpose=${purpose}`);
    return {
      success: false,
      error: 'Unable to send verification email. Please try again later.'
    };
  }
}
