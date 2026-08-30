import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, BookOpen, Users, GraduationCap, Clock, UserPlus } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const TrainingProviderPortal: React.FC = () => {
  const { token, user } = useAuth();
  const [providerData, setProviderData] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Teacher Onboarding Request Form
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tSpec, setTSpec] = useState('EV Battery & High Voltage Safety');

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [provRes, batRes, trnRes] = await Promise.all([
        fetch(`${API_BASE_URL}/providers`, { headers }),
        fetch(`${API_BASE_URL}/batches`, { headers }),
        fetch(`${API_BASE_URL}/trainers`, { headers })
      ]);

      if (provRes.ok) {
        const data = await provRes.json();
        setProviderData(data.providers?.[0] || null);
      }
      if (batRes.ok) setBatches((await batRes.json()).batches || []);
      if (trnRes.ok) setTeachers((await trnRes.json()).trainers || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleRequestTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/trainers/request-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: tName,
          email: tEmail,
          phone: tPhone,
          specialization: tSpec,
          organizationId: user?.organizationId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit teacher onboarding');
      setFeedback({ type: 'success', message: 'Teacher onboarding application submitted for Government Admin approval.' });
      setTName('');
      setTEmail('');
      setTPhone('');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const totalEnrolledLearners = batches.reduce((acc, b) => acc + (b._count?.enrollments || 0), 0);
  const activeTeachersCount = teachers.filter(t => t.status === 'APPROVED').length;
  const pendingTeachersCount = teachers.filter(t => t.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
              TRAINING PROVIDER CENTER
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{providerData?.name || 'Training Institute'}</h1>
          <p className="text-sm text-slate-600">
            Manage your training operations, teachers, batches and learners.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-900 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Active Batches</p>
            <p className="text-2xl font-bold text-slate-900">{batches.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Enrolled Learners</p>
            <p className="text-2xl font-bold text-slate-900">{totalEnrolledLearners}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-800 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Active Teachers</p>
            <p className="text-2xl font-bold text-slate-900">{activeTeachersCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Pending Actions</p>
            <p className="text-2xl font-bold text-slate-900">{pendingTeachersCount}</p>
          </div>
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

      {/* Authorized Courses */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Government Authorized Skilling Programs</h2>
        <p className="text-xs text-slate-500 mb-4">
          Courses approved by Government Admin for delivery at your training centers.
        </p>

        {providerData?.authorizations?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providerData.authorizations.map((auth: any) => (
              <div key={auth.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded">
                      {auth.course.code}
                    </span>
                    <h3 className="font-bold text-slate-900 mt-1">{auth.course.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">
                    {auth.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">{auth.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded border border-dashed">
            No active course authorizations found. Contact Government Admin for accreditation.
          </p>
        )}
      </div>

      {/* Managed Batches */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Scheduled & Ongoing Batches ({batches.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Batch Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Teacher</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Mode</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Enrolled Learners</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {batches.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">{b.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{b.course?.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{b.trainer ? b.trainer.name : 'Pending Teacher Assignment'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-blue-900">{b.trainingMode}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                    {b._count?.enrollments || 0} / {b.capacity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teachers & Onboarding Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Onboarding Request */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Request Teacher Onboarding</h2>
          <p className="text-xs text-slate-500 mb-4">
            Submit teacher candidate credentials to Government Admin for state accreditation and role assignment.
          </p>
          <form onSubmit={handleRequestTeacher} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={tName}
                onChange={(e) => setTName(e.target.value)}
                placeholder="e.g. Sunil Kadam"
                className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Official Email *</label>
              <input
                type="email"
                required
                value={tEmail}
                onChange={(e) => setTEmail(e.target.value)}
                placeholder="sunil.teacher@provider.org"
                className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Phone</label>
              <input
                type="tel"
                value={tPhone}
                onChange={(e) => setTPhone(e.target.value)}
                placeholder="9822114455"
                className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Specialization</label>
              <input
                type="text"
                value={tSpec}
                onChange={(e) => setTSpec(e.target.value)}
                className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm flex items-center justify-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Submit Onboarding Request</span>
            </button>
          </form>
        </div>

        {/* Affiliated Teachers List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Affiliated Teachers ({teachers.length})</h2>
          <div className="space-y-3">
            {teachers.map((t) => (
              <div key={t.id} className="bg-slate-50 border border-slate-200 rounded p-3 flex justify-between items-center text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                  <p className="text-slate-500">{t.email} • {t.specialization}</p>
                </div>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  t.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
