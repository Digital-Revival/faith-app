import { useAuth } from '@/contexts/AuthContext';
import { checkAndAwardBadges } from '@/services/api/badgeService';
import { lessonProgressService } from '@/services/api/lessonProgressService';
import { queryKeys } from '@/services/queryKeys';
import type { LessonProgress, ModuleProgress, ModuleStatus } from '@/types/progress';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

function upsertLessonProgressList(
  current: LessonProgress[],
  nextProgress: LessonProgress,
): LessonProgress[] {
  const existingIndex = current.findIndex((item) => item.lesson_id === nextProgress.lesson_id);

  if (existingIndex === -1) {
    return [...current, nextProgress];
  }

  return current.map((item, index) => (index === existingIndex ? nextProgress : item));
}

function upsertModuleProgressList(
  current: ModuleProgress[],
  nextProgress: ModuleProgress,
): ModuleProgress[] {
  const existingIndex = current.findIndex((item) => item.module_id === nextProgress.module_id);

  if (existingIndex === -1) {
    return [...current, nextProgress];
  }

  return current.map((item, index) => (index === existingIndex ? nextProgress : item));
}

function createCachedLessonProgress({
  existing,
  userId,
  lessonId,
  moduleId,
  videoPositionSeconds,
  completed,
  completedAt,
  savedAt,
}: {
  existing: LessonProgress | null | undefined;
  userId: string;
  lessonId: string;
  moduleId: string;
  videoPositionSeconds: number;
  completed: boolean;
  completedAt: string | null;
  savedAt: string;
}): LessonProgress {
  return {
    id: existing?.id ?? `${userId}:${lessonId}`,
    user_id: userId,
    lesson_id: lessonId,
    module_id: moduleId,
    completed,
    video_position_seconds: completed
      ? Math.max(existing?.video_position_seconds ?? 0, videoPositionSeconds)
      : videoPositionSeconds,
    completed_at: completed ? completedAt ?? existing?.completed_at ?? savedAt : null,
    created_at: existing?.created_at ?? savedAt,
    updated_at: savedAt,
  };
}

function createCachedModuleProgress({
  existing,
  userId,
  moduleId,
  status,
  progressPercentage,
  completedAt,
  savedAt,
}: {
  existing: ModuleProgress | null;
  userId: string;
  moduleId: string;
  status: ModuleStatus;
  progressPercentage: number;
  completedAt: string | null;
  savedAt: string;
}): ModuleProgress {
  const nextStatus = existing?.status === 'completed' ? existing.status : status;

  return {
    id: existing?.id ?? `${userId}:${moduleId}`,
    user_id: userId,
    module_id: moduleId,
    status: nextStatus,
    progress_percentage:
      nextStatus === 'completed'
        ? existing?.progress_percentage ?? 100
        : progressPercentage,
    completed_at:
      nextStatus === 'completed' ? existing?.completed_at ?? completedAt ?? savedAt : null,
    created_at: existing?.created_at ?? savedAt,
    updated_at: savedAt,
  };
}

