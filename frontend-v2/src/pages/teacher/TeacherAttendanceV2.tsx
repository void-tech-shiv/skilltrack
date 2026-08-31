import React, { useState, useEffect } from 'react';
import { CheckSquare, Users, Calendar, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { TrainingSession, TraineeProfile } from '../../types';

export const TeacherAttendanceV2: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [learners, setLearners] = useState<TraineeProfile[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: 'PRESENT' | 'ABSENT' | 'LATE'; hours: number }>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sRes, lRes] = await Promise.all([
          api.get('/training/sessions').catch(() => ({ sessions: [] })),
          api.get('/trainees').catch(() => ({ trainees: [] })),
        ]);

        setSessions(sRes.sessions || []);
        setLearners(lRes.trainees || []);
        if (sRes.sessions?.length > 0) {
          setSelectedSessionId(sRes.sessions[0].id);
        }

        // Initialize default map
        const initialMap: Record<string, { status: 'PRESENT' | 'ABSENT' | 'LATE'; hours: number }> = {};
        (lRes.trainees || []).forEach((l: any) => {
          initialMap[l.id] = { status: 'PRESENT', hours: 4 };
        });
        setAttendanceMap(initialMap);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusChange = (traineeId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [traineeId]: {
        ...prev[traineeId],
        status,
        hours: status === 'ABSENT' ? 0 : prev[traineeId]?.hours || 4,
      },
    }));
  };

  const handleHoursChange = (traineeId: string, hours: number) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [traineeId]: {
        ...prev[traineeId],
        hours,
      },
    }));
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const records = Object.entries(attendanceMap).map(([traineeId, data]) => ({
        traineeId,
        status: data.status,
        trainingHours: data.hours,
      }));

      await api.post(`/training/attendance`, { sessionId: selectedSessionId, records });
      setSuccess('Classroom attendance & training hours officially recorded and synchronized!');
    } catch (err: any) {
      setError(err.message || 'Failed to submit attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Hour-by-Hour Learner Attendance
          </h2>
          <p className="text-xs text-slate-500">
            Log verified classroom and workshop training hours contributing to certificate thresholds.
          </p>
        </div>

        {/* Session Selector */}
        <div className="w-full sm:w-72">
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.topic} ({formatDate(s.date)})
              </option>
            ))}
          </select>
        </div>
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

      {/* Roster & Attendance Marking Form */}
      <form onSubmit={handleSubmitAttendance} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Session Roster ({learners.length} Enrolled Learners)
            </h3>
            <p className="text-xs text-slate-500">
              {selectedSession ? `${selectedSession.topic} • ${selectedSession.plannedHours} Planned Hours` : 'Select a session'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                const map: Record<string, any> = {};
                learners.forEach((l) => {
                  map[l.id] = { status: 'PRESENT', hours: selectedSession?.plannedHours || 4 };
                });
                setAttendanceMap(map);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Mark All Present
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {learners.map((l) => {
            const current = attendanceMap[l.id] || { status: 'PRESENT', hours: 4 };
            return (
              <div key={l.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">{l.firstName} {l.lastName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{l.canonicalId || l.id.substring(0, 8)}</p>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Status Toggle Buttons */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    {(['PRESENT', 'ABSENT', 'LATE'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(l.id, st)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          current.status === st
                            ? st === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : st === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Hours Input */}
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min={0}
                      max={8}
                      value={current.hours}
                      onChange={(e) => handleHoursChange(l.id, Number(e.target.value))}
                      className="w-16 px-2.5 py-1 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-xs text-slate-500 font-medium">Hrs</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Attendance...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit & Verify Attendance</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
