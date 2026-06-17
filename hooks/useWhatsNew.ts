import { APP_VERSION } from '@/constants/version';
import {
  WHATS_NEW_RELEASES,
  type WhatsNewRelease,
} from '@/constants/whatsNew';
import { useAuth } from '@/contexts/AuthContext';
import { userSettingsService } from '@/services/api/userSettingsService';
import { queryKeys } from '@/services/queryKeys';
import { compareVersions } from '@/utils/compareVersions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

const LAST_SEEN_VERSION_KEY = 'app.last_seen_version';

interface LastSeenQueryResult {
  version: string | null;
  fetchFailed: boolean;
}

export function useWhatsNew(): {
  lastSeenVersion: string | null;
  hasUnreadWhatsNew: boolean;
  unreadReleases: WhatsNewRelease[];
  allReleases: WhatsNewRelease[];
  isLoading: boolean;
  markSeen: () => Promise<void>;
} {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? session?.user?.id ?? '';

  const { data: lastSeenResult, isPending } = useQuery({
    queryKey: queryKeys.userSettings.lastSeenAppVersion(userId),
    queryFn: async (): Promise<LastSeenQueryResult> => {
      try {
        const raw = await userSettingsService.getSetting<string>(
          userId,
          LAST_SEEN_VERSION_KEY,
        );
        if (typeof raw === 'string') {
          return { version: raw, fetchFailed: false };
        }
        return { version: null, fetchFailed: false };
      } catch {
        return { version: null, fetchFailed: true };
      }
    },
    enabled: !!userId,
    staleTime: 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });

  const { mutateAsync: persistSeen, isPending: isMutationPending } =
    useMutation({
      mutationFn: async () => {
        await userSettingsService.setSetting(
          userId,
          LAST_SEEN_VERSION_KEY,
          APP_VERSION,
        );
      },
      onSuccess: () => {
        queryClient.setQueryData(
          queryKeys.userSettings.lastSeenAppVersion(userId),
          { version: APP_VERSION, fetchFailed: false },
        );
      },
    });

  const markSeen = useCallback(async () => {
    if (!userId) return;
    await persistSeen();
  }, [userId, persistSeen]);

  const lastSeenVersion = lastSeenResult?.fetchFailed
    ? null
    : (lastSeenResult?.version ?? null);

  const hasUnreadWhatsNew = useMemo(() => {
    if (lastSeenResult?.fetchFailed) return false;
    if (lastSeenVersion === null) return true;
    return compareVersions(APP_VERSION, lastSeenVersion) > 0;
  }, [lastSeenResult?.fetchFailed, lastSeenVersion]);

  const unreadReleases = useMemo(() => {
    if (lastSeenResult?.fetchFailed) return [];
    return WHATS_NEW_RELEASES.filter(
      (release) =>
        compareVersions(release.version, lastSeenVersion ?? '0.0.0') > 0,
    );
  }, [lastSeenResult?.fetchFailed, lastSeenVersion]);

  const waitingForUserId = !userId;
  const waitingForSettings = !!userId && isPending;

  return {
    lastSeenVersion,
    hasUnreadWhatsNew,
    unreadReleases,
    allReleases: WHATS_NEW_RELEASES,
    isLoading:
      waitingForUserId || waitingForSettings || isMutationPending,
    markSeen,
  };
}
