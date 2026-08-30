import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { EmailVerificationModal } from '../components/EmailVerificationModal';
import { API_BASE_URL } from '../config';

export const Login: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'register_trainee' | 'register_employer'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Learner Registration State
  const [tFirstName, setTFirstName] = useState('');
  const [tLastName, setTLastName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('password123');
  const [tPhone, setTPhone] = useState('');
  const [tAadhaar, setTAadhaar] = useState('');
  const [tApaar, setTApaar] = useState('');
  const [tEducation, setTEducation] = useState('Graduate (B.Tech / B.Sc / B.Com)');
  const [tCategory, setTCategory] = useState('General / Open');
  const [tSkills, setTSkills] = useState('EV Battery, Auto Diagnostics');
  const [tCareerGoals, setTCareerGoals] = useState('EV Diagnostic Technician');
  const [tConsent, setTConsent] = useState(true);
  const [tVerified, setTVerified] = useState(false);
  const [tVerificationToken, setTVerificationToken] = useState('');

  // Employer Registration State
  const [eCompany, setECompany] = useState('');
  const [eIndustry, setEIndustry] = useState('Automotive EV');
  const [eEmail, setEEmail] = useState('');
  const [ePassword, setEPassword] = useState('password123');
  const [eContact, setEContact] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eVerified, setEVerified] = useState(false);
  const [eVerificationToken, setEVerificationToken] = useState('');

  // Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [modalPurpose, setModalPurpose] = useState<'ACCOUNT_CREATION' | 'EMAIL_CHANGE'>('ACCOUNT_CREATION');
  const [modalTarget, setModalTarget] = useState<'trainee' | 'employer'>('trainee');
  const [sendingOtp, setSendingOtp] = useState(false);

  const { login } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Invalid official email or password.');
        } else if (res.status === 403) {
          throw new Error(data.error || 'Access forbidden: Insufficient privileges.');
        } else if (res.status === 500) {
          throw new Error('Server is temporarily unavailable. Please try again.');
        }
        throw new Error(data.error || data.message || `Authentication failed (Status ${res.status})`);
      }

      login(data.token, data.user);
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to the authentication server. Please check your internet connection or try again.');
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger Email OTP send before registration
  const handleInitiateVerification = async (target: 'trainee' | 'employer') => {
    setError('');
    const targetEmail = target === 'trainee' ? tEmail.trim().toLowerCase() : eEmail.trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }

    if (target === 'trainee' && (!tFirstName || !tLastName)) {
      setError('Please enter your first and last name before email verification.');
      return;
    }

    if (target === 'employer' && !eCompany) {
      setError('Please enter your company name before email verification.');
      return;
    }

    setSendingOtp(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/email/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, purpose: 'ACCOUNT_CREATION' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code');

      setModalEmail(targetEmail);
      setModalPurpose('ACCOUNT_CREATION');
      setModalTarget(target);
      setShowVerifyModal(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleTraineeRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanAadhaar = tAadhaar.replace(/\s+/g, '').replace(/-/g, '').trim();
    if (!cleanAadhaar || cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) {
      setError('Aadhaar number must contain exactly 12 digits.');
      return;
    }

    const cleanApaar = tApaar.replace(/\s+/g, '').replace(/-/g, '').trim();
    if (!cleanApaar || cleanApaar.length !== 12 || !/^\d{12}$/.test(cleanApaar)) {
      setError('APAAR / ABC ID must contain exactly 12 digits.');
      return;
    }

    if (!tVerified) {
      handleInitiateVerification('trainee');
      return;
    }

    if (!tConsent) {
      setError('You must accept the Government data processing consent terms to register.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/trainee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: tFirstName,
          lastName: tLastName,
          email: tEmail,
          password: tPassword,
          phone: tPhone,
          aadhaarNumber: cleanAadhaar,
          apaarAbcId: cleanApaar,
          educationLevel: tEducation,
          category: tCategory,
          skills: tSkills,
          careerGoals: tCareerGoals,
          verificationToken: tVerificationToken
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setSuccessMsg(`Registration submitted! Your verified account is pending Government Admin review.`);
      setTab('login');
      setEmail(tEmail);
      setTVerified(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!eVerified) {
      handleInitiateVerification('employer');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/employer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: eCompany,
          industry: eIndustry,
          email: eEmail,
          password: ePassword,
          contactPerson: eContact,
          phone: ePhone,
          verificationToken: eVerificationToken
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setSuccessMsg('Employer registration submitted! Your organization verification is pending Government Administrator approval.');
      setTab('login');
      setEmail(eEmail);
      setEVerified(false);
      setEVerificationToken('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* OTP Verification Modal */}
      {showVerifyModal && (
        <EmailVerificationModal
          email={modalEmail}
          purpose={modalPurpose}
          onVerified={(token) => {
            if (modalTarget === 'trainee') {
              setTVerified(true);
              setTVerificationToken(token);
            } else {
              setEVerified(true);
              setEVerificationToken(token);
            }
            setShowVerifyModal(false);
          }}
          onChangeEmail={() => {
            setShowVerifyModal(false);
          }}
          onClose={() => setShowVerifyModal(false)}
        />
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-900 text-white rounded-lg flex items-center justify-center shadow-md">
            <ShieldCheck className="h-10 w-10 text-amber-400" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
          Government of Maharashtra
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm font-semibold text-slate-600">
          Maharashtra State Innovation Society (MSInS) • Outcomes Intelligence Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-slate-200">
          
          {/* TABS */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-2.5 px-3 text-center text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                tab === 'login' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register_trainee'); setError(''); }}
              className={`flex-1 py-2.5 px-3 text-center text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                tab === 'register_trainee' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Learner Registration
            </button>
            <button
              onClick={() => { setTab('register_employer'); setError(''); }}
              className={`flex-1 py-2.5 px-3 text-center text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                tab === 'register_employer' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Employer Registration
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-600 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-600 p-3">
              <p className="text-sm text-emerald-800 font-medium">{successMsg}</p>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'login' && (
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Official Email ID</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-blue-900 hover:text-blue-700 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal'}
                </button>
              </form>
          )}

          {/* TAB 2: LEARNER SELF-REGISTRATION */}
          {tab === 'register_trainee' && (
            <form className="space-y-3" onSubmit={handleTraineeRegister}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={tFirstName}
                    onChange={(e) => setTFirstName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={tLastName}
                    onChange={(e) => setTLastName(e.target.value)}
                    placeholder="e.g. Shinde"
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">Email Address *</label>
                    {tVerified ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInitiateVerification('trainee')}
                        disabled={sendingOtp || !tEmail}
                        className="text-[10px] font-bold text-blue-900 hover:underline"
                      >
                        {sendingOtp ? 'Sending...' : 'Verify Email'}
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    disabled={tVerified}
                    value={tEmail}
                    onChange={(e) => { setTEmail(e.target.value); setTVerified(false); }}
                    placeholder="ramesh@example.com"
                    className={`mt-1 block w-full px-3 py-1.5 border rounded-md text-sm ${tVerified ? 'bg-emerald-50/50 border-emerald-300' : 'border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    value={tPhone}
                    onChange={(e) => setTPhone(e.target.value)}
                    placeholder="9876543210"
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Set Account Password *</label>
                <input
                  type="password"
                  required
                  value={tPassword}
                  onChange={(e) => setTPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>

              {/* IDENTITY & IDENTIFIERS ROW */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">AADHAAR NUMBER *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    required
                    value={tAadhaar}
                    onChange={(e) => setTAadhaar(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 12-digit Aadhaar number"
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm font-mono"
                  />
                  {tAadhaar && tAadhaar.length !== 12 && (
                    <p className="text-[10px] text-amber-600 mt-0.5 font-medium">Must contain exactly 12 digits ({tAadhaar.length}/12)</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">APAAR / ABC ID *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    required
                    value={tApaar}
                    onChange={(e) => setTApaar(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 12-digit APAAR / ABC ID"
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm font-mono"
                  />
                  {tApaar && tApaar.length !== 12 && (
                    <p className="text-[10px] text-amber-600 mt-0.5 font-medium">Must contain exactly 12 digits ({tApaar.length}/12)</p>
                  )}
                </div>
              </div>

              {/* EDUCATION & CATEGORY ROW */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">HIGHEST QUALIFICATION *</label>
                  <select
                    value={tEducation}
                    onChange={(e) => setTEducation(e.target.value)}
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="Higher Secondary (12th)">Higher Secondary (12th)</option>
                    <option value="Diploma in Engineering">Diploma in Engineering</option>
                    <option value="Graduate (B.Tech / B.Sc / B.Com)">Graduate (B.Tech / B.Sc / B.Com)</option>
                    <option value="Post Graduate">Post Graduate</option>
                    <option value="ITI Vocational">ITI Vocational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">SOCIAL CATEGORY</label>
                  <select
                    value={tCategory}
                    onChange={(e) => setTCategory(e.target.value)}
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="General / Open">General / Open</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                    <option value="NT / VJNT">NT / VJNT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">EXISTING SKILLS</label>
                <input
                  type="text"
                  value={tSkills}
                  onChange={(e) => setTSkills(e.target.value)}
                  placeholder="e.g. Python, Data Analysis, Electronics"
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">TARGET CAREER GOAL</label>
                <input
                  type="text"
                  value={tCareerGoals}
                  onChange={(e) => setTCareerGoals(e.target.value)}
                  placeholder="e.g. Embedded Robotics Engineer"
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tConsent}
                    onChange={(e) => setTConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-900 rounded"
                  />
                  <span className="text-xs text-slate-700">
                    I grant consent to the Government of Maharashtra (MSInS) to store my learning progress, verify my credentials, and track employment outcomes in accordance with Government privacy policies.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || sendingOtp}
                className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {!tVerified ? (
                  <span>Verify Email & Continue Registration</span>
                ) : loading ? (
                  <span>Submitting Application...</span>
                ) : (
                  <span>Submit Learner Registration Application</span>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: EMPLOYER SELF-REGISTRATION */}
          {tab === 'register_employer' && (
            <form className="space-y-3" onSubmit={handleEmployerRegister}>
              <div>
                <label className="block text-xs font-medium text-slate-700">Company / Enterprise Name *</label>
                <input
                  type="text"
                  required
                  value={eCompany}
                  onChange={(e) => setECompany(e.target.value)}
                  placeholder="e.g. Mahindra Electric Mobility Ltd"
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Industry Sector *</label>
                  <select
                    value={eIndustry}
                    onChange={(e) => setEIndustry(e.target.value)}
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="Automotive & EV">Automotive & EV</option>
                    <option value="IT & Software Services">IT & Software Services</option>
                    <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                    <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                    <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">Corporate Email ID *</label>
                    {eVerified ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInitiateVerification('employer')}
                        disabled={sendingOtp || !eEmail}
                        className="text-[10px] font-bold text-blue-900 hover:underline"
                      >
                        {sendingOtp ? 'Sending...' : 'Verify Email'}
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    disabled={eVerified}
                    value={eEmail}
                    onChange={(e) => { setEEmail(e.target.value); setEVerified(false); }}
                    placeholder="hr@company.com"
                    className={`mt-1 block w-full px-3 py-1.5 border rounded-md text-sm ${eVerified ? 'bg-emerald-50/50 border-emerald-300' : 'border-slate-300'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Official Representative Name</label>
                  <input
                    type="text"
                    value={eContact}
                    onChange={(e) => setEContact(e.target.value)}
                    placeholder="e.g. Anand Mahindra"
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Corporate Phone</label>
                  <input
                    type="tel"
                    value={ePhone}
                    onChange={(e) => setEPhone(e.target.value)}
                    placeholder="020-12345678"
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Set Portal Password *</label>
                <input
                  type="password"
                  required
                  value={ePassword}
                  onChange={(e) => setEPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded border border-amber-200">
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  <strong>Verification Notice:</strong> Employer accounts require official verification by the Government Administrator before access is activated to verify candidate placements.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || sendingOtp}
                className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {!eVerified ? (
                  <span>Verify Corporate Email & Submit</span>
                ) : loading ? (
                  <span>Submitting Application...</span>
                ) : (
                  <span>Submit Employer Registration Application</span>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
