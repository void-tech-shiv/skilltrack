import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, ShieldAlert, Building2, UserPlus, Award, AlertTriangle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const AdminPortal: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'approvals' | 'providers' | 'trainers' | 'certificates' | 'interventions'>('approvals');
  
  // Data states
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [certApps, setCertApps] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal / Form states
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderEmail, setNewProviderEmail] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [authReason, setAuthReason] = useState('Accredited state vocational training lab');
  
  // Revocation state
  const [revokingCertId, setRevokingCertId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  // Rejection modal
  const [rejectingUserId, setRejectingUserId] = useState('');
  const [rejectingUserName, setRejectingUserName] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Approval confirmation modal
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [approvingUserName, setApprovingUserName] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Applicant details modal & Aadhaar mask toggle
  const [viewingApplicant, setViewingApplicant] = useState<any | null>(null);
  const [revealedAadhaar, setRevealedAadhaar] = useState<Record<string, boolean>>({});

  const handleToggleAadhaar = async (traineeId: string) => {
    const isRevealed = !!revealedAadhaar[traineeId];
    if (!isRevealed && token) {
      try {
        await fetch(`${API_BASE_URL}/trainees/${traineeId}/log-aadhaar-view`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to log Aadhaar view:', err);
      }
    }
    setRevealedAadhaar(prev => ({ ...prev, [traineeId]: !isRevealed }));
  };

  // New intervention modal
  const [newInterventionTraineeId, setNewInterventionTraineeId] = useState('');
  const [newInterventionType, setNewInterventionType] = useState('COUNSELING');
  const [newInterventionNotes, setNewInterventionNotes] = useState('');
  const [newInterventionAssignee, setNewInterventionAssignee] = useState('');

  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pendingRes, provRes, crsRes, trnRes, certRes, intRes] = await Promise.all([
        fetch(`${API_BASE_URL}/auth/pending-users`, { headers }),
        fetch(`${API_BASE_URL}/providers`, { headers }),
        fetch(`${API_BASE_URL}/courses`, { headers }),
        fetch(`${API_BASE_URL}/trainers`, { headers }),
        fetch(`${API_BASE_URL}/certificates/applications`, { headers }),
        fetch(`${API_BASE_URL}/interventions`, { headers })
      ]);

      if (pendingRes.ok) setPendingUsers((await pendingRes.json()).users || []);
      if (provRes.ok) setProviders((await provRes.json()).providers || []);
      if (crsRes.ok) setCourses((await crsRes.json()).courses || []);
      if (trnRes.ok) setTrainers((await trnRes.json()).trainers || []);
      if (certRes.ok) setCertApps((await certRes.json()).applications || []);
      if (intRes.ok) setInterventions((await intRes.json()).interventions || []);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  // Handlers
  const handlePromptApprove = (userId: string, name: string) => {
    setApprovingUserId(userId);
    setApprovingUserName(name);
  };

  const handleConfirmApprove = async () => {
    if (!approvingUserId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/approve-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: approvingUserId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to approve this application. Please try again.');
      
      setFeedback({ type: 'success', message: '✓ Application Approved successfully. Account is now active.' });
      setApprovingUserId(null);
      setApprovingUserName('');
      if (viewingApplicant && viewingApplicant.id === approvingUserId) {
        setViewingApplicant(null);
      }
      fetchAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to approve this application. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromptReject = (userId: string, name: string) => {
    setRejectingUserId(userId);
    setRejectingUserName(name);
    setRejectReason('');
    setRejectError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingUserId) return;
    if (!rejectReason.trim()) {
      setRejectError('Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    setRejectError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reject-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: rejectingUserId, reason: rejectReason.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to reject this application. Please try again.');
      
      setFeedback({ type: 'success', message: '✓ Application marked as Rejected.' });
      setRejectingUserId('');
      setRejectingUserName('');
      setRejectReason('');
      if (viewingApplicant && viewingApplicant.id === rejectingUserId) {
        setViewingApplicant(null);
      }
      fetchAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to reject this application. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newProviderName, email: newProviderEmail, password: 'password123' })
      });
      if (!res.ok) throw new Error('Failed to create training provider');
      setFeedback({ type: 'success', message: 'Training Provider created successfully with default credentials.' });
      setNewProviderName('');
      setNewProviderEmail('');
      fetchAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleAuthorizeCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId || !selectedCourseId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/providers/authorize-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ providerId: selectedProviderId, courseId: selectedCourseId, reason: authReason })
      });
      if (!res.ok) throw new Error('Failed to authorize provider for course');
      setFeedback({ type: 'success', message: 'Course authorized for provider successfully.' });
      fetchAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleApproveTrainer = async (trainerId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`${API_BASE_URL}/trainers/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ trainerId, action })
      });
      if (!res.ok) throw new Error('Failed to process trainer approval');
      setFeedback({ type: 'success', message: `Trainer ${action.toLowerCase()} successfully.` });
      fetchAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleApproveCertificate = async (applicationId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`${API_BASE_URL}/certificates/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ applicationId, action })
      });
      if (!res.ok) throw new Error('Failed to process certificate');
      setFeedback({ type: 'success', message: `Certificate ${action === 'APPROVE' ? 'approved and issued' : 'rejected'} successfully.` });
      fetchAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRevokeCertificate = async () => {
    if (!revokingCertId || !revokeReason) return;
    try {
      const res = await fetch(`${API_BASE_URL}/certificates/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ certificateId: revokingCertId, reason: revokeReason })
      });
      if (!res.ok) throw new Error('Failed to revoke certificate');
      setFeedback({ type: 'success', message: 'Certificate officially revoked.' });
      setRevokingCertId('');
      setRevokeReason('');
      fetchAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterventionTraineeId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          traineeId: newInterventionTraineeId,
          actionType: newInterventionType,
          priority: 'HIGH',
          assignedTo: newInterventionAssignee || 'State Counselor',
          notes: newInterventionNotes
        })
      });
      if (!res.ok) throw new Error('Failed to create remedial intervention');
      setFeedback({ type: 'success', message: 'Remedial intervention ticket created.' });
      setNewInterventionTraineeId('');
      setNewInterventionNotes('');
      fetchAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              GOVERNMENT ADMIN PORTAL
            </span>
            <span className="text-xs text-slate-500">• Highest Authority</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">State Governance & Skilling Administration</h1>
          <p className="text-sm text-slate-600">
            Maharashtra State Innovation Society — Approvals, Authorizations, Certifications & Interventions
          </p>
        </div>
        <button
          onClick={fetchAllData}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh All</span>
        </button>
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
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'approvals' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>User Approvals ({pendingUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'providers' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Providers & Authorizations</span>
        </button>

        <button
          onClick={() => setActiveTab('trainers')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'trainers' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Teacher Approvals ({trainers.filter(t => t.status === 'PENDING').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'certificates' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Certificates & Verification</span>
        </button>

        <button
          onClick={() => setActiveTab('interventions')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 ${
            activeTab === 'interventions' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Remedial Interventions ({interventions.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING USER APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Pending Learner & Employer Registrations</h2>
          <p className="text-xs text-slate-500 mb-4">
            Security Gate: Learners and Employers cannot sign in or interact with the platform until verified and approved by the Government Admin.
          </p>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded border border-dashed border-slate-300">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium">All registration applications have been reviewed. No pending users.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Role Requested</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Identity / Affiliation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Applied Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {pendingUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {u.trainee ? `${u.trainee.firstName} ${u.trainee.lastName}` : u.organization?.name || u.email}
                        <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                          u.role === 'TRAINEE' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {u.role === 'TRAINEE' ? 'Learner' : u.role === 'EMPLOYER' ? 'Employer' : u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {u.trainee ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs text-slate-800">
                              Aadhaar: {u.trainee.aadhaarNumber ? `XXXX XXXX ${u.trainee.aadhaarNumber.slice(-4)}` : '—'}
                            </span>
                            <span className="text-xs text-slate-500 block">
                              APAAR: {u.trainee.apaarAbcId || '—'}
                            </span>
                          </div>
                        ) : (
                          `Company: ${u.organization?.name || '—'}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => setViewingApplicant(u)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300"
                        >
                          Review Details
                        </button>
                        <button
                          onClick={() => handlePromptApprove(u.id, u.trainee ? `${u.trainee.firstName} ${u.trainee.lastName}` : u.email)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handlePromptReject(u.id, u.trainee ? `${u.trainee.firstName} ${u.trainee.lastName}` : u.email)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm"
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

          {/* Applicant Review Modal with Identity & Education Details */}
          {viewingApplicant && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Government Admin Review</span>
                    <h3 className="text-base font-bold">
                      {viewingApplicant.trainee ? `${viewingApplicant.trainee.firstName} ${viewingApplicant.trainee.lastName}` : viewingApplicant.organization?.name || viewingApplicant.email}
                    </h3>
                  </div>
                  <button
                    onClick={() => setViewingApplicant(null)}
                    className="text-slate-400 hover:text-white text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  {viewingApplicant.trainee ? (
                    <div className="space-y-4">
                      {/* IDENTITY & EDUCATION DETAILS SECTION */}
                      <div className="bg-blue-50/50 border border-blue-200/80 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                            IDENTITY & EDUCATION DETAILS
                          </h4>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                            Verified Citizen
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 font-medium block">Aadhaar Number:</span>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="font-mono font-bold text-slate-800">
                                {revealedAadhaar[viewingApplicant.trainee.id]
                                  ? viewingApplicant.trainee.aadhaarNumber
                                  : viewingApplicant.trainee.aadhaarNumber
                                  ? `XXXX XXXX ${viewingApplicant.trainee.aadhaarNumber.slice(-4)}`
                                  : '—'}
                              </span>
                              {viewingApplicant.trainee.aadhaarNumber && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAadhaar(viewingApplicant.trainee.id)}
                                  className="text-[10px] font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 px-1.5 py-0.5 rounded"
                                >
                                  {revealedAadhaar[viewingApplicant.trainee.id] ? 'Hide' : 'Show'}
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-500 font-medium block">APAAR / ABC ID:</span>
                            <span className="font-mono font-bold text-slate-800 block mt-0.5">
                              {viewingApplicant.trainee.apaarAbcId || '—'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 font-medium block">Highest Qualification:</span>
                            <span className="font-semibold text-slate-800 block mt-0.5">
                              {viewingApplicant.trainee.educationLevel || '—'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 font-medium block">Social Category:</span>
                            <span className="font-semibold text-slate-800 block mt-0.5">
                              {viewingApplicant.trainee.category || '—'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 text-xs">
                          <span className="text-slate-500 font-medium block">Existing Skills:</span>
                          <span className="font-medium text-slate-800 block mt-0.5">
                            {Array.isArray(viewingApplicant.trainee.skills)
                              ? viewingApplicant.trainee.skills.join(', ')
                              : viewingApplicant.trainee.skills || '—'}
                          </span>
                        </div>

                        <div className="pt-1 text-xs">
                          <span className="text-slate-500 font-medium block">Target Career Goal:</span>
                          <span className="font-medium text-slate-800 block mt-0.5">
                            {viewingApplicant.trainee.careerGoals || '—'}
                          </span>
                        </div>
                      </div>

                      {/* CONTACT & REGISTRATION DETAILS */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-500 block">Email:</span>
                            <span className="font-medium text-slate-800">{viewingApplicant.email}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Phone:</span>
                            <span className="font-medium text-slate-800">{viewingApplicant.trainee.phone || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Submitted At:</span>
                            <span className="font-medium text-slate-800">{new Date(viewingApplicant.createdAt).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Current Status:</span>
                            <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {viewingApplicant.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs space-y-2">
                      <p><b>Company:</b> {viewingApplicant.organization?.name || '—'}</p>
                      <p><b>Industry:</b> {viewingApplicant.organization?.industry || '—'}</p>
                      <p><b>Email:</b> {viewingApplicant.email}</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 space-y-3">
                  {/* APPLICATION DECISION SECTION */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">APPLICATION DECISION</span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs font-semibold text-slate-700">Current Status:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          viewingApplicant.status === 'ACTIVE' || viewingApplicant.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : viewingApplicant.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {viewingApplicant.status === 'ACTIVE' || viewingApplicant.status === 'APPROVED' ? '🟢 Approved' : viewingApplicant.status === 'REJECTED' ? '🔴 Rejected' : '🟡 Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setViewingApplicant(null)}
                        className="px-3.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition"
                      >
                        Close
                      </button>
                      {viewingApplicant.status === 'PENDING' || viewingApplicant.status === 'UNDER_REVIEW' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePromptReject(viewingApplicant.id, viewingApplicant.trainee ? `${viewingApplicant.trainee.firstName} ${viewingApplicant.trainee.lastName}` : viewingApplicant.email)}
                            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition"
                          >
                            Reject Application
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromptApprove(viewingApplicant.id, viewingApplicant.trainee ? `${viewingApplicant.trainee.firstName} ${viewingApplicant.trainee.lastName}` : viewingApplicant.email)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                          >
                            Approve Application
                          </button>
                        </>
                      ) : viewingApplicant.status === 'ACTIVE' || viewingApplicant.status === 'APPROVED' ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          ✓ Approved
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                          ✕ Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approval Confirmation Modal */}
          {approvingUserId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Approve Learner Application?</h3>
                    <p className="text-xs text-slate-500">Official State Governance Authorization</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to approve this learner application for <strong>{approvingUserName}</strong>? Upon confirmation, the account status will be set to <strong>ACTIVE</strong> in the database and the applicant will receive an official notification.
                </p>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => { setApprovingUserId(null); setApprovingUserName(''); }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleConfirmApprove}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-1.5"
                  >
                    <span>{actionLoading ? 'Approving...' : 'Confirm Approval'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Modal */}
          {rejectingUserId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    ✕
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Reject Learner Application</h3>
                    <p className="text-xs text-slate-500">Applicant: {rejectingUserName || 'Applicant'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    required
                    value={rejectReason}
                    onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
                    placeholder="Enter reason for rejection (e.g. Incomplete identification or educational records)..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
                    rows={3}
                  />
                  {rejectError && (
                    <p className="text-xs text-rose-600 mt-1 font-semibold">{rejectError}</p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => { setRejectingUserId(''); setRejectReason(''); setRejectError(''); }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleConfirmReject}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-1.5"
                  >
                    <span>{actionLoading ? 'Rejecting...' : 'Reject Application'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROVIDERS & COURSE AUTHORIZATIONS */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          {/* Create Provider Form */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Create New Training Provider Organization</h2>
            <p className="text-xs text-slate-500 mb-4">
              Governance Rule: Training Providers are officially accredited and created by Government Admin. Public self-registration is restricted.
            </p>
            <form onSubmit={handleCreateProvider} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-700">Provider Name *</label>
                <input
                  type="text"
                  required
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder="e.g. Nashik Skill Academy"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Official Contact Email *</label>
                <input
                  type="email"
                  required
                  value={newProviderEmail}
                  onChange={(e) => setNewProviderEmail(e.target.value)}
                  placeholder="contact@nashikskill.org"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-md shadow-sm"
              >
                Create Provider Organization
              </button>
            </form>
          </div>

          {/* Authorize Course Form */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Authorize Course Delivery for Provider</h2>
            <p className="text-xs text-slate-500 mb-4">
              Mandatory Rule: Batches cannot be scheduled unless the Training Provider is officially authorized for that specific Course.
            </p>
            <form onSubmit={handleAuthorizeCourse} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-700">Select Provider *</label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  required
                >
                  <option value="">-- Choose Provider --</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Select Course *</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  required
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Accreditation Justification</label>
                <input
                  type="text"
                  value={authReason}
                  onChange={(e) => setAuthReason(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-md shadow-sm"
              >
                Grant Course Authorization
              </button>
            </form>
          </div>

          {/* Providers List & Authorized Courses */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Accredited Training Providers & Authorizations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((p) => (
                <div key={p.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                      <p className="text-xs text-slate-500">Status: {p.status} • Trainers: {p.trainers?.length || 0}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      {p.batches?.length || 0} Batches
                    </span>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Authorized Courses:</h4>
                    {p.authorizations?.length > 0 ? (
                      <div className="space-y-1">
                        {p.authorizations.map((auth: any) => (
                          <div key={auth.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-xs">
                            <span className="font-medium text-slate-800">{auth.course.code}: {auth.course.name}</span>
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                              AUTHORIZED
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 font-medium bg-amber-50 p-2 rounded">
                        No courses authorized yet. Authorize courses above to enable batch scheduling.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEACHER ONBOARDING APPROVALS */}
      {activeTab === 'trainers' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Teacher Onboarding & Affiliation Approvals</h2>
          <p className="text-xs text-slate-500 mb-4">
            Teachers submitted by Training Providers must be verified and granted access by Government Admin.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Teacher Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Provider Affiliation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Specialization</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {trainers.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {t.name}
                      <div className="text-xs text-slate-500 font-mono">{t.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{t.organization?.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.specialization || 'General Technical'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        t.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {t.status !== 'APPROVED' ? (
                        <button
                          onClick={() => handleApproveTrainer(t.id, 'APPROVED')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded"
                        >
                          Approve Teacher
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Active Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CERTIFICATES & REVOCATION */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Pending Government Certificate Applications</h2>
            <p className="text-xs text-slate-500 mb-4">
              Review completed learners against course rules (80% attendance, module verification, evidence checks) before issuing official tamper-evident QR certificates.
            </p>

            {certApps.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded border border-dashed border-slate-300">
                <p className="text-sm">No pending certificate applications.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Learner</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Course & Provider</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Eligibility Metrics</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {certApps.map((app) => (
                      <tr key={app.id}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {app.trainee.firstName} {app.trainee.lastName}
                          <div className="text-xs text-slate-500">{app.trainee.canonicalId}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {app.enrollment?.batch?.course?.name}
                          <div className="text-xs text-slate-500">{app.enrollment?.batch?.provider?.name}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <div>Attendance: <span className="font-bold text-emerald-700">{app.attendancePercent}%</span></div>
                          <div>Modules: <span className="font-bold text-emerald-700">{app.modulePercent}%</span></div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {app.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApproveCertificate(app.id, 'APPROVE')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded"
                              >
                                Approve & Issue
                              </button>
                              <button
                                onClick={() => handleApproveCertificate(app.id, 'REJECT')}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {app.status === 'APPROVED' && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-emerald-700 font-semibold">Issued with QR</span>
                              <button
                                onClick={() => {
                                  setRevokingCertId(app.enrollment?.certificates?.[0]?.id || app.id);
                                  setRevokeReason('Compliance audit exception');
                                  handleRevokeCertificate();
                                }}
                                className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold rounded"
                              >
                                Revoke
                              </button>
                            </div>
                          )}
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

      {/* TAB 5: REMEDIAL INTERVENTIONS */}
      {activeTab === 'interventions' && (
        <div className="space-y-6">
          {/* Create Intervention Form */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Create Remedial Intervention Ticket</h2>
            <p className="text-xs text-slate-500 mb-4">
              AI & Attendance Early Warning: Create targeted remedial actions (counseling, remedial modules, employer rematch) for high dropout risk learners.
            </p>
            <form onSubmit={handleCreateIntervention} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-700">Learner Canonical ID *</label>
                <input
                  type="text"
                  required
                  value={newInterventionTraineeId}
                  onChange={(e) => setNewInterventionTraineeId(e.target.value)}
                  placeholder="e.g. TR-1010"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Remedial Action Type *</label>
                <select
                  value={newInterventionType}
                  onChange={(e) => setNewInterventionType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="COUNSELING">Counseling & Motivation</option>
                  <option value="REMEDIAL_TRAINING">Remedial Technical Sessions</option>
                  <option value="ATTENDANCE_ALERT">Attendance Warning & Family Contact</option>
                  <option value="EMPLOYER_REMATCH">Employer Rematch / Placement Drive</option>
                  <option value="FINANCIAL_ASSISTANCE">Stipend / Transport Assistance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Assigned Officer / Counselor</label>
                <input
                  type="text"
                  value={newInterventionAssignee}
                  onChange={(e) => setNewInterventionAssignee(e.target.value)}
                  placeholder="e.g. Officer Anand Joshi"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-md shadow-sm"
              >
                Create Intervention
              </button>
            </form>
          </div>

          {/* Interventions List */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Active State Intervention Tickets</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Learner</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Action Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Priority / Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {interventions.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {item.trainee ? `${item.trainee.firstName} ${item.trainee.lastName}` : item.traineeId}
                        <div className="text-xs text-slate-500">{item.trainee?.canonicalId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-900">
                        {item.actionType?.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.assignedTo || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-sm space-x-1">
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-bold">
                          {item.priority}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-xs font-medium">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">{item.notes || 'Routine follow-up'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
