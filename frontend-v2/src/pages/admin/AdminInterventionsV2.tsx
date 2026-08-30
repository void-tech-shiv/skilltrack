import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight, Sparkles, TrendingDown } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const AdminInterventionsV2: React.FC = () => {
  const flags = [
    {
      id: 'INT-001',
      district: 'Solapur',
      provider: 'Solapur Vocational Institute',
      issue: 'Drop in 6-month placement retention below 60% threshold',
      action: 'Mandatory curriculum review & local industry alignment workshop ordered',
      status: 'UNDER_INVESTIGATION',
      severity: 'HIGH',
    },
    {
      id: 'INT-002',
      district: 'Amravati',
      provider: 'Vidarbha Technical Center',
      issue: 'High non-placement rate due to lack of local EV employer ties',
      action: 'State apprenticeship subsidy paired with Mahindra & Tata EV supply chains',
      status: 'RESOLVED',
      severity: 'MEDIUM',
    },
    {
      id: 'INT-003',
      district: 'Nagpur',
      provider: 'Central India Skill Hub',
      issue: 'Repeated late attendance reporting in Solar Inverter batches',
      action: 'Provider warning notice issued by State Skilling Authority',
      status: 'ACTION_REQUIRED',
      severity: 'LOW',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full mb-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Policy Interventions</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Remedial Outcomes & Quality Interventions
        </h2>
        <p className="text-xs text-slate-500">
          Proactive quality control triggered by automated retention and placement telemetry flags.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Interventions"
          value="2"
          icon={AlertTriangle}
          accentColor="amber"
          subtitle="Quality anomalies detected"
        />
        <StatCard
          title="Resolved Cases"
          value="14"
          icon={CheckCircle2}
          accentColor="emerald"
          subtitle="Provider compliance restored"
        />
        <StatCard
          title="Average Turnaround"
          value="6 Days"
          icon={Sparkles}
          accentColor="indigo"
          subtitle="Rapid corrective response"
        />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">Flagged Centers & Policy Actions</h3>
        <div className="space-y-3">
          {flags.map((f) => (
            <div key={f.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-brand-700">{f.id}</span>
                  <span className="text-xs font-bold text-slate-800">{f.provider} ({f.district})</span>
                </div>
                <StatusBadge status={f.status} />
              </div>
              <p className="text-xs font-semibold text-rose-700">{f.issue}</p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span><b>Action:</b> {f.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
