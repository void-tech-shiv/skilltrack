import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, ShieldCheck, Clock, User } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Enrollment } from '../../types';

export const CompletionApprovalsV2: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/training/completions/pending').catch(() => ({ pending: [] }));
      setRecommendations(res.pending || []);
    } catch (err) {
      console.error('Error fetching completions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleApproveCompletion = async (enrollmentId: string) => {
    try {
      await api.post('/training/approve-completion', { enrollmentId, action: 'APPROVE' });
      setSuccess('Course completion officially approved! Candidate unlocked for Certificate Application.');
      fetchRecommendations();
    } catch (err: any) {
      setError(err.message || 'Failed to approve course completion.');
    }
  };

  const handleRejectCompletion = async (enrollmentId: string) => {
    try {
      await api.post('/training/approve-completion', { enrollmentId, action: 'REJECT' });
      setSuccess('Course completion returned for revision.');
      fetchRecommendations();
    } catch (err: any) {
      setError(err.message || 'Failed to reject course completion.');
    }
  };

  const columns: Column<Enrollment>[] = [
    {
      key: 'trainee',
      header: 'Learner',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">
            {item.trainee ? `${item.trainee.firstName} ${item.trainee.lastName}` : 'Candidate'}
          </p>
          <p className="text-xs text-slate-400 font-mono">{item.trainee?.canonicalId}</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course & Batch',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{item.batch?.course?.name || 'Regulated Course'}</p>
          <p className="text-[11px] text-slate-400">{item.batch?.name}</p>
        </div>
      ),
    },
    {
      key: 'attendance',
      header: 'Attendance Proof',
      render: (item) => {
        const total = item.attendance?.length || 0;
        const present = item.attendance?.filter((a: any) => a.status === 'PRESENT').length || 0;
        const pct = total > 0 ? Math.round((present / total) * 100) : 100;
        return (
          <span className="text-xs font-bold text-slate-800">
            {pct}% Verified ({present}/{total} Sessions)
          </span>
        );
      },
    },
    {
      key: 'evidence',
      header: 'Lab Evidence Submissions',
      render: (item) => {
        const verified = item.evidenceSubmissions?.filter((e: any) => e.status === 'VERIFIED').length || 0;
        return (
          <span className="text-xs font-bold text-emerald-700">
            ✓ {verified} Lab Proofs Verified
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Final Compliance Approval',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleRejectCompletion(item.id)}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl shadow-subtle transition flex items-center space-x-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>
          <button
            onClick={() => handleApproveCompletion(item.id)}
            className="px-3.5 py-1.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Course Completion & Credential Eligibility Reviews
        </h2>
        <p className="text-xs text-slate-500">
          Verify teacher-recommended course completions against the state completion matrix.
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
        data={recommendations}
        searchPlaceholder="Search candidates..."
        emptyTitle="No completion recommendations pending review"
        emptyDescription="All teacher recommendations have been validated against rule matrices."
      />
    </div>
  );
};
