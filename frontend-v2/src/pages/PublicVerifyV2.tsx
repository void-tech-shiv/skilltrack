import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Building2,
  Calendar,
  User,
  BookOpen
} from 'lucide-react';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';

export const PublicVerifyV2: React.FC = () => {
  const { certNumber } = useParams<{ certNumber?: string }>();
  const [searchId, setSearchId] = useState(certNumber || '');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const performVerification = async (idToVerify: string) => {
    if (!idToVerify.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await api.post('/certificates/verify', { certificateId: idToVerify.trim() });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Verification search encountered an issue.');
      setResult({ valid: false, status: 'NOT_FOUND', message: 'Certificate record not found in state registry.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certNumber) {
      setSearchId(certNumber);
      performVerification(certNumber);
    }
  }, [certNumber]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(searchId);
  };

  const handleReset = () => {
    setSearched(false);
    setResult(null);
    setSearchId('');
    setError(null);
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
            <p className="text-xs text-slate-500 font-semibold">
              Public State Certificate & Credential Verification Registry
            </p>
          </div>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Platform Sign In</span>
        </Link>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Verification Registry Box */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-elevated">
          {/* Header Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 mb-3 shadow-subtle">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Official Credential Verification Registry
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
              Verify the authenticity of skilling credentials issued under the Maharashtra State Innovation Society (MSInS).
            </p>
          </div>

          {/* Search Form (Always visible at top) */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter Certificate ID (e.g. CERT-MH-2026-1003)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 uppercase font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Certificate</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Verification Results Canvas */}
          {searched && result && (
            <div className="animate-in fade-in zoom-in-95 duration-200 max-w-2xl mx-auto">
              {/* CASE 1: OFFICIALLY VERIFIED & VALID */}
              {result.valid && result.status === 'ISSUED' && (
                <div className="bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 shadow-card">
                  <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-emerald-100">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Official State Seal
                      </span>
                      <h3 className="text-lg font-extrabold text-emerald-900 tracking-tight mt-0.5">
                        ✓ OFFICIALLY VERIFIED CREDENTIAL
                      </h3>
                      <p className="text-xs text-slate-500">Record authenticated in the State Blockchain Registry</p>
                    </div>
                  </div>

                  {/* Public-Safe Metadata */}
                  <div className="space-y-4 text-xs sm:text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-slate-200/80">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Recipient Name</span>
                        <p className="text-base font-extrabold text-slate-900 mt-0.5">
                          {result.certificate?.recipientName || result.recipientName || result.issuedTo || 'Verified Learner'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Certificate ID</span>
                        <p className="font-mono font-bold text-brand-700 mt-0.5">
                          {result.certificate?.certificateNumber || result.certificateNumber}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Certified Course</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {result.certificate?.courseName || result.courseName || 'Advanced Technical Program'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">Accredited Provider</span>
                          <p className="font-semibold text-slate-800 mt-0.5">
                            {result.certificate?.providerName || result.providerName || result.trainingProvider || 'State Partner'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">Issue Date</span>
                          <p className="font-semibold text-slate-800 mt-0.5">
                            {formatDate(result.certificate?.issueDate || result.issueDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-emerald-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Tamper-evident verification guarantee</span>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-xs font-bold text-brand-700 hover:underline"
                    >
                      Verify Another →
                    </button>
                  </div>
                </div>
              )}

              {/* CASE 2: REVOKED */}
              {result.status === 'REVOKED' && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 sm:p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-rose-900">CERTIFICATE REVOKED</h3>
                    <p className="text-xs text-rose-700 mt-1">
                      This certificate has been officially revoked by the State Authority.
                    </p>
                    {result.certificate?.revokedReason && (
                      <p className="text-xs font-semibold text-slate-700 mt-2 bg-white/80 p-2.5 rounded-xl border border-rose-200 max-w-md mx-auto">
                        Reason: {result.certificate.revokedReason}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* CASE 3: NOT YET ISSUED / PENDING */}
              {result.status === 'PENDING' && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-amber-900">CERTIFICATE NOT YET ISSUED</h3>
                    <p className="text-xs text-amber-700 mt-1">
                      Application is currently undergoing administrative compliance review.
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* CASE 4: NOT FOUND */}
              {(!result.valid && (result.status === 'NOT_FOUND' || !result.status)) && (
                <div className="bg-slate-50 border-2 border-slate-300 rounded-3xl p-6 sm:p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">CERTIFICATE NOT FOUND</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      No official record matches the specified certificate identifier. Please double check the ID.
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-5 py-2 bg-brand-900 text-white text-xs font-bold rounded-xl hover:bg-brand-800 transition"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500">
        © 2026 Maharashtra State Innovation Society (MSInS), Government of Maharashtra.
      </footer>
    </div>
  );
};
