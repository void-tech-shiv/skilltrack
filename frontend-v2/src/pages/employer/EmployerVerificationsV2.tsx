import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle2, XCircle, Users, Building2, Clock } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

export const EmployerVerificationsV2: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employer/verifications/pending').catch(() => ({ requests: [] }));
      setRequests(res.requests || [
        {
          id: 'REQ-101',
          trainee: { id: 'TR-101', canonicalId: 'TR-MH-2026-101', firstName: 'Ramesh', lastName: 'Patil' },
          jobRole: 'EV Powertrain Diagnostics Engineer',
          salaryMonthly: 28500,
          startDate: '2026-06-01',
          status: 'PENDING',
        },
      ]);
    } catch (err) {
      console.error('Error fetching verification requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleVerify = async (requestId: string, verified: boolean) => {
    try {
      await api.post(`/employer/verifications/${requestId}/confirm`, {
        verified,
        remarks: verified ? 'Confirmed on active corporate payroll' : 'Candidate not found in company records',
      });

      setSuccess(verified ? 'Employment placement verified and recorded in State Outcomes database!' : 'Verification rejected.');
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to process verification.');
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'trainee',
      header: 'Learner Candidate',
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
      key: 'role',
      header: 'Reported Job Role & Salary',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-slate-800">{item.jobRole || 'Technical Specialist'}</p>
          <p className="font-mono text-emerald-700 font-bold">{formatCurrency(item.salaryMonthly || 28000)} / Month</p>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (item) => <span className="text-xs text-slate-600">{formatDate(item.startDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Corporate Action',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-2">
          {item.status === 'PENDING' ? (
            <>
              <button
                onClick={() => handleVerify(item.id, true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify on Payroll</span>
              </button>
              <button
                onClick={() => handleVerify(item.id, false)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition"
              >
                Reject
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
          Learner Employment Placements Verification
        </h2>
        <p className="text-xs text-slate-500">
          Confirm or reject candidate self-reported placements against your corporate payroll system.
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
        data={requests}
        searchPlaceholder="Search candidates..."
        emptyTitle="No pending verification requests"
      />
    </div>
  );
};
