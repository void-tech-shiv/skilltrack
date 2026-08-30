import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, CheckCircle, XCircle, Users, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const EmployerPortal: React.FC = () => {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'roster'>('pending');
  const [evidenceNotes, setEvidenceNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { token, user } = useAuth();

  const fetchVerifications = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/employer/verifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setVerifications(data.verifications || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (token) fetchVerifications();
  }, [token, fetchVerifications]);

  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const notes = evidenceNotes[id] || (status === 'VERIFIED' ? 'Employee confirmed active on company payroll' : 'Candidate not found on payroll');
      const res = await fetch(`${API_BASE_URL}/employer/verifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: `Employment outcome successfully ${status.toLowerCase()}.` });
        fetchVerifications();
      } else {
        throw new Error('Failed to update verification');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const pendingList = verifications.filter(v => v.status === 'PENDING');
  const verifiedList = verifications.filter(v => v.status === 'VERIFIED');

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading employer verifications...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-200 text-slate-800">
              EMPLOYER PORTAL
            </span>
            <span className="text-xs text-slate-500 font-mono">Org: {user?.organizationName || 'Corporate Partner'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Employment Outcome Verification</h1>
          <p className="text-sm text-slate-600">
            Verify workforce placements, apprenticeships, and retention confirmations for Maharashtra state learners.
          </p>
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

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'pending' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Pending Verifications ({pendingList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'roster' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Verified Workforce ({verifiedList.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING VERIFICATIONS */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Pending Learner Verification Requests</h2>
          <p className="text-xs text-slate-500 mb-4">
            Confirm whether the following certified learners are actively employed in your organization.
          </p>

          {pendingList.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded border border-dashed border-slate-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium">All employment verification requests have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingList.map((v) => (
                <div key={v.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {v.trainee.firstName} {v.trainee.lastName}
                    </h3>
                    <p className="text-xs text-slate-600 font-mono">Learner ID: {v.trainee.canonicalId} • District: {v.trainee.district}</p>
                    <p className="text-xs text-slate-500 mt-1">Requested On: {new Date(v.createdAt).toLocaleDateString()}</p>
                    
                    <input
                      type="text"
                      placeholder="Optional payroll note (e.g. Employee ID, joined July 2026)"
                      value={evidenceNotes[v.id] || ''}
                      onChange={(e) => setEvidenceNotes({ ...evidenceNotes, [v.id]: e.target.value })}
                      className="mt-2 text-xs border border-slate-300 rounded px-2 py-1 w-full md:w-80"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVerify(v.id, 'VERIFIED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm flex items-center space-x-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm Employment</span>
                    </button>
                    <button
                      onClick={() => handleVerify(v.id, 'REJECTED')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-sm flex items-center space-x-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VERIFIED ROSTER */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Confirmed Placed Employees</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Employee Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">District</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Verified Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {verifiedList.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {v.trainee.firstName} {v.trainee.lastName}
                      <div className="text-xs text-slate-500">{v.trainee.canonicalId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{v.trainee.district}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">
                        VERIFIED EMPLOYED
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{new Date(v.updatedAt).toLocaleDateString()}</td>
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
