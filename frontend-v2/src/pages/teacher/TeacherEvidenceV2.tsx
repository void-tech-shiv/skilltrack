import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, XCircle, ExternalLink, Clock, ShieldCheck } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { EvidenceSubmission } from '../../types';

export const TeacherEvidenceV2: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceSubmission | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const res = await api.get('/evidence/pending').catch(() => ({ pending: [] }));
      setEvidenceList(res.pending || []);
    } catch (err) {
      console.error('Error fetching evidence queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedEvidence) return;

    try {
      await api.put(`/evidence/${selectedEvidence.id}/verify`, {
        status,
        notes: verificationNotes || (status === 'VERIFIED' ? 'Verified lab evidence meets competency criteria.' : 'Evidence rejected.'),
      });

      setSuccess(`Evidence submission "${selectedEvidence.title}" marked as ${status}!`);
      setVerifyModalOpen(false);
      setSelectedEvidence(null);
      setVerificationNotes('');
      fetchEvidence();
    } catch (err: any) {
      setError(err.message || 'Failed to verify evidence.');
    }
  };

  const columns: Column<EvidenceSubmission>[] = [
    {
      key: 'title',
      header: 'Practical Evidence Title',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{item.description || 'Lab competency proof'}</p>
        </div>
      ),
    },
    {
      key: 'trainee',
      header: 'Learner',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">
            {item.trainee ? `${item.trainee.firstName} ${item.trainee.lastName}` : 'Candidate'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">{item.trainee?.canonicalId}</p>
        </div>
      ),
    },
    {
      key: 'file',
      header: 'Document Proof',
      render: (item) => (
        <a
          href={item.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-xs font-bold text-brand-600 hover:underline"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{item.fileType || 'PDF/Image'}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
    {
      key: 'status',
      header: 'Review Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Teacher Evaluation',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-2">
          {item.status === 'SUBMITTED' ? (
            <button
              onClick={() => {
                setSelectedEvidence(item);
                setVerifyModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center space-x-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Evaluate Proof</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 italic">Evaluated</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Practical Laboratory Evidence Verification
        </h2>
        <p className="text-xs text-slate-500">
          Verify external oscilloscope captures, wiring schematics, and workshop project submissions.
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

      <DataTable
        columns={columns}
        data={evidenceList}
        searchPlaceholder="Search evidence submissions..."
        emptyTitle="No lab evidence pending evaluation"
      />

      {/* Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Evaluate Lab Evidence Proof"
        subtitle={selectedEvidence?.title || 'Submission Evaluation'}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <p className="font-bold text-slate-800">Learner: {selectedEvidence?.trainee?.firstName} {selectedEvidence?.trainee?.lastName}</p>
            <p className="text-slate-600">Description: {selectedEvidence?.description || 'No remarks provided.'}</p>
            <a
              href={selectedEvidence?.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-brand-700 font-bold hover:underline pt-1"
            >
              <FileText className="w-4 h-4" />
              <span>Inspect Full Resolution Evidence File →</span>
            </a>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Teacher Verification Feedback / Sign-Off Remarks
            </label>
            <textarea
              rows={3}
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="e.g. Oscilloscope waveform meets voltage regulation tolerances."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => handleVerify('REJECTED')}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200"
            >
              Reject Evidence
            </button>
            <button
              type="button"
              onClick={() => handleVerify('VERIFIED')}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Verify & Approve Proof
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
