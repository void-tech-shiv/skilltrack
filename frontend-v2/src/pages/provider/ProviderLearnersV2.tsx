import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, Search, Award, CheckCircle2 } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../lib/api';
import { TraineeProfile } from '../../types';

export const ProviderLearnersV2: React.FC = () => {
  const [learners, setLearners] = useState<TraineeProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLearners = async () => {
      try {
        setLoading(true);
        const res = await api.get('/trainees');
        setLearners(res.trainees || []);
      } catch (err) {
        console.error('Error fetching learners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLearners();
  }, []);

  const columns: Column<TraineeProfile>[] = [
    {
      key: 'name',
      header: 'Learner Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.firstName} {item.lastName}</p>
          <p className="text-xs text-slate-400 font-mono">{item.canonicalId}</p>
        </div>
      ),
    },
    {
      key: 'district',
      header: 'District / Division',
      render: (item) => (
        <span className="text-xs text-slate-700 font-medium">
          {item.district || 'Pune'} • {item.division || 'Pune Division'}
        </span>
      ),
    },
    {
      key: 'education',
      header: 'Education Level',
      render: (item) => (
        <span className="text-xs text-slate-700">
          {item.educationLevel?.replace(/_/g, ' ') || 'Graduate'}
        </span>
      ),
    },
    {
      key: 'skills',
      header: 'Skills Acquired',
      render: (item) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {item.skills?.map((s, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md">
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <StatusBadge status={item.user?.status || 'ACTIVE'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Enrolled Learners Roster
        </h2>
        <p className="text-xs text-slate-500">
          Learners enrolled across your center's authorized batches.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={learners}
        searchPlaceholder="Search learners by name or district..."
        emptyTitle="No learners enrolled"
      />
    </div>
  );
};
