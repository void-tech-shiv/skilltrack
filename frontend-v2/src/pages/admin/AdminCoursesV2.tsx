import React, { useState, useEffect } from 'react';
import { BookOpen, Award, CheckCircle2, Clock, Users, Plus } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../lib/api';
import { Course } from '../../types';

export const AdminCoursesV2: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
    fetchCourses();
  }, []);

  const columns: Column<Course>[] = [
    {
      key: 'name',
      header: 'Regulated Course',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-400 font-mono">{item.code}</p>
        </div>
      ),
    },
    {
      key: 'expectedDurationHours',
      header: 'Duration',
      render: (item) => (
        <div className="flex items-center space-x-1 text-xs text-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.expectedDurationHours} Hours</span>
        </div>
      ),
    },
    {
      key: 'rules',
      header: 'Completion Thresholds',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-slate-800">Min Attendance: {item.attendanceRequirement}%</p>
          <p className="text-[11px] text-slate-500">Modules Req: {item.moduleRequirement}%</p>
        </div>
      ),
    },
    {
      key: 'evidenceRequired',
      header: 'Lab Evidence',
      render: (item) => (
        <StatusBadge
          status={item.evidenceRequired ? 'MANDATORY' : 'OPTIONAL'}
          variant={item.evidenceRequired ? 'verified' : 'neutral'}
        />
      ),
    },
    {
      key: 'skills',
      header: 'Mapped Skills',
      render: (item) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {item.skills?.map((s, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
              {s}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Regulated State Course Catalog
          </h2>
          <p className="text-xs text-slate-500">
            Standardized technical curriculum, modular completion criteria, and skill taxonomies.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={courses}
        searchPlaceholder="Search courses by title or code..."
        emptyTitle="No courses registered"
      />
    </div>
  );
};
