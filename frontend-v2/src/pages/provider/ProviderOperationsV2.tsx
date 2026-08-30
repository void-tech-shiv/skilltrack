import React from 'react';
import { CheckSquare, Calendar, Users, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const ProviderOperationsV2: React.FC = () => {
  const tasks = [
    {
      id: 'OP-01',
      title: 'Lab Rig Calibration - EV Battery Testbench',
      batch: 'EV Diagnostics - Batch A',
      teacher: 'Prof. Anant Kulkarni',
      status: 'VERIFIED',
      dueDate: '2026-09-05',
    },
    {
      id: 'OP-02',
      title: 'Biometric & Hour-by-Hour Attendance Log Sync',
      batch: 'Robotics Assembly - Cohort 1',
      teacher: 'Sunil Rao',
      status: 'IN_PROGRESS',
      dueDate: '2026-09-02',
    },
    {
      id: 'OP-03',
      title: 'External Practical Evidence Upload Verification',
      batch: 'Solar Inverter Servicing',
      teacher: 'Priya Joshi',
      status: 'PENDING',
      dueDate: '2026-09-03',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Training Operations & Center Readiness
        </h2>
        <p className="text-xs text-slate-500">
          Monitor training laboratory compliance, attendance synchronization, and session delivery logs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Daily Attendance Sync"
          value="98.2%"
          icon={CheckSquare}
          accentColor="emerald"
          subtitle="All sessions reported"
        />
        <StatCard
          title="Lab Workstation Capacity"
          value="45 / 50"
          icon={Users}
          accentColor="brand"
          subtitle="90% utilized"
        />
        <StatCard
          title="Pending Evidence Checks"
          value="8 Proofs"
          icon={Clock}
          accentColor="amber"
          subtitle="Awaiting teacher sign-off"
        />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">Active Center Operation Workflows</h3>
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-brand-700">{t.id}</span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{t.title}</h4>
                <p className="text-xs text-slate-500">{t.batch} • Teacher: {t.teacher}</p>
              </div>
              <div className="text-right space-y-1">
                <StatusBadge status={t.status} />
                <p className="text-[11px] text-slate-400">Due: {t.dueDate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
