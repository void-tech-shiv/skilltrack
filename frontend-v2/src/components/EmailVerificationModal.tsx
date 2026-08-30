import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { api } from '../lib/api';

interface EmailVerificationModalProps {
  email: string;
  purpose?: 'ACCOUNT_CREATION' | 'EMAIL_CHANGE';
  onVerified: (verificationToken: string, email: string) => void;
  onChangeEmail: () => void;
  onClose?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  email,
  purpose = 'ACCOUNT_CREATION',
  onVerified,
  onChangeEmail,
  onClose
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = clean.slice(-1);
    setDigits(nextDigits);
    setError(null);

    if (index < 5 && clean.length > 0) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pasted[i] || '';
    }
    setDigits(nextDigits);
    setError(null);

    const targetIdx = Math.min(5, pasted.length);
    inputRefs.current[targetIdx]?.focus();
  };

  const maskedEmail = () => {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local.charAt(0)}*@${domain}`;
    return `${local.charAt(0)}${'*'.repeat(Math.min(5, local.length - 1))}@${domain}`;
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: any = await api.post('/auth/email/verify-otp', {
        email: email.trim().toLowerCase(),
        otp,
        purpose
      });

      setSuccess(true);
      setTimeout(() => {
        onVerified(data.verificationToken, email);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError(null);

    try {
      await api.post('/auth/email/send-otp', {
        email: email.trim().toLowerCase(),
        purpose
      });

      setTimer(60);
      setCanResend(false);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Government Header Bar */}
        <div className="bg-gradient-to-r from-gov-navy via-brand-800 to-gov-navy px-6 py-4 border-b-2 border-amber-500 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
                Government of Maharashtra
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">State Outcomes Security • Email Verification</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-blue-200 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-white/10 transition">
              ✕
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-50 to-indigo-50 text-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-sm">
              <Mail className="w-7 h-7" />
            </div>
            <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black rounded-full uppercase tracking-wider mb-2">
              Identity Ownership Check
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">VERIFY YOUR EMAIL</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-sm font-extrabold text-gov-navy font-mono tracking-wide mt-1 bg-slate-50 py-1 px-3 rounded-lg inline-block border border-slate-200">
              {maskedEmail()}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center space-x-2 text-emerald-700 text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Email Verified Successfully! Continuing...</span>
            </div>
          )}

          {/* 6 Digit Input Boxes */}
          <form onSubmit={handleVerify}>
            <div className="flex justify-between items-center gap-2 mb-6">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading || success}
                  className="w-12 h-14 text-center text-2xl font-black font-mono text-gov-navy bg-slate-50/80 border-2 border-slate-200 rounded-2xl focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 transition shadow-sm"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || success || digits.join('').length !== 6}
              className="w-full py-3.5 bg-gradient-to-r from-gov-navy to-brand-700 hover:from-brand-900 hover:to-brand-800 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition shadow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified!</span>
                </>
              ) : (
                <span>Verify Email</span>
              )}
            </button>
          </form>

          {/* Resend Code & Change Email */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
            <div className="text-xs text-slate-500 flex items-center justify-center space-x-1.5">
              <span>Didn't receive the code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-brand-700 hover:text-gov-navy font-bold underline transition"
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              ) : (
                <span className="text-slate-400 font-semibold flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Resend available in {timer}s</span>
                </span>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={onChangeEmail}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition inline-flex items-center space-x-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change Email Address</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
