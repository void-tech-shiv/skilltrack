import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, CheckSquare, FileText, Award } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const TrainerPortal: React.FC = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'batches' | 'attendance' | 'evidence' | 'completions'>('attendance');

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: string; hours: number; notes: string }>>({});
  
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Session Form
  const [newSessionDate, setNewSessionDate] = useState('2026-08-28');
  const [newSessionTopic, setNewSessionTopic] = useState('BMS Real-Time Calibration & Telemetry');
  const [newSessionHours, setNewSessionHours] = useState('4.0');
  const [newSessionMode, setNewSessionMode] = useState('HYBRID');

  const fetchBatches = async () => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_BASE_URL}/batches`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
        if (data.batches?.length > 0 && !selectedBatchId) {
          setSelectedBatchId(data.batches[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchBatchDetails = async (batchId: string) => {
    if (!token || !batchId) return;
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [bRes, sRes] = await Promise.all([
        fetch(`${API_BASE_URL}/batches/${batchId}`, { headers }),
        fetch(`${API_BASE_URL}/training/sessions?batchId=${batchId}`, { headers })
      ]);

      if (bRes.ok) {
        const data = await bRes.json();
        setBatchDetails(data.batch);
        
        // Extract all evidence submissions from batch enrollments
        const allEvidence: any[] = [];
        data.batch?.enrollments?.forEach((e: any) => {
          e.evidenceSubmissions?.forEach((ev: any) => {
            allEvidence.push({ ...ev, trainee: e.trainee, enrollmentId: e.id });
          });
        });
        setEvidenceList(allEvidence);
      }

      if (sRes.ok) {
        const data = await sRes.json();
        setSessions(data.sessions || []);
        if (data.sessions?.length > 0) {
          setSelectedSessionId(data.sessions[0].id);
          // Initialize attendance
          const attMap: Record<string, any> = {};
          data.sessions[0].attendance?.forEach((a: any) => {
            attMap[a.traineeId] = { status: a.status, hours: a.trainingHours, notes: a.notes || '' };
          });
          setAttendanceRecords(attMap);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [token]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchBatchDetails(selectedBatchId);
    }
  }, [selectedBatchId]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/training/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          batchId: selectedBatchId,
          date: newSessionDate,
          topic: newSessionTopic,
          plannedHours: parseFloat(newSessionHours),
          actualHours: parseFloat(newSessionHours),
          mode: newSessionMode
        })
      });
      if (!res.ok) throw new Error('Failed to create session');
      setFeedback({ type: 'success', message: 'Training session scheduled successfully.' });
      fetchBatchDetails(selectedBatchId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedSessionId) return;
    try {
      const records = Object.entries(attendanceRecords).map(([traineeId, data]) => ({
        traineeId,
        status: data.status,
        trainingHours: data.hours,
        notes: data.notes
      }));

      const res = await fetch(`${API_BASE_URL}/training/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          records
        })
      });
      if (!res.ok) throw new Error('Failed to save attendance');
      setFeedback({ type: 'success', message: 'Session attendance verified and saved.' });
      fetchBatchDetails(selectedBatchId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleVerifyEvidence = async (evidenceId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const res = await fetch(`${API_BASE_URL}/training/evidence/${evidenceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, notes: status === 'VERIFIED' ? 'Demonstrated skill competency and safety adherence' : 'Criteria not met' })
      });
      if (!res.ok) throw new Error('Failed to verify evidence');
      setFeedback({ type: 'success', message: `Evidence marked as ${status}.` });
      fetchBatchDetails(selectedBatchId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRecommendCompletion = async (enrollmentId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/training/recommend-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enrollmentId })
      });
      if (!res.ok) throw new Error('Failed to recommend completion');
      setFeedback({ type: 'success', message: 'Completion recommended to Course Manager.' });
      fetchBatchDetails(selectedBatchId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading trainer classroom & batches...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-800">
              TEACHER DASHBOARD
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Classroom, Attendance & Evidence Verification</h1>
          <p className="text-sm text-slate-600">
            Assigned Teacher: <b className="text-slate-800">{user?.name || user?.email}</b>
          </p>
        </div>

        {/* Batch Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-700 uppercase">Active Batch:</label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm font-semibold bg-white text-slate-800"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.course?.code})</option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-md border ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'
        } flex justify-between items-center`}>
          <span className="text-sm font-medium">{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-sm font-bold ml-4">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'attendance' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Mark Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'evidence' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Evidence Verification ({evidenceList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'batches' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Batch Learners ({batchDetails?.enrollments?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('completions')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'completions' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Recommend Completion</span>
        </button>
      </div>

      {/* TAB 1: SESSION ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Schedule Session Form */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Schedule Session / Lab</h2>
            <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-700">Date *</label>
                <input
                  type="date"
                  required
                  value={newSessionDate}
                  onChange={(e) => setNewSessionDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700">Session Topic / Curriculum Unit *</label>
                <input
                  type="text"
                  required
                  value={newSessionTopic}
                  onChange={(e) => setNewSessionTopic(e.target.value)}
                  placeholder="e.g. BMS Calibration & Diagnostics"
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Planned Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={newSessionHours}
                  onChange={(e) => setNewSessionHours(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Delivery Mode</label>
                <select
                  value={newSessionMode}
                  onChange={(e) => setNewSessionMode(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                >
                  <option value="OFFLINE">Offline Lab</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONLINE">Online Virtual</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-md shadow-sm"
              >
                Schedule Session
              </button>
            </form>
          </div>

          {/* Attendance Marking Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mark / Correct Attendance</h2>
                <p className="text-xs text-slate-500">
                  Select session to mark real-time trainee presence, partial attendance, and training hours.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={selectedSessionId}
                  onChange={(e) => {
                    setSelectedSessionId(e.target.value);
                    const ses = sessions.find(s => s.id === e.target.value);
                    const attMap: Record<string, any> = {};
                    ses?.attendance?.forEach((a: any) => {
                      attMap[a.traineeId] = { status: a.status, hours: a.trainingHours, notes: a.notes || '' };
                    });
                    setAttendanceRecords(attMap);
                  }}
                  className="border border-slate-300 rounded px-3 py-1 text-sm font-medium bg-slate-50"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.date).toLocaleDateString()} - {s.topic} ({s.actualHours}h)
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleSaveAttendance}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm"
                >
                  Save Attendance
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Learner</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Hours Credited</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Teacher Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {batchDetails?.enrollments?.map((en: any) => {
                    const tId = en.trainee.id;
                    const rec = attendanceRecords[tId] || { status: 'PRESENT', hours: 4.0, notes: '' };
                    return (
                      <tr key={en.id}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {en.trainee.firstName} {en.trainee.lastName}
                          <div className="text-xs text-slate-500">{en.trainee.canonicalId}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={rec.status}
                            onChange={(e) => setAttendanceRecords({
                              ...attendanceRecords,
                              [tId]: { ...rec, status: e.target.value }
                            })}
                            className="border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                          >
                            <option value="PRESENT">PRESENT</option>
                            <option value="LATE">LATE</option>
                            <option value="PARTIAL">PARTIAL</option>
                            <option value="ABSENT">ABSENT</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="number"
                            step="0.5"
                            value={rec.hours}
                            onChange={(e) => setAttendanceRecords({
                              ...attendanceRecords,
                              [tId]: { ...rec, hours: parseFloat(e.target.value) || 0 }
                            })}
                            className="w-20 border border-slate-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="text"
                            value={rec.notes}
                            onChange={(e) => setAttendanceRecords({
                              ...attendanceRecords,
                              [tId]: { ...rec, notes: e.target.value }
                            })}
                            placeholder="e.g. Completed multimeter lab test"
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVIDENCE VERIFICATION */}
      {activeTab === 'evidence' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Student Lab Reports & Evidence Submissions</h2>
          <p className="text-xs text-slate-500 mb-4">
            Verify external learning evidence, oscillograms, and assignments submitted by trainees before recommending course completion.
          </p>

          {evidenceList.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded border border-dashed border-slate-300">
              <p className="text-sm">No evidence submissions in this batch yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Learner</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Evidence Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {evidenceList.map((ev) => (
                    <tr key={ev.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {ev.trainee?.firstName} {ev.trainee?.lastName}
                        <div className="text-xs text-slate-500">{ev.trainee?.canonicalId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-900">
                        {ev.title}
                        <div className="text-xs text-slate-500 font-mono">Type: {ev.fileType}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">{ev.description}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          ev.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {ev.status !== 'VERIFIED' ? (
                          <>
                            <button
                              onClick={() => handleVerifyEvidence(ev.id, 'VERIFIED')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded"
                            >
                              Verify & Pass
                            </button>
                            <button
                              onClick={() => handleVerifyEvidence(ev.id, 'REJECTED')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-emerald-700 font-bold">Verified by Teacher</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BATCH LEARNERS */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Batch Roster & Module Status</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Learner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">District</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Enrollment Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Modules Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {batchDetails?.enrollments?.map((en: any) => (
                  <tr key={en.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {en.trainee.firstName} {en.trainee.lastName}
                      <div className="text-xs text-slate-500">{en.trainee.canonicalId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{en.trainee.district}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-900">{en.status}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {en.moduleProgress?.filter((m: any) => m.status === 'VERIFIED').length || 0} / {en.moduleProgress?.length || 0} Modules
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RECOMMEND COMPLETION */}
      {activeTab === 'completions' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Recommend Course Completion</h2>
          <p className="text-xs text-slate-500 mb-4">
            Recommend eligible learners who have attended sessions and passed module requirements to Course Manager for official course completion.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Learner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {batchDetails?.enrollments?.map((en: any) => (
                  <tr key={en.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {en.trainee.firstName} {en.trainee.lastName}
                      <div className="text-xs text-slate-500">{en.trainee.canonicalId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-900">{en.status}</td>
                    <td className="px-4 py-3 text-right">
                      {en.status === 'IN_PROGRESS' || en.status === 'ENROLLED' ? (
                        <button
                          onClick={() => handleRecommendCompletion(en.id)}
                          className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded"
                        >
                          Recommend Completion
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold">{en.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
