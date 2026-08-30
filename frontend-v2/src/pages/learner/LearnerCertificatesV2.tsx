import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Clock, QrCode, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { CertificateCard } from '../../components/common/CertificateCard';
import { QRModal } from '../../components/common/QRModal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { api } from '../../lib/api';
import { Certificate, Enrollment } from '../../types';

export const LearnerCertificatesV2: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [eligibilities, setEligibilities] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // QR Modal
  const [qrModalData, setQrModalData] = useState<{ isOpen: boolean; certNumber: string; recipient: string }>({
    isOpen: false,
    certNumber: '',
    recipient: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, eRes] = await Promise.all([
        api.get('/certificates/my').catch(() => ({ certificates: [] })),
        api.get('/enrollments').catch(() => ({ enrollments: [] })),
      ]);

      const enrollmentsList = eRes.enrollments || [];
      const eligData: Record<string, any> = {};

      // Fetch eligibility dynamically for each enrollment
      await Promise.all(
        enrollmentsList.map(async (en: any) => {
          const res = await api.get(`/certificates/eligibility/${en.id}`).catch(() => null);
          if (res) {
            eligData[en.id] = {
              isEligible: res.isEligible,
              criteria: res.criteria,
            };
          }
        })
      );

      setCertificates(cRes.certificates || []);
      setEnrollments(enrollmentsList);
      setEligibilities(eligData);
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (enrollmentId: string) => {
    try {
      setApplying(true);
      setError(null);
      await api.post('/certificates/apply', { enrollmentId });
      setSuccess('Certificate application submitted to State Admin for regulatory approval!');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit certificate application.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full mb-1">
          <Award className="w-3.5 h-3.5" />
          <span>Government Authenticated Credentials</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          My State Skilling Certificates
        </h2>
        <p className="text-xs text-slate-500">
          Cryptographically signed, tamper-evident credentials issued by the Maharashtra State Innovation Society.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess(null)}>Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center justify-between">
          <span>✕ {error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Section 1: Issued Certificates */}
      {certificates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">Official Issued Credentials</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <CertificateCard
                key={cert.id}
                certificate={cert}
                onShowQR={() =>
                  setQrModalData({
                    isOpen: true,
                    certNumber: cert.certificateNumber,
                    recipient: cert.trainee ? `${cert.trainee.firstName} ${cert.trainee.lastName}` : 'State Learner',
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Certificate Eligibility & Applications */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-subtle space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Certificate Eligibility Rule Matrix</h3>
          <p className="text-xs text-slate-500">
            Fulfill mandatory attendance (≥80%), syllabus units, and verified lab evidence to apply.
          </p>
        </div>

        <div className="space-y-4">
          {enrollments.map((en) => {
            const hasCert = certificates.some((c) => c.enrollmentId === en.id);
            if (hasCert) return null;

            const eligibility = eligibilities[en.id];
            const isEligible = eligibility?.isEligible && en.status === 'COMPLETED';

            return (
              <div key={en.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{en.batch?.course?.name}</h4>
                    <p className="text-xs text-slate-500">{en.batch?.name} • {en.batch?.provider?.name}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-subtle">
                    Status: {en.status}
                  </span>
                </div>

                {eligibility ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Attendance</span>
                      <p className={`font-bold mt-0.5 ${eligibility.criteria.attendanceEligible ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {eligibility.criteria.attendanceEligible ? '✓' : '✕'} {eligibility.criteria.attendancePercent}% (Threshold {eligibility.criteria.attendanceRequired}%)
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Curriculum Units</span>
                      <p className={`font-bold mt-0.5 ${eligibility.criteria.moduleEligible ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {eligibility.criteria.moduleEligible ? '✓' : '✕'} {eligibility.criteria.modulePercent}% Completed
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Practical Evidence</span>
                      <p className={`font-bold mt-0.5 ${eligibility.criteria.evidenceEligible ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {eligibility.criteria.evidenceEligible ? '✓ Lab Proofs Verified' : '✕ Lab Proofs Missing'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic py-2">Loading eligibility metrics...</div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <div className={`flex items-center space-x-1.5 text-xs font-bold ${isEligible ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {isEligible ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>All Regulatory Thresholds Met</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Ineligible (Pending Manager Approval or Thresholds)</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleApply(en.id)}
                    disabled={applying || !isEligible}
                    className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {applying ? 'Submitting...' : 'Apply for Official Certificate'}
                  </button>
                </div>
              </div>
            );
          })}

          {enrollments.length === 0 && certificates.length === 0 && (
            <p className="text-xs text-slate-400 py-6 text-center">
              No active course enrollments found. Enroll in a batch to earn your state certification.
            </p>
          )}
        </div>
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData({ ...qrModalData, isOpen: false })}
        certificateNumber={qrModalData.certNumber}
        recipientName={qrModalData.recipient}
      />
    </div>
  );
};
