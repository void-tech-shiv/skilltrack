import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Clock, BookOpen, User, Building2 } from 'lucide-react';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Enrollment } from '../../types';

export const LearnerTrainingV2: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const res = await api.get('/enrollments');
        setEnrollments(res.enrollments || []);
      } catch (err) {
        console.error('Error fetching learner training:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          My Enrolled Training Batches
        </h2>
        <p className="text-xs text-slate-500">
          Track syllabus modules, classroom attendance hours, and scheduled live sessions.
        </p>
      </div>

      <div className="space-y-6">
        {enrollments.map((en) => (
          <div
            key={en.id}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-brand-700">
                  {en.batch?.course?.code || 'MAHA-EV-401'}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {en.batch?.course?.name || 'Technical Course'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Batch: <b>{en.batch?.name}</b> • Center: <b>{en.batch?.provider?.name || 'Accredited Center'}</b>
                </p>
              </div>
              <StatusBadge status={en.status} />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <ProgressBar value={82} label="Modular Completion" variant="brand" />
                <p className="text-[11px] text-slate-500">4 of 5 Modules Completed</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <ProgressBar value={91} label="Session Attendance" variant="emerald" />
                <p className="text-[11px] text-slate-500">38 of 42 Hours Attended</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <ProgressBar value={100} label="Lab Evidence Proofs" variant="indigo" />
                <p className="text-[11px] text-slate-500">All Practical Evidence Verified</p>
              </div>
            </div>

            {/* Modules List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Course Syllabus Units
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { num: 1, name: 'High-Voltage Safety Protocols', status: 'COMPLETED' },
                  { num: 2, name: 'Battery Chemistry & Pack Architecture', status: 'COMPLETED' },
                  { num: 3, name: 'BMS Fault Diagnostics & CAN Protocol', status: 'COMPLETED' },
                  { num: 4, name: 'Inverter & Motor Controller Tuning', status: 'IN_PROGRESS' },
                  { num: 5, name: 'Regenerative Braking Systems Lab', status: 'UPCOMING' },
                ].map((m) => (
                  <div key={m.num} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      Unit {m.num}: {m.name}
                    </span>
                    <StatusBadge status={m.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {enrollments.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
            <p className="text-sm font-bold text-slate-700">No Active Enrollments</p>
            <p className="text-xs text-slate-400">Discover accredited courses and apply to an upcoming cohort.</p>
          </div>
        )}
      </div>
    </div>
  );
};
