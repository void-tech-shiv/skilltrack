import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Building2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Award
} from 'lucide-react';
import { TabsNav } from '../../components/ui/TabsNav';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export const AdminApprovalsV2: React.FC = () => {
  const [activeTab, setActiveTab] = useState('learners');
  const [loading, setLoading] = useState(false);
  const [learners, setLearners] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Action states
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Authorize Course Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Learner Detail Review Modal & Aadhaar Masking State
  const [viewingLearner, setViewingLearner] = useState<any | null>(null);
  const [revealedAadhaar, setRevealedAadhaar] = useState<Record<string, boolean>>({});

  // Approval confirmation modal state
  const [approvingLearnerId, setApprovingLearnerId] = useState<string | null>(null);
  const [approvingLearnerName, setApprovingLearnerName] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection modal state
  const [rejectingLearnerId, setRejectingLearnerId] = useState<string | null>(null);
  const [rejectingLearnerName, setRejectingLearnerName] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const handleToggleAadhaar = async (traineeId: string) => {
    const isRevealed = !!revealedAadhaar[traineeId];
    if (!isRevealed) {
      try {
        await api.post(`/trainees/${traineeId}/log-aadhaar-view`, {});
      } catch (err) {
        console.error('Audit log error:', err);
      }
    }
    setRevealedAadhaar(prev => ({ ...prev, [traineeId]: !isRevealed }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [learnersRes, pendingUsersRes, employersRes, providersRes, coursesRes] = await Promise.all([
        api.get('/trainees?pageSize=100').catch(() => ({ trainees: [] })),
        api.get('/auth/pending-users').catch(() => ({ users: [] })),
        api.get('/employers').catch(() => ({ employers: [] })),
        api.get('/providers').catch(() => ({ providers: [] })),
        api.get('/courses').catch(() => ({ courses: [] })),
      ]);

      const traineesList: any[] = [...(learnersRes.trainees || [])];
      
      // If there are pending users with trainee profiles not yet in the list, merge them
      const pendingUsers = pendingUsersRes.users || [];
      pendingUsers.forEach((u: any) => {
        if (u.role === 'TRAINEE' && u.trainee) {
          const exists = traineesList.some(t => t.id === u.trainee.id);
          if (!exists) {
            traineesList.unshift({
              ...u.trainee,
              user: {
                id: u.id,
                email: u.email,
                role: u.role,
                status: u.status
              }
            });
          }
        }
      });

      setLearners(traineesList);
      setEmployers(employersRes.employers || []);
      setProviders(providersRes.providers || []);
      setCourses(coursesRes.courses || []);
    } catch (err) {
      console.error('Error fetching approvals data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePromptApprove = (userId: string, name: string) => {
    setApprovingLearnerId(userId);
    setApprovingLearnerName(name);
  };

  const handleConfirmApprove = async () => {
    if (!approvingLearnerId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.put(`/admin/users/${approvingLearnerId}/status`, { status: 'ACTIVE' });
      setActionSuccess('✓ Application Approved successfully. Account is now active.');
      setApprovingLearnerId(null);
      setApprovingLearnerName('');
      if (viewingLearner && viewingLearner.user?.id === approvingLearnerId) {
        setViewingLearner(null);
      }
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Unable to approve this application. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromptReject = (userId: string, name: string) => {
    setRejectingLearnerId(userId);
    setRejectingLearnerName(name);
    setRejectReason('');
    setRejectError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingLearnerId) return;
    if (!rejectReason.trim()) {
      setRejectError('Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    setRejectError('');
    try {
      await api.put(`/admin/users/${rejectingLearnerId}/status`, { status: 'REJECTED', reason: rejectReason.trim() });
      setActionSuccess('✓ Application marked as Rejected.');
      setRejectingLearnerId(null);
      setRejectingLearnerName('');
      setRejectReason('');
      if (viewingLearner && viewingLearner.user?.id === rejectingLearnerId) {
        setViewingLearner(null);
      }
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Unable to reject this application. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAuthorizeCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId || !selectedCourseId) return;

    try {
      await api.post(`/providers/authorize-course`, { providerId: selectedProviderId, courseId: selectedCourseId });
      setActionSuccess('Training Provider officially accredited for the selected course.');
      setAuthModalOpen(false);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to authorize course for provider.');
    }
  };

  const tabs = [
    { id: 'learners', label: 'Learner Applications', icon: UserCheck, badge: learners.filter((l) => l.user?.status === 'PENDING').length },
    { id: 'employers', label: 'Employer Verifications', icon: Building2, badge: employers.filter((e) => e.user?.status === 'PENDING').length },
    { id: 'accreditation', label: 'Provider Accreditations', icon: BookOpen },
  ];

  // Learner columns
  const learnerColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Learner Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.firstName} {item.lastName}</p>
          <p className="text-xs text-slate-400 font-mono">{item.canonicalId || item.id.substring(0, 8)}</p>
        </div>
      ),
    },
    {
      key: 'identity',
      header: 'Aadhaar / APAAR Identity',
      render: (item) => (
        <div className="space-y-0.5">
          <p className="text-xs font-mono font-semibold text-slate-800">
            Aadhaar: {item.aadhaarNumber ? `XXXX XXXX ${item.aadhaarNumber.slice(-4)}` : '—'}
          </p>
          <p className="text-[11px] font-mono text-slate-500">
            APAAR: {item.apaarAbcId || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'education',
      header: 'Education / Category',
      render: (item) => (
        <div>
          <p className="text-xs text-slate-800 font-medium">
            {item.educationLevel ? item.educationLevel.replace(/_/g, ' ') : '—'}
          </p>
          <p className="text-[11px] text-slate-400">
            {item.category || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact',
      render: (item) => (
        <div>
          <p className="text-xs text-slate-800">{item.user?.email || '—'}</p>
          <p className="text-[11px] text-slate-400">{item.phone || '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.user?.status || 'PENDING'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => setViewingLearner(item)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
          >
            Review Details
          </button>
          {item.user?.status === 'PENDING' && (
            <>
              <button
                onClick={() => handlePromptApprove(item.user.id, `${item.firstName} ${item.lastName}`)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => handlePromptReject(item.user.id, `${item.firstName} ${item.lastName}`)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center space-x-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Governance & Accreditation Approvals
          </h2>
          <p className="text-xs text-slate-500">
            Review and grant state regulatory access for learners, industry employers, and training providers.
          </p>
        </div>

        {activeTab === 'accreditation' && (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Accredit Course to Provider</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-900 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center justify-between">
          <span>✕ {actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-900 font-bold text-xs">Dismiss</button>
        </div>
      )}

      <TabsNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Learners */}
      {activeTab === 'learners' && (
        <DataTable
          columns={learnerColumns}
          data={learners}
          searchPlaceholder="Search learners by name or district..."
          emptyTitle="No learner applications"
          emptyDescription="All submitted citizen applications have been processed."
        />
      )}

      {/* Tab 2: Employers */}
      {activeTab === 'employers' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-slate-900">Registered Industry Employers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employers.map((emp) => (
              <div key={emp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{emp.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{emp.industry || '—'} • {emp.location || '—'}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">{emp.user?.email}</p>
                </div>
                <StatusBadge status={emp.user?.status || 'ACTIVE'} />
              </div>
            ))}
            {employers.length === 0 && (
              <p className="text-xs text-slate-400 col-span-2 text-center py-6">No employers registered</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Provider Course Accreditation */}
      {activeTab === 'accreditation' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Accredited Training Providers</h3>
              <p className="text-xs text-slate-500">Providers authorized to run regulated government curriculum</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-brand-600" />
                    <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{p.location || '—'}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 text-xs">
                  <p className="font-bold text-slate-700 mb-1">Authorized Courses:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.authorizedCourses?.map((ac: any) => (
                      <span key={ac.courseId} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md border border-brand-200 text-[11px] font-semibold">
                        {ac.course?.name || ac.courseId}
                      </span>
                    ))}
                    {(!p.authorizedCourses || p.authorizedCourses.length === 0) && (
                      <span className="text-slate-400 text-[11px] italic">No courses currently authorized</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Authorization Modal */}
      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Accredit Course to Training Provider"
        subtitle="Authorize a licensed partner to schedule regulated batches"
      >
        <form onSubmit={handleAuthorizeCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Training Provider
            </label>
            <select
              required
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— Choose a Provider —</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.location ? `(${p.location})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Regulated Course
            </label>
            <select
              required
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— Choose a Course —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Grant Course Accreditation
            </button>
          </div>
        </form>
      </Modal>

      {/* Learner Profile Review Modal with IDENTITY & EDUCATION DETAILS */}
      {viewingLearner && (
        <Modal
          isOpen={!!viewingLearner}
          onClose={() => setViewingLearner(null)}
          title="Learner Application & Identity Dossier"
          subtitle={`Review state credential details for ${viewingLearner.firstName} ${viewingLearner.lastName}`}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* IDENTITY & EDUCATION DETAILS CARD */}
            <div className="bg-brand-50/50 border border-brand-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-brand-200/60 pb-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-950">
                  IDENTITY & EDUCATION DETAILS
                </h4>
                <span className="text-[11px] bg-brand-100 text-brand-800 px-2.5 py-0.5 rounded-full font-bold">
                  Verified State Citizen
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                    AADHAAR NUMBER
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {revealedAadhaar[viewingLearner.id]
                        ? viewingLearner.aadhaarNumber
                        : viewingLearner.aadhaarNumber
                        ? `XXXX XXXX ${viewingLearner.aadhaarNumber.slice(-4)}`
                        : '—'}
                    </span>
                    {viewingLearner.aadhaarNumber && (
                      <button
                        type="button"
                        onClick={() => handleToggleAadhaar(viewingLearner.id)}
                        className="text-[10px] font-bold text-brand-900 bg-brand-100 hover:bg-brand-200 px-2 py-0.5 rounded-lg transition"
                      >
                        {revealedAadhaar[viewingLearner.id] ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                    APAAR / ABC ID
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
                    {viewingLearner.apaarAbcId || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                    HIGHEST QUALIFICATION
                  </span>
                  <span className="font-semibold text-slate-900 block mt-1">
                    {viewingLearner.educationLevel?.replace(/_/g, ' ') || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                    SOCIAL CATEGORY
                  </span>
                  <span className="font-semibold text-slate-900 block mt-1">
                    {viewingLearner.category || '—'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs border-t border-brand-200/40">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                  EXISTING SKILLS
                </span>
                <span className="font-medium text-slate-800 block mt-1">
                  {Array.isArray(viewingLearner.skills)
                    ? viewingLearner.skills.join(', ')
                    : viewingLearner.skills || '—'}
                </span>
              </div>

              <div className="pt-2 text-xs border-t border-brand-200/40">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                  TARGET CAREER GOAL
                </span>
                <span className="font-medium text-slate-800 block mt-1">
                  {viewingLearner.careerGoals || '—'}
                </span>
              </div>
            </div>

            {/* CONTACT & REGISTRATION METADATA */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 font-medium block">Email:</span>
                  <span className="font-semibold text-slate-800">{viewingLearner.user?.email || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Phone:</span>
                  <span className="font-semibold text-slate-800">{viewingLearner.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">State Canonical ID:</span>
                  <span className="font-mono font-semibold text-brand-800">{viewingLearner.canonicalId || viewingLearner.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Current Status:</span>
                  <StatusBadge status={viewingLearner.user?.status || 'PENDING'} />
                </div>
              </div>
            </div>

            {/* APPLICATION DECISION SECTION */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    APPLICATION DECISION
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs font-semibold text-slate-700">Current Status:</span>
                    <StatusBadge status={viewingLearner.user?.status || viewingLearner.status || 'PENDING'} />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setViewingLearner(null)}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition shadow-subtle"
                  >
                    Close
                  </button>
                  {(viewingLearner.user?.status === 'PENDING' || viewingLearner.status === 'PENDING' || !viewingLearner.user?.status || viewingLearner.user?.status === 'UNDER_REVIEW') ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handlePromptReject(viewingLearner.user?.id || viewingLearner.id, `${viewingLearner.firstName} ${viewingLearner.lastName}`)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition"
                      >
                        Reject Application
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromptApprove(viewingLearner.user?.id || viewingLearner.id, `${viewingLearner.firstName} ${viewingLearner.lastName}`)}
                        className="px-5 py-2 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>Approve Application</span>
                      </button>
                    </>
                  ) : (viewingLearner.user?.status === 'ACTIVE' || viewingLearner.user?.status === 'APPROVED' || viewingLearner.status === 'ACTIVE') ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      ✓ Approved
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                      ✕ Rejected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Approval Confirmation Modal */}
      {approvingLearnerId && (
        <Modal
          isOpen={!!approvingLearnerId}
          onClose={() => { setApprovingLearnerId(null); setApprovingLearnerName(''); }}
          title="Approve Learner Application?"
          subtitle="Official State Accreditation & Access Authorization"
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start space-x-3 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Confirmation Required</p>
                <p className="text-slate-600 leading-relaxed">
                  Are you sure you want to approve this learner application for <strong>{approvingLearnerName}</strong>?
                  Upon confirmation, the account status will be set to <strong>ACTIVE</strong> in the database and the learner will receive an official notification.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => { setApprovingLearnerId(null); setApprovingLearnerName(''); }}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionLoading ? 'Approving...' : 'Confirm Approval'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Modal */}
      {rejectingLearnerId && (
        <Modal
          isOpen={!!rejectingLearnerId}
          onClose={() => { setRejectingLearnerId(null); setRejectingLearnerName(''); setRejectReason(''); setRejectError(''); }}
          title="Reject Learner Application"
          subtitle={`Applicant: ${rejectingLearnerName || 'Applicant'}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Rejection Reason *
              </label>
              <textarea
                required
                value={rejectReason}
                onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
                placeholder="Enter reason for rejection (e.g. Incomplete educational records or non-compliant credentials)..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
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
                onClick={() => { setRejectingLearnerId(null); setRejectingLearnerName(''); setRejectReason(''); setRejectError(''); }}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{actionLoading ? 'Rejecting...' : 'Reject Application'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
