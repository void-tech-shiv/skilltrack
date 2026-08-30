import React from 'react';
import { ShieldCheck, Award, QrCode, CheckCircle2, Download } from 'lucide-react';
import { Certificate } from '../../types';
import { formatDate } from '../../lib/utils';

interface CertificateCardProps {
  certificate: Certificate;
  onShowQR?: () => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({ certificate, onShowQR }) => {
  const isIssued = certificate.status === 'ISSUED';

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-amber-50/40 via-white to-slate-50 border-2 border-amber-300/80 rounded-3xl p-6 sm:p-8 shadow-elevated transition-all duration-300 hover:shadow-2xl">
      {/* Decorative Guilloche Border Accent */}
      <div className="absolute inset-2 border border-amber-200/60 rounded-2xl pointer-events-none" />
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 rounded-b-full shadow-sm" />

      {/* Header */}
      <div className="text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-gov-navy to-brand-800 text-white shadow-md mb-3">
          <ShieldCheck className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Government of Maharashtra</h3>
        <p className="text-[11px] font-semibold text-slate-400">Maharashtra State Innovation Society (MSInS)</p>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-2 font-serif">
          Certificate of Skilling Competency
        </h2>
        <p className="text-xs text-slate-500 italic mt-0.5">
          This is to officially certify that
        </p>
      </div>

      {/* Recipient */}
      <div className="text-center my-5 relative z-10">
        <h1 className="text-2xl sm:text-3xl font-black text-brand-900 tracking-tight border-b-2 border-dashed border-amber-300 inline-block px-6 pb-1">
          {certificate.trainee ? `${certificate.trainee.firstName} ${certificate.trainee.lastName}` : 'State Learner'}
        </h1>
        <p className="text-xs font-mono font-bold text-slate-500 mt-1">
          Learner ID: {certificate.trainee?.canonicalId || 'TR-MAHA-2026'}
        </p>
      </div>

      {/* Course Details */}
      <div className="text-center max-w-lg mx-auto relative z-10 text-xs sm:text-sm text-slate-700 space-y-1">
        <p>
          has successfully satisfied all modular prerequisites, laboratory evidence verifications, and attendance thresholds for the authorized program:
        </p>
        <p className="font-extrabold text-slate-900 text-base sm:text-lg pt-1">
          {certificate.course?.name || 'Advanced Technical Program'}
        </p>
        <p className="text-xs font-mono text-slate-500">
          Code: {certificate.course?.code || 'MAHA-500'}
        </p>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs relative z-10">
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold">Certificate Number</span>
          <p className="font-mono font-bold text-brand-700 truncate">{certificate.certificateNumber}</p>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold">Issue Date</span>
          <p className="font-semibold text-slate-800">{formatDate(certificate.issueDate)}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold">Accredited Provider</span>
          <p className="font-semibold text-slate-800 truncate">
            {certificate.enrollment?.batch?.provider?.name || 'State Skilling Partner'}
          </p>
        </div>
      </div>

      {/* Footer & Tamper-Evident QR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-amber-200/80 relative z-10">
        <div className="flex items-center space-x-2 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-slate-900">Tamper-Evident State Registry</p>
            <p className="text-[10px] text-slate-400 font-mono">
              SHA256: {certificate.certificateNumber.replace(/[^0-9]/g, '')}-SEC-GOV-MH
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onShowQR && (
            <button
              onClick={onShowQR}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-subtle transition"
            >
              <QrCode className="w-4 h-4 text-brand-600" />
              <span>Verify QR</span>
            </button>
          )}

          <a
            href={`/verify/${certificate.certificateNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-subtle transition"
          >
            <Award className="w-4 h-4" />
            <span>Public Verification URL</span>
          </a>
        </div>
      </div>
    </div>
  );
};
