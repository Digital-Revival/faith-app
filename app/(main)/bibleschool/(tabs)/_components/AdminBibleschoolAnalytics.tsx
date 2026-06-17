import { Box } from '@/components/ui/box';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { CollapsibleOverviewCard } from '../../_components/CollapsibleOverviewCard';
import { AdminAnalyticsGraphPicker } from './AdminAnalyticsGraphPicker';
import { useAdminAnalyticsLayout } from '../_hooks/useAdminAnalyticsLayout';
import { useModules } from '@/hooks/useBibleschoolContent';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { adminAnalyticsService } from '@/services/api/adminAnalyticsService';
import { queryKeys } from '@/services/queryKeys';
import { getErrorMessage } from '@/utils/errors';
import { buildAnalyticsCsv } from '@/utils/exportAnalytics';
import { useToast } from '@/hooks/useToast';
import { bzzt } from '@/utils/haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userSettingsService } from '@/services/api/userSettingsService';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ModuleStat, QuizModuleStat } from '@/types/analytics';
import type { BibleschoolModule } from '@/types/bibleschool';
import { sortModulesByOrder } from '@/utils/bibleschoolCurriculum';

function BarChart({
  stats,
  maxValue,
  theme,
  t,
}: {
  stats: { module: BibleschoolModule; stat: ModuleStat }[];
  maxValue: number;
  theme: ReturnType<typeof useTheme>;
  t: (key: string) => string;
}) {
  const items = stats.slice(0, 10).filter(
    (x) =>
      x.stat.completedCount + x.stat.inProgressCount + x.stat.lockedCount > 0,
  );
  if (items.length === 0) {
    return (
      <Text
        className="text-sm py-4"
        style={{ color: theme.textSecondary }}
      >
        No module activity yet
      </Text>
    );
  }
  return (
    <VStack className="gap-4">
      {items.map(({ module, stat }) => {
        const total =
          stat.completedCount + stat.inProgressCount + stat.lockedCount;
        const completedPct =
          total > 0 ? (stat.completedCount / total) * 100 : 0;
        return (
          <Box key={module.id}>
            <Box className="flex-row items-center justify-between mb-2">
              <Text
                className="text-sm font-medium flex-1"
                style={{ color: theme.textPrimary }}
                numberOfLines={1}
              >
                {module.title}
              </Text>
              <Text
                className="text-sm font-semibold ml-3"
                style={{ color: theme.textPrimary }}
              >
                {stat.completedCount} / {total}
              </Text>
            </Box>
            <Box
              className="h-2.5 rounded-full overflow-hidden"
              style={{ backgroundColor: theme.cardBorder }}
            >
              <View
                style={{
                  width: `${completedPct}%`,
                  height: '100%',
                  backgroundColor: theme.buttonPrimary,
                  borderRadius: 6,
                }}
              />
            </Box>
          </Box>
        );
      })}
    </VStack>
  );
}

type DateRangeKey = '7' | '30' | '90' | 'all';

const DATE_RANGE_KEY = 'admin_analytics_date_range';

function formatChartDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

