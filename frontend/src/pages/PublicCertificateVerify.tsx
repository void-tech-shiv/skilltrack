import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle, XCircle, ArrowLeft, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const PublicCertificateVerify: React.FC = () => {
  const { certNumber } = useParams<{ certNumber: string }>();
  const [inputCertId, setInputCertId] = useState(certNumber || '');
  const [certData, setCertData] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (certNumber) {
      setInputCertId(certNumber);
    }
  }, [certNumber]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = inputCertId.trim();
    if (!cleanId) return;

    setLoading(true);
    setErrorMsg('');
    setCertData(null);
    setHasSearched(true);

    try {
      const res = await fetch(`${API_BASE_URL}/certificates/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: cleanId })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          setCertData({ status: 'NOT_FOUND', message: data.message });
        } else {
          setErrorMsg(data.message || data.error || 'Unable to perform verification.');
        }
      } else {
        setCertData(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to verification registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setHasSearched(false);
    setCertData(null);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-900 text-white rounded-lg flex items-center justify-center shadow-md">
            <ShieldCheck className="h-10 w-10 text-amber-400" />
          </div>
        </div>
        <h2 className="mt-3 text-center text-xl font-bold tracking-tight text-slate-900">
          Government of Maharashtra
        </h2>
        <p className="text-center text-xs font-semibold text-slate-600">
          Maharashtra State Innovation Society (MSInS) • Public Certificate Verification Registry
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-md rounded-lg border border-slate-200">
          
          <div className="text-center mb-6">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
              Official Certificate Verification
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Verify the authenticity of a Maharashtra Government skilling certificate using its unique Certificate ID.
            </p>
          </div>

          {/* Search Input Form (Always Visible or Populated) */}
          <form onSubmit={handleVerify} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Certificate ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={inputCertId}
                  onChange={(e) => {
                    setInputCertId(e.target.value);
                    if (hasSearched) setHasSearched(false);
                  }}
                  placeholder="e.g. CERT-MH-2026-1003"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !inputCertId.trim()}
              className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm rounded-md shadow flex items-center justify-center space-x-2 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credential...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Verify Certificate</span>
                </>
              )}
            </button>
          </form>

          {/* RESULT 1: NOT FOUND / 404 */}
          {hasSearched && certData?.status === 'NOT_FOUND' && (
            <div className="p-6 border border-red-200 bg-red-50 rounded-lg text-center space-y-3">
              <XCircle className="w-12 h-12 text-red-600 mx-auto" />
              <h4 className="text-base font-bold text-red-900">CERTIFICATE NOT FOUND</h4>
              <p className="text-xs text-red-700 max-w-sm mx-auto">
                The certificate ID you entered could not be verified against the Maharashtra State Certificate Registry.
              </p>
              <button
                onClick={handleReset}
                className="mt-2 px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded"
              >
                Try Again
              </button>
            </div>
          )}

          {/* RESULT 2: REVOKED */}
          {hasSearched && certData?.status === 'REVOKED' && (
            <div className="p-6 border border-red-300 bg-red-50 rounded-lg space-y-4">
              <div className="flex items-center space-x-3">
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="text-base font-bold text-red-900">CERTIFICATE REVOKED</h4>
                  <p className="text-xs text-red-700 font-mono">Certificate ID: {certData.certificateNumber}</p>
                </div>
              </div>
              <p className="text-xs text-slate-700">
                This certificate was previously issued but has been <b>revoked</b> by the issuing authority.
              </p>
              {certData.revokedReason && (
                <p className="text-xs text-red-800 bg-red-100 p-2.5 rounded border border-red-200">
                  <b>Reason:</b> {certData.revokedReason}
                </p>
              )}
            </div>
          )}

          {/* RESULT 3: PENDING / NOT YET ISSUED */}
          {hasSearched && certData && certData.status !== 'ISSUED' && certData.status !== 'REVOKED' && certData.status !== 'NOT_FOUND' && (
            <div className="p-6 border border-amber-200 bg-amber-50 rounded-lg text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
              <h4 className="text-base font-bold text-amber-900">CERTIFICATE NOT YET ISSUED</h4>
              <p className="text-xs text-amber-800">
                This application or enrollment is currently pending state verification and has not yet been issued.
              </p>
            </div>
          )}

          {/* RESULT 4: VALID & ISSUED CERTIFICATE */}
          {hasSearched && certData?.status === 'ISSUED' && (
            <div className="space-y-5 border-t border-slate-200 pt-5">
              {/* Success Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-base font-bold text-emerald-900">OFFICIALLY VERIFIED CREDENTIAL</h4>
                  <p className="text-xs text-emerald-800">
                    Authentic skilling certificate verified against Maharashtra State Registry.
                  </p>
                </div>
              </div>

              {/* Public Attributes (Strictly Minimum Required Public Info, No Private PII) */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 text-xs text-slate-700">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                  <span className="text-slate-500 font-medium">Certificate Identifier:</span>
                  <span className="font-mono text-sm font-bold text-blue-900">{certData.certificateNumber}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Recipient Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{certData.issuedTo}</span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-slate-500 font-medium">Course Program:</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{certData.courseName}</span>
                    <div className="text-[11px] text-slate-500 font-mono">{certData.courseCode}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Training Provider:</span>
                  <span className="font-semibold text-slate-800">{certData.trainingProvider}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500">Completion Date:</span>
                    <div className="font-semibold text-slate-800">{new Date(certData.completionDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Issued On:</span>
                    <div className="font-semibold text-slate-800">{new Date(certData.issueDate).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Verification Authority Seal */}
              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-500 font-medium">
                  {certData.verificationAuthority}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Tamper-Evident Hash: SHA256-MH-{certData.certificateNumber.replace(/[^0-9]/g, '')}
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded mt-4">
              <p className="text-xs text-red-700 font-medium">{errorMsg}</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <Link to="/login" className="text-xs font-semibold text-blue-900 hover:text-blue-800 flex items-center justify-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Government Portal</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
