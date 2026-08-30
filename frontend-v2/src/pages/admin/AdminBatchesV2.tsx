import React, { useState, useEffect } from 'react';
import { Calendar, Building2, Users, MapPin, CheckCircle2 } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Batch } from '../../types';

export const AdminBatchesV2: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const res = await api.get('/batches');
        setBatches(res.batches || []);
      } catch (err) {
        console.error('Error fetching batches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  const columns: Column<Batch>[] = [
    {
      key: 'name',
      header: 'Batch Information',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-brand-600 font-semibold">{item.course?.name}</p>
        </div>
      ),
    },
    {
      key: 'provider',
      header: 'Training Provider',
      render: (item) => (
        <div className="flex items-center space-x-1.5 text-xs text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.provider?.name || 'Accredited Partner'}</span>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: 'Assigned Teacher',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-800">
          {item.trainer?.name || 'State Teacher'}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'Mode / Capacity',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
            {item.trainingMode}
          </span>
          <p className="text-slate-500 text-[11px]">{item._count?.enrollments || 0} / {item.capacity} Enrolled</p>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Timeline',
      render: (item) => (
        <div className="text-xs text-slate-600">
          <p>{formatDate(item.startDate)} - {formatDate(item.endDate)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Batch Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Accredited Training Batches
          </h2>
          <p className="text-xs text-slate-500">
            Active and scheduled classroom and laboratory sessions across Maharashtra centers.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={batches}
        searchPlaceholder="Search batches by name, course, or provider..."
        emptyTitle="No batches scheduled"
      />
    </div>
  );
};
