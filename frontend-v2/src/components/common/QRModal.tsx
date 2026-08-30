import React from 'react';
import { Modal } from '../ui/Modal';
import { ShieldCheck, Copy, Check, ExternalLink } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificateNumber: string;
  recipientName: string;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  certificateNumber,
  recipientName,
}) => {
  const [copied, setCopied] = React.useState(false);
  const verifyUrl = `${window.location.origin}/verify/${certificateNumber}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=0f172a&margin=8`;

  const handleCopy = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Public QR Code Verification"
      subtitle="Scan with any smartphone camera to verify this credential"
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* QR Code Container */}
        <div className="p-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl shadow-card">
          <img
            src={qrApiUrl}
            alt={`QR Verification for ${certificateNumber}`}
            className="w-48 h-48 rounded-xl"
          />
        </div>

        <div>
          <h4 className="font-bold text-slate-900 text-sm">{recipientName}</h4>
          <p className="font-mono text-xs text-brand-700 font-semibold">{certificateNumber}</p>
        </div>

        {/* Verification Link Input */}
        <div className="w-full">
          <div className="flex items-center space-x-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <input
              type="text"
              readOnly
              value={verifyUrl}
              className="bg-transparent flex-1 text-slate-600 outline-none truncate font-mono text-[11px]"
            />
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
              title="Copy verification link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Cryptographically validated by MSInS Registry</span>
        </div>
      </div>
    </Modal>
  );
};
