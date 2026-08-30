import React, { useState, useEffect } from 'react';
import { Calendar, Users, Building2, MapPin, Clock } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Batch } from '../../types';

export const ProviderBatchesV2: React.FC = () => {
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
      header: 'Batch Title & Course',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-brand-600 font-semibold">{item.course?.name}</p>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: 'Assigned Teacher',
      render: (item) => (
        <span className="text-xs font-bold text-slate-800">
          {item.trainer?.name || 'Assigned Instructor'}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'Enrolled / Capacity',
      render: (item) => (
        <span className="text-xs font-bold text-slate-800">
          {item._count?.enrollments || 0} / {item.capacity} Learners
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Batch Schedule',
      render: (item) => (
        <span className="text-xs text-slate-600">
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Managed Center Batches
        </h2>
        <p className="text-xs text-slate-500">
          Cohort delivery tracking, class schedules, and learner capacity management.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={batches}
        searchPlaceholder="Search batches..."
        emptyTitle="No center batches found"
      />
    </div>
  );
};
