import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  ShieldCheck,
  Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDisplayName, getRoleBadgeStyle, getInitials, cn } from '../../lib/utils';

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuToggle }) => {
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.role;
  const badgeStyle = getRoleBadgeStyle(role);

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

        {/* Right Section: Public Cert Shortcut, Authenticated Role Display, & User Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Public Certificate Registry Shortcut */}
          <Link
            to="/verify"
            className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition shadow-subtle"
          >
            <Award className="w-4 h-4 text-brand-600" />
            <span>Public Verify Registry</span>
          </Link>

          {/* Authenticated Role Badge (Clean, Non-Clickable Display) */}
          <div
            className={cn(
              'inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-subtle select-none',
              badgeStyle.bg,
              badgeStyle.text,
              badgeStyle.border
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{getRoleDisplayName(role)}</span>
          </div>

          {/* User Profile Avatar & Info */}
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
