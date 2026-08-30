import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, CheckCircle2, ArrowLeft, RefreshCw, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';

export const ForgotPasswordV2: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: any = null;
    if (step === 2 && timer > 0) {
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
  }, [step, timer]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: any = await api.post('/auth/forgot-password/send-otp', {
        email: email.trim().toLowerCase()
      });

      setMaskedEmail(data.emailMasked || email);
      setStep(2);
      setTimer(60);
      setCanResend(false);
      setDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message || 'Unable to request password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    const nextDigits = [...digits];
    nextDigits[index] = clean ? clean.slice(-1) : '';
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
    inputRefs.current[Math.min(5, pasted.length)]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: any = await api.post('/auth/forgot-password/verify-otp', {
        email: email.trim().toLowerCase(),
        otp
      });

      setResetToken(data.resetToken);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/forgot-password/send-otp', {
        email: email.trim().toLowerCase()
      });

      setTimer(60);
      setCanResend(false);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/reset-password', {
        resetToken,
        newPassword
      });

      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-gov-navy to-brand-700 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Government of Maharashtra
            </h1>
            <p className="text-xs text-slate-500 font-semibold">State Outcomes Intelligence • Security & Account Recovery</p>
          </div>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-elevated">
          
          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-50 to-indigo-50 text-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-sm">
                  <Mail className="w-7 h-7" />
                </div>
                <span className="inline-block px-3 py-1 bg-blue-50 text-brand-700 border border-blue-200 text-[10px] font-black rounded-full uppercase tracking-wider mb-2">
                  Credential Recovery
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Forgot Password
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered official email to receive a 6-digit password reset code.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. user@maha.gov.in"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-600 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-gov-navy to-brand-700 hover:from-brand-900 hover:to-brand-800 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold text-sm rounded-2xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Verify OTP */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-tr from-amber-50 to-orange-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-100 shadow-sm">
                  <Lock className="w-7 h-7" />
                </div>
                <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black rounded-full uppercase tracking-wider mb-2">
                  Authentication Challenge
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  VERIFY OTP
                </h2>
                <p className="text-xs text-slate-500 mt-1">We've sent a 6-digit code to:</p>
                <p className="text-sm font-extrabold text-gov-navy font-mono mt-1 bg-slate-50 py-1 px-3 rounded-lg inline-block border border-slate-200">
                  {maskedEmail}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
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
                      className="w-12 h-14 text-center text-2xl font-black font-mono text-gov-navy bg-slate-50/80 border-2 border-slate-200 rounded-2xl focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 transition shadow-sm"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || digits.join('').length !== 6}
                  className="w-full py-3.5 bg-gradient-to-r from-gov-navy to-brand-700 hover:from-brand-900 hover:to-brand-800 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold text-sm rounded-2xl transition shadow-lg flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
                <div className="text-xs text-slate-500">
                  {canResend ? (
                    <button
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-brand-700 font-bold hover:underline"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <span className="text-slate-400 font-semibold inline-flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resend available in {timer}s</span>
                    </span>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => {
                      setStep(1);
                      setError(null);
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition inline-flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change Email Address</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Create New Password */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-tr from-emerald-50 to-teal-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100 shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black rounded-full uppercase tracking-wider mb-2">
                  Reset Password
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  CREATE NEW PASSWORD
                </h2>
                <p className="text-xs text-slate-500 mt-1">Set a secure password for your account</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="block w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="block w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-600 transition"
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-700">Password requirements:</p>
                  <p className={newPassword.length >= 8 ? 'text-emerald-700 font-semibold' : ''}>
                    • At least 8 characters long
                  </p>
                  <p className={newPassword && newPassword === confirmPassword ? 'text-emerald-700 font-semibold' : ''}>
                    • Passwords match
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="w-full py-3.5 bg-gradient-to-r from-gov-navy to-brand-700 hover:from-brand-900 hover:to-brand-800 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold text-sm rounded-2xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: Password Updated Confirmation */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">PASSWORD UPDATED</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-gradient-to-r from-gov-navy to-brand-700 hover:from-brand-900 hover:to-brand-800 text-white font-bold text-sm rounded-2xl shadow-lg transition"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
