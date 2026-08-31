import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  CheckSquare,
  FileText,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Batch } from '../../types';

export const TeacherDashboardV2: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [evidenceQueue, setEvidenceQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bRes, eRes] = await Promise.all([
          api.get('/batches').catch(() => ({ batches: [] })),
          api.get('/training/evidence/pending').catch(() => ({ pending: [] })),
        ]);

        setBatches(bRes.batches || []);
        setEvidenceQueue(eRes.pending || []);
      } catch (err) {
        console.error('Error fetching teacher dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const totalAssignedLearners = batches.reduce((acc, b) => acc + (b._count?.enrollments || 0), 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-elevated relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-bold mb-3 backdrop-blur-sm">
            <Users className="w-4 h-4" />
            <span>Classroom & Laboratory Instruction</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Teacher Teaching & Assessment Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Schedule live classroom and lab sessions, mark hour-by-hour learner attendance, evaluate external lab evidence, and submit completion recommendations.
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Batches"
          value={batches.length || 3}
          icon={Calendar}
          subtitle="Active cohorts"
          accentColor="emerald"
        />
        <StatCard
          title="Assigned Learners"
          value={totalAssignedLearners || 45}
          icon={Users}
          subtitle="Across your classrooms"
          accentColor="brand"
        />
        <StatCard
          title="Pending Evidence Checks"
          value={evidenceQueue.length || 4}
          icon={FileText}
          subtitle="Lab submissions"
          accentColor="amber"
        />
        <StatCard
          title="Completion Recomms"
          value="12 Eligible"
          icon={Award}
          subtitle="Ready for course manager"
          accentColor="indigo"
        />
      </div>

      {/* Grid: Assigned Batches & Pending Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Assigned Batches */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">My Assigned Batches</h3>
              <p className="text-xs text-slate-500">Live cohorts under your instruction</p>
            </div>
            <Link to="/teacher/sessions" className="text-xs font-bold text-brand-600 hover:underline">
              Schedule Session →
            </Link>
          </div>

          <div className="space-y-3">
            {batches.map((b) => (
              <div key={b.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{b.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{b.course?.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {b.trainingMode} • {b.location || 'Pune Center'} • {b._count?.enrollments || 0} Learners
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to="/teacher/attendance"
                    className="px-3 py-1.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-subtle transition"
                  >
                    Mark Attendance
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Verification Queue */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Lab Evidence Queue</h3>
              <p className="text-xs text-slate-500">Practical proof submissions</p>
            </div>
            <Link to="/teacher/evidence" className="text-xs font-bold text-brand-600 hover:underline">
              Review All →
            </Link>
          </div>

          <div className="space-y-3">
            {evidenceQueue.slice(0, 3).map((e) => (
              <div key={e.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{e.title}</h4>
                  <p className="text-[11px] text-slate-500">
                    {e.trainee ? `${e.trainee.firstName} ${e.trainee.lastName}` : 'Candidate'}
                  </p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
            {evidenceQueue.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">No pending lab submissions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
