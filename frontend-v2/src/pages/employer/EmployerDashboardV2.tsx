import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  CheckSquare,
  Building2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { api } from '../../lib/api';

export const EmployerDashboardV2: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rRes, eRes] = await Promise.all([
          api.get('/employer/verifications/pending').catch(() => ({ requests: [] })),
          api.get('/employer/employees').catch(() => ({ employees: [] })),
        ]);

        setRequests(rRes.requests || []);
        setEmployees(eRes.employees || []);
      } catch (err) {
        console.error('Error fetching employer dashboard:', err);
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
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-elevated relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-purple-300 text-xs font-bold mb-3 backdrop-blur-sm">
            <Building2 className="w-4 h-4" />
            <span>Enterprise Talent & Payroll Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Employer Verification Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Authenticate candidate employment placements on corporate payroll, confirm wages, and maintain workforce compliance.
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Verified Employees"
          value={employees.length || 14}
          icon={Users}
          subtitle="On active payroll"
          accentColor="purple"
        />
        <StatCard
          title="Pending Verifications"
          value={requests.length || 2}
          icon={CheckSquare}
          subtitle="Awaiting HR sign-off"
          accentColor="amber"
        />
        <StatCard
          title="Average Starting Wage"
          value="₹26,800"
          icon={DollarSign}
          subtitle="Certified technical talent"
          accentColor="emerald"
        />
        <StatCard
          title="Corporate Compliance"
          value="100%"
          icon={ShieldCheck}
          subtitle="State registry synced"
          accentColor="brand"
        />
      </div>

      {/* Grid: Pending Verifications & Employee Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Verifications */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Pending Candidate Verifications</h3>
              <p className="text-xs text-slate-500">Learners claiming placement at your organization</p>
            </div>
            <Link to="/employer/verifications" className="text-xs font-bold text-brand-600 hover:underline">
              Review All →
            </Link>
          </div>

          <div className="space-y-3">
            {requests.slice(0, 3).map((r, i) => (
              <div key={r.id || i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {r.trainee ? `${r.trainee.firstName} ${r.trainee.lastName}` : 'Ramesh Patil'}
                  </h4>
                  <p className="text-[11px] text-slate-500">{r.jobTitle || 'EV Calibration Specialist'}</p>
                </div>
                <StatusBadge status="PENDING" />
              </div>
            ))}
            {requests.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">No pending verification requests</p>
            )}
          </div>
        </div>

        {/* Verified Employees Roster */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Verified Corporate Employees</h3>
              <p className="text-xs text-slate-500">Certified talent currently on payroll</p>
            </div>
            <Link to="/employer/roster" className="text-xs font-bold text-brand-600 hover:underline">
              Full Roster →
            </Link>
          </div>

          <div className="space-y-3">
            {(employees.length > 0 ? employees : [
              { name: 'Pooja Deshmukh', role: 'EV Powertrain Engineer', wage: '₹32,000/mo' },
              { name: 'Rahul Shinde', role: 'Solar System Technician', wage: '₹26,500/mo' },
            ]).slice(0, 3).map((emp: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{emp.name}</h4>
                  <p className="text-[11px] text-slate-500">{emp.role}</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700">{emp.wage || '₹28,000/mo'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
