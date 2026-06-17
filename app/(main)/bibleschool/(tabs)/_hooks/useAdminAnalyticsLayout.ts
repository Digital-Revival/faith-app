import { useAuth } from '@/contexts/AuthContext';
import { userSettingsService } from '@/services/api/userSettingsService';
import { useCallback, useEffect, useRef, useState } from 'react';

export const ADMIN_ANALYTICS_GRAPH_IDS = [
  'totalUsers',
  'activeUsers',
  'mostCompleted',
  'quizPerformance',
  'engagementFunnel',
  'moduleCompletion',
] as const;

export type AdminAnalyticsGraphId = (typeof ADMIN_ANALYTICS_GRAPH_IDS)[number];

const VISIBLE_KEY = 'admin_analytics_visible_graphs';
const COLLAPSED_KEY = 'admin_analytics_collapsed_graphs';

export function useAdminAnalyticsLayout() {
  const { user } = useAuth();
  const [visibleGraphIds, setVisibleGraphIds] = useState<string[]>(
    [...ADMIN_ANALYTICS_GRAPH_IDS],
  );
  const [collapsedGraphIds, setCollapsedGraphIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleRef = useRef(visibleGraphIds);
  const collapsedRef = useRef(collapsedGraphIds);

  useEffect(() => {
    visibleRef.current = visibleGraphIds;
  }, [visibleGraphIds]);

  useEffect(() => {
    collapsedRef.current = collapsedGraphIds;
  }, [collapsedGraphIds]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setIsLoaded(true);
        return;
      }
      try {
        const [visible, collapsed] = await Promise.all([
          userSettingsService.getSetting<string[]>(user.id, VISIBLE_KEY),
          userSettingsService.getSetting<string[]>(user.id, COLLAPSED_KEY),
        ]);
        if (visible && Array.isArray(visible) && visible.length > 0) {
          setVisibleGraphIds(visible);
        }
        if (collapsed && Array.isArray(collapsed)) {
          setCollapsedGraphIds(new Set(collapsed));
        }
      } catch {
        //
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, [user]);

  const scheduleSave = useCallback(() => {
    if (!user?.id) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      const visible = visibleRef.current;
      const collapsed = Array.from(collapsedRef.current);
      userSettingsService
        .setSetting(user.id, VISIBLE_KEY, visible)
        .catch(() => {});
      userSettingsService
        .setSetting(user.id, COLLAPSED_KEY, collapsed)
        .catch(() => {});
    }, 400);
  }, [user]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const setGraphVisible = useCallback(
    (id: string, visible: boolean) => {
      setVisibleGraphIds((prev) => {
        const next = visible
          ? [...prev, id].filter((x) =>
              ADMIN_ANALYTICS_GRAPH_IDS.includes(x as AdminAnalyticsGraphId),
            )
          : prev.filter((x) => x !== id);
        if (next.length === 0) return prev;
        visibleRef.current = next;
        scheduleSave();
        return next;
      });
    },
    [scheduleSave],
  );

  const toggleGraphCollapsed = useCallback(
    (id: string) => {
      setCollapsedGraphIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        collapsedRef.current = next;
        scheduleSave();
        return next;
      });
    },
    [scheduleSave],
  );

  const isGraphVisible = useCallback(
    (id: string) => visibleGraphIds.includes(id),
    [visibleGraphIds],
  );

  const isGraphCollapsed = useCallback(
    (id: string) => collapsedGraphIds.has(id),
    [collapsedGraphIds],
  );

  return {
    visibleGraphIds,
    collapsedGraphIds,
    setGraphVisible,
    toggleGraphCollapsed,
    isGraphVisible,
    isGraphCollapsed,
    isLoaded,
  };
}

const __expoRouterPrivateRoute_useAdminAnalyticsLayout = () => null;

export default __expoRouterPrivateRoute_useAdminAnalyticsLayout;
