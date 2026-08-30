import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Calendar, Award, Shield, Upload, FileText, QrCode, ExternalLink, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const TraineePortal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [trainee, setTrainee] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'training' | 'modules' | 'outcomes' | 'certificates' | 'consent'>('profile');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Evidence upload form state
  const [evidenceTitle, setEvidenceTitle] = useState('HV Battery Circuit Diagnostics Lab Report');
  const [evidenceUrl, setEvidenceUrl] = useState('/uploads/my_lab_report.pdf');
  const [evidenceDesc, setEvidenceDesc] = useState('Completed high-voltage safety disconnect and multimeter oscilloscope testing.');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');

  // Eligibility check state
  const [eligibilityData, setEligibilityData] = useState<any>(null);

  const fetchTraineeData = async () => {
    const targetId = id || user?.traineeId;
    if (!token || !targetId) return;
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [tRes, cRes] = await Promise.all([
        fetch(`${API_BASE_URL}/trainees/${targetId}`, { headers }),
        fetch(`${API_BASE_URL}/courses`, { headers })
      ]);

      if (tRes.ok) {
        const data = await tRes.json();
        setTrainee(data.trainee);
        if (data.trainee?.enrollments?.length > 0) {
          setSelectedEnrollmentId(data.trainee.enrollments[0].id);
        }
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCourses(cData.courses || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraineeData();
  }, [token, user, id]);

  const handleEnrollCourse = async (batchId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/batches/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ batchId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrollment request failed');
      setFeedback({ type: 'success', message: 'Enrollment application submitted for Course Manager review.' });
      fetchTraineeData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollmentId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/training/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          enrollmentId: selectedEnrollmentId,
          title: evidenceTitle,
          fileUrl: evidenceUrl,
          fileType: 'PDF',
          description: evidenceDesc
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit evidence');
      setFeedback({ type: 'success', message: 'Evidence document submitted for Teacher verification.' });
      fetchTraineeData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCheckEligibility = async (enrollmentId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/certificates/eligibility/${enrollmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEligibilityData(data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleApplyCertificate = async (enrollmentId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/certificates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enrollmentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Certificate application failed');
      setFeedback({ type: 'success', message: 'Certificate application submitted for Government Admin approval.' });
      fetchTraineeData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleToggleConsent = async (granted: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/consent`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          granted,
          consentType: 'LONGITUDINAL_OUTCOMES_TRACKING',
          notes: granted ? 'Consent renewed via portal' : 'Consent revoked via portal'
        })
      });
      if (!res.ok) throw new Error('Failed to update consent');
      setFeedback({ type: 'success', message: 'Consent preferences updated and logged.' });
      fetchTraineeData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Learner Portal...</div>;
  if (!trainee) return <div className="p-10 text-center text-red-500">Error loading learner record.</div>;

  const currentEnrollment = trainee.enrollments?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-100 text-sky-800">
              STATE LEARNER PORTAL
            </span>
            <span className="text-xs text-slate-500 font-mono">Learner ID: {trainee.canonicalId}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{trainee.firstName} {trainee.lastName}</h1>
          <p className="text-sm text-slate-600">
            District: {trainee.district} • Education: {trainee.educationLevel} • Career Goal: {trainee.careerGoals || 'Not set'}
          </p>
        </div>
        <button
          onClick={fetchTraineeData}
          className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
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

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'profile' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Skill Gap</span>
        </button>

        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'training' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Training & Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'modules' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Modules & Evidence Upload</span>
        </button>

        <button
          onClick={() => setActiveTab('outcomes')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'outcomes' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Employment Outcomes</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'certificates' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Government Certificates</span>
        </button>

        <button
          onClick={() => setActiveTab('consent')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'consent' ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy & Consent</span>
        </button>
      </div>

      {/* TAB 1: PROFILE & SKILL GAP */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Info */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Learner Profile</h2>
              <div className="space-y-2 text-sm text-slate-700">
                <p><span className="text-slate-500 font-medium">State ID:</span> <b className="font-mono">{trainee.canonicalId}</b></p>
                <p><span className="text-slate-500 font-medium">Phone:</span> {trainee.phone || 'N/A'}</p>
                <p><span className="text-slate-500 font-medium">Division:</span> {trainee.division}</p>
                <p><span className="text-slate-500 font-medium">Category:</span> {trainee.category}</p>
                <p><span className="text-slate-500 font-medium">Gender:</span> {trainee.gender}</p>
                <p><span className="text-slate-500 font-medium">Declared Skills:</span> {trainee.skills || 'None'}</p>
              </div>
            </div>

            {/* AI Skill Gap Intelligence */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2">AI Skill Gap & Career Readiness</h2>
              <p className="text-xs text-slate-500 mb-4">
                Analysis based on your current skills vs Maharashtra high-demand industrial roles.
              </p>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
                  <span className="font-bold text-blue-900">Target Role: </span>
                  <span className="text-blue-800">{trainee.careerGoals || 'EV Diagnostic Specialist'}</span>
                  <div className="mt-1 text-slate-600">
                    Required Competencies: <b>BMS Calibration, High-Voltage Isolation, Oscilloscope Waveform Scan</b>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs">
                  <span className="font-bold text-emerald-900">Skill Gap Index: </span>
                  <span className="font-bold text-emerald-800">Low Gap (78% Match)</span>
                  <p className="text-slate-600 mt-0.5">Completing EV-101 course closes all remaining technical prerequisites.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Courses */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recommended Courses & Available Batches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((c) => (
                <div key={c.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded">
                        {c.code}
                      </span>
                      <span className="text-xs text-slate-500">{c.expectedDurationHours} Hours</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-2">{c.name}</h3>
                    <p className="text-xs text-slate-600 mt-1">{c.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-emerald-700 font-semibold">
                      Min Attendance: {c.attendanceRequirement}%
                    </span>
                    {c.batches?.length > 0 ? (
                      <button
                        onClick={() => handleEnrollCourse(c.batches[0].id)}
                        className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded"
                      >
                        Apply for Batch
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Batch Scheduling Soon</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE TRAINING & ATTENDANCE */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          {currentEnrollment ? (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                      ENROLLED BATCH: {currentEnrollment.batch?.name}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-2">{currentEnrollment.batch?.course?.name}</h2>
                    <p className="text-xs text-slate-600">
                      Training Provider: <b>{currentEnrollment.batch?.provider?.name}</b> • Teacher: <b>{currentEnrollment.batch?.trainer?.name || 'Assigned'}</b>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Mode: <span className="font-semibold">{currentEnrollment.batch?.trainingMode}</span> • Location: {currentEnrollment.batch?.location}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                    STATUS: {currentEnrollment.status}
                  </span>
                </div>
              </div>

              {/* Attendance Records */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Session Attendance & Hours Credited</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Session Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Topic</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Hours Credited</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {trainee.attendanceRecords?.map((att: any) => (
                        <tr key={att.id}>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {new Date(att.session?.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{att.session?.topic}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              att.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                            {att.trainingHours} hrs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg text-center text-slate-500 border">
              <p className="text-sm">No active training enrollments found. Discover courses in the Profile tab.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MODULES & EVIDENCE SUBMISSION */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          {/* Submit Evidence Form */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Submit External Training Evidence / Lab Report</h2>
            <p className="text-xs text-slate-500 mb-4">
              Upload proof of completed external training assignments, oscilloscope lab oscillograms, or project reports for Teacher verification.
            </p>
            <form onSubmit={handleSubmitEvidence} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">Evidence Title *</label>
                <input
                  type="text"
                  required
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">File URL / Cloud Document Link *</label>
                <input
                  type="text"
                  required
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Work Description / Observations</label>
                <textarea
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm"
              >
                Submit Evidence for Teacher Review
              </button>
            </form>
          </div>

          {/* Evidence Submissions History */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Submitted Evidence Records</h2>
            <div className="space-y-3">
              {currentEnrollment?.evidenceSubmissions?.map((ev: any) => (
                <div key={ev.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{ev.title}</h3>
                    <p className="text-slate-600">{ev.description}</p>
                    {ev.verificationNotes && <p className="text-emerald-700 mt-1 font-medium">Teacher Note: {ev.verificationNotes}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    ev.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ev.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OUTCOMES & FOLLOW-UPS */}
      {activeTab === 'outcomes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recorded Employment Outcomes</h2>
            <div className="space-y-3">
              {trainee.outcomes?.map((o: any) => (
                <div key={o.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                        {o.status}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-2">{o.jobTitle || o.enterpriseName || 'Outcome Recorded'}</h3>
                      {o.employerName && <p className="text-xs text-slate-600">Employer: {o.employerName}</p>}
                      {o.salary && <p className="text-xs text-slate-600 font-semibold">Salary: ₹{o.salary.toLocaleString()}/month</p>}
                      {o.monthlyRevenue && <p className="text-xs text-slate-600 font-semibold">Enterprise Revenue: ₹{o.monthlyRevenue.toLocaleString()}/month</p>}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      Checkpoint: {o.retentionCheckpoint}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CERTIFICATES & QR VERIFICATION */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {/* Eligibility Check & Apply */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Government Certificate Eligibility Engine</h2>
            <p className="text-xs text-slate-500 mb-4">
              Automated validation against Maharashtra State Innovation Society certification criteria.
            </p>

            {currentEnrollment && (
              <div className="space-y-4">
                <button
                  onClick={() => handleCheckEligibility(currentEnrollment.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded"
                >
                  Run Eligibility Evaluation
                </button>

                {eligibilityData && (
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Attendance: <b>{eligibilityData.criteria?.attendancePercent}%</b> (Required: {eligibilityData.criteria?.attendanceRequired}%)</span>
                      <span className={eligibilityData.criteria?.attendanceEligible ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                        {eligibilityData.criteria?.attendanceEligible ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Module Completion: <b>{eligibilityData.criteria?.modulePercent}%</b> (Required: {eligibilityData.criteria?.moduleRequired}%)</span>
                      <span className={eligibilityData.criteria?.moduleEligible ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                        {eligibilityData.criteria?.moduleEligible ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Evidence Verification:</span>
                      <span className={eligibilityData.criteria?.evidenceEligible ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                        {eligibilityData.criteria?.evidenceEligible ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>

                    <div className="pt-2 border-t flex justify-between items-center">
                      <span className="font-bold">Overall Eligibility:</span>
                      <button
                        onClick={() => handleApplyCertificate(currentEnrollment.id)}
                        disabled={!eligibilityData.isEligible}
                        className={`px-3 py-1 font-bold rounded ${
                          eligibilityData.isEligible
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {eligibilityData.isEligible ? 'Apply for Official Certificate' : 'Ineligible (Pending Manager Approval or Thresholds)'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Issued Certificates */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Official Issued State Certificates</h2>
            <div className="space-y-4">
              {trainee.certificates?.map((cert: any) => (
                <div key={cert.id} className="p-6 border-2 border-blue-900 rounded-lg bg-blue-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-6 h-6 text-amber-600" />
                      <h3 className="font-bold text-blue-950 text-base">{cert.course?.name}</h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">Certificate No: <b className="font-mono">{cert.certificateNumber}</b></p>
                    <p className="text-xs text-slate-500">Issued On: {new Date(cert.issueDate).toLocaleDateString()} • Authorized by: {cert.approvedBy}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/verify-certificate/${cert.certificateNumber}`}
                      target="_blank"
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded flex items-center space-x-1.5 shadow"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Public QR Verification Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PRIVACY & CONSENT */}
      {activeTab === 'consent' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Consent & Privacy Governance</h2>
            <p className="text-xs text-slate-500 mb-4">
              You maintain full ownership of your data under Maharashtra Government privacy compliance policies.
            </p>

            <div className="bg-slate-50 p-4 rounded border border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Longitudinal Skilling & Outcomes Tracking</h3>
                <p className="text-xs text-slate-600">Allows Government analytics to measure wage progression and job retention.</p>
              </div>
              <button
                onClick={() => handleToggleConsent(!trainee.consentStatus)}
                className={`px-4 py-1.5 text-xs font-bold rounded ${
                  trainee.consentStatus ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {trainee.consentStatus ? 'GRANTED' : 'REVOKED'}
              </button>
            </div>

            {/* Consent History */}
            <div className="mt-6">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">Immutable Audit Trail</h3>
              <div className="space-y-2">
                {trainee.consentLogs?.map((log: any) => (
                  <div key={log.id} className="text-xs text-slate-600 p-2 border-b border-slate-100 flex justify-between">
                    <span>{log.notes} ({log.consentType})</span>
                    <span className="font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
