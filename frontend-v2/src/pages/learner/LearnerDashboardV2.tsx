import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Calendar,
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Course, Enrollment, Certificate } from '../../types';

export const LearnerDashboardV2: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLearnerData = async () => {
      try {
        setLoading(true);
        const [pRes, eRes, cRes, rRes] = await Promise.all([
          api.get('/trainees/me').catch(() => ({ profile: null })),
          api.get('/enrollments').catch(() => ({ enrollments: [] })),
          api.get('/certificates/my').catch(() => ({ certificates: [] })),
          api.get('/courses/recommendations').catch(() => ({ recommendations: [] })),
        ]);

        setProfile(pRes.profile || null);
        setEnrollments(eRes.enrollments || []);
        setCertificates(cRes.certificates || []);
        setRecommendations(rRes.recommendations || []);
      } catch (err) {
        console.error('Error fetching learner dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLearnerData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const learnerName = profile ? `${profile.firstName} ${profile.lastName}` : (user?.name || 'Citizen Learner');

  return (
    <div className="space-y-6">
      {/* Hero Greeting Section */}
      <div className="bg-gradient-to-r from-gov-navy via-slate-900 to-brand-950 p-6 sm:p-8 rounded-3xl text-white shadow-elevated relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 bg-white/10 text-sky-300 border border-white/10 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
              State Learner Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {learnerName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Continue your skill development journey. Track module progression, classroom attendance, laboratory evidence proofs, and state certificates.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center space-x-4">
            <ProgressRing value={82} size={80} strokeWidth={6} label="PROGRESS" variant="emerald" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-white">Overall Skilling</p>
              <p className="text-slate-300">82% Completed</p>
              <p className="text-[11px] text-emerald-400 font-bold">On track for certificate</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards with Visual Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Enrollments"
          value={enrollments.length || 1}
          icon={BookOpen}
          subtitle="Regulated batches"
          accentColor="brand"
        />
        <StatCard
          title="Attendance Metric"
          value="91.4%"
          icon={CheckCircle2}
          trend={{ value: '+4.2%', isPositive: true, label: 'above 80% req' }}
          accentColor="emerald"
        />
        <StatCard
          title="Practical Lab Proofs"
          value="4 Verified"
          icon={FileText}
          subtitle="Evidence submissions"
          accentColor="indigo"
        />
        <StatCard
          title="State Certificates"
          value={certificates.length}
          icon={Award}
          subtitle="QR Credential Verified"
          accentColor="amber"
        />
      </div>

      {/* Main Grid: Current Training, AI Skill Gaps, & Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Current Active Training Progress */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Current Training Progress</h3>
              <p className="text-xs text-slate-500">Active cohort module completions & attendance</p>
            </div>
            <Link to="/learner/training" className="text-xs font-bold text-brand-600 hover:underline">
              Training Hub →
            </Link>
          </div>

          <div className="space-y-4">
            {enrollments.map((en) => (
              <div key={en.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {en.batch?.course?.name || 'Electric Vehicle Maintenance Technician'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Batch: {en.batch?.name} • Center: {en.batch?.provider?.name || 'Tata Strive'}
                    </p>
                  </div>
                  <StatusBadge status={en.status} />
                </div>

                {/* Progress Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <ProgressBar value={82} label="Course Modular Progress" variant="brand" />
                  <ProgressBar value={91} label="Session Attendance" variant="emerald" />
                </div>
              </div>
            ))}

            {enrollments.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                You are not currently enrolled in any active cohorts.
                <Link to="/learner/skills" className="block text-brand-600 font-bold mt-2 hover:underline">
                  Discover Recommended Courses →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Career & Skill Gap Telemetry */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>AI Skill Gap Match</span>
              </h4>
              <Link to="/learner/skills" className="text-xs font-bold text-brand-600 hover:underline">
                Explore
              </Link>
            </div>

            <p className="text-xs text-slate-600">
              Based on your career target (<b>{profile?.careerGoals || 'Technical Specialist'}</b>):
            </p>

            <div className="space-y-2">
              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-brand-900">EV Diagnostics & CAN Bus</p>
                  <p className="text-[10px] text-brand-700">High State Industry Demand</p>
                </div>
                <span className="px-2 py-0.5 bg-brand-600 text-white font-bold text-[10px] rounded-full">
                  94% Match
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-emerald-900">Solar Inverter Safety</p>
                  <p className="text-[10px] text-emerald-700">Renewable Energy Track</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-full">
                  88% Match
                </span>
              </div>
            </div>
          </div>

          {/* Certificate Quick Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Verified Credentials
              </h4>
              <Link to="/learner/certificates" className="text-xs font-bold text-brand-600 hover:underline">
                View All
              </Link>
            </div>

            {certificates.slice(0, 1).map((cert) => (
              <div key={cert.id} className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center space-x-3">
                <Award className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-xs truncate">{cert.course?.name || 'Technical Course'}</p>
                  <p className="font-mono text-[10px] text-brand-700 font-bold">{cert.certificateNumber}</p>
                </div>
              </div>
            ))}

            {certificates.length === 0 && (
              <p className="text-xs text-slate-400 py-3 text-center">
                Complete your course to unlock official state certification.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
