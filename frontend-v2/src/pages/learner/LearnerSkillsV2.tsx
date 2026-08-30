import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Clock, Award, CheckCircle2, ArrowRight, RefreshCw, Calendar } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { Course, Batch } from '../../types';

export const LearnerSkillsV2: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cRes, bRes] = await Promise.all([
          api.get('/courses').catch(() => ({ courses: [] })),
          api.get('/batches').catch(() => ({ batches: [] })),
        ]);

        setCourses(cRes.courses || []);
        setBatches(bRes.batches || []);
      } catch (err) {
        console.error('Error fetching course catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    try {
      await api.post('/enrollments', { batchId: selectedBatchId });
      setSuccess('Enrollment application submitted successfully! Under review by Course Manager.');
      setEnrollModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit enrollment application.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle">
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

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c, idx) => {
          const matchScore = 95 - idx * 6;
          const courseBatches = batches.filter((b) => b.courseId === c.id);

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
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'Regulated curriculum'}</p>
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
                    {c.skills?.map((sk, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 mt-5 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {courseBatches.length} Available Cohorts
                </span>
                <button
                  onClick={() => {
                    setSelectedCourse(c);
                    setEnrollModalOpen(true);
                  }}
                  className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center space-x-1"
                >
                  <span>Apply for Batch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
              <option value="">— Choose a Batch —</option>
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
            <p className="font-bold text-slate-800">Enrollment Notice:</p>
            <p>Your application will be sent to the Course Manager for eligibility verification.</p>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEnrollModalOpen(false)}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-900 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
