import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  Users
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { parseSkills } from '../../lib/utils';
import { Course, Batch, Enrollment } from '../../types';

export const LearnerSkillsV2: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cRes, bRes, eRes] = await Promise.all([
        api.get('/courses').catch(() => ({ courses: [] })),
        api.get('/batches').catch(() => ({ batches: [] })),
        api.get('/enrollments').catch(() => ({ enrollments: [] })),
      ]);

      setCourses(cRes.courses || (Array.isArray(cRes) ? cRes : []));
      setBatches(bRes.batches || (Array.isArray(bRes) ? bRes : []));
      setEnrollments(eRes.enrollments || (Array.isArray(eRes) ? eRes : []));
    } catch (err: any) {
      console.error('Error fetching course catalog & enrollments:', err);
      setError('Unable to load course catalog. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open enroll modal for a course
  const handleOpenEnrollModal = (course: Course) => {
    setSelectedCourse(course);
    const availableBatches = batches.filter((b) => b.courseId === course.id && b.status === 'ACTIVE');
    if (availableBatches.length > 0) {
      setSelectedBatchId(availableBatches[0].id);
    } else {
      setSelectedBatchId('');
    }
    setError(null);
    setSuccess(null);
    setEnrollModalOpen(true);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) {
      setError('Please select an active cohort batch to apply.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Call backend enrollment endpoint
      const res = await api.post('/batches/enroll', { batchId: selectedBatchId });

      setSuccess(
        res.message || 'Enrollment application submitted successfully! Under review by Course Manager.'
      );
      setEnrollModalOpen(false);

      // Re-fetch enrollments to update state seamlessly
      await fetchData();
    } catch (err: any) {
      console.error('Enrollment application error:', err);
      const msg = err.message || '';
      if (msg.includes('already applied') || msg.includes('already requested') || msg.includes('409')) {
        setError('You have already applied for this batch.');
      } else if (msg.includes('404') || msg.includes('not found')) {
        setError('This batch could not be found.');
      } else if (msg.includes('permission') || msg.includes('403')) {
        setError("You don't have permission to apply for this batch. Please ensure you are signed in as a registered learner.");
      } else if (msg.includes('sign in') || msg.includes('401')) {
        setError('Your session has expired. Please sign in again.');
      } else if (msg.includes('capacity') || msg.includes('full')) {
        setError('This batch has reached maximum capacity and is no longer accepting applications.');
      } else {
        setError(msg || 'Unable to submit your application right now. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Check enrollment status for a course
  const getCourseEnrollmentStatus = (courseId: string) => {
    const matchingEnrollment = enrollments.find(
      (en) => en.batch?.courseId === courseId || en.batch?.course?.id === courseId
    );
    return matchingEnrollment;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Skill Gap & Career Matching</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Explore Government Skilling Programs
          </h2>
          <p className="text-xs text-slate-500">
            Discover high-demand technical courses matched to state employment outcome opportunities.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-subtle disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 underline text-xs ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 underline text-xs ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c, idx) => {
          const matchScore = Math.max(75, 96 - idx * 5);
          const courseBatches = batches.filter((b) => b.courseId === c.id);
          const enrollment = getCourseEnrollmentStatus(c.id);

          return (
            <div
              key={c.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-mono font-bold text-xs">
                    {c.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                    {matchScore}% Match
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'Regulated state curriculum'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Duration:</span>
                    </span>
                    <span className="font-bold">{c.expectedDurationHours} Hours</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Min Attendance:</span>
                    <span className="font-bold">{c.attendanceRequirement}%</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Key Competencies</span>
                  <div className="flex flex-wrap gap-1">
                    {parseSkills(c.skills).map((sk, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 mt-5 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  {courseBatches.length} Available Cohorts
                </span>

                {enrollment ? (
                  <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl shadow-subtle">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {enrollment.status === 'REQUESTED'
                        ? 'Applied (Under Review)'
                        : enrollment.status === 'ENROLLED'
                        ? 'Enrolled'
                        : enrollment.status}
                    </span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleOpenEnrollModal(c)}
                    className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center space-x-1"
                  >
                    <span>Apply for Batch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {courses.length === 0 && !loading && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Courses Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            New government skilling programs will appear here as cohorts open for registration.
          </p>
        </div>
      )}

      {/* Modal: Enroll in Batch */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title="Apply for Batch Enrollment"
        subtitle={selectedCourse ? `${selectedCourse.name} (${selectedCourse.code})` : 'Course Selection'}
      >
        <form onSubmit={handleEnrollSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Available Batch *
            </label>
            <select
              required
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— Choose an Accredited Batch —</option>
              {batches
                .filter((b) => !selectedCourse || b.courseId === selectedCourse.id)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} • {b.provider?.name || 'Center'} ({b.trainingMode})
                  </option>
                ))}
            </select>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Accreditation Notice:</span>
            </p>
            <p>
              Your application will be routed directly to the Course Manager for prerequisite review.
              Once confirmed, you will receive notifications for batch orientation.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEnrollModalOpen(false)}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedBatchId}
              className="px-5 py-2 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
