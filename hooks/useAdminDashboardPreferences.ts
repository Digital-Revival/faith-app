import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { userSettingsService } from '@/services/api/userSettingsService';
import type { AdminDashboardWidgetId, AdminPeriod } from '@/types/analytics';
import { normalizeAdminDashboardLayout } from '@/utils/adminAnalytics';

const LAYOUT_KEY = 'admin.dashboard.layout.v2';
const FILTERS_KEY = 'admin.analytics.filters.v2';

export interface AdminDashboardPreferences {
  widgets: { id: AdminDashboardWidgetId; visible: boolean }[];
}
export interface AdminAnalyticsFilters {
  period: AdminPeriod;
  locales: string[];
  simpleModes: boolean[];
  moduleIds: string[];
}

function normalizeAnalyticsFilters(value: Partial<AdminAnalyticsFilters> & {
  locale?: string | null;
  simpleMode?: boolean | null;
  moduleId?: string | null;
} | null): AdminAnalyticsFilters {
  return {
    period: value?.period ?? '30d',
    locales: value?.locales ?? (value?.locale ? [value.locale] : []),
    simpleModes: value?.simpleModes ?? (value?.simpleMode === null || value?.simpleMode === undefined ? [] : [value.simpleMode]),
    moduleIds: value?.moduleIds ?? (value?.moduleId ? [value.moduleId] : []),
  };
}

export function useAdminDashboardPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ['admin-dashboard-layout', user?.id];
  const query = useQuery({
    queryKey: key,
    enabled: !!user?.id,
    queryFn: async () => normalizeAdminDashboardLayout(await userSettingsService.getSetting<AdminDashboardPreferences>(user!.id, LAYOUT_KEY)),
  });
  const mutation = useMutation({
    mutationFn: async (value: AdminDashboardPreferences) => userSettingsService.setSetting(user!.id, LAYOUT_KEY, normalizeAdminDashboardLayout(value)),
    onMutate: (value) => queryClient.setQueryData(key, normalizeAdminDashboardLayout(value)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  return {
    layout: query.data ?? normalizeAdminDashboardLayout(null),
    setLayout: (value: AdminDashboardPreferences) => mutation.mutate(value),
    isSaving: mutation.isPending,
  };
}

export function useAdminAnalyticsFilters() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ['admin-analytics-filters', user?.id];
  const defaults = normalizeAnalyticsFilters(null);
  const query = useQuery({
    queryKey: key,
    enabled: !!user?.id,
    queryFn: async () => normalizeAnalyticsFilters(await userSettingsService.getSetting<Partial<AdminAnalyticsFilters>>(user!.id, FILTERS_KEY)),
  });
  const mutation = useMutation({
    mutationFn: async (value: AdminAnalyticsFilters) => userSettingsService.setSetting(user!.id, FILTERS_KEY, value),
    onMutate: (value) => queryClient.setQueryData(key, value),
  });
  return { filters: query.data ?? defaults, setFilters: (value: AdminAnalyticsFilters) => mutation.mutate(value), isLoading: query.isLoading };
}