function TimeSeriesSection({
  title,
  data,
  theme,
  t,
}: {
  title: string;
  data: { date: string; count: number }[];
  theme: ReturnType<typeof useTheme>;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const safeData = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const displayData = useMemo(() => {
    const maxVisible = expanded ? Math.min(30, safeData.length) : 7;
    if (safeData.length > maxVisible) {
      return safeData.slice(-maxVisible);
    }
    return safeData;
  }, [safeData, expanded]);

  const total = useMemo(() => safeData.reduce((sum, p) => sum + p.count, 0), [safeData]);
  const isSubset = safeData.length > displayData.length;
  const canExpand = safeData.length > 7;
  const canCollapse = expanded;

  const maxCount = useMemo(
    () => Math.max(1, ...displayData.map((p) => p.count)),
    [displayData],
  );

  if (displayData.length === 0) {
    return (
      <VStack className="gap-2">
        <Text
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: theme.textSecondary }}
        >
          {title}
        </Text>
        <Text
          className="text-sm py-2"
          style={{ color: theme.textTertiary }}
        >
          {t('admin.noDataInPeriod')}
        </Text>
      </VStack>
    );
  }

  return (
    <VStack className="gap-2">
      <Box className="flex-row items-center justify-between flex-wrap gap-2">
        <Text
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: theme.textSecondary }}
        >
          {title}
        </Text>
        <Box className="flex-row items-center gap-2">
          <Text
            className="text-xs font-semibold"
            style={{ color: theme.textPrimary }}
          >
            {t('admin.totalInPeriod')}: {total}
          </Text>
          {(canExpand || canCollapse) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                bzzt();
                setExpanded((e) => !e);
              }}
              accessibilityLabel={expanded ? t('admin.showLess') : t('admin.showMore')}
              accessibilityRole="button"
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: theme.cardBorder }}
            >
              <Box className="flex-row items-center gap-1.5">
                <Text
                  className="text-xs font-medium"
                  style={{ color: theme.buttonPrimary }}
                >
                  {expanded ? t('admin.showLess') : t('admin.showMore')}
                </Text>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={theme.buttonPrimary}
                />
              </Box>
            </TouchableOpacity>
          )}
        </Box>
      </Box>
      {isSubset && (
        <Text
          className="text-xs -mt-1"
          style={{ color: theme.textTertiary }}
        >
          {t('admin.showingLastDays', { count: displayData.length })}
        </Text>
      )}
      <Box
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: theme.cardBorder,
          borderWidth: 1,
          borderColor: theme.cardBorder,
        }}
      >
        {[...displayData]
          .reverse()
          .map((p: { date: string; count: number }, idx: number) => (
            <Box
              key={p.date}
              className="flex-row items-center justify-between px-4 py-2.5"
              style={{
                borderBottomWidth: idx < displayData.length - 1 ? 1 : 0,
                borderBottomColor: theme.cardBg,
              }}
            >
              <Text
                className="text-sm"
                style={{ color: theme.textPrimary }}
              >
                {formatChartDate(p.date)}
              </Text>
              <Box className="flex-row items-center gap-3">
                <Text
                  className="text-sm font-semibold min-w-[28px] text-right"
                  style={{ color: theme.textPrimary }}
                >
                  {p.count}
                </Text>
                <View
                  style={{
                    width: 80,
                    height: 8,
                    backgroundColor: theme.cardBg,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${(p.count / maxCount) * 100}%`,
                      height: '100%',
                      backgroundColor: theme.buttonPrimary,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </Box>
            </Box>
          ))}
      </Box>
    </VStack>
  );
}


export function AdminBibleschoolAnalytics() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { data: modules = [] } = useModules(locale);
  const curriculumSorted = useMemo(() => sortModulesByOrder(modules), [modules]);
  const moduleLabels = useMemo(
    () => Object.fromEntries(curriculumSorted.map((m) => [m.id, m.title])),
    [curriculumSorted],
  );
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRangeKey>('30');
  const [pickerVisible, setPickerVisible] = useState(false);
  const dateRangeLoadedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    userSettingsService
      .getSetting<DateRangeKey>(user.id, DATE_RANGE_KEY)
      .then((saved) => {
        if (saved && (saved === '7' || saved === '30' || saved === '90' || saved === 'all')) {
          setDateRange(saved);
        }
      })
      .catch(() => {})
      .finally(() => {
        dateRangeLoadedRef.current = true;
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !dateRangeLoadedRef.current) return;
    userSettingsService
      .setSetting(user.id, DATE_RANGE_KEY, dateRange)
      .catch(() => {});
  }, [user?.id, dateRange]);
  const {
    isGraphVisible,
    isGraphCollapsed,
    toggleGraphCollapsed,
    setGraphVisible,
    visibleGraphIds,
  } = useAdminAnalyticsLayout();

  const { fromDate, toDate, queryFrom, queryTo } = useMemo(() => {
    const to = new Date();
    const from = new Date();
    if (dateRange === '7') from.setDate(from.getDate() - 7);
    else if (dateRange === '30') from.setDate(from.getDate() - 30);
    else if (dateRange === '90') from.setDate(from.getDate() - 90);
    else from.setFullYear(from.getFullYear() - 10);
    const fd = from.toISOString();
    const td = to.toISOString();
    return {
      fromDate: fd,
      toDate: td,
      queryFrom: dateRange === 'all' ? undefined : fd,
      queryTo: dateRange === 'all' ? undefined : td,
    };
  }, [dateRange]);

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: queryKeys.admin.bibleschoolAnalytics(queryFrom, queryTo),
    queryFn: () => adminAnalyticsService.getBibleschoolAnalytics(queryFrom, queryTo),
  });

  const { data: quizAnalytics } = useQuery({
    queryKey: queryKeys.admin.quizAnalytics(queryFrom, queryTo),
    queryFn: () => adminAnalyticsService.getQuizAnalytics(queryFrom, queryTo),
  });

  const { data: timeAnalytics } = useQuery({
    queryKey: queryKeys.admin.timeAnalytics(fromDate, toDate),
    queryFn: () => adminAnalyticsService.getTimeAnalytics(fromDate, toDate),
  });

  const mergedStats = useMemo(() => {
    if (!analytics) return [];
    const map = new Map(analytics.moduleStats.map((s) => [s.moduleId, s]));
    return curriculumSorted.map((module) => ({
      module,
      stat: map.get(module.id) ?? {
        moduleId: module.id,
        completedCount: 0,
        inProgressCount: 0,
        lockedCount: 0,
      },
    }));
  }, [analytics, curriculumSorted]);

  const mostCompleted = useMemo(() => {
    return [...mergedStats].sort(
      (a, b) => b.stat.completedCount - a.stat.completedCount,
    );
  }, [mergedStats]);

  const maxCompleted = useMemo(() => {
    return Math.max(
      1,
      ...mostCompleted.map(
        (m) => m.stat.completedCount + m.stat.inProgressCount + m.stat.lockedCount,
      ),
    );
  }, [mostCompleted]);

  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    bzzt();
    try {
      const csv = buildAnalyticsCsv(
        analytics ?? null,
        quizAnalytics ?? null,
        timeAnalytics ?? null,
        moduleLabels,
      );
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t('admin.exportSuccess'));
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          toast.error(t('admin.exportUnavailable'));
          return;
        }
        const cacheDir = FileSystem.cacheDirectory;
        if (!cacheDir) {
          toast.error(t('admin.exportUnavailable'));
          return;
        }
        const path = `${cacheDir}analytics-export-${Date.now()}.csv`;
        await FileSystem.writeAsStringAsync(path, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(path, {
          mimeType: 'text/csv',
          dialogTitle: t('admin.exportAnalytics'),
        });
        toast.success(t('admin.exportSuccess'));
      }
    } catch {
      toast.error(t('admin.exportFailed'));
    } finally {
      setExporting(false);
    }
  }, [
    analytics,
    quizAnalytics,
    timeAnalytics,
    moduleLabels,
    exporting,
    toast,
    t,
  ]);

  const funnelData = useMemo(() => {
    return mergedStats.slice(0, 10).map(({ module, stat }) => {
      const started = stat.completedCount + stat.inProgressCount;
      const completed = stat.completedCount;
      const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;
      return {
        module,
        started,
        completed,
        completionRate,
      };
    });
  }, [mergedStats]);

  if (isLoading) {
    return <LoadingScreen message={t('loading.section.bibleschool')} />;
  }

  if (error) {
    return (
      <Box
        className="flex-1 px-6 pt-6"
        style={{ paddingTop: insets.top + 24, backgroundColor: theme.pageBg }}
      >
        <MainTopBar
          title={t('admin.bibleschoolAnalytics')}
          currentSection="admin"
          showBackButton
        />
        <Box className="flex-1 items-center justify-center p-8">
          <Ionicons name="alert-circle" size={48} color={theme.textSecondary} />
          <Text
            className="text-base mt-4 text-center"
            style={{ color: theme.textSecondary }}
          >
            {getErrorMessage(error, t('common.loading'))}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className="flex-1 px-6 pt-6"
      style={{
        paddingTop: insets.top + 24,
        backgroundColor: theme.pageBg,
      }}
    >
      <MainTopBar
        title={t('admin.bibleschoolAnalytics')}
        currentSection="admin"
        showBackButton
      />
      <Box className="flex-row justify-end gap-2 pb-2">
        <TouchableOpacity
          onPress={() => {
            bzzt();
            setPickerVisible(true);
          }}
          className="flex-row items-center gap-2 px-4 py-2 rounded-xl cursor-pointer"
          style={{
            backgroundColor: theme.cardBorder,
          }}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={theme.textPrimary}
          />
          <Text
            className="text-sm font-semibold"
            style={{ color: theme.textPrimary }}
          >
            {t('admin.customizeGraphs')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleExport}
          disabled={exporting}
          className="flex-row items-center gap-2 px-4 py-2 rounded-xl cursor-pointer"
          style={{
            backgroundColor: theme.buttonPrimary,
          }}
        >
          <Ionicons
            name="download-outline"
            size={18}
            color={theme.buttonPrimaryContrast}
          />
          <Text
            className="text-sm font-semibold"
            style={{ color: theme.buttonPrimaryContrast }}
          >
            {exporting ? t('admin.exporting') : t('admin.export')}
          </Text>
        </TouchableOpacity>
      </Box>
      <AdminAnalyticsGraphPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        visibleGraphIds={visibleGraphIds}
        onToggleGraph={setGraphVisible}
      />
      <Box className="flex-row items-center justify-between py-3 mb-1">
        <Text
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: theme.textSecondary }}
        >
          {t('admin.dateRange')}
        </Text>
        <Box className="flex-row gap-1">
          {(['7', '30', '90', 'all'] as DateRangeKey[]).map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => setDateRange(key)}
              className="px-3 py-1.5 rounded-lg cursor-pointer"
              style={{
                backgroundColor:
                  dateRange === key ? theme.buttonPrimary : theme.cardBorder,
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{
                  color: dateRange === key ? '#fff' : theme.textSecondary,
                }}
              >
                {key === 'all'
                  ? t('admin.allTime')
                  : `${key}${t('admin.daysShort')}`}
              </Text>
            </TouchableOpacity>
          ))}
        </Box>
      </Box>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <VStack className="gap-6">
          {isGraphVisible('totalUsers') && (
            <CollapsibleOverviewCard
              title={t('admin.totalUsers')}
              collapsed={isGraphCollapsed('totalUsers')}
              onCollapseToggle={() => toggleGraphCollapsed('totalUsers')}
            >
              <Box className="flex-row items-center gap-4">
                <Box
                  className="rounded-xl p-4"
                  style={{ backgroundColor: theme.avatarPrimary }}
                >
                  <Ionicons name="people" size={32} color={theme.textPrimary} />
                </Box>
                <Box className="flex-1">
                  <Text
                    className="text-3xl font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {analytics?.totalUsers ?? 0}
                  </Text>
                  <Text
                    className="text-sm mt-1"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('admin.totalUsers')}
                  </Text>
                </Box>
              </Box>
            </CollapsibleOverviewCard>
          )}

          {isGraphVisible('activeUsers') && timeAnalytics && (
            <CollapsibleOverviewCard
              title={t('admin.activeUsers')}
              collapsed={isGraphCollapsed('activeUsers')}
              onCollapseToggle={() => toggleGraphCollapsed('activeUsers')}
            >
              <VStack className="gap-5">
                <Box className="flex-row gap-3">
                  <Box
                    className="flex-1 rounded-xl p-4"
                    style={{ backgroundColor: theme.cardBorder }}
                  >
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: theme.textPrimary }}
                    >
                      {timeAnalytics.activeUsersLast7Days}
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ color: theme.textSecondary }}
                    >
                      {t('admin.last7Days')}
                    </Text>
                  </Box>
                  <Box
                    className="flex-1 rounded-xl p-4"
                    style={{ backgroundColor: theme.cardBorder }}
                  >
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: theme.textPrimary }}
                    >
                      {timeAnalytics.activeUsersLast30Days}
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ color: theme.textSecondary }}
                    >
                      {t('admin.last30Days')}
                    </Text>
                  </Box>
                </Box>
                <Text
                  className="text-xs"
                  style={{ color: theme.textTertiary }}
                >
                  {t('admin.activeUsersNote')}
                </Text>

                <TimeSeriesSection
                  title={t('admin.newSignupsInPeriod')}
                  data={timeAnalytics.newUsersByDay}
                  theme={theme}
                  t={t}
                />
                <TimeSeriesSection
                  title={t('admin.lessonCompletionsInPeriod')}
                  data={timeAnalytics.lessonCompletionsByDay}
                  theme={theme}
                  t={t}
                />
                <TimeSeriesSection
                  title={t('admin.moduleCompletionsInPeriod')}
                  data={timeAnalytics.moduleCompletionsByDay}
                  theme={theme}
                  t={t}
                />
              </VStack>
            </CollapsibleOverviewCard>
          )}

          {isGraphVisible('mostCompleted') && (
            <CollapsibleOverviewCard
              title={t('admin.mostCompleted')}
              collapsed={isGraphCollapsed('mostCompleted')}
              onCollapseToggle={() => toggleGraphCollapsed('mostCompleted')}
            >
              <BarChart
                stats={mostCompleted}
                maxValue={maxCompleted}
                theme={theme}
                t={t}
              />
            </CollapsibleOverviewCard>
          )}

          {isGraphVisible('quizPerformance') &&
            quizAnalytics &&
            quizAnalytics.moduleStats.length > 0 && (
            <CollapsibleOverviewCard
              title={t('admin.quizPerformance')}
              collapsed={isGraphCollapsed('quizPerformance')}
              onCollapseToggle={() => toggleGraphCollapsed('quizPerformance')}
            >
              <VStack className="gap-0">
                <Box
                  className="flex-row items-center py-2 mb-1"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: theme.cardBorder,
                  }}
                >
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider flex-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Module
                  </Text>
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('admin.avgScore')}
                  </Text>
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('admin.passed')}
                  </Text>
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider min-w-[36px] text-right"
                    style={{ color: theme.textSecondary }}
                  >
                    Rate
                  </Text>
                </Box>
                {quizAnalytics.moduleStats.slice(0, 10).map((qStat: QuizModuleStat) => {
                  const module = curriculumSorted.find((m) => m.id === qStat.moduleId);
                  const passRate =
                    qStat.attemptCount > 0
                      ? Math.round(
                          (qStat.passedCount / qStat.attemptCount) * 100,
                        )
                      : 0;
                  return (
                    <Box
                      key={qStat.moduleId}
                      className="flex-row items-center justify-between py-3"
                      style={{
                        borderBottomWidth: 1,
                        borderBottomColor: theme.cardBorder,
                      }}
                    >
                      <Text
                        className="text-sm font-medium flex-1"
                        style={{ color: theme.textPrimary }}
                        numberOfLines={1}
                      >
                        {module ? module.title : qStat.moduleId}
                      </Text>
                      <Box className="flex-row items-center gap-4">
                        <Text
                          className="text-xs"
                          style={{ color: theme.textSecondary }}
                        >
                          {qStat.avgScore}% {t('admin.avgScore')}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: theme.textSecondary }}
                        >
                          {qStat.passedCount}/{qStat.attemptCount}{' '}
                          {t('admin.passed')}
                        </Text>
                        <Text
                          className="text-sm font-semibold min-w-[36px] text-right"
                          style={{ color: theme.textPrimary }}
                        >
                          {passRate}%
                        </Text>
                      </Box>
                    </Box>
                  );
                })}
              </VStack>
            </CollapsibleOverviewCard>
          )}

          {isGraphVisible('engagementFunnel') &&
            funnelData.some((f) => f.started > 0) && (
            <CollapsibleOverviewCard
              title={t('admin.engagementFunnel')}
              collapsed={isGraphCollapsed('engagementFunnel')}
              onCollapseToggle={() => toggleGraphCollapsed('engagementFunnel')}
            >
              <VStack className="gap-0">
                <Box
                  className="flex-row items-center py-2 mb-1"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: theme.cardBorder,
                  }}
                >
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider flex-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Module
                  </Text>
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('admin.completed')} / Started
                  </Text>
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider min-w-[40px] text-right"
                    style={{ color: theme.textSecondary }}
                  >
                    Rate
                  </Text>
                </Box>
                {funnelData
                  .filter((f) => f.started > 0)
                  .slice(0, 8)
                  .map(({ module, started, completed, completionRate }) => (
                    <Box
                      key={module.id}
                      className="flex-row items-center justify-between py-3"
                      style={{
                        borderBottomWidth: 1,
                        borderBottomColor: theme.cardBorder,
                      }}
                    >
                      <Text
                        className="text-sm font-medium flex-1"
                        style={{ color: theme.textPrimary }}
                        numberOfLines={1}
                      >
                        {module.title}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: theme.textSecondary }}
                      >
                        {completed} / {started}
                      </Text>
                      <Text
                        className="text-sm font-semibold min-w-[40px] text-right"
                        style={{ color: theme.textPrimary }}
                      >
                        {completionRate}%
                      </Text>
                    </Box>
                  ))}
              </VStack>
            </CollapsibleOverviewCard>
          )}

          {isGraphVisible('moduleCompletion') && (
            <CollapsibleOverviewCard
              title={t('admin.moduleCompletion')}
              collapsed={isGraphCollapsed('moduleCompletion')}
              onCollapseToggle={() => toggleGraphCollapsed('moduleCompletion')}
            >
              <VStack className="gap-0">
                <Box
                  className="flex-row items-center py-2 mb-1"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: theme.cardBorder,
                  }}
                >
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider flex-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Module
                  </Text>
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('admin.completed')} / {t('admin.inProgress')}
                  </Text>
                  <Text
                    className="text-xs font-semibold uppercase tracking-wider min-w-[40px] text-right"
                    style={{ color: theme.textSecondary }}
                  >
                    Share
                  </Text>
                </Box>
                {mergedStats.slice(0, 10).map(({ module, stat }) => {
                  const total =
                    stat.completedCount +
                    stat.inProgressCount +
                    stat.lockedCount;
                  const rate =
                    analytics?.totalUsers && analytics.totalUsers > 0
                      ? Math.round((total / analytics.totalUsers) * 100)
                      : 0;
                  return (
                    <Box
                      key={module.id}
                      className="flex-row items-center justify-between py-3"
                      style={{
                        borderBottomWidth: 1,
                        borderBottomColor: theme.cardBorder,
                      }}
                    >
                      <Text
                        className="text-sm font-medium flex-1"
                        style={{ color: theme.textPrimary }}
                        numberOfLines={1}
                      >
                        {module.title}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: theme.textSecondary }}
                      >
                        {stat.completedCount} / {stat.inProgressCount}
                      </Text>
                      <Text
                        className="text-sm font-semibold min-w-[40px] text-right"
                        style={{ color: theme.textPrimary }}
                      >
                        {rate}%
                      </Text>
                    </Box>
                  );
                })}
              </VStack>
            </CollapsibleOverviewCard>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}

const __expoRouterPrivateRoute_AdminBibleschoolAnalytics = () => null;

export default __expoRouterPrivateRoute_AdminBibleschoolAnalytics;
