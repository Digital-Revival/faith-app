export interface ModuleStat {
  moduleId: string;
  completedCount: number;
  inProgressCount: number;
  lockedCount: number;
}

export interface BibleschoolAnalytics {
  totalUsers: number;
  moduleStats: ModuleStat[];
}

export interface QuizModuleStat {
  moduleId: string;
  attemptCount: number;
  passedCount: number;
  failedCount: number;
  avgScore: number;
  retryCount: number;
}

export interface QuizAnalytics {
  moduleStats: QuizModuleStat[];
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface TimeAnalytics {
  newUsersByDay: TimeSeriesPoint[];
  lessonCompletionsByDay: TimeSeriesPoint[];
  moduleCompletionsByDay: TimeSeriesPoint[];
  activeUsersLast7Days: number;
  activeUsersLast30Days: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string;
  lastActivity: string | null;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  totalCount: number;
}

export interface AdminUserModuleProgress {
  moduleId: string;
  status: 'locked' | 'in_progress' | 'completed';
  progressPercentage: number;
  completedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  startedLessonCount?: number;
  completedLessonCount?: number;
  lastLessonId?: string | null;
  lastLessonAt?: string | null;
}

export interface AdminUserQuizAttempt {
  moduleId: string;
  attemptNumber: number;
  scorePercentage: number;
  passed: boolean;
  completedAt: string;
}

export interface AdminUserDetail {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  lessonCompletedCount: number;
  moduleProgress: AdminUserModuleProgress[];
  quizAttempts: AdminUserQuizAttempt[];
}

export type AdminPeriod = '7d' | '30d' | '90d' | 'all';
export type AdminMetricId = 'active' | 'engaged' | 'new' | 'modulesCompleted';
export type AdminDashboardWidgetId =
  | 'schoolHealth'
  | 'activityTrend'
  | 'attention'
  | 'learningFunnel'
  | 'modulePulse'
  | 'examPulse'
  | 'retention';
export type AdminAttentionSignalType =
  | 'no_first_lesson'
  | 'inactive_after_start'
  | 'stalled_module'
  | 'repeated_exam_failure';

export interface AdminEventCoverage { startedAt: string | null; isBuilding: boolean }
export interface AdminMetric {
  id: AdminMetricId;
  value: number;
  previousValue: number | null;
}
export interface AdminTrendPoint {
  date: string;
  activeUsers: number;
  newUsers: number;
  lessonCompletions: number;
  moduleCompletions: number;
}
export interface AdminAttentionSignal { type: AdminAttentionSignalType; count: number }
export interface AdminModulePulse {
  moduleId: string;
  starters: number;
  completers: number;
  completionRate: number;
}
export interface AdminExamPulse {
  firstAttemptPassRate: number;
  overallPassRate: number;
  averageScore: number;
  retryCount: number;
}
export interface AdminOverviewResponse {
  generatedAt: string;
  period: AdminPeriod;
  timezone: string;
  bounds: { from: string; to: string; previousFrom: string | null; previousTo: string | null; bucket: string };
  eventCoverage: AdminEventCoverage;
  metricDefinitions: Record<string, string>;
  metrics: AdminMetric[];
  trends: AdminTrendPoint[];
  attention: AdminAttentionSignal[];
  modulePulse: AdminModulePulse[];
  examPulse: AdminExamPulse;
}

export interface AdminFunnelStage { id: string; value: number }
export interface AdminModuleAnalytics extends AdminModulePulse {
  dropoff: number;
  medianDays: number;
  lessons: { lessonId: string; started: number; completed: number }[];
}
export interface AdminExamAnalytics extends AdminExamPulse {
  moduleId: string;
  attempts: number;
}
export interface AdminRetention {
  d1: number;
  d7: number;
  d30: number;
  isBuilding: boolean;
  startedAt: string | null;
  cohorts: { weekStart: string; size: number; d1: number; d7: number; d30: number }[];
}
export interface AdminLearningAnalyticsResponse {
  generatedAt: string;
  period: AdminPeriod;
  timezone: string;
  bounds: AdminOverviewResponse['bounds'];
  eventCoverage: AdminEventCoverage;
  metricDefinitions: Record<string, string>;
  filters: { locales: string[]; simpleModes: boolean[]; moduleIds: string[] };
  funnel: AdminFunnelStage[];
  modules: AdminModuleAnalytics[];
  exams: AdminExamAnalytics[];
  retention: AdminRetention;
}

export interface AdminUserFilters {
  search?: string;
  locales?: string[];
  simpleModes?: boolean[];
  signals?: AdminAttentionSignalType[];
  moduleIds?: string[];
  sort?: 'name' | 'created_at' | 'last_activity' | 'progress';
  direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AdminUserV2 extends AdminUser {
  locale: string;
  simpleMode: boolean;
  currentModuleId: string | null;
  currentModuleStatus: 'not_started' | 'in_progress' | 'ready_for_next';
  progressPercentage: number;
  completedModuleCount: number;
  completedLessonCount: number;
  lastCompletedModuleId: string | null;
  signals: AdminAttentionSignalType[];
}
export interface AdminUsersResponseV2 {
  generatedAt: string;
  users: AdminUserV2[];
  totalCount: number;
  limit: number;
  offset: number;
}
export interface AdminTimelineEvent {
  type: 'lesson_completed' | 'module_completed' | 'exam_attempt';
  at: string;
  moduleId: string;
  lessonId?: string;
  score?: number;
  passed?: boolean;
}
export interface AdminUserDetailV2 extends Omit<AdminUserDetail, 'user'> {
  generatedAt: string;
  user: AdminUserDetail['user'] & { locale: string; simpleMode: boolean };
  timeline: AdminTimelineEvent[];
  signals: AdminAttentionSignal[];
}
