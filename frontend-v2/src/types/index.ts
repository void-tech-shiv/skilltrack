export type UserRole = 
  | 'GOVERNMENT_ADMIN' 
  | 'COURSE_MANAGER' 
  | 'TRAINING_PROVIDER' 
  | 'TRAINER' // Mapped to 'Teacher' in UI
  | 'TRAINEE' // Mapped to 'Learner' in UI
  | 'EMPLOYER'
  | 'ANALYST';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status?: 'ACTIVE' | 'PENDING' | 'UNDER_REVIEW' | 'SUSPENDED' | 'REJECTED';
  organizationId?: string;
  organizationName?: string;
  traineeId?: string;
  trainerId?: string;
  name?: string;
}

export interface TraineeProfile {
  id: string;
  canonicalId: string;
  firstName: string;
  lastName: string;
  dob?: string;
  gender?: string;
  phone?: string;
  district?: string;
  division?: string;
  educationLevel?: string;
  category?: string;
  skills?: string[];
  careerGoals?: string;
  consentStatus?: boolean;
  consentDate?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  programId?: string;
  expectedDurationHours: number;
  attendanceRequirement: number;
  moduleRequirement: number;
  evidenceRequired: boolean;
  skills: string[];
  targetJobRoles: string[];
  modules?: CourseModule[];
  batches?: Batch[];
  _count?: { batches: number };
}

export interface CourseModule {
  id: string;
  courseId: string;
  name: string;
  order: number;
  requiredEvidence: boolean;
}

export interface Batch {
  id: string;
  name: string;
  courseId: string;
  providerId: string;
  trainerId?: string;
  capacity: number;
  trainingMode: 'OFFLINE' | 'HYBRID' | 'ONLINE';
  location?: string;
  startDate?: string;
  endDate?: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  course?: Course;
  provider?: { id: string; name: string };
  trainer?: { id: string; name: string; email: string };
  enrollments?: Enrollment[];
  _count?: { enrollments: number };
}

export interface Enrollment {
  id: string;
  batchId: string;
  traineeId: string;
  status: 'PENDING' | 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED';
  enrolledAt: string;
  completedAt?: string;
  completionRecommendedAt?: string;
  batch?: Batch;
  trainee?: TraineeProfile;
  attendance?: AttendanceRecord[];
  evidenceSubmissions?: EvidenceSubmission[];
  moduleProgress?: ModuleProgress[];
  certificate?: Certificate;
}

export interface TrainingSession {
  id: string;
  batchId: string;
  trainerId: string;
  date: string;
  topic: string;
  plannedHours: number;
  actualHours?: number;
  mode: 'OFFLINE' | 'HYBRID' | 'ONLINE';
  attendance?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  traineeId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  trainingHours: number;
  notes?: string;
}

export interface EvidenceSubmission {
  id: string;
  enrollmentId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  description?: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  verificationNotes?: string;
  verifiedAt?: string;
  trainee?: TraineeProfile;
}

export interface ModuleProgress {
  id: string;
  enrollmentId: string;
  moduleId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';
  score?: number;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  traineeId: string;
  courseId: string;
  enrollmentId: string;
  issueDate: string;
  status: 'ISSUED' | 'REVOKED';
  approvedBy: string;
  qrCodeUrl?: string;
  revokedReason?: string;
  revokedAt?: string;
  trainee?: TraineeProfile;
  course?: Course;
  enrollment?: Enrollment;
}

export interface CertificateApplication {
  id: string;
  enrollmentId: string;
  traineeId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
  enrollment?: Enrollment;
  trainee?: TraineeProfile;
}

export interface DashboardMetrics {
  totalTrainees: number;
  activeBatches: number;
  totalPlaced: number;
  placementRate: number;
  retentionRate6M: number;
  placementTrend: Array<{ name: string; placement: number; target: number }>;
  retentionDistribution: Array<{ checkpoint: string; rate: number; activeCount: number }>;
  nonPlacementTaxonomy: Array<{ reason: string; percentage: number; count: number; category: string }>;
  wageProgression: Array<{ month: string; avgWage: number; benchmark: number }>;
  providerLeaderboard: Array<{ name: string; score: number; placed: number; retention: number }>;
  genderSplit: Array<{ name: string; value: number }>;
  districtHeatmap: Array<{ district: string; trainees: number; placed: number }>;
}
