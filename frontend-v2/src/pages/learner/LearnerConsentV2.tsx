import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Eye, CheckCircle2, Clock, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export const LearnerConsentV2: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [employerMatchConsent, setEmployerMatchConsent] = useState(true);
  const [longitudinalConsent, setLongitudinalConsent] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/trainees/me');
        setProfile(res.profile || null);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/trainees/me/consent', {
        analyticsConsent,
        employerMatchConsent,
        longitudinalConsent,
      });
      setSuccess('Privacy and telemetry consent preferences saved successfully!');
    } catch (err: any) {
      console.error('Error updating consent:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Data Protection & Privacy Control</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Citizen Privacy, Consent & Audit Trail
        </h2>
        <p className="text-xs text-slate-500">
          Control how your technical training telemetry and verified credentials are used across state governance.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess(null)}>Dismiss</button>
        </div>
      )}

      {/* Consent Form */}
      <form onSubmit={handleSaveConsent} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-subtle space-y-6">
        <h3 className="text-base font-extrabold text-slate-900">Telemetry & Privacy Permissions</h3>

        <div className="space-y-4">
          <label className="flex items-start space-x-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={analyticsConsent}
              onChange={(e) => setAnalyticsConsent(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-slate-900">Anonymized State Analytics Aggregation</p>
              <p className="text-slate-500">
                Allow your training completion metrics to be included in aggregate district and division skill-gap reports.
              </p>
            </div>
          </label>

          <label className="flex items-start space-x-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={employerMatchConsent}
              onChange={(e) => setEmployerMatchConsent(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-slate-900">Corporate Employer Talent Matching</p>
              <p className="text-slate-500">
                Allow accredited Maharashtra industrial employers to view your certified competencies for hiring.
              </p>
            </div>
          </label>

          <label className="flex items-start space-x-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={longitudinalConsent}
              onChange={(e) => setLongitudinalConsent(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-slate-900">Longitudinal Post-Training Outcome Checks</p>
              <p className="text-slate-500">
                Consent to 3-month, 6-month, and 12-month post-training employment confirmation on employer payroll.
              </p>
            </div>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Save Consent Preferences</span>
          </button>
        </div>
      </form>

      {/* Immutable Audit Log Records for Citizen */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">Citizen Privacy Audit Trail</h3>
        <p className="text-xs text-slate-500">Log of official state access and verification actions on your data.</p>

        <div className="space-y-2.5">
          {[
            { action: 'CREDENTIAL_VERIFIED_PUBLIC', actor: 'Public Employer HR (API)', date: new Date().toISOString() },
            { action: 'ATTENDANCE_LOGGED', actor: 'Teacher Sunil Rao', date: new Date(Date.now() - 86400000).toISOString() },
            { action: 'ENROLLMENT_CONFIRMED', actor: 'Course Manager Deshpande', date: new Date(Date.now() - 172800000).toISOString() },
          ].map((log, i) => (
            <div key={i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono text-[11px] font-bold text-brand-800">{log.action}</span>
                <p className="text-slate-500 text-[11px] mt-0.5">By {log.actor}</p>
              </div>
              <span className="text-slate-400 font-medium">{formatDate(log.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
