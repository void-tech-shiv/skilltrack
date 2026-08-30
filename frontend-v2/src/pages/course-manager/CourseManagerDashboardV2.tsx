import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Users,
  Award,
  CheckSquare,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { api } from '../../lib/api';

export const CourseManagerDashboardV2: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cRes, bRes] = await Promise.all([
          api.get('/courses').catch(() => ({ courses: [] })),
          api.get('/batches').catch(() => ({ batches: [] })),
        ]);

        setCourses(cRes.courses || []);
        setBatches(bRes.batches || []);
      } catch (err) {
        console.error('Error fetching course manager dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-elevated relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-xs font-bold mb-3 backdrop-blur-sm">
            <BookOpen className="w-4 h-4" />
            <span>Course & Training Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Curriculum & Batch Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Design regulated state curricula, configure modular completion matrices, schedule provider batches, and validate course completion.
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active State Courses"
          value={courses.length}
          icon={BookOpen}
          subtitle="Regulated curricula"
          accentColor="brand"
        />
        <StatCard
          title="Scheduled Batches"
          value={batches.length}
          icon={Calendar}
          subtitle="Across training centers"
          accentColor="emerald"
        />
        <StatCard
          title="Curriculum Modules"
          value={courses.reduce((acc, c) => acc + (c.modules?.length || 4), 0)}
          icon={CheckSquare}
          subtitle="With laboratory units"
          accentColor="indigo"
        />
        <StatCard
          title="Completion Approvals"
          value="18 Pending"
          icon={Award}
          subtitle="Teacher recommendations"
          accentColor="amber"
        />
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Courses */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Regulated Courses</h3>
              <p className="text-xs text-slate-500">Curricula with rule criteria</p>
            </div>
            <Link to="/course-manager/curriculum" className="text-xs font-bold text-brand-600 hover:underline">
              Curriculum Matrix →
            </Link>
          </div>

          <div className="space-y-3">
            {courses.slice(0, 4).map((c) => (
              <div key={c.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
                  <p className="text-[11px] text-slate-500">{c.code} • {c.expectedDurationHours} Hours • Min {c.attendanceRequirement}% Att</p>
                </div>
                <StatusBadge status={c.evidenceRequired ? 'EVIDENCE_REQ' : 'STANDARD'} />
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Batches */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Scheduled Batches</h3>
              <p className="text-xs text-slate-500">Live & upcoming provider cohorts</p>
            </div>
            <Link to="/course-manager/batches" className="text-xs font-bold text-brand-600 hover:underline">
              Schedule Batch →
            </Link>
          </div>

          <div className="space-y-3">
            {batches.slice(0, 4).map((b) => (
              <div key={b.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{b.name}</h4>
                  <p className="text-[11px] text-slate-500">{b.provider?.name || 'Accredited Partner'} • {b.trainingMode}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
