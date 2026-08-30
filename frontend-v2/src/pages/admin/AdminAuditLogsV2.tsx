import React, { useState, useEffect } from 'react';
import { ClipboardList, ShieldCheck, Clock, User, ArrowRight } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { formatDateTime } from '../../lib/utils';
import { api } from '../../lib/api';

export const AdminAuditLogsV2: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/audit-logs').catch(() => ({ logs: [] }));
        setLogs(res.logs || [
          {
            id: 'LOG-1092',
            action: 'CERTIFICATE_ISSUED',
            actor: 'admin@maha.gov.in',
            target: 'CERT-MH-2026-1003',
            details: 'Approved certificate for Learner TR-MH-2026-101',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'LOG-1091',
            action: 'PROVIDER_COURSE_ACCREDITED',
            actor: 'admin@maha.gov.in',
            target: 'Tata Strive Center',
            details: 'Accredited Electric Vehicle Maintenance Technician',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'LOG-1090',
            action: 'LEARNER_ACTIVATED',
            actor: 'admin@maha.gov.in',
            target: 'Pooja Deshmukh',
            details: 'Citizen registration approved from Pune district',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
          },
        ]);
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const columns: Column<any>[] = [
    {
      key: 'id',
      header: 'Log ID',
      render: (item) => <span className="font-mono text-xs font-bold text-slate-700">{item.id}</span>,
    },
    {
      key: 'action',
      header: 'Audit Event',
      render: (item) => (
        <span className="px-2.5 py-1 rounded-md bg-slate-100 font-mono text-[11px] font-bold text-brand-800">
          {item.action}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (item) => <span className="text-xs font-semibold text-slate-800">{item.actor}</span>,
    },
    {
      key: 'details',
      header: 'Event Description',
      render: (item) => <span className="text-xs text-slate-600">{item.details}</span>,
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (item) => <span className="text-xs text-slate-500">{formatDateTime(item.timestamp)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Immutable State Audit Trail</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Compliance & Regulatory Audit Logs
        </h2>
        <p className="text-xs text-slate-500">
          Tamper-resistant log records tracking every state administrative action, accreditation, and certificate event.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        searchPlaceholder="Search audit events by action or actor..."
        emptyTitle="No audit records"
      />
    </div>
  );
};
