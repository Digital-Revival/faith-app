import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { AdminCard, MetricGrid, PeriodSelector, SectionTitle, TrendChart } from '@/app/(main)/admin/_components/AdminAnalyticsUI';
import { Text } from '@/components/ui/text';
import { routes } from '@/constants/routes';
import { useAdminAnalyticsFilters, useAdminDashboardPreferences } from '@/hooks/useAdminDashboardPreferences';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { adminAnalyticsService } from '@/services/api/adminAnalyticsService';
import { queryKeys } from '@/services/queryKeys';
import type { AdminDashboardWidgetId, AdminPeriod } from '@/types/analytics';
import { getAdminTimezone } from '@/utils/adminAnalytics';

const SIGNAL_ICONS = { no_first_lesson: 'play-outline', inactive_after_start: 'time-outline', stalled_module: 'pause-outline', repeated_exam_failure: 'alert-circle-outline' } as const;

export default function AdminOverviewScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const timezone = getAdminTimezone();
  const [editing, setEditing] = useState(false);
  const { layout, setLayout, isSaving } = useAdminDashboardPreferences();
  const { filters: savedFilters, setFilters: setSavedFilters } = useAdminAnalyticsFilters();
  const period: AdminPeriod = savedFilters.period;
  const query = useQuery({ queryKey: queryKeys.admin.overviewV2(period, timezone), queryFn: () => adminAnalyticsService.getOverviewV2(period, timezone) });
  const visible = useMemo(() => new Set(layout.widgets.filter((item) => item.visible).map((item) => item.id)), [layout]);
  const labels = {
    active: t('admin.v2.active'), engaged: t('admin.v2.engaged'), new: t('admin.v2.newUsers'), modulesCompleted: t('admin.v2.modulesCompleted'),
    noComparison: t('admin.v2.noComparison'), previousPeriod: t('admin.v2.previousPeriod'), activeUsers: t('admin.v2.active'),
    newUsers: t('admin.v2.newUsers'), lessonCompletions: t('admin.v2.lessonCompletions'), moduleCompletions: t('admin.v2.moduleCompletions'), highest: t('admin.v2.highest'), showData: t('admin.v2.showData'), hideData: t('admin.v2.hideData'),
  };
  const periodLabels = { '7d': '7d', '30d': '30d', '90d': '90d', all: t('admin.allTime') };
  const moveWidget = (index: number, direction: -1 | 1) => {
    const next = [...layout.widgets]; const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setLayout({ widgets: next });
  };
  const toggleWidget = (id: AdminDashboardWidgetId) => {
    const visibleCount = layout.widgets.filter((item) => item.visible).length;
    setLayout({ widgets: layout.widgets.map((item) => item.id === id ? { ...item, visible: item.visible ? visibleCount <= 1 : true } : item) });
  };

  return <View style={{ flex: 1, paddingTop: insets.top + 24, backgroundColor: theme.pageBg }}>
    <View style={{ paddingHorizontal: 24 }}><MainTopBar title={t('admin.overview')} currentSection="admin" /></View>
    <ScrollView refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={theme.textPrimary} />} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 48, gap: 22 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}><Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>{t('admin.v2.schoolHealth')}</Text><Text className="mt-1 text-sm" style={{ color: theme.textSecondary }}>{query.data ? t('admin.v2.updatedAt', { time: new Date(query.data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }) : t('common.loading')}</Text></View>
        <Pressable accessibilityLabel={t('admin.v2.customize')} onPress={() => setEditing(true)} hitSlop={8} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="options-outline" size={22} color={theme.textPrimary} /></Pressable>
      </View>
      <PeriodSelector value={period} onChange={(nextPeriod) => setSavedFilters({ ...savedFilters, period: nextPeriod })} labels={periodLabels} />
      {query.isError ? <AdminCard><Text style={{ color: theme.dataVizRisk }}>{t('admin.v2.loadError')}</Text><Pressable onPress={() => query.refetch()} style={{ minHeight: 44, justifyContent: 'center' }}><Text className="font-semibold" style={{ color: theme.dataVizPrimary }}>{t('common.retry')}</Text></Pressable></AdminCard> : null}
      {query.data && visible.has('schoolHealth') ? <MetricGrid metrics={query.data.metrics} labels={labels} /> : null}
      {query.data && visible.has('activityTrend') ? <View style={{ gap: 10 }}><SectionTitle title={t('admin.v2.activityTrend')} action={t('admin.analytics')} onAction={() => router.push(routes.admin('analytics') as never)} /><TrendChart points={query.data.trends} labels={labels} /></View> : null}
      {query.data && visible.has('attention') ? <View style={{ gap: 10 }}><SectionTitle title={t('admin.v2.attention')} action={t('admin.users')} onAction={() => router.push(routes.admin('users') as never)} /><AdminCard>{query.data.attention.map((signal, index) => <Pressable key={signal.type} onPress={() => router.push({ pathname: routes.admin('users') as never, params: { signal: signal.type } })} style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: index === query.data!.attention.length - 1 ? 0 : 1, borderBottomColor: theme.cardBorder }}><Ionicons name={SIGNAL_ICONS[signal.type]} size={20} color={signal.count ? theme.dataVizWarning : theme.textTertiary} /><Text className="flex-1 text-sm font-medium" style={{ color: theme.textPrimary }}>{t(`admin.v2.signals.${signal.type}`)}</Text><Text className="text-base font-bold" style={{ color: signal.count ? theme.dataVizWarning : theme.textSecondary }}>{signal.count}</Text><Ionicons name="chevron-forward" size={16} color={theme.textTertiary} /></Pressable>)}</AdminCard></View> : null}
    </ScrollView>
    <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}><Pressable onPress={() => setEditing(false)} style={{ flex: 1, backgroundColor: theme.overlayBg, justifyContent: 'flex-end' }}><Animated.View entering={SlideInDown.duration(220)} exiting={SlideOutDown.duration(180)}><Pressable onPress={() => {}} style={{ backgroundColor: theme.pageBg, padding: 24, paddingBottom: insets.bottom + 24, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>{t('admin.v2.customize')}</Text><Pressable accessibilityLabel={t('common.close')} onPress={() => setEditing(false)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={24} color={theme.textPrimary} /></Pressable></View>{layout.widgets.map((item, index) => <View key={item.id} style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.cardBorder }}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.visible }} onPress={() => toggleWidget(item.id)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={item.visible ? 'checkbox' : 'square-outline'} size={22} color={item.visible ? theme.dataVizPrimary : theme.textSecondary} /></Pressable><Text className="flex-1 text-sm font-semibold" style={{ color: theme.textPrimary }}>{t(`admin.v2.widgets.${item.id}`)}</Text><Pressable accessibilityLabel={t('admin.v2.moveUp')} disabled={index === 0 || isSaving} onPress={() => moveWidget(index, -1)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? .3 : 1 }}><Ionicons name="arrow-up" size={20} color={theme.textSecondary} /></Pressable><Pressable accessibilityLabel={t('admin.v2.moveDown')} disabled={index === layout.widgets.length - 1 || isSaving} onPress={() => moveWidget(index, 1)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: index === layout.widgets.length - 1 ? .3 : 1 }}><Ionicons name="arrow-down" size={20} color={theme.textSecondary} /></Pressable></View>)}</Pressable></Animated.View></Pressable></Modal>
  </View>;
}
