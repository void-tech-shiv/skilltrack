import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Building2, Users, MapPin, CheckCircle2 } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Batch, Course } from '../../types';

export const BatchSchedulerV2: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [batchName, setBatchName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [capacity, setCapacity] = useState(30);
  const [trainingMode, setTrainingMode] = useState<'OFFLINE' | 'HYBRID' | 'ONLINE'>('HYBRID');
  const [location, setLocation] = useState('Pune Innovation Lab');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-11-30');

  // Feedback
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, cRes, pRes] = await Promise.all([
        api.get('/batches').catch(() => ({ batches: [] })),
        api.get('/courses').catch(() => ({ courses: [] })),
        api.get('/providers').catch(() => ({ providers: [] })),
      ]);

      setBatches(bRes.batches || []);
      setCourses(cRes.courses || []);
      setProviders(pRes.providers || []);
    } catch (err) {
      console.error('Error fetching batch scheduler data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter accredited providers authorized for selected course
  const authorizedProviders = providers.filter((p) => {
    if (!courseId) return true;
    return p.authorizedCourses?.some((ac: any) => ac.courseId === courseId);
  });

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !providerId) {
      setError('Please select a course and an accredited provider.');
      return;
    }

    try {
      await api.post('/batches', {
        name: batchName,
        courseId,
        providerId,
        capacity: Number(capacity),
        trainingMode,
        location,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });

      setSuccess(`Batch "${batchName}" scheduled successfully!`);
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule batch.');
    }
  };

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
      key: 'provider',
      header: 'Accredited Partner',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-800">
          {item.provider?.name || 'State Partner'}
        </span>
      ),
    },
    {
      key: 'mode',
      header: 'Mode / Location',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[10px] text-slate-700">
            {item.trainingMode}
          </span>
          <p className="text-slate-500 text-[11px]">{item.location || 'Pune'}</p>
        </div>
      ),
    },
    {
      key: 'enrollments',
      header: 'Capacity & Enrolled',
      render: (item) => (
        <span className="text-xs font-bold text-slate-800">
          {item._count?.enrollments || 0} / {item.capacity} Learners
        </span>
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
            Batch Scheduling & Capacity Center
          </h2>
          <p className="text-xs text-slate-500">
            Schedule regulated cohorts enforcing provider accreditation rules.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Batch</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess(null)}>Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center justify-between">
          <span>✕ {error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={batches}
        searchPlaceholder="Search batches by name or provider..."
        emptyTitle="No batches scheduled"
      />

      {/* Modal: Schedule Batch */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule New Training Batch"
        subtitle="Only authorized training providers for the selected course can be assigned"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Batch Title *
            </label>
            <input
              type="text"
              required
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g. EV Diagnostics - Fall 2026 Batch A"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Course *
              </label>
              <select
                required
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              >
                <option value="">— Choose Course —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Accredited Provider *
              </label>
              <select
                required
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              >
                <option value="">— Choose Provider —</option>
                {authorizedProviders.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Capacity (Learners)
              </label>
              <input
                type="number"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Training Mode
              </label>
              <select
                value={trainingMode}
                onChange={(e) => setTrainingMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              >
                <option value="OFFLINE">Offline (In-Person)</option>
                <option value="HYBRID">Hybrid (Online + Lab)</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-900 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Schedule Batch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
