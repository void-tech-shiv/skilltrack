import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Clock, CheckSquare, Layers, Award, RefreshCw, CheckCircle2 } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { Course } from '../../types';

export const CourseCurriculumV2: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // New Course Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [durationHours, setDurationHours] = useState(120);
  const [attendanceReq, setAttendanceReq] = useState(80);
  const [moduleReq, setModuleReq] = useState(100);
  const [evidenceRequired, setEvidenceRequired] = useState(true);
  const [skillsStr, setSkillsStr] = useState('EV Powertrain Diagnostics, Battery Safety');

  // New Module Form State
  const [moduleName, setModuleName] = useState('');
  const [moduleOrder, setModuleOrder] = useState(1);
  const [moduleEvidenceReq, setModuleEvidenceReq] = useState(true);

  // Feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses');
      setCourses(res.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skills = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
      await api.post('/courses', {
        name,
        code: code.toUpperCase(),
        description,
        expectedDurationHours: Number(durationHours),
        attendanceRequirement: Number(attendanceReq),
        moduleRequirement: Number(moduleReq),
        evidenceRequired,
        skills,
        targetJobRoles: ['Specialized Technician', 'Field Engineer'],
      });

      setSuccessMsg(`Course "${name}" created successfully with completion rules!`);
      setCreateCourseOpen(false);
      fetchCourses();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create course.');
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      await api.post(`/courses/${selectedCourse.id}/modules`, {
        name: moduleName,
        order: Number(moduleOrder),
        requiredEvidence: moduleEvidenceReq,
      });

      setSuccessMsg(`Module "${moduleName}" added to ${selectedCourse.name}!`);
      setAddModuleOpen(false);
      fetchCourses();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add module.');
    }
  };

  const columns: Column<Course>[] = [
    {
      key: 'name',
      header: 'Course & Code',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-brand-700 font-mono font-bold">{item.code}</p>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration & Attendance Rule',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-slate-800">{item.expectedDurationHours} Hours</p>
          <p className="text-slate-500 font-medium">Min {item.attendanceRequirement}% Required</p>
        </div>
      ),
    },
    {
      key: 'modules',
      header: 'Curriculum Hierarchy',
      render: (item) => (
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-700">{item.modules?.length || 0} Modules Registered</p>
          <button
            onClick={() => {
              setSelectedCourse(item);
              setModuleOrder((item.modules?.length || 0) + 1);
              setAddModuleOpen(true);
            }}
            className="text-[11px] font-bold text-brand-600 hover:underline flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Module</span>
          </button>
        </div>
      ),
    },
    {
      key: 'evidence',
      header: 'Evidence Rule',
      render: (item) => (
        <StatusBadge
          status={item.evidenceRequired ? 'MANDATORY' : 'OPTIONAL'}
          variant={item.evidenceRequired ? 'verified' : 'neutral'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Curriculum Authoring & Completion Rules
          </h2>
          <p className="text-xs text-slate-500">
            Define structured modular syllabi, laboratory proof requirements, and passing criteria.
          </p>
        </div>

        <button
          onClick={() => setCreateCourseOpen(true)}
          className="px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Regulated Course</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>Dismiss</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center justify-between">
          <span>✕ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}>Dismiss</button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={courses}
        searchPlaceholder="Search courses..."
        emptyTitle="No courses registered"
      />

      {/* Modal: Create Course */}
      <Modal
        isOpen={createCourseOpen}
        onClose={() => setCreateCourseOpen(false)}
        title="Create New Regulated Course"
        subtitle="Define course rules and threshold criteria"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. EV Powertrain Diagnostics"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. EV-TECH-401"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hours (Duration)
              </label>
              <input
                type="number"
                required
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Min Attendance %
              </label>
              <input
                type="number"
                required
                value={attendanceReq}
                onChange={(e) => setAttendanceReq(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Min Modules %
              </label>
              <input
                type="number"
                required
                value={moduleReq}
                onChange={(e) => setModuleReq(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mapped Skills (comma-separated)
            </label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>

          <label className="flex items-center space-x-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={evidenceRequired}
              onChange={(e) => setEvidenceRequired(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600"
            />
            <span className="text-xs font-bold text-slate-800">
              Mandate Practical Lab Evidence Proof for Certificate Eligibility
            </span>
          </label>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setCreateCourseOpen(false)}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-900 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Create Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Module */}
      <Modal
        isOpen={addModuleOpen}
        onClose={() => setAddModuleOpen(false)}
        title={`Add Module to ${selectedCourse?.name || 'Course'}`}
        subtitle="Define syllabus unit and evidence requirement"
      >
        <form onSubmit={handleAddModule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Module Title *
            </label>
            <input
              type="text"
              required
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="e.g. Battery Management System (BMS) Calibration"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sequence Order
              </label>
              <input
                type="number"
                required
                value={moduleOrder}
                onChange={(e) => setModuleOrder(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={moduleEvidenceReq}
                  onChange={(e) => setModuleEvidenceReq(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600"
                />
                <span>Requires Lab Submission</span>
              </label>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setAddModuleOpen(false)}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-900 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Save Module
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