export function useLessonDetailProgress({
  moduleId,
  lessonId,
  lessonCount,
}: {
  moduleId: string;
  lessonId: string;
  lessonCount: number;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? '';
  const lessonProgressKey = queryKeys.progress.lessonProgress.byUserLesson(userId, lessonId);
  const moduleLessonProgressKey = queryKeys.progress.lessonProgress.byUserModule(
    userId,
    moduleId,
  );
  const completedLessonsKey = queryKeys.progress.lessonProgress.completedByUser(userId);
  const lastWatchedKey = queryKeys.progress.lessonProgress.lastWatchedByUser(userId);
  const moduleProgressKey = queryKeys.progress.moduleProgress.byUserModule(userId, moduleId);
  const moduleProgressOverviewKey = queryKeys.progress.moduleProgress.overview(userId);

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: lessonProgressKey,
    queryFn: () => lessonProgressService.getByUserAndLesson(user!.id, lessonId),
    enabled: !!userId && !!lessonId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const syncLessonCaches = useCallback(
    (nextProgress: LessonProgress, includeCompletedList = false) => {
      queryClient.setQueryData(lessonProgressKey, nextProgress);
      queryClient.setQueryData<LessonProgress[] | undefined>(moduleLessonProgressKey, (current) =>
        Array.isArray(current) ? upsertLessonProgressList(current, nextProgress) : current,
      );
      queryClient.setQueryData(lastWatchedKey, nextProgress);

      if (includeCompletedList) {
        queryClient.setQueryData<LessonProgress[] | undefined>(completedLessonsKey, (current) =>
          Array.isArray(current) ? upsertLessonProgressList(current, nextProgress) : current,
        );
      }
    },
    [
      completedLessonsKey,
      lastWatchedKey,
      lessonProgressKey,
      moduleLessonProgressKey,
      queryClient,
    ],
  );

  const syncModuleProgressCaches = useCallback(
    (nextProgress: ModuleProgress) => {
      queryClient.setQueryData(moduleProgressKey, nextProgress);
      queryClient.setQueryData<ModuleProgress[] | undefined>(moduleProgressOverviewKey, (current) =>
        Array.isArray(current) ? upsertModuleProgressList(current, nextProgress) : current,
      );
    },
    [moduleProgressKey, moduleProgressOverviewKey, queryClient],
  );

  const savePositionMutation = useMutation({
    mutationFn: async (videoPositionSeconds: number) => {
      await lessonProgressService.saveLessonProgressRpc({
        lessonId,
        moduleId,
        lessonCount,
        videoPositionSeconds,
        completed: false,
      });
      return {
        savedAt: new Date().toISOString(),
        videoPositionSeconds,
      };
    },
    onSuccess: ({ savedAt, videoPositionSeconds }) => {
      if (!userId) return;

      const currentLessonProgress =
        queryClient.getQueryData<LessonProgress | null>(lessonProgressKey);
      const nextLessonProgress = createCachedLessonProgress({
        existing: currentLessonProgress,
        userId,
        lessonId,
        moduleId,
        videoPositionSeconds,
        completed: currentLessonProgress?.completed ?? false,
        completedAt: currentLessonProgress?.completed_at ?? null,
        savedAt,
      });

      syncLessonCaches(nextLessonProgress);

      const currentModuleProgress =
        queryClient.getQueryData<ModuleProgress | null>(moduleProgressKey);

      if (currentModuleProgress !== undefined) {
        const nextModuleProgress = createCachedModuleProgress({
          existing: currentModuleProgress,
          userId,
          moduleId,
          status: 'in_progress',
          progressPercentage: currentModuleProgress?.progress_percentage ?? 0,
          completedAt: null,
          savedAt,
        });

        syncModuleProgressCaches(nextModuleProgress);
      }
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      const completedAt = new Date().toISOString();
      const cachedLessonProgress =
        queryClient.getQueryData<LessonProgress | null>(lessonProgressKey);
      const videoPositionSeconds =
        cachedLessonProgress?.video_position_seconds ?? progress?.video_position_seconds ?? 0;

      await lessonProgressService.saveLessonProgressRpc({
        lessonId,
        moduleId,
        lessonCount,
        videoPositionSeconds,
        completed: true,
        completedAt,
      });

      return {
        completedAt,
        videoPositionSeconds,
      };
    },
    onSuccess: async ({ completedAt, videoPositionSeconds }) => {
      if (!userId) return;

      const currentLessonProgress =
        queryClient.getQueryData<LessonProgress | null>(lessonProgressKey);
      const nextLessonProgress = createCachedLessonProgress({
        existing: currentLessonProgress,
        userId,
        lessonId,
        moduleId,
        videoPositionSeconds,
        completed: true,
        completedAt,
        savedAt: completedAt,
      });

      syncLessonCaches(nextLessonProgress, true);

      const cachedCompletedLessons =
        queryClient.getQueryData<LessonProgress[] | undefined>(completedLessonsKey);
      const moduleCompletedCount = Array.isArray(cachedCompletedLessons)
        ? cachedCompletedLessons.filter((item) => item.module_id === moduleId).length
        : 0;
      const lessonAlreadyCompleted = Array.isArray(cachedCompletedLessons)
        ? cachedCompletedLessons.some((item) => item.lesson_id === lessonId)
        : false;
      const currentModuleProgress =
        queryClient.getQueryData<ModuleProgress | null>(moduleProgressKey);

      if (currentModuleProgress !== undefined) {
        const computedProgressPercentage =
          lessonCount > 0
            ? Math.round(
                ((lessonAlreadyCompleted ? moduleCompletedCount : moduleCompletedCount + 1) /
                  lessonCount) *
                  100,
              )
            : 0;
        const nextModuleProgress = createCachedModuleProgress({
          existing: currentModuleProgress,
          userId,
          moduleId,
          status: 'in_progress',
          progressPercentage: Math.max(
            currentModuleProgress?.progress_percentage ?? 0,
            computedProgressPercentage,
          ),
          completedAt: null,
          savedAt: completedAt,
        });

        syncModuleProgressCaches(nextModuleProgress);
      } else {
        queryClient.invalidateQueries({ queryKey: moduleProgressKey });
        queryClient.invalidateQueries({ queryKey: moduleProgressOverviewKey });
      }

      if (cachedCompletedLessons === undefined) {
        queryClient.invalidateQueries({ queryKey: completedLessonsKey });
      }

      await checkAndAwardBadges(userId).catch(() => []);
      queryClient.invalidateQueries({ queryKey: queryKeys.badges.userBadges(userId) });
    },
  });

  const lastSaveTimeRef = useRef(0);
  const lastSavePositionRef = useRef<number | null>(null);
  const completionInFlightRef = useRef(false);

  const handleSavePosition = useCallback(
    (seconds: number, immediate = false) => {
      if (!userId) return;
      const position = Math.floor(seconds);
      const now = Date.now();
      if (immediate) {
        savePositionMutation.mutate(position);
        lastSaveTimeRef.current = now;
        lastSavePositionRef.current = position;
        return;
      }
      const elapsed = now - lastSaveTimeRef.current;
      const positionDelta =
        lastSavePositionRef.current !== null
          ? Math.abs(position - lastSavePositionRef.current)
          : 999;
      if (elapsed >= 5000 || positionDelta >= 10) {
        savePositionMutation.mutate(position);
        lastSaveTimeRef.current = now;
        lastSavePositionRef.current = position;
      }
    },
    [savePositionMutation, userId],
  );

  const handleMarkComplete = useCallback(async (): Promise<boolean> => {
    const cachedProgress =
      queryClient.getQueryData<LessonProgress | null>(lessonProgressKey);
    if (
      !userId ||
      progress?.completed ||
      cachedProgress?.completed ||
      completionInFlightRef.current
    ) {
      return false;
    }

    completionInFlightRef.current = true;
    try {
      await markCompleteMutation.mutateAsync();
      return true;
    } finally {
      completionInFlightRef.current = false;
    }
  }, [
    lessonProgressKey,
    markCompleteMutation,
    progress?.completed,
    queryClient,
    userId,
  ]);

  return {
    progress,
    progressLoading,
    handleSavePosition,
    handleMarkComplete,
  };
}
