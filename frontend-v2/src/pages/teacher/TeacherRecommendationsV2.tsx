import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Users, Clock, ShieldCheck } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../lib/api';
import { Enrollment } from '../../types';

export const TeacherRecommendationsV2: React.FC = () => {
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

  const handleRecommend = async (enrollmentId: string) => {
    try {
      await api.post('/training/recommend-completion', { enrollmentId });
      setSuccess('Learner officially recommended for course completion to Course Manager!');
      fetchEnrollments();
    } catch (err: any) {
      setError(err.message || 'Failed to submit recommendation.');
    }
  };

  const columns: Column<Enrollment>[] = [
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
      key: 'batch',
      header: 'Batch / Course',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{item.batch?.name}</p>
          <p className="text-[11px] text-slate-500">{item.batch?.course?.name}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Current Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Teacher Action',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end">
          {item.status === 'ENROLLED' || item.status === 'IN_PROGRESS' ? (
            <button
              onClick={() => handleRecommend(item.id)}
              className="px-3.5 py-1.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center space-x-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Recommend Completion</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-semibold italic">Recommended / Completed</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Course Completion Recommendations
        </h2>
        <p className="text-xs text-slate-500">
          Recommend learners who have successfully fulfilled all training hours and practical assignments.
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
        searchPlaceholder="Search enrolled learners..."
        emptyTitle="No candidates in roster"
      />
    </div>
  );
};
