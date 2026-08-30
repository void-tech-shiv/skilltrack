import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  ShieldCheck,
  Award,
  Bell,
  User as UserIcon,
  ChevronDown,
  Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDisplayName, getRoleBadgeStyle, getInitials, cn } from '../../lib/utils';
import { UserRole } from '../../types';

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuToggle }) => {
  const { user, switchRoleQuick } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const location = useLocation();

  const role = user?.role;
  const badgeStyle = getRoleBadgeStyle(role);

  const availableRoles: { role: UserRole; label: string }[] = [
    { role: 'GOVERNMENT_ADMIN', label: 'Government Admin' },
    { role: 'COURSE_MANAGER', label: 'Course Manager' },
    { role: 'TRAINING_PROVIDER', label: 'Training Provider' },
    { role: 'TRAINER', label: 'Teacher' },
    { role: 'TRAINEE', label: 'Learner' },
    { role: 'EMPLOYER', label: 'Employer' },
  ];

  // Breadcrumbs calculation
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const pageTitle = pathSegments.length > 0 
    ? pathSegments[pathSegments.length - 1].replace(/-/g, ' ').toUpperCase()
    : 'DASHBOARD';

  return (
    <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200/80 z-20 shadow-subtle px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
              <span>MahaSkills V2</span>
              <span>/</span>
              <span className="text-slate-700 capitalize">
                {pathSegments[0] ? pathSegments[0].replace(/-/g, ' ') : 'Overview'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right Section: Public Cert Shortcut, Quick Role Switcher, & User Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Public Certificate Registry Shortcut */}
          <Link
            to="/verify"
            className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition shadow-subtle"
          >
            <Award className="w-4 h-4 text-brand-600" />
            <span>Public Verify Registry</span>
          </Link>

          {/* Quick Role Switcher for Evaluators & Pair Programming */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className={cn(
                'inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-subtle transition',
                badgeStyle.bg,
                badgeStyle.text,
                badgeStyle.border
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{getRoleDisplayName(role)}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {roleMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch Persona</p>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">Select a role workspace to test:</p>
                  </div>
                  <div className="py-1 space-y-0.5">
                    {availableRoles.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchRoleQuick(r.role);
                          setRoleMenuOpen(false);
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition',
                          role === r.role ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <span>{r.label}</span>
                        {role === r.role && <ShieldCheck className="w-4 h-4 text-brand-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {getInitials(user?.name || user?.email)}
            </div>
            <div className="hidden xl:block text-left leading-tight">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                {user?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
