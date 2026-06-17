const progressKey = (userId: string) => ['progress', userId] as const;

export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  admin: {
    bibleschoolAnalytics: (from?: string, to?: string) =>
      ['admin', 'bibleschoolAnalytics', from, to] as const,
    quizAnalytics: (from?: string, to?: string) =>
      ['admin', 'quizAnalytics', from, to] as const,
    timeAnalytics: (from?: string, to?: string) =>
      ['admin', 'timeAnalytics', from, to] as const,
    users: (limit: number, offset: number, search?: string) =>
      ['admin', 'users', limit, offset, search] as const,
    userDetail: (userId: string) => ['admin', 'userDetail', userId] as const,
  },
  vimeo: {
    meta: (videoId: string) => ['vimeo', 'meta', videoId] as const,
  },
  bibleschool: {
    category: (locale: string) => ['bibleschool', 'category', locale] as const,
  },
  userSettings: {
    introWatched: (userId: string) =>
      ['userSettings', 'introWatched', userId] as const,
    introPosition: (userId: string) =>
      ['userSettings', 'introPosition', userId] as const,
    onboardingSection: (userId: string, section: string) =>
      ['userSettings', 'onboarding', section, userId] as const,
    lastSeenAppVersion: (userId: string) =>
      ['userSettings', 'lastSeenAppVersion', userId] as const,
  },
  badges: {
    all: ['badges'] as const,
    userBadges: (userId: string) => ['badges', 'user', userId] as const,
  },
  notifications: {
    list: (userId: string) => ['notifications', 'list', userId] as const,
  },
  streak: {
    display: (userId: string) => ['streak', 'display', userId] as const,
  },
  progress: {
    byUser: progressKey,
    overview: (userId: string) => [...progressKey(userId), 'overview'] as const,
    lesson: (userId: string, lessonId: string) =>
      [...progressKey(userId), 'lesson', lessonId] as const,
    module: (userId: string, moduleId: string) =>
      [...progressKey(userId), 'module', moduleId] as const,
    quizAttempts: (userId: string, moduleId: string) =>
      [...progressKey(userId), 'quizAttempts', 'module', moduleId] as const,
    allQuizAttempts: (userId: string) =>
      [...progressKey(userId), 'quizAttempts', 'all'] as const,
    lessonProgress: {
      byUser: (userId: string) => [...progressKey(userId), 'lessonProgress'] as const,
      byUserLesson: (userId: string, lessonId: string) =>
        [...progressKey(userId), 'lessonProgress', 'lesson', lessonId] as const,
      byUserModule: (userId: string, moduleId: string) =>
        [...progressKey(userId), 'lessonProgress', 'module', moduleId] as const,
      completedByUser: (userId: string) =>
        [...progressKey(userId), 'lessonProgress', 'completed'] as const,
      lastWatchedByUser: (userId: string) =>
        [...progressKey(userId), 'lessonProgress', 'lastWatched'] as const,
    },
    moduleProgress: {
      byUser: (userId: string) => [...progressKey(userId), 'moduleProgress'] as const,
      byUserModule: (userId: string, moduleId: string) =>
        [...progressKey(userId), 'moduleProgress', 'module', moduleId] as const,
      overview: (userId: string) =>
        [...progressKey(userId), 'moduleProgress', 'overview'] as const,
    },
  },
} as const;
