import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  Calendar,
  Award,
  BarChart3,
  ShieldAlert,
  ClipboardList,
  CheckSquare,
  FileText,
  Briefcase,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn, getRoleDisplayName, getRoleBadgeStyle } from '../../lib/utils';
import { UserRole } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const role = user?.role;

  // Define role-specific navigation items
  const getNavItems = (userRole?: UserRole) => {
    switch (userRole) {
      case 'GOVERNMENT_ADMIN':
        return [
          { to: '/admin', label: 'Governance Command', icon: LayoutDashboard },
          { to: '/admin/approvals', label: 'Pending Approvals', icon: UserCheck },
          { to: '/admin/analytics', label: 'State Macro Analytics', icon: BarChart3 },
          { to: '/admin/courses', label: 'State Course Catalog', icon: BookOpen },
          { to: '/admin/batches', label: 'Accredited Batches', icon: Calendar },
          { to: '/admin/certificates', label: 'Certificate Issuance', icon: Award },
          { to: '/admin/interventions', label: 'Outcomes & Interventions', icon: ShieldAlert },
          { to: '/admin/audit-logs', label: 'Compliance Audit Logs', icon: ClipboardList },
        ];

      case 'COURSE_MANAGER':
        return [
          { to: '/course-manager', label: 'Operations Overview', icon: LayoutDashboard },
          { to: '/course-manager/curriculum', label: 'Curriculum & Rules', icon: BookOpen },
          { to: '/course-manager/batches', label: 'Batch Scheduler', icon: Calendar },
          { to: '/course-manager/enrollments', label: 'Enrollment Requests', icon: Users },
          { to: '/course-manager/completions', label: 'Completion Approvals', icon: Award },
        ];

      case 'TRAINING_PROVIDER':
        return [
          { to: '/provider', label: 'Provider Center', icon: LayoutDashboard },
          { to: '/provider/batches', label: 'My Batches', icon: Calendar },
          { to: '/provider/teachers', label: 'Affiliated Teachers', icon: Users },
          { to: '/provider/learners', label: 'Enrolled Learners', icon: GraduationCap },
          { to: '/provider/operations', label: 'Training Operations', icon: CheckSquare },
        ];

      case 'TRAINER': // Teacher
        return [
          { to: '/teacher', label: 'Teacher Workspace', icon: LayoutDashboard },
          { to: '/teacher/sessions', label: 'Classroom Sessions', icon: Calendar },
          { to: '/teacher/attendance', label: 'Mark Attendance', icon: CheckSquare },
          { to: '/teacher/evidence', label: 'Evidence Verification', icon: FileText },
          { to: '/teacher/recommendations', label: 'Recommend Completion', icon: Award },
        ];

      case 'TRAINEE': // Learner
        return [
          { to: '/learner', label: 'My Journey', icon: LayoutDashboard },
          { to: '/learner/skills', label: 'Skills & AI Gap Match', icon: Sparkles },
          { to: '/learner/training', label: 'My Training & Batches', icon: Calendar },
          { to: '/learner/evidence', label: 'Evidence Submissions', icon: FileText },
          { to: '/learner/employment', label: 'Employment Outcomes', icon: Briefcase },
          { to: '/learner/certificates', label: 'My Certificates', icon: Award },
          { to: '/learner/consent', label: 'Privacy & Consent', icon: ShieldCheck },
        ];

      case 'EMPLOYER':
        return [
          { to: '/employer', label: 'Enterprise Workspace', icon: LayoutDashboard },
          { to: '/employer/verifications', label: 'Learner Verifications', icon: CheckSquare },
          { to: '/employer/roster', label: 'Verified Employees', icon: Users },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems(role);
  const badgeStyle = getRoleBadgeStyle(role);

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 z-30 shadow-subtle',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand & Organization Header */}
      <div>
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-gov-navy to-brand-700 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none truncate">
                  MahaSkills V2
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold truncate mt-1">
                  Outcomes Intelligence
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Persona Pill (when expanded) */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Workspace</span>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', badgeStyle.bg, badgeStyle.text, badgeStyle.border)}>
                {getRoleDisplayName(role)}
              </span>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.split('/').length <= 2}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 group',
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-subtle font-bold'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0 transition-colors',
                        isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-700'
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Quick Info & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
