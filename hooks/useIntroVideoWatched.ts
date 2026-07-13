import { useAuth } from '@/contexts/AuthContext';
import { userSettingsService } from '@/services/api/userSettingsService';
import { queryKeys } from '@/services/queryKeys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

const INTRO_WATCHED_KEY = 'bibleschool.intro_video_watched';

export function useIntroVideoWatched(): {
  hasWatched: boolean;
  markWatched: () => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? '';

  const {
    data: hasWatched = false,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.userSettings.introWatched(userId),
    queryFn: async () => {
      const stored = await userSettingsService.getSetting<boolean>(
        user!.id,
        INTRO_WATCHED_KEY,
      );
      return stored === true;
    },
    enabled: !!user?.id,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await userSettingsService.setSetting(
        user!.id,
        INTRO_WATCHED_KEY,
        true,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.userSettings.introWatched(userId),
      });
    },
  });

  const markWatched = useCallback(async () => {
    if (!user?.id) return;
    await mutation.mutateAsync();
  }, [user?.id, mutation.mutateAsync]);

  return {
    hasWatched,
    markWatched,
    isLoading: isLoading || mutation.isPending,
    isError,
    refetch,
  };
}
