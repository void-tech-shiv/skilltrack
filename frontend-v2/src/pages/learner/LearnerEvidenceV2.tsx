import React, { useState, useEffect } from 'react';
import { FileText, Plus, ExternalLink, CheckCircle2, Clock, UploadCloud, AlertCircle } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { EvidenceSubmission, Enrollment } from '../../types';

export const LearnerEvidenceV2: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceSubmission[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Form State
  const [enrollmentId, setEnrollmentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('https://storage.googleapis.com/maha-evidence/lab-waveform-scope-sample.pdf');
  const [fileType, setFileType] = useState('PDF Document');

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eRes, enRes] = await Promise.all([
        api.get('/trainees/me/evidence').catch(() => ({ submissions: [] })),
        api.get('/trainees/me/enrollments').catch(() => ({ enrollments: [] })),
      ]);

      setEvidenceList(eRes.submissions || []);
      setEnrollments(enRes.enrollments || []);
      if (enRes.enrollments?.length > 0 && !enrollmentId) {
        setEnrollmentId(enRes.enrollments[0].id);
      }
    } catch (err) {
      console.error('Error fetching evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentId || !title) return;

    try {
      await api.post('/evidence/submit', {
        enrollmentId,
        title,
        description,
        fileUrl,
        fileType,
      });

      setSuccess(`Lab evidence "${title}" submitted to your assigned teacher for verification!`);
      setUploadModalOpen(false);
      setTitle('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit evidence proof.');
    }
  };

  const columns: Column<EvidenceSubmission>[] = [
    {
      key: 'title',
      header: 'Practical Evidence Title',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{item.description || 'Lab proof'}</p>
        </div>
      ),
    },
    {
      key: 'file',
      header: 'Proof File',
      render: (item) => (
        <a
          href={item.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-xs font-bold text-brand-600 hover:underline"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{item.fileType || 'Evidence Document'}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
    {
      key: 'status',
      header: 'Teacher Verification',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'notes',
      header: 'Feedback / Remarks',
      render: (item) => (
        <span className="text-xs text-slate-600 italic">
          {item.verificationNotes || 'Pending teacher sign-off'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Practical Laboratory Evidence Submissions
          </h2>
          <p className="text-xs text-slate-500">
            Upload oscilloscope waveforms, wiring schematics, and workshop verification logs.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Lab Evidence</span>
        </button>
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
        emptyTitle="No lab evidence uploaded"
        emptyDescription="Upload practical proofs required for certificate eligibility."
      />

      {/* Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Practical Laboratory Evidence"
        subtitle="Provide technical documentation for instructor evaluation"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Enrolled Batch *
            </label>
            <select
              required
              value={enrollmentId}
              onChange={(e) => setEnrollmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            >
              {enrollments.map((en) => (
                <option key={en.id} value={en.id}>
                  {en.batch?.course?.name} ({en.batch?.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Evidence Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inverter Oscilloscope PWM Trace Calibration"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Laboratory Methodology
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the lab test conducted..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              File URL / Cloud Storage Proof
            </label>
            <input
              type="url"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-900 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Submit for Verification
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
