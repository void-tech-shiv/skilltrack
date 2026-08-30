import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import Trainees from './pages/Trainees';
import Upload from './pages/Upload';
import { Login } from './pages/Login';
import { TraineePortal } from './pages/TraineePortal';
import { EmployerPortal } from './pages/EmployerPortal';
import { AdminPortal } from './pages/AdminPortal';
import { CourseManagerPortal } from './pages/CourseManagerPortal';
import { TrainerPortal } from './pages/TrainerPortal';
import { TrainingProviderPortal } from './pages/TrainingProviderPortal';
import { PublicCertificateVerify } from './pages/PublicCertificateVerify';
import { LandingPage } from './pages/LandingPage';
import { ForgotPassword } from './pages/ForgotPassword';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShieldCheck, LogOut } from 'lucide-react';

const getRoleDisplayName = (r?: string) => {
  switch (r) {
    case 'GOVERNMENT_ADMIN': return 'Government Admin';
    case 'COURSE_MANAGER': return 'Course Manager';
    case 'TRAINING_PROVIDER': return 'Training Provider';
    case 'TRAINER': return 'Teacher';
    case 'EMPLOYER': return 'Employer';
    case 'TRAINEE': return 'Learner';
    default: return r || '';
  }
};

function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const role = user?.role;
  
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Official Government Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900 text-white flex items-center justify-center font-bold text-lg rounded shadow-sm flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Skill & Employment Outcomes Intelligence
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">
                Maharashtra State Innovation Society (MSInS) • Government of Maharashtra
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm font-semibold text-slate-700 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              {role === 'GOVERNMENT_ADMIN' && (
                <>
                  <Link to="/admin" className="hover:text-blue-900">Government Admin Governance</Link>
                  <Link to="/dashboard" className="hover:text-blue-900">State Analytics</Link>
                  <Link to="/trainees" className="hover:text-blue-900">Learners Roster</Link>
                  <Link to="/upload" className="hover:text-blue-900">Data Ingest</Link>
                </>
              )}
              {role === 'COURSE_MANAGER' && (
                <>
                  <Link to="/course-manager" className="hover:text-blue-900">Course & Batch Operations</Link>
                  <Link to="/trainees" className="hover:text-blue-900">Learners Roster</Link>
                </>
              )}
              {role === 'TRAINING_PROVIDER' && (
                <>
                  <Link to="/provider-portal" className="hover:text-blue-900">Training Provider Center</Link>
                  <Link to="/trainees" className="hover:text-blue-900">Enrolled Learners</Link>
                </>
              )}
              {role === 'TRAINER' && (
                <>
                  <Link to="/trainer-portal" className="hover:text-blue-900">Teacher Dashboard</Link>
                </>
              )}
              {role === 'TRAINEE' && (
                <>
                  <Link to="/trainee-portal" className="hover:text-blue-900">Learner Dashboard</Link>
                </>
              )}
              {role === 'EMPLOYER' && (
                <>
                  <Link to="/employer-portal" className="hover:text-blue-900">Employer Verifications</Link>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 border-l border-slate-300">
              <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded bg-slate-200 text-slate-800 uppercase tracking-wide whitespace-nowrap">
                {getRoleDisplayName(role)}
              </span>
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold text-xs transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>

      {/* Government Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © 2026 Maharashtra State Innovation Society (MSInS), Government of Maharashtra. All rights reserved.
      </footer>
    </div>
  );
}

function Protected({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Verifying authorization...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <MainLayout>{children}</MainLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-certificate" element={<PublicCertificateVerify />} />
      <Route path="/verify-certificate/:certNumber" element={<PublicCertificateVerify />} />

      {/* Role-Specific Portals */}
      <Route path="/admin" element={<Protected roles={['GOVERNMENT_ADMIN']}><AdminPortal /></Protected>} />
      <Route path="/dashboard" element={<Protected roles={['GOVERNMENT_ADMIN']}><Dashboard /></Protected>} />
      <Route path="/course-manager" element={<Protected roles={['GOVERNMENT_ADMIN', 'COURSE_MANAGER']}><CourseManagerPortal /></Protected>} />
      <Route path="/trainer-portal" element={<Protected roles={['TRAINER']}><TrainerPortal /></Protected>} />
      <Route path="/provider-portal" element={<Protected roles={['TRAINING_PROVIDER']}><TrainingProviderPortal /></Protected>} />
      <Route path="/trainee-portal" element={<Protected roles={['TRAINEE']}><TraineePortal /></Protected>} />
      <Route path="/employer-portal" element={<Protected roles={['EMPLOYER']}><EmployerPortal /></Protected>} />
      
      {/* Shared Roster & Data Ingestion */}
      <Route path="/trainees" element={<Protected roles={['GOVERNMENT_ADMIN', 'TRAINING_PROVIDER', 'COURSE_MANAGER']}><Trainees /></Protected>} />
      <Route path="/trainees/:id" element={<Protected roles={['GOVERNMENT_ADMIN', 'TRAINING_PROVIDER', 'COURSE_MANAGER']}><TraineePortal /></Protected>} />
      <Route path="/upload" element={<Protected roles={['GOVERNMENT_ADMIN']}><Upload /></Protected>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
