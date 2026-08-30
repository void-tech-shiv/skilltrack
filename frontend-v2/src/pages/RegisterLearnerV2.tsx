import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2, User, GraduationCap, MapPin, Sparkles, Lock, RefreshCw, Mail } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { EmailVerificationModal } from '../components/EmailVerificationModal';

export const RegisterLearnerV2: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [apaarAbcId, setApaarAbcId] = useState('');
  const [educationLevel, setEducationLevel] = useState('GRADUATE');
  const [category, setCategory] = useState('General / Open');
  const [skills, setSkills] = useState('Python, Data Analysis, Electronics');
  const [careerGoals, setCareerGoals] = useState('Embedded Robotics Engineer');
  const [consentGranted, setConsentGranted] = useState(true);

  // Trigger Email Verification Modal
  const handleInitiateVerification = async () => {
    setError(null);
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }
    if (!firstName || !lastName || !password) {
      setError('Please enter your first name, last name, and password.');
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
      setError(err.message || 'Failed to send verification code. Please check your email address.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!firstName || !lastName || !email || !password) {
        setError('Please fill in all required identity fields.');
        return;
      }
      if (!emailVerified) {
        handleInitiateVerification();
        return;
      }
    } else if (step === 2) {
      const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '').replace(/-/g, '').trim();
      if (!cleanAadhaar || cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) {
        setError('Aadhaar number must contain exactly 12 digits.');
        return;
      }

      const cleanApaar = apaarAbcId.replace(/\s+/g, '').replace(/-/g, '').trim();
      if (!cleanApaar || cleanApaar.length !== 12 || !/^\d{12}$/.test(cleanApaar)) {
        setError('APAAR / ABC ID must contain exactly 12 digits.');
        return;
      }
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGranted) {
      setError('You must accept the Government data privacy terms to register.');
      return;
    }

    if (!emailVerified) {
      handleInitiateVerification();
      return;
    }

    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '').replace(/-/g, '').trim();
    if (!cleanAadhaar || cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) {
      setError('Aadhaar number must contain exactly 12 digits.');
      return;
    }

    const cleanApaar = apaarAbcId.replace(/\s+/g, '').replace(/-/g, '').trim();
    if (!cleanApaar || cleanApaar.length !== 12 || !/^\d{12}$/.test(cleanApaar)) {
      setError('APAAR / ABC ID must contain exactly 12 digits.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const res: any = await api.post('/auth/register/trainee', {
        firstName,
        lastName,
        email: email.trim(),
        password,
        phone,
        aadhaarNumber: cleanAadhaar,
        apaarAbcId: cleanApaar,
        educationLevel,
        category,
        skills: skillsArray,
        careerGoals,
        verificationToken
      });

      setSuccess(res.message || 'Learner registration submitted successfully! Pending Government Admin review.');
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
            setStep(2); // Auto-advance to Step 2 upon verification
          }}
          onChangeEmail={() => setShowVerifyModal(false)}
          onClose={() => setShowVerifyModal(false)}
        />
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-gov-navy to-brand-700 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Government of Maharashtra
            </h1>
            <p className="text-xs text-slate-500 font-semibold">State Learner Enrollment Portal</p>
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
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-elevated">
          {/* Wizard Header */}
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
              Citizen Self-Enrollment
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Learner Registration
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Create your verifiable state learning profile & outcome record
            </p>
          </div>

          {/* Stepper Header */}
          {!success && (
            <div className="flex items-center justify-between max-w-md mx-auto mb-8 px-2">
              {[
                { s: 1, label: 'Identity & Email', icon: User },
                { s: 2, label: 'Education & Identity Details', icon: GraduationCap },
                { s: 3, label: 'Consent & Complete', icon: Sparkles },
              ].map((item, idx) => {
                const Icon = item.icon;
                const active = step === item.s;
                const done = step > item.s;
                return (
                  <React.Fragment key={item.s}>
                    <div className="flex flex-col items-center space-y-1">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all shadow-sm',
                          done
                            ? 'bg-emerald-600 text-white'
                            : active
                            ? 'bg-brand-900 text-white ring-4 ring-brand-100'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        )}
                      >
                        {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-bold tracking-tight',
                          active ? 'text-brand-900' : 'text-slate-400'
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 mx-2 rounded-full transition-colors',
                          step > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                        )}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

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
              <h3 className="text-xl font-bold text-slate-900">Application Submitted!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">{success}</p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 max-w-md mx-auto text-left space-y-1">
                <p className="font-bold text-slate-700">Next Steps:</p>
                <p>1. Email verified and application received.</p>
                <p>2. Government Administrator reviews your credentials.</p>
                <p>3. Once verified, your status changes to <b>ACTIVE</b>.</p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* STEP 1: IDENTITY & EMAIL */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Ramesh"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Patil"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Email Address *
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
                          {sendingOtp ? 'Sending code...' : 'Verify Email Address'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        disabled={emailVerified}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setEmailVerified(false); }}
                        placeholder="ramesh.patil@example.com"
                        className={cn(
                          "w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500",
                          emailVerified ? "bg-emerald-50/40 border-emerald-300" : "bg-slate-50 border-slate-200"
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Password *
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
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={sendingOtp}
                      className="px-6 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2"
                    >
                      <span>{emailVerified ? 'Continue to Education' : 'Verify Email & Continue'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: EDUCATION & IDENTITY DETAILS */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* IDENTITY IDENTIFIERS ROW */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          AADHAAR NUMBER *
                        </label>
                        {aadhaarNumber && aadhaarNumber.length === 12 && (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>12 Digits</span>
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={12}
                        pattern="\d{12}"
                        required
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 12-digit Aadhaar number"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500"
                      />
                      {aadhaarNumber && aadhaarNumber.length !== 12 && (
                        <p className="text-[11px] text-amber-600 mt-1 font-medium">Aadhaar number must contain exactly 12 digits ({aadhaarNumber.length}/12)</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          APAAR / ABC ID *
                        </label>
                        {apaarAbcId && apaarAbcId.length === 12 && (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>12 Digits</span>
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={12}
                        pattern="\d{12}"
                        required
                        value={apaarAbcId}
                        onChange={(e) => setApaarAbcId(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 12-digit APAAR / ABC ID"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500"
                      />
                      {apaarAbcId && apaarAbcId.length !== 12 && (
                        <p className="text-[11px] text-amber-600 mt-1 font-medium">APAAR / ABC ID must contain exactly 12 digits ({apaarAbcId.length}/12)</p>
                      )}
                    </div>
                  </div>

                  {/* EDUCATION & CATEGORY ROW */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        HIGHEST QUALIFICATION *
                      </label>
                      <select
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="10TH_STANDARD">10th Standard (SSC)</option>
                        <option value="12TH_STANDARD">12th Standard (HSC)</option>
                        <option value="ITI_DIPLOMA">ITI / Vocational Trade</option>
                        <option value="POLYTECHNIC_DIPLOMA">Polytechnic Diploma</option>
                        <option value="GRADUATE">Graduate (B.Tech / B.Sc / B.Com / B.A)</option>
                        <option value="POST_GRADUATE">Post Graduate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        SOCIAL CATEGORY
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
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
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      EXISTING SKILLS
                    </label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="e.g. Python, Data Analysis, Electronics"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      TARGET CAREER GOAL
                    </label>
                    <input
                      type="text"
                      value={careerGoals}
                      onChange={(e) => setCareerGoals(e.target.value)}
                      placeholder="e.g. Embedded Robotics Engineer"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2"
                    >
                      <span>Continue to Consent</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONSENT & SUBMISSION */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Government Privacy & Data Verification Charter
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      By proceeding with this registration on the Maharashtra State Skill & Employment
                      Outcomes Platform, you agree that your training attendance, examination
                      transcripts, verified certifications, and subsequent employment outcomes (wages &
                      retention milestones) will be recorded for government auditing, policy optimization, and employer verifications.
                    </p>
                    <label className="flex items-start space-x-3 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={consentGranted}
                        onChange={(e) => setConsentGranted(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-xs text-slate-700 font-semibold">
                        I give consent for State telemetry tracking and official verification of my credentials.
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !consentGranted}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Registration Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
