import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);
const resolve4 = promisify(dns.resolve4);

// Comprehensive list of disposable/temporary email provider domains
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'trashmail.com',
  'trashmail.net',
  'yopmail.com',
  'yopmail.fr',
  'dispostable.com',
  'fakeinbox.com',
  'getairmail.com',
  'sharklasers.com',
  'grr.la',
  'throwawaymail.com',
  'burnermail.io',
  'dropmail.me',
  'emailondeck.com',
  'mohmal.com',
  'mytemp.email',
  'crazymailing.com',
  'generator.email',
  'tempail.com',
  'zillamail.com',
  'maildrop.cc',
  'inboxbear.com',
  'getnada.com',
  'abcvg.com',
  'nada.ltd',
  'duck.com',
  'tempmailo.com',
  'internxt.com',
  'tempm.com',
  'luxusmail.org',
  'fakemailgenerator.com'
]);

// Configurable government / official organization domains
const GOV_APPROVED_DOMAINS = new Set([
  'maha.gov.in',
  'gov.in',
  'nic.in',
  'msins.in',
  'msdbe.gov.in'
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  domain?: string;
  isDisposable?: boolean;
  isGovernmentDomain?: boolean;
}

/**
 * Validates email syntax, disposable domain blocklist, and DNS MX configuration.
 */
export async function validateEmail(emailRaw: string, checkDns = true): Promise<EmailValidationResult> {
  if (!emailRaw || typeof emailRaw !== 'string') {
    return { isValid: false, error: 'Email address is required' };
  }

  const email = emailRaw.trim().toLowerCase();

  // 1. Basic length boundaries
  if (email.length < 5 || email.length > 254) {
    return { isValid: false, error: 'Email address must be between 5 and 254 characters' };
  }

  // 2. Strict RFC 5322 regex validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email address format' };
  }

  // Ensure no double dots in local part or domain
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return { isValid: false, error: 'Invalid email address syntax' };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Invalid email structure' };
  }

  const [localPart, domain] = parts;
  if (localPart.length > 64) {
    return { isValid: false, error: 'Email local part cannot exceed 64 characters' };
  }

  // 3. Disposable Domain Filter
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.',
      isDisposable: true,
      domain
    };
  }

  const isGovernmentDomain = GOV_APPROVED_DOMAINS.has(domain) || domain.endsWith('.gov.in');

  // 4. DNS MX Record Resolution (where practical)
  if (checkDns) {
    try {
      const mxRecords = await resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        // Fallback: Check if domain has an A record
        const aRecords = await resolve4(domain);
        if (!aRecords || aRecords.length === 0) {
          return { isValid: false, error: `Email domain "${domain}" has no valid mail exchange (MX) or DNS records.`, domain };
        }
      }
    } catch (dnsErr: any) {
      // In local development or isolated environments, if DNS fails with ENOTFOUND, reject invalid domains
      if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA') {
        return { isValid: false, error: `Email domain "${domain}" does not exist or has no valid mail servers.`, domain };
      }
      // For network timeouts or test environments, proceed to OTP validation
      console.warn(`[ValidationService] DNS check skipped/warn for ${domain}: ${dnsErr.message}`);
    }
  }

  return {
    isValid: true,
    domain,
    isDisposable: false,
    isGovernmentDomain
  };
}

/**
 * Masks email for privacy (e.g. ravisha@gmail.com -> r*****@gmail.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local.charAt(0)}*@${domain}`;
  }
  const first = local.charAt(0);
  const asterisks = '*'.repeat(Math.min(5, local.length - 1));
  return `${first}${asterisks}@${domain}`;
}
