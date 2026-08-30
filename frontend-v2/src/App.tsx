import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { UserRole } from './types';

// Public & Auth Pages
import { LandingPageV2 } from './pages/LandingPageV2';
import { LoginV2 } from './pages/LoginV2';
import { RegisterLearnerV2 } from './pages/RegisterLearnerV2';
import { RegisterEmployerV2 } from './pages/RegisterEmployerV2';
import { ForgotPasswordV2 } from './pages/ForgotPasswordV2';
import { PublicVerifyV2 } from './pages/PublicVerifyV2';

// Admin Pages
import { AdminDashboardV2 } from './pages/admin/AdminDashboardV2';
import { AdminApprovalsV2 } from './pages/admin/AdminApprovalsV2';
import { AdminAnalyticsV2 } from './pages/admin/AdminAnalyticsV2';
import { AdminCoursesV2 } from './pages/admin/AdminCoursesV2';
import { AdminBatchesV2 } from './pages/admin/AdminBatchesV2';
import { AdminCertificatesV2 } from './pages/admin/AdminCertificatesV2';
import { AdminInterventionsV2 } from './pages/admin/AdminInterventionsV2';
import { AdminAuditLogsV2 } from './pages/admin/AdminAuditLogsV2';

// Course Manager Pages
import { CourseManagerDashboardV2 } from './pages/course-manager/CourseManagerDashboardV2';
import { CourseCurriculumV2 } from './pages/course-manager/CourseCurriculumV2';
import { BatchSchedulerV2 } from './pages/course-manager/BatchSchedulerV2';
import { EnrollmentReviewsV2 } from './pages/course-manager/EnrollmentReviewsV2';
import { CompletionApprovalsV2 } from './pages/course-manager/CompletionApprovalsV2';

// Training Provider Pages
import { ProviderDashboardV2 } from './pages/provider/ProviderDashboardV2';
import { ProviderBatchesV2 } from './pages/provider/ProviderBatchesV2';
import { ProviderTeachersV2 } from './pages/provider/ProviderTeachersV2';
import { ProviderLearnersV2 } from './pages/provider/ProviderLearnersV2';
import { ProviderOperationsV2 } from './pages/provider/ProviderOperationsV2';

// Teacher Pages
import { TeacherDashboardV2 } from './pages/teacher/TeacherDashboardV2';
import { TeacherSessionsV2 } from './pages/teacher/TeacherSessionsV2';
import { TeacherAttendanceV2 } from './pages/teacher/TeacherAttendanceV2';
import { TeacherEvidenceV2 } from './pages/teacher/TeacherEvidenceV2';
import { TeacherRecommendationsV2 } from './pages/teacher/TeacherRecommendationsV2';

// Learner Pages
import { LearnerDashboardV2 } from './pages/learner/LearnerDashboardV2';
import { LearnerSkillsV2 } from './pages/learner/LearnerSkillsV2';
import { LearnerTrainingV2 } from './pages/learner/LearnerTrainingV2';
import { LearnerEvidenceV2 } from './pages/learner/LearnerEvidenceV2';
import { LearnerEmploymentV2 } from './pages/learner/LearnerEmploymentV2';
import { LearnerCertificatesV2 } from './pages/learner/LearnerCertificatesV2';
import { LearnerConsentV2 } from './pages/learner/LearnerConsentV2';

// Employer Pages
import { EmployerDashboardV2 } from './pages/employer/EmployerDashboardV2';
import { EmployerVerificationsV2 } from './pages/employer/EmployerVerificationsV2';
import { EmployerRosterV2 } from './pages/employer/EmployerRosterV2';

// Protected Route Guard
const Protected: React.FC<{
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-900" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">403 — Unauthorized Role Scope</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
          Your current role (<b>{user.role}</b>) does not possess regulatory authorization to access this workspace.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 bg-brand-900 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Authorized Portal</span>
        </Link>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
};

