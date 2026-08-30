import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle2, Building2, Briefcase, RefreshCw, ArrowRight, Mail } from 'lucide-react';
import { api } from '../lib/api';
import { EmailVerificationModal } from '../components/EmailVerificationModal';

export const RegisterEmployerV2: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('Automotive & EV');
  const [location, setLocation] = useState('Pune Chakan MIDC');

  const handleInitiateVerification = async () => {
    setError(null);
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please enter a valid corporate email address.');
      return;
    }
    if (!companyName) {
      setError('Please enter your company name.');
      return;
    }

    setSendingOtp(true);
    try {
      await api.post('/auth/email/send-otp', {
        email: targetEmail,
        purpose: 'ACCOUNT_CREATION'
      });
      setShowVerifyModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailVerified) {
      handleInitiateVerification();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: any = await api.post('/auth/register/employer', {
        companyName,
        contactName,
        email: email.trim(),
        password,
        phone,
        industry,
        location,
        verificationToken
      });

      setSuccess(res.message || 'Employer organization registration submitted! Pending Government Admin review.');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Verification Modal */}
      {showVerifyModal && (
        <EmailVerificationModal
          email={email.trim().toLowerCase()}
          purpose="ACCOUNT_CREATION"
          onVerified={(token) => {
            setEmailVerified(true);
            setVerificationToken(token);
            setShowVerifyModal(false);
          }}
          onChangeEmail={() => setShowVerifyModal(false)}
          onClose={() => setShowVerifyModal(false)}
        />
      )}

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
            <p className="text-xs text-slate-500 font-semibold">Enterprise & Employer Portal</p>
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
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-elevated">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
              Industry Partner Application
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Employer Registration
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Join the Maharashtra state talent ecosystem for verified hiring & wage tracking
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Application Received!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">{success}</p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 max-w-md mx-auto text-left space-y-1">
                <p className="font-bold text-slate-700">Next Steps:</p>
                <p>1. Email verified and organization credentials stored.</p>
                <p>2. State Skilling Directorate verifies company registration and GSTIN entity details.</p>
                <p>3. Upon approval, you will receive activation credentials to verify candidate placements.</p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company / Organization Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Tata Motors Passenger Vehicles Ltd"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Industry Domain *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Automotive & EV">Automotive & EV</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Industrial Manufacturing">Industrial Manufacturing</option>
                      <option value="Logistics & Warehousing">Logistics & Warehousing</option>
                      <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                      <option value="Renewable Energy">Renewable Energy</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Primary Plant / Office Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Chakan MIDC, Pune"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Corporate Email ID *
                  </label>
                  {emailVerified ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 inline-flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Email Verified</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleInitiateVerification}
                      disabled={sendingOtp || !email}
                      className="text-[11px] font-bold text-brand-700 hover:text-brand-900 hover:underline"
                    >
                      {sendingOtp ? 'Sending code...' : 'Verify Corporate Email'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={emailVerified}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailVerified(false); }}
                    placeholder="e.g. hr.careers@company.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 ${
                      emailVerified ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Rohit Deshmukh (VP HR)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Direct Phone / Extension
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 20 6600 1234"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Portal Access Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl">
                <p className="text-xs text-purple-900 leading-relaxed font-semibold">
                  Note: Following submission, our verification desk validates corporate credentials. Once approved, your organization will have secure access to verify candidate self-reported outcomes and issue wage records.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || sendingOtp}
                  className="w-full py-3.5 bg-gradient-to-r from-gov-navy to-brand-700 hover:from-brand-900 hover:to-brand-800 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold text-sm rounded-2xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  {!emailVerified ? (
                    <span>Verify Corporate Email & Submit</span>
                  ) : loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Organization Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
