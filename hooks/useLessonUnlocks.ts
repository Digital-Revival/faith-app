import { useAuth } from '@/contexts/AuthContext';
import { useModules } from '@/hooks/useBibleschoolContent';
import { useCompletedLessons } from '@/hooks/useCompletedLessons';
import { useIntroVideoWatched } from '@/hooks/useIntroVideoWatched';
import { useTranslation } from '@/hooks/useTranslation';
import {
  groupQuizAttemptsByModuleId,
  quizAttemptService,
} from '@/services/api/quizAttemptService';
import { queryKeys } from '@/services/queryKeys';
import { sortModulesByOrder } from '@/utils/bibleschoolCurriculum';
import {
  getNextUnlockedLesson,
  getNextUnlockedTarget,
  isExamUnlocked,
  isLessonUnlocked,
} from '@/utils/unlockLogic';
import { resolveQuizAttemptCounts } from '@/utils/quizAttemptScore';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const QUIZ_ATTEMPTS_STALE_MS = 5 * 60 * 1000;

export interface ExamStatusForModule {
  passed: boolean;
  attemptCount?: number;
  latestFailedAttempt?: {
    score: number;
    correct?: number;
    total?: number;
  };
}

export function useLessonUnlocks() {
  const { user } = useAuth();
  const { locale } = useTranslation();
  const { data: modules = [], isLoading: modulesLoading } = useModules(locale);
  const curriculum = useMemo(() => sortModulesByOrder(modules), [modules]);

  const { data: completedLessons, isLoading: completedLoading } =
    useCompletedLessons(user?.id);
  const { hasWatched: introVideoWatched, isLoading: introLoading } =
    useIntroVideoWatched();

  const { data: allQuizAttempts, isLoading: quizAttemptsLoading } = useQuery({
    queryKey: queryKeys.progress.allQuizAttempts(user?.id ?? ''),
    queryFn: () => quizAttemptService.listAllByUser(user!.id),
    enabled: !!user?.id,
    staleTime: QUIZ_ATTEMPTS_STALE_MS,
  });

  const attemptsByModuleId = useMemo(
    () => groupQuizAttemptsByModuleId(allQuizAttempts),
    [allQuizAttempts],
  );

  const completedLessonIds = useMemo(() => {
    if (!completedLessons) return new Set<string>();
    return new Set(completedLessons.map((p) => p.lesson_id));
  }, [completedLessons]);

  const passedModuleIds = useMemo(() => {
    const set = new Set<string>();
    curriculum.forEach((m) => {
      const attempts = attemptsByModuleId.get(m.id) ?? [];
      const passed = attempts.some((a) => a.passed);
      if (passed) set.add(m.id);
    });
    return set;
  }, [attemptsByModuleId, curriculum]);

  const isLoading =
    completedLoading ||
    introLoading ||
    quizAttemptsLoading ||
    modulesLoading;

  const checkLessonUnlocked = useMemo(
    () => (moduleId: string, lesson: { id: string; moduleId: string; order: number }) =>
      isLessonUnlocked(
        curriculum,
        moduleId,
        lesson,
        completedLessonIds,
        passedModuleIds,
        introVideoWatched,
      ),
    [curriculum, completedLessonIds, passedModuleIds, introVideoWatched],
  );

  const checkExamUnlocked = useMemo(
    () => (moduleId: string) =>
      isExamUnlocked(curriculum, moduleId, completedLessonIds),
    [curriculum, completedLessonIds],
  );

  const nextUnlockedLesson = useMemo(
    () =>
      getNextUnlockedLesson(
        curriculum,
        completedLessonIds,
        passedModuleIds,
        introVideoWatched,
      ),
    [curriculum, completedLessonIds, passedModuleIds, introVideoWatched],
  );

  const nextUnlockedTarget = useMemo(
    () =>
      getNextUnlockedTarget(
        curriculum,
        completedLessonIds,
        passedModuleIds,
        introVideoWatched,
      ),
    [curriculum, completedLessonIds, passedModuleIds, introVideoWatched],
  );

  const getExamStatusForModule = useMemo(
    () => (moduleId: string): ExamStatusForModule => {
      const passed = passedModuleIds.has(moduleId);
      const attempts = attemptsByModuleId.get(moduleId) ?? [];
      const latestAttempt = attempts[0];
      if (passed) {
        return { passed, attemptCount: attempts.length };
      }
      if (!latestAttempt) {
        return { passed: false };
      }
      const counts = resolveQuizAttemptCounts(latestAttempt);
      return {
        passed: false,
        attemptCount: attempts.length,
        latestFailedAttempt: {
          score: latestAttempt.score_percentage,
          correct: counts?.correct,
          total: counts?.total,
        },
      };
    },
    [passedModuleIds, attemptsByModuleId],
  );

  return {
    completedLessonIds,
    passedModuleIds,
    isLessonUnlocked: checkLessonUnlocked,
    isExamUnlocked: checkExamUnlocked,
    getExamStatusForModule,
    nextUnlockedLesson,
    nextUnlockedTarget,
    isLoading,
  };
}
