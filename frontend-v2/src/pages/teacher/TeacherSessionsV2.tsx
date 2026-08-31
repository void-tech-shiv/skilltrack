import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Users, BookOpen, CheckCircle2 } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Batch, TrainingSession } from '../../types';

export const TeacherSessionsV2: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [batchId, setBatchId] = useState('');
  const [topic, setTopic] = useState('');
  const [plannedHours, setPlannedHours] = useState(4);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState<'OFFLINE' | 'HYBRID' | 'ONLINE'>('OFFLINE');

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, bRes] = await Promise.all([
        api.get('/training/sessions').catch(() => ({ sessions: [] })),
        api.get('/batches').catch(() => ({ batches: [] })),
      ]);

      setSessions(sRes.sessions || []);
      setBatches(bRes.batches || []);
      if (bRes.batches?.length > 0 && !batchId) {
        setBatchId(bRes.batches[0].id);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;

    try {
      await api.post('/training/sessions', {
        batchId,
        topic,
        plannedHours: Number(plannedHours),
        date: new Date(date).toISOString(),
        mode,
      });

      setSuccess(`Session "${topic}" scheduled successfully!`);
      setModalOpen(false);
      setTopic('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule session.');
    }
  };

  const columns: Column<TrainingSession>[] = [
    {
      key: 'topic',
      header: 'Session Topic & Focus',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.topic}</p>
          <p className="text-xs text-brand-600 font-medium">Batch ID: {item.batchId?.substring(0, 8)}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Session Date',
      render: (item) => <span className="text-xs font-semibold text-slate-800">{formatDate(item.date)}</span>,
    },
    {
      key: 'hours',
      header: 'Planned Hours',
      render: (item) => (
        <span className="text-xs font-bold text-slate-800">{item.plannedHours} Training Hours</span>
      ),
    },
    {
      key: 'mode',
      header: 'Delivery Mode',
      render: (item) => (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[10px] text-slate-700">
          {item.mode}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Classroom & Laboratory Sessions
          </h2>
          <p className="text-xs text-slate-500">
            Schedule instruction sessions, practical workshops, and lab demonstrations.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Session</span>
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
        data={sessions}
        searchPlaceholder="Search sessions by topic..."
        emptyTitle="No sessions scheduled"
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Classroom / Lab Session"
        subtitle="Specify training hours and technical topic"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Batch *
            </label>
            <select
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.course?.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Session Topic & Learning Objective *
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Battery Cell Balancing & Voltage Testing"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Planned Hours
              </label>
              <input
                type="number"
                required
                value={plannedHours}
                onChange={(e) => setPlannedHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Delivery Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              >
                <option value="OFFLINE">Offline (Lab / In-Person)</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONLINE">Online Virtual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Session Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
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
              Schedule Session
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
