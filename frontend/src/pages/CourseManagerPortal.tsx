import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, PlusCircle, Layers, CheckCircle2, Award } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const CourseManagerPortal: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'batches' | 'enrollments' | 'completions'>('courses');

  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Course Form State
  const [cName, setCName] = useState('');
  const [cCode, setCCode] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cDuration, setCDuration] = useState('120');
  const [cAttendanceReq, setCAttendanceReq] = useState('80');
  const [cModuleReq, setCModuleReq] = useState('80');
  const [cEvidenceReq, setCEvidenceReq] = useState(true);
  const [cSkills, setCSkills] = useState('EV Battery, Diagnostic Scan');
  const [cTargetRoles, setCTargetRoles] = useState('EV Service Engineer, Technician');

  // Add Module Modal State
  const [selectedCourseForModule, setSelectedCourseForModule] = useState<string | null>(null);
  const [modName, setModName] = useState('');
  const [modOrder, setModOrder] = useState('1');
  const [modEvidence, setModEvidence] = useState(false);

  // New Batch Form State
  const [bName, setBName] = useState('');
  const [bCourseId, setBCourseId] = useState('');
  const [bProviderId, setBProviderId] = useState('');
  const [bTrainerId, setBTrainerId] = useState('');
  const [bCapacity, setBCapacity] = useState('30');
  const [bMode, setBMode] = useState('HYBRID');
  const [bLocation, setBLocation] = useState('Pune Vocational Center');
  const [bStart, setBStart] = useState('2026-09-01');
  const [bEnd, setBEnd] = useState('2026-11-30');

  const fetchData = async () => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [crsRes, batRes, provRes, trnRes] = await Promise.all([
        fetch(`${API_BASE_URL}/courses`, { headers }),
        fetch(`${API_BASE_URL}/batches`, { headers }),
        fetch(`${API_BASE_URL}/providers`, { headers }),
        fetch(`${API_BASE_URL}/trainers`, { headers })
      ]);

      if (crsRes.ok) setCourses((await crsRes.json()).courses || []);
      if (batRes.ok) setBatches((await batRes.json()).batches || []);
      if (provRes.ok) setProviders((await provRes.json()).providers || []);
      if (trnRes.ok) setTrainers((await trnRes.json()).trainers || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const programId = courses[0]?.programId || 'ev-prog-1';
      const res = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: cName,
          code: cCode,
          description: cDesc,
          programId,
          expectedDurationHours: parseInt(cDuration),
          attendanceRequirement: parseFloat(cAttendanceReq),
          moduleRequirement: parseFloat(cModuleReq),
          evidenceRequired: cEvidenceReq,
          skills: cSkills.split(',').map(s => s.trim()),
          targetJobRoles: cTargetRoles.split(',').map(r => r.trim())
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create course');
      setFeedback({ type: 'success', message: 'Course created successfully with defined completion rules.' });
      setCName('');
      setCCode('');
      setCDesc('');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForModule) return;
    try {
      const res = await fetch(`${API_BASE_URL}/courses/${selectedCourseForModule}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: modName,
          order: parseInt(modOrder),
          requiredEvidence: modEvidence
        })
      });
      if (!res.ok) throw new Error('Failed to add module');
      setFeedback({ type: 'success', message: 'Module added to course curriculum.' });
      setSelectedCourseForModule(null);
      setModName('');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: bName,
          courseId: bCourseId,
          providerId: bProviderId,
          trainerId: bTrainerId || null,
          capacity: parseInt(bCapacity),
          trainingMode: bMode,
          location: bLocation,
          startDate: bStart,
          endDate: bEnd
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create batch');
      setFeedback({ type: 'success', message: 'Batch successfully created and assigned to authorized provider.' });
      setBName('');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleApproveEnrollment = async (enrollmentId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`${API_BASE_URL}/batches/approve-enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enrollmentId, action })
      });
      if (!res.ok) throw new Error('Failed to process enrollment');
      setFeedback({ type: 'success', message: `Enrollment ${action.toLowerCase()} successfully.` });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleApproveCompletion = async (enrollmentId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`${API_BASE_URL}/training/approve-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enrollmentId, action })
      });
      if (!res.ok) throw new Error('Failed to process course completion approval');
      setFeedback({ type: 'success', message: `Course completion ${action === 'APPROVE' ? 'approved' : 'returned to trainer'}.` });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
            COURSE MANAGER PORTAL
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Course, Batch & Completion Management</h1>
        <p className="text-sm text-slate-600">
          Design curriculum, configure mandatory completion rules, create authorized batches, and approve learner completions.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-md border ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'
        } flex justify-between items-center`}>
          <span className="text-sm font-medium">{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-sm font-bold ml-4">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'courses' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Courses & Modules ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'batches' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Batches & Allocation ({batches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('enrollments')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'enrollments' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Enrollment Review</span>
        </button>

        <button
          onClick={() => setActiveTab('completions')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'completions' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Completion Approvals</span>
        </button>
      </div>

      {/* TAB 1: COURSES & MODULE BUILDER */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Create Course Form */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Create New Skilling Course & Rule Matrix</h2>
            <p className="text-xs text-slate-500 mb-4">
              Set rigorous graduation rules including minimum attendance percentage, module verification thresholds, and evidence submission requirements.
            </p>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="e.g. EV Powertrain & Telemetry Diagnostics"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={cCode}
                    onChange={(e) => setCCode(e.target.value)}
                    placeholder="e.g. EV-301"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Duration (Hours)</label>
                  <input
                    type="number"
                    value={cDuration}
                    onChange={(e) => setCDuration(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Min Attendance Required (%)</label>
                  <input
                    type="number"
                    value={cAttendanceReq}
                    onChange={(e) => setCAttendanceReq(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Min Module Completion (%)</label>
                  <input
                    type="number"
                    value={cModuleReq}
                    onChange={(e) => setCModuleReq(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <input
                    type="checkbox"
                    checked={cEvidenceReq}
                    onChange={(e) => setCEvidenceReq(e.target.checked)}
                    className="h-4 w-4 text-blue-900 rounded"
                  />
                  <label className="text-xs font-medium text-slate-700">Require External Evidence Verification</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Competencies / Skills (Comma-separated)</label>
                  <input
                    type="text"
                    value={cSkills}
                    onChange={(e) => setCSkills(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Target Job Roles (Comma-separated)</label>
                  <input
                    type="text"
                    value={cTargetRoles}
                    onChange={(e) => setCTargetRoles(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Description</label>
                <textarea
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  placeholder="Course objectives, target industrial sector, syllabus details..."
                  rows={2}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-md shadow-sm"
              >
                Create Course & Define Rules
              </button>
            </form>
          </div>

          {/* Courses Catalog & Modules */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Official State Course Catalog</h2>
            <div className="space-y-4">
              {courses.map((c) => (
                <div key={c.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded">
                          {c.code}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{c.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCourseForModule(c.id);
                        setModOrder((c.modules?.length + 1 || 1).toString());
                      }}
                      className="px-3 py-1.5 bg-blue-900 text-white text-xs font-semibold rounded flex items-center space-x-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Module</span>
                    </button>
                  </div>

                  {/* Rules Pill Summary */}
                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                      Duration: <b>{c.expectedDurationHours}h</b>
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                      Min Attendance: <b>{c.attendanceRequirement}%</b>
                    </span>
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded">
                      Min Modules: <b>{c.moduleRequirement}%</b>
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                      Evidence Required: <b>{c.evidenceRequired ? 'YES' : 'NO'}</b>
                    </span>
                  </div>

                  {/* Modules List */}
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Curriculum Modules ({c.modules?.length || 0}):</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {c.modules?.map((m: any) => (
                        <div key={m.id} className="bg-white p-2.5 rounded border border-slate-200 flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-800">{m.name}</span>
                          <span className="text-slate-500 font-mono">
                            {m.requiredEvidence ? '📄 Proof Required' : 'Quiz/Theory'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module Modal */}
          {selectedCourseForModule && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Add Module to Curriculum</h3>
                <form onSubmit={handleAddModule} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Module Title *</label>
                    <input
                      type="text"
                      required
                      value={modName}
                      onChange={(e) => setModName(e.target.value)}
                      placeholder="e.g. Module 3: Advanced Oscilloscope Waveform Analysis"
                      className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Sequence Order</label>
                    <input
                      type="number"
                      value={modOrder}
                      onChange={(e) => setModOrder(e.target.value)}
                      className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      checked={modEvidence}
                      onChange={(e) => setModEvidence(e.target.checked)}
                      className="h-4 w-4 text-blue-900 rounded"
                    />
                    <label className="text-xs font-medium text-slate-700">Require Learner Lab / Assignment Evidence</label>
                  </div>
                  <div className="flex justify-end space-x-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCourseForModule(null)}
                      className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-900 text-white text-xs font-semibold rounded"
                    >
                      Save Module
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BATCH CREATION & ALLOCATION */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          {/* Create Batch Form */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Schedule New Training Batch</h2>
            <p className="text-xs text-slate-500 mb-4">
              Enforces authorization: Batch can only be scheduled with a Training Provider that has been officially authorized by Government Admin for the selected Course.
            </p>
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Batch Code / Name *</label>
                  <input
                    type="text"
                    required
                    value={bName}
                    onChange={(e) => setBName(e.target.value)}
                    placeholder="e.g. EV-101-NASHIK-B1"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Course *</label>
                  <select
                    value={bCourseId}
                    onChange={(e) => setBCourseId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    required
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Authorized Provider *</label>
                  <select
                    value={bProviderId}
                    onChange={(e) => setBProviderId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    required
                  >
                    <option value="">-- Choose Provider --</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Assigned Teacher</label>
                  <select
                    value={bTrainerId}
                    onChange={(e) => setBTrainerId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="">-- Assign Later --</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.organization?.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Capacity</label>
                  <input
                    type="number"
                    value={bCapacity}
                    onChange={(e) => setBCapacity(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Delivery Mode</label>
                  <select
                    value={bMode}
                    onChange={(e) => setBMode(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="OFFLINE">Offline (Training Center)</option>
                    <option value="HYBRID">Hybrid (Lab + Virtual)</option>
                    <option value="ONLINE">Online (External Platform)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Location / Center</label>
                  <input
                    type="text"
                    value={bLocation}
                    onChange={(e) => setBLocation(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={bStart}
                    onChange={(e) => setBStart(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={bEnd}
                    onChange={(e) => setBEnd(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-md shadow-sm"
              >
                Create Batch & Schedule
              </button>
            </form>
          </div>

          {/* Batches List */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Active & Scheduled Batches</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Batch Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Provider</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Teacher</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Mode & Schedule</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {batches.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">{b.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{b.course?.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{b.provider?.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{b.trainer ? b.trainer.name : 'Pending Assignment'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        <span className="font-semibold">{b.trainingMode}</span> • {new Date(b.startDate).toLocaleDateString()} to {new Date(b.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-blue-900">
                        {b._count?.enrollments || 0} / {b.capacity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ENROLLMENT REVIEW */}
      {activeTab === 'enrollments' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Learner Batch Enrollment Review</h2>
          <p className="text-xs text-slate-500 mb-4">
            Review learner enrollment requests against prerequisites and batch capacity limits.
          </p>

          <div className="space-y-3">
            {batches.flatMap(b => (b.enrollments || []).map((e: any) => ({ ...e, batchName: b.name }))).length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded border border-dashed border-slate-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium">All batch enrollments reviewed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Learner</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Batch</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {batches.flatMap(b => (b.enrollments || []).map((e: any) => ({ ...e, batchName: b.name }))).map((en: any) => (
                      <tr key={en.id}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {en.trainee?.firstName} {en.trainee?.lastName}
                          <div className="text-xs text-slate-500">{en.trainee?.canonicalId}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{en.batchName}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-900">{en.status}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleApproveEnrollment(en.id, 'APPROVED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveEnrollment(en.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: COMPLETION APPROVALS */}
      {activeTab === 'completions' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Teacher Course Completion Recommendations</h2>
          <p className="text-xs text-slate-500 mb-4">
            Course Managers review the completion recommendations submitted by approved Teachers before granting final Course Completion status.
          </p>

          <div className="space-y-3">
            {batches.flatMap(b => (b.enrollments || []).filter((e: any) => e.status === 'COMPLETED' || e.status === 'IN_PROGRESS')).map((en: any) => (
              <div key={en.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{en.trainee?.firstName} {en.trainee?.lastName}</h3>
                  <p className="text-slate-500">Status: {en.status}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproveCompletion(en.id, 'APPROVE')}
                    className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded"
                  >
                    Confirm Completion
                  </button>
                  <button
                    onClick={() => handleApproveCompletion(en.id, 'REJECT')}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded"
                  >
                    Return
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
