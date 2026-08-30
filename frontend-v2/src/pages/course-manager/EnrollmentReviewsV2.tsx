import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, Clock, Search, Calendar, AlertCircle } from 'lucide-react';
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

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

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

  const confirmApprove = async () => {
    if (!approvingId) return;
    try {
      setProcessing(true);
      setError(null);
      await api.put(`/enrollments/${approvingId}/status`, { status: 'ENROLLED' });
      setSuccess('Enrollment approved successfully.');
      setApprovingId(null);
      fetchEnrollments();
    } catch (err: any) {
      setError('Unable to approve this enrollment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    if (!rejectionReason.trim()) return;
    try {
      setProcessing(true);
      setError(null);
      await api.put(`/enrollments/${rejectingId}/status`, { status: 'REJECTED', rejectionReason });
      setSuccess('Enrollment rejected successfully.');
      setRejectingId(null);
      setRejectionReason('');
      fetchEnrollments();
    } catch (err: any) {
      setError('Unable to reject this enrollment. Please try again.');
    } finally {
      setProcessing(false);
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
      render: (item) => {
        if (item.status === 'REQUESTED' || item.status === 'PENDING') {
          return (
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setApprovingId(item.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => setRejectingId(item.id)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center space-x-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          );
        }
        
        if (item.status === 'REJECTED') {
          return <span className="text-xs font-bold text-rose-600">Rejected</span>;
        }

        return <span className="text-xs font-bold text-emerald-600">Approved / Enrolled</span>;
      },
    },
  ];

  const approvingEnrollment = enrollments.find(e => e.id === approvingId);
  const rejectingEnrollment = enrollments.find(e => e.id === rejectingId);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Learner Batch Enrollment Reviews
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review prerequisite citizen applications and seat allocations for regulated batches.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="hover:text-emerald-900">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:text-rose-900">Dismiss</button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={enrollments}
        searchPlaceholder="Search enrollments by learner or batch..."
        emptyTitle="No pending enrollments"
      />

      {/* Approve Modal */}
      {approvingId && approvingEnrollment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Approve Enrollment?</h3>
            <div className="mb-6 space-y-3">
              <p className="text-sm text-slate-600">
                Are you sure you want to approve this learner's enrollment?
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm">
                <p><span className="font-semibold text-slate-700">Learner:</span> {approvingEnrollment.trainee?.firstName} {approvingEnrollment.trainee?.lastName}</p>
                <p><span className="font-semibold text-slate-700">Batch:</span> {approvingEnrollment.batch?.name}</p>
                <p><span className="font-semibold text-slate-700">Course:</span> {approvingEnrollment.batch?.course?.name}</p>
                <p><span className="font-semibold text-slate-700">Center:</span> {approvingEnrollment.batch?.provider?.name || 'State Partner'}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                disabled={processing}
                onClick={() => setApprovingId(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                disabled={processing}
                onClick={confirmApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center disabled:opacity-50"
              >
                {processing ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && rejectingEnrollment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Reject Enrollment</h3>
            <div className="mb-6 space-y-3">
              <p className="text-sm text-slate-600">
                Please provide a reason for rejecting this learner's enrollment.
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm">
                <p><span className="font-semibold text-slate-700">Learner:</span> {rejectingEnrollment.trainee?.firstName} {rejectingEnrollment.trainee?.lastName}</p>
                <p><span className="font-semibold text-slate-700">Batch:</span> {rejectingEnrollment.batch?.name}</p>
                <p><span className="font-semibold text-slate-700">Course:</span> {rejectingEnrollment.batch?.course?.name}</p>
              </div>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection (required)..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                disabled={processing}
                onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                disabled={processing || !rejectionReason.trim()}
                onClick={confirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center disabled:opacity-50"
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

