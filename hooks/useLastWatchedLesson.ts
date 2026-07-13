import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useModule } from '@/hooks/useBibleschoolContent';
import { lessonProgressService } from '@/services/api/lessonProgressService';
import { queryKeys } from '@/services/queryKeys';
import type { BibleschoolLesson, BibleschoolModule } from '@/types/bibleschool';
import { useQuery } from '@tanstack/react-query';

export function useLastWatchedLesson(): {
  lesson: BibleschoolLesson | null;
  module: BibleschoolModule | null;
  positionSeconds: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
} {
  const { user } = useAuth();
  const { locale } = useTranslation();

  const {
    data: lastWatched,
    isLoading,
    isError: progressError,
    refetch: refetchProgress,
  } = useQuery({
    queryKey: queryKeys.progress.lessonProgress.lastWatchedByUser(user?.id ?? ''),
    queryFn: () => lessonProgressService.getLastWatchedByUser(user!.id),
    enabled: !!user?.id,
  });

  const {
    data: moduleData,
    isLoading: moduleLoading,
    isError: moduleError,
    refetch: refetchModule,
  } = useModule(
    lastWatched?.module_id ?? undefined,
    locale,
  );

  if (!lastWatched) {
    return {
      lesson: null,
      module: null,
      positionSeconds: 0,
      isLoading,
      isError: progressError,
      refetch: async () => {
        await refetchProgress();
      },
    };
  }

  const module = moduleData ?? null;
  const lesson =
    module?.lessons.find((l) => l.id === lastWatched.lesson_id) ?? null;
  const moduleFetchPending = !!lastWatched.module_id && moduleLoading;

  return {
    lesson,
    module,
    positionSeconds: lastWatched.video_position_seconds,
    isLoading: isLoading || moduleFetchPending,
    isError: progressError || moduleError,
    refetch: async () => {
      await Promise.all([refetchProgress(), refetchModule()]);
    },
  };
}
