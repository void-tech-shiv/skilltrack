import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Users,
  Search,
  Award,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  X
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { api } from '../../lib/api';
import { parseSkills } from '../../lib/utils';
import { TraineeProfile } from '../../types';

export const ProviderLearnersV2: React.FC = () => {
  const [learners, setLearners] = useState<TraineeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLearner, setSelectedLearner] = useState<any | null>(null);

  const fetchLearners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/trainees');
      const data = res.trainees || (Array.isArray(res) ? res : []);
      setLearners(data);
    } catch (err: any) {
      console.error('Error fetching provider learners:', err);
      setError(err.message || 'Unable to load learners. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLearners();
  }, [fetchLearners]);

  const columns: Column<TraineeProfile>[] = [
    {
      key: 'name',
      header: 'Learner Name',
      render: (item) => (
        <div>
          <button
            onClick={() => setSelectedLearner(item)}
            className="text-left font-bold text-slate-900 hover:text-brand-700 transition"
          >
            {item.firstName} {item.lastName}
          </button>
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
      render: (item) => {
        const skillsList = parseSkills(item.skills);
        if (skillsList.length === 0) {
          return <span className="text-xs text-slate-400 italic">No skills listed</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {skillsList.map((s, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md"
              >
                {s}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (item: any) => (
        <StatusBadge status={item.user?.status || 'ACTIVE'} />
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (item) => (
        <button
          onClick={() => setSelectedLearner(item)}
          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
        >
          View Profile
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Enrolled Learners Roster
          </h2>
          <p className="text-xs text-slate-500">
            Learners enrolled across your training center's accredited batches.
          </p>
        </div>

        <button
          onClick={fetchLearners}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-subtle disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800 text-xs">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={fetchLearners}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table or Loading Skeleton */}
      {loading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
          <TableSkeleton rows={5} columns={5} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={learners}
          searchPlaceholder="Search learners by name, ID, district..."
          emptyTitle="No learners enrolled"
          emptyDescription="There are currently no learners registered in your center's batches."
        />
      )}

      {/* Learner Detail Modal */}
      {selectedLearner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedLearner(null)}
              className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base shadow-sm">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {selectedLearner.firstName} {selectedLearner.lastName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{selectedLearner.canonicalId}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">District</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLearner.district || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Division</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLearner.division || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Education</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLearner.educationLevel?.replace(/_/g, ' ') || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Category</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLearner.category || 'General'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Acquired Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {parseSkills(selectedLearner.skills).map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold rounded-lg">
                      {s}
                    </span>
                  ))}
                  {parseSkills(selectedLearner.skills).length === 0 && (
                    <span className="text-xs text-slate-400 italic">No skills registered</span>
                  )}
                </div>
              </div>

              {selectedLearner.careerGoals && (
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Career Objective</p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                    {selectedLearner.careerGoals}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLearner(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