import { ErrorBoundary } from './components/ui/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Landing, Authentication & Registration Routes */}
            <Route path="/" element={<LandingPageV2 />} />
            <Route path="/home" element={<LandingPageV2 />} />
            <Route path="/login" element={<LoginV2 />} />
            <Route path="/forgot-password" element={<ForgotPasswordV2 />} />
            <Route path="/register-learner" element={<RegisterLearnerV2 />} />
            <Route path="/register-employer" element={<RegisterEmployerV2 />} />
            <Route path="/verify" element={<PublicVerifyV2 />} />
            <Route path="/verify/:certNumber" element={<PublicVerifyV2 />} />

            {/* 1. GOVERNMENT ADMIN V2 ROUTES */}
            <Route path="/admin" element={<Protected allowedRoles={['GOVERNMENT_ADMIN']}><AdminDashboardV2 /></Protected>} />
            <Route path="/admin/approvals" element={<Protected allowedRoles={['GOVERNMENT_ADMIN']}><AdminApprovalsV2 /></Protected>} />
            <Route path="/admin/analytics" element={<Protected allowedRoles={['GOVERNMENT_ADMIN']}><AdminAnalyticsV2 /></Protected>} />
            <Route path="/admin/courses" element={<Protected allowedRoles={['GOVERNMENT_ADMIN']}><AdminCoursesV2 /></Protected>} />
            <Route path="/admin/batches" element={<Protected allowedRoles={['GOVERNMENT_ADMIN']}><AdminBatchesV2 /></Protected>} />
            <Route path="/admin/certificates" element={<Protected allowedRoles={['GOVERNMENT_ADMIN']}><AdminCertificatesV2 /></Protected>} />
            <Route path="/admin/interventions" element={<Protected allowedRoles={['GOVERNMENT_ADMIN']}><AdminInterventionsV2 /></Protected>} />
            <Route path="/admin/audit-logs" element={<Protected allowedRoles={['GOVERNMENT_ADMIN']}><AdminAuditLogsV2 /></Protected>} />

            {/* 2. COURSE MANAGER V2 ROUTES */}
            <Route path="/course-manager" element={<Protected allowedRoles={['COURSE_MANAGER']}><CourseManagerDashboardV2 /></Protected>} />
            <Route path="/course-manager/curriculum" element={<Protected allowedRoles={['COURSE_MANAGER']}><CourseCurriculumV2 /></Protected>} />
            <Route path="/course-manager/batches" element={<Protected allowedRoles={['COURSE_MANAGER']}><BatchSchedulerV2 /></Protected>} />
            <Route path="/course-manager/enrollments" element={<Protected allowedRoles={['COURSE_MANAGER']}><EnrollmentReviewsV2 /></Protected>} />
            <Route path="/course-manager/completions" element={<Protected allowedRoles={['COURSE_MANAGER']}><CompletionApprovalsV2 /></Protected>} />

            {/* 3. TRAINING PROVIDER V2 ROUTES (Operational Only) */}
            <Route path="/provider" element={<Protected allowedRoles={['TRAINING_PROVIDER']}><ProviderDashboardV2 /></Protected>} />
            <Route path="/provider/batches" element={<Protected allowedRoles={['TRAINING_PROVIDER']}><ProviderBatchesV2 /></Protected>} />
            <Route path="/provider/teachers" element={<Protected allowedRoles={['TRAINING_PROVIDER']}><ProviderTeachersV2 /></Protected>} />
            <Route path="/provider/learners" element={<Protected allowedRoles={['TRAINING_PROVIDER']}><ProviderLearnersV2 /></Protected>} />
            <Route path="/provider/operations" element={<Protected allowedRoles={['TRAINING_PROVIDER']}><ProviderOperationsV2 /></Protected>} />

            {/* 4. TEACHER V2 ROUTES */}
            <Route path="/teacher" element={<Protected allowedRoles={['TRAINER']}><TeacherDashboardV2 /></Protected>} />
            <Route path="/teacher/sessions" element={<Protected allowedRoles={['TRAINER']}><TeacherSessionsV2 /></Protected>} />
            <Route path="/teacher/attendance" element={<Protected allowedRoles={['TRAINER']}><TeacherAttendanceV2 /></Protected>} />
            <Route path="/teacher/evidence" element={<Protected allowedRoles={['TRAINER']}><TeacherEvidenceV2 /></Protected>} />
            <Route path="/teacher/recommendations" element={<Protected allowedRoles={['TRAINER']}><TeacherRecommendationsV2 /></Protected>} />

            {/* 5. LEARNER V2 ROUTES */}
            <Route path="/learner" element={<Protected allowedRoles={['TRAINEE']}><LearnerDashboardV2 /></Protected>} />
            <Route path="/learner/skills" element={<Protected allowedRoles={['TRAINEE']}><LearnerSkillsV2 /></Protected>} />
            <Route path="/learner/training" element={<Protected allowedRoles={['TRAINEE']}><LearnerTrainingV2 /></Protected>} />
            <Route path="/learner/evidence" element={<Protected allowedRoles={['TRAINEE']}><LearnerEvidenceV2 /></Protected>} />
            <Route path="/learner/employment" element={<Protected allowedRoles={['TRAINEE']}><LearnerEmploymentV2 /></Protected>} />
            <Route path="/learner/certificates" element={<Protected allowedRoles={['TRAINEE']}><LearnerCertificatesV2 /></Protected>} />
            <Route path="/learner/consent" element={<Protected allowedRoles={['TRAINEE']}><LearnerConsentV2 /></Protected>} />

            {/* 6. EMPLOYER V2 ROUTES */}
            <Route path="/employer" element={<Protected allowedRoles={['EMPLOYER']}><EmployerDashboardV2 /></Protected>} />
            <Route path="/employer/verifications" element={<Protected allowedRoles={['EMPLOYER']}><EmployerVerificationsV2 /></Protected>} />
            <Route path="/employer/roster" element={<Protected allowedRoles={['EMPLOYER']}><EmployerRosterV2 /></Protected>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};
