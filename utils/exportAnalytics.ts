import type {
  AdminLearningAnalyticsResponse,
  AdminUserFilters,
  AdminUsersResponseV2,
  BibleschoolAnalytics,
  QuizAnalytics,
  TimeAnalytics,
} from '@/types/analytics';

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildLearningAnalyticsCsv(data: AdminLearningAnalyticsResponse): string {
  const rows = [
    'Faith Generation Admin Analytics',
    `Generated At,${escapeCsvCell(data.generatedAt)}`,
    `Period,${escapeCsvCell(data.period)}`,
    `Timezone,${escapeCsvCell(data.timezone)}`,
    `Locales,${escapeCsvCell(data.filters.locales.length ? data.filters.locales.join('|') : 'all')}`,
    `Simple Modes,${escapeCsvCell(data.filters.simpleModes.length ? data.filters.simpleModes.map(String).join('|') : 'all')}`,
    `Modules,${escapeCsvCell(data.filters.moduleIds.length ? data.filters.moduleIds.join('|') : 'all')}`,
    '', 'Funnel', 'Stage,Students',
    ...data.funnel.map((stage) => `${escapeCsvCell(stage.id)},${stage.value}`),
    '', 'Modules', 'Module,Starters,Completers,Dropoff,Completion Rate,Median Days',
    ...data.modules.map((module) => [module.moduleId,module.starters,module.completers,module.dropoff,module.completionRate,module.medianDays].map(escapeCsvCell).join(',')),
    '', 'Exams', 'Module,Attempts,First Attempt Pass Rate,Overall Pass Rate,Average Score,Retries',
    ...data.exams.map((exam) => [exam.moduleId,exam.attempts,exam.firstAttemptPassRate,exam.overallPassRate,exam.averageScore,exam.retryCount].map(escapeCsvCell).join(',')),
    '', 'Retention', 'D1,D7,D30,Building',
    [data.retention.d1,data.retention.d7,data.retention.d30,String(data.retention.isBuilding)].map(escapeCsvCell).join(','),
  ];
  return rows.join('\n');
}

export function buildAdminUsersCsv(data: AdminUsersResponseV2, filters: AdminUserFilters, timezone: string): string {
  const rows = [
    'Faith Generation Admin Users', `Generated At,${escapeCsvCell(data.generatedAt)}`,
    `Timezone,${escapeCsvCell(timezone)}`, `Search,${escapeCsvCell(filters.search ?? '')}`,
    `Locales,${escapeCsvCell(filters.locales?.length ? filters.locales.join('|') : 'all')}`,
    `Simple Modes,${escapeCsvCell(filters.simpleModes?.length ? filters.simpleModes.map(String).join('|') : 'all')}`,
    `Attention Signals,${escapeCsvCell(filters.signals?.length ? filters.signals.join('|') : 'all')}`,
    `Modules,${escapeCsvCell(filters.moduleIds?.length ? filters.moduleIds.join('|') : 'all')}`, '',
    'Name,Email,Created At,Last Activity,Locale,Simple Mode,Current Module,Module Status,Module Progress,Completed Modules,Completed Lessons,Signals',
    ...data.users.map((user) => [user.fullName ?? '',user.email,user.createdAt,user.lastActivity ?? '',user.locale,String(user.simpleMode),user.currentModuleId ?? '',user.currentModuleStatus,user.progressPercentage,user.completedModuleCount,user.completedLessonCount,user.signals.join('|')].map(escapeCsvCell).join(',')),
  ];
  return rows.join('\n');
}

export function buildAnalyticsCsv(
  analytics: BibleschoolAnalytics | null,
  quizAnalytics: QuizAnalytics | null,
  timeAnalytics: TimeAnalytics | null,
  moduleLabels?: Record<string, string>,
): string {
  const sections: string[] = [];

  sections.push('Bible School Analytics Export');
  sections.push(`Exported: ${new Date().toISOString()}`);
  sections.push('');

  if (analytics) {
    sections.push('Total Users');
    sections.push(escapeCsvCell(analytics.totalUsers));
    sections.push('');

    sections.push('Module Completion');
    sections.push('Module,Completed,In Progress,Locked,Total');
    for (const stat of analytics.moduleStats) {
      const mod =
        moduleLabels?.[stat.moduleId] ?? stat.moduleId;
      const total =
        stat.completedCount + stat.inProgressCount + stat.lockedCount;
      sections.push(
        [
          escapeCsvCell(mod),
          escapeCsvCell(stat.completedCount),
          escapeCsvCell(stat.inProgressCount),
          escapeCsvCell(stat.lockedCount),
          escapeCsvCell(total),
        ].join(','),
      );
    }
    sections.push('');
  }

  if (quizAnalytics && quizAnalytics.moduleStats.length > 0) {
    sections.push('Quiz Performance');
    sections.push(
      'Module,Attempts,Passed,Failed,Avg Score %,Retry Count',
    );
    for (const stat of quizAnalytics.moduleStats) {
      const mod = moduleLabels?.[stat.moduleId] ?? stat.moduleId;
      sections.push(
        [
          escapeCsvCell(mod),
          escapeCsvCell(stat.attemptCount),
          escapeCsvCell(stat.passedCount),
          escapeCsvCell(stat.failedCount),
          escapeCsvCell(stat.avgScore),
          escapeCsvCell(stat.retryCount),
        ].join(','),
      );
    }
    sections.push('');
  }

  if (timeAnalytics) {
    sections.push('Active Users');
    sections.push(`Last 7 days,${timeAnalytics.activeUsersLast7Days}`);
    sections.push(`Last 30 days,${timeAnalytics.activeUsersLast30Days}`);
    sections.push('');

    if (timeAnalytics.newUsersByDay.length > 0) {
      sections.push('New Users by Day');
      sections.push('Date,Count');
      for (const p of timeAnalytics.newUsersByDay) {
        sections.push([escapeCsvCell(p.date), escapeCsvCell(p.count)].join(','));
      }
      sections.push('');
    }

    if (timeAnalytics.moduleCompletionsByDay.length > 0) {
      sections.push('Module Completions by Day');
      sections.push('Date,Count');
      for (const p of timeAnalytics.moduleCompletionsByDay) {
        sections.push([escapeCsvCell(p.date), escapeCsvCell(p.count)].join(','));
      }
      sections.push('');
    }
  }

  return sections.join('\n');
}
