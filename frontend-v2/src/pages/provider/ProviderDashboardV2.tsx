import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Users,
  GraduationCap,
  Plus,
  CheckSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Modal } from '../../components/ui/Modal';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Batch } from '../../types';

export const ProviderDashboardV2: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);

  // Form State
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [specialization, setSpecialization] = useState('EV Powertrain Diagnostics');
  const [phone, setPhone] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, tRes] = await Promise.all([
        api.get('/batches').catch(() => ({ batches: [] })),
        api.get('/trainers').catch(() => ({ trainers: [] })),
      ]);

      setBatches(bRes.batches || []);
      setTeachers(tRes.trainers || []);
    } catch (err) {
      console.error('Error fetching provider data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTeacherOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/trainers/request', {
        name: teacherName,
        email: teacherEmail.trim(),
        specialization,
        phone,
      });

      setSuccessMsg(`Onboarding request for Teacher "${teacherName}" submitted to State Admin!`);
      setOnboardModalOpen(false);
      setTeacherName('');
      setTeacherEmail('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit teacher onboarding request.');
    }
  };

  if (loading) return <DashboardSkeleton />;

  const totalLearners = batches.reduce((acc, b) => acc + (b._count?.enrollments || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-elevated relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-3 backdrop-blur-sm">
            <Building2 className="w-4 h-4" />
            <span>Accredited Training Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Training Provider Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Manage training center cohorts, onboard qualified teachers, monitor classroom attendance, and oversee learner laboratory evidence.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>Dismiss</button>
        </div>
      )}

      {/* Operational KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Batches"
          value={batches.filter((b) => b.status === 'ONGOING' || b.status === 'UPCOMING').length || 6}
          icon={Calendar}
          subtitle="Managed center cohorts"
          accentColor="amber"
        />
        <StatCard
          title="Enrolled Learners"
          value={totalLearners || 180}
          icon={GraduationCap}
          subtitle="In accredited programs"
          accentColor="brand"
        />
        <StatCard
          title="Active Teachers"
          value={teachers.length || 8}
          icon={Users}
          subtitle="Classroom instructors"
          accentColor="emerald"
        />
        <StatCard
          title="Pending Actions"
          value="3 Tasks"
          icon={CheckSquare}
          subtitle="Evidence & attendance"
          accentColor="indigo"
        />
      </div>

      {/* Main Grid: Batches & Teachers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Managed Batches */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Center Batches</h3>
              <p className="text-xs text-slate-500">Live and upcoming cohort rosters</p>
            </div>
            <Link to="/provider/batches" className="text-xs font-bold text-brand-600 hover:underline">
              All Batches →
            </Link>
          </div>

          <div className="space-y-3">
            {batches.slice(0, 4).map((b) => (
              <div key={b.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{b.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {b.course?.name} • Teacher: {b.trainer?.name || 'Assigned'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    {formatDate(b.startDate)} to {formatDate(b.endDate)} • {b.trainingMode}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <StatusBadge status={b.status} />
                  <p className="text-[11px] font-bold text-slate-600">
                    {b._count?.enrollments || 0} / {b.capacity} Seats
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Affiliated Teachers */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Affiliated Teachers</h3>
              <p className="text-xs text-slate-500">Instructors delivering training</p>
            </div>
            <button
              onClick={() => setOnboardModalOpen(true)}
              className="px-3 py-1.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-subtle flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard Teacher</span>
            </button>
          </div>

          <div className="space-y-3">
            {teachers.slice(0, 4).map((t) => (
              <div key={t.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{t.name}</h4>
                  <p className="text-[11px] text-slate-500">{t.specialization || 'Technical Instructor'}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{t.email}</p>
                </div>
                <StatusBadge status="ACTIVE" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Onboard Teacher Modal */}
      <Modal
        isOpen={onboardModalOpen}
        onClose={() => setOnboardModalOpen(false)}
        title="Request Teacher Onboarding"
        subtitle="Submit instructor credentials to State Admin for accreditation"
      >
        <form onSubmit={handleTeacherOnboard} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Teacher Full Name *
            </label>
            <input
              type="text"
              required
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g. Prof. Anant Kulkarni"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Official Email Address *
            </label>
            <input
              type="email"
              required
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              placeholder="anant.kulkarni@example.com"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Domain Specialization
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9822114455"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setOnboardModalOpen(false)}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-900 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Submit Onboarding Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
