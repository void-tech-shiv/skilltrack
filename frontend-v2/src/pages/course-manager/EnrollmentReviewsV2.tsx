import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, Clock, Search, Calendar } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Enrollment } from '../../types';

export const EnrollmentReviewsV2: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enrollments/all').catch(() => ({ enrollments: [] }));
      setEnrollments(res.enrollments || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleApprove = async (enrollmentId: string) => {
    try {
      await api.put(`/enrollments/${enrollmentId}/status`, { status: 'ENROLLED' });
      setSuccess('Learner enrollment approved and confirmed in batch roster.');
      fetchEnrollments();
    } catch (err: any) {
      setError(err.message || 'Failed to approve enrollment.');
    }
  };

  const handleReject = async (enrollmentId: string) => {
    try {
      await api.put(`/enrollments/${enrollmentId}/status`, { status: 'DROPPED' });
      setSuccess('Learner enrollment request rejected.');
      fetchEnrollments();
    } catch (err: any) {
      setError(err.message || 'Failed to reject enrollment.');
    }
  };

  const columns: Column<Enrollment>[] = [
    {
      key: 'learner',
      header: 'Learner Applicant',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">
            {item.trainee ? `${item.trainee.firstName} ${item.trainee.lastName}` : 'Citizen Applicant'}
          </p>
          <p className="text-xs text-slate-400 font-mono">{item.trainee?.canonicalId}</p>
        </div>
      ),
    },
    {
      key: 'batch',
      header: 'Requested Batch',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{item.batch?.name}</p>
          <p className="text-[11px] text-slate-400">{item.batch?.course?.name}</p>
        </div>
      ),
    },
    {
      key: 'provider',
      header: 'Training Center',
      render: (item) => (
        <span className="text-xs text-slate-700">{item.batch?.provider?.name || 'State Partner'}</span>
      ),
    },
    {
      key: 'enrolledAt',
      header: 'Application Date',
      render: (item) => <span className="text-xs text-slate-500">{formatDate(item.enrolledAt)}</span>,
    },
    {
      key: 'status',
      header: 'Enrollment Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Review Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-2">
          {item.status === 'PENDING' ? (
            <>
              <button
                onClick={() => handleApprove(item.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </button>
              <button
                onClick={() => handleReject(item.id)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center space-x-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">Confirmed</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Learner Batch Enrollment Reviews
        </h2>
        <p className="text-xs text-slate-500">
          Review prerequisite citizen applications and seat allocations for regulated batches.
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
        data={enrollments}
        searchPlaceholder="Search enrollments by learner or batch..."
        emptyTitle="No pending enrollments"
      />
    </div>
  );
};
