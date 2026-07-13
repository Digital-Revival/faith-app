import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { AdminMultiSelectFilter } from '@/app/(main)/admin/_components/AdminMultiSelectFilter';
import { Text } from '@/components/ui/text';
import { routes } from '@/constants/routes';
import { useModules } from '@/hooks/useBibleschoolContent';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/hooks/useTranslation';
import { adminAnalyticsService } from '@/services/api/adminAnalyticsService';
import { queryKeys } from '@/services/queryKeys';
import type { AdminAttentionSignalType, AdminUserFilters, AdminUserV2 } from '@/types/analytics';
import type { BibleschoolModule } from '@/types/bibleschool';
import { getAdminPaginationItems, getAdminTimezone } from '@/utils/adminAnalytics';
import { buildAdminUsersCsv } from '@/utils/exportAnalytics';
import { formatRelativeDate } from '@/utils/formatters';

const PAGE_SIZE = 30;
type AdminUserSort = NonNullable<AdminUserFilters['sort']>;

const LANGUAGE_OPTIONS = [
  { value: 'nl', label: 'Nederlands', leading: '🇳🇱' },
  { value: 'bg', label: 'Български', leading: '🇧🇬' },
  { value: 'hi', label: 'हिन्दी', leading: '🇮🇳' },
  { value: 'id', label: 'Bahasa Indonesia', leading: '🇮🇩' },
  { value: 'en', label: 'English', leading: '🇬🇧' },
];

export default function AdminUsersScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ signal?: AdminAttentionSignalType }>();
  const { data: modules = [] } = useModules(locale);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [locales, setLocales] = useState<string[]>([]);
  const [simpleModes, setSimpleModes] = useState<boolean[]>([]);
  const [signals, setSignals] = useState<AdminAttentionSignalType[]>(params.signal ? [params.signal] : []);
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [sort, setSort] = useState<AdminUserSort>('last_activity');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = useMemo<AdminUserFilters>(() => ({
    search: debouncedSearch,
    locales,
    simpleModes,
    signals,
    moduleIds,
    sort,
    direction: sort === 'name' ? 'asc' : 'desc',
    limit: PAGE_SIZE,
    offset,
  }), [debouncedSearch, locales, moduleIds, offset, signals, simpleModes, sort]);
  const query = useQuery({
    queryKey: queryKeys.admin.usersV2(filters),
    queryFn: () => adminAnalyticsService.getAdminUsersV2(filters),
  });

  const modeOptions = useMemo(() => [
    { value: 'simple', label: t('admin.v2.simpleMode') },
    { value: 'normal', label: t('admin.v2.normalMode') },
  ], [t]);
  const signalOptions = useMemo(() => (['no_first_lesson', 'inactive_after_start', 'stalled_module', 'repeated_exam_failure'] as AdminAttentionSignalType[])
    .map((value) => ({ value, label: t(`admin.v2.signals.${value}`) })), [t]);
  const moduleOptions = useMemo(() => modules.map((module) => ({ value: module.id, label: module.title })), [modules]);
  const sortOptions = useMemo(() => (['last_activity', 'progress', 'created_at', 'name'] as AdminUserSort[])
    .map((value) => ({ value, label: t(`admin.v2.sort.${value}`) })), [t]);

  const total = query.data?.totalCount ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginationItems = getAdminPaginationItems(page, pages);
  const goToPage = (nextPage: number) => {
    Keyboard.dismiss();
    setOffset((nextPage - 1) * PAGE_SIZE);
  };
  const resetPage = (update: () => void) => {
    update();
    setOffset(0);
  };
  const exportUsers = async () => {
    if (!query.data) return;
    try {
      if (!await Sharing.isAvailableAsync()) throw new Error('unavailable');
      const allUsers: AdminUserV2[] = [];
      for (let exportOffset = 0; exportOffset < query.data.totalCount; exportOffset += 100) {
        const pageData = await adminAnalyticsService.getAdminUsersV2({ ...filters, limit: 100, offset: exportOffset });
        allUsers.push(...pageData.users);
      }
      const exportData = { ...query.data, users: allUsers, limit: allUsers.length, offset: 0 };
      const path = `${FileSystem.cacheDirectory}faith-users-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(path, buildAdminUsersCsv(exportData, filters, getAdminTimezone()), { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: t('admin.v2.exportUsers') });
    } catch {
      toast.error(t('admin.exportFailed'));
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 24, backgroundColor: theme.pageBg }}>
      <View style={{ paddingHorizontal: 24 }}>
        <MainTopBar title={t('admin.users')} currentSection="admin" showBackButton />
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
        <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 8, backgroundColor: theme.cardBg }}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput value={search} onChangeText={setSearch} placeholder={t('admin.searchUsers')} placeholderTextColor={theme.textTertiary} returnKeyType="search" style={{ flex: 1, color: theme.textPrimary, fontFamily: 'Poppins_400Regular' }} />
          {search ? <Pressable accessibilityLabel={t('common.clear')} onPress={() => setSearch('')} hitSlop={8}><Ionicons name="close-circle" size={20} color={theme.textSecondary} /></Pressable> : null}
        </View>
      </View>
      <FlatList
        data={query.data?.users ?? []}
        keyExtractor={(item) => item.id}
        refreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 24,
          gap: 8,
          flexGrow: query.data?.users.length ? 0 : 1,
        }}
        ListHeaderComponent={(
          <View style={{ gap: 12, paddingBottom: 12 }}>
            <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>{t('admin.v2.filters')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><AdminMultiSelectFilter label={t('admin.v2.languages')} allLabel={t('admin.v2.allLanguages')} selectedValues={locales} options={LANGUAGE_OPTIONS} onApply={(values) => resetPage(() => setLocales(values))} onOpenChange={setFilterOpen} /></View>
              <View style={{ flex: 1 }}><AdminMultiSelectFilter label={t('admin.v2.modes')} allLabel={t('admin.v2.allModes')} selectedValues={simpleModes.map((value) => value ? 'simple' : 'normal')} options={modeOptions} onApply={(values) => resetPage(() => setSimpleModes(values.map((value) => value === 'simple')))} onOpenChange={setFilterOpen} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><AdminMultiSelectFilter label={t('admin.v2.attention')} allLabel={t('admin.v2.allSignals')} selectedValues={signals} options={signalOptions} onApply={(values) => resetPage(() => setSignals(values as AdminAttentionSignalType[]))} onOpenChange={setFilterOpen} /></View>
              <View style={{ flex: 1 }}><AdminMultiSelectFilter label={t('admin.v2.modules')} allLabel={t('admin.v2.allModules')} selectedValues={moduleIds} options={moduleOptions} onApply={(values) => resetPage(() => setModuleIds(values))} onOpenChange={setFilterOpen} /></View>
            </View>
            <AdminMultiSelectFilter label={t('admin.v2.sortBy')} allLabel={t(`admin.v2.sort.${sort}`)} selectedValues={[sort]} options={sortOptions} selectionMode="single" allowAll={false} onApply={(values) => resetPage(() => setSort(values[0] as AdminUserSort))} onOpenChange={setFilterOpen} />
            <Pressable onPress={exportUsers} disabled={!query.data?.users.length} style={{ alignSelf: 'flex-end', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: query.data?.users.length ? 1 : 0.4 }}>
              <Ionicons name="download-outline" size={18} color={theme.textPrimary} />
              <Text className="text-xs font-semibold" style={{ color: theme.textPrimary }}>{t('admin.v2.exportUsers')}</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}><Text className="text-center" style={{ color: query.isError ? theme.dataVizRisk : theme.textSecondary }}>{query.isLoading ? t('common.loading') : query.isError ? t('admin.v2.loadError') : t('admin.noUsersFound')}</Text></View>}
        renderItem={({ item }) => <UserRow user={item} modules={modules} onPress={() => { Keyboard.dismiss(); router.push(routes.admin(`users/${item.id}`) as never); }} />}
      />
      {total > 0 && !filterOpen ? <View style={{ paddingTop: 10, paddingHorizontal: 24, paddingBottom: insets.bottom + 10, borderTopWidth: 1, borderTopColor: theme.cardBorder, backgroundColor: theme.pageBg }}><View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><PaginationArrow direction="back" disabled={page === 1} onPress={() => goToPage(page - 1)} /><View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }}>{paginationItems.map((item, index) => item === 'ellipsis' ? <View key={`ellipsis-${index}`} style={{ width: 20, height: 40, alignItems: 'center', justifyContent: 'center' }}><Text className="text-sm" style={{ color: theme.textTertiary }}>…</Text></View> : <Pressable key={item} accessibilityRole="button" accessibilityLabel={t('admin.v2.pageNumber', { count: item })} accessibilityState={{ selected: item === page }} onPress={() => goToPage(item)} style={{ width: 32, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: item === page ? theme.buttonPrimary : 'transparent' }}><Text className="text-sm font-semibold" style={{ color: item === page ? theme.buttonPrimaryContrast : theme.textSecondary }}>{item}</Text></Pressable>)}</View><PaginationArrow direction="forward" disabled={page === pages} onPress={() => goToPage(page + 1)} /></View></View> : null}
    </View>
  );
}

function PaginationArrow({ direction, disabled, onPress }: { direction: 'back' | 'forward'; disabled: boolean; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return <Pressable accessibilityRole="button" accessibilityLabel={direction === 'back' ? t('common.previous') : t('common.next')} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={{ width: 44, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0.2 : 0.05, shadowRadius: 4, elevation: 2, opacity: disabled ? 0.35 : 1 }}><Ionicons name={direction === 'back' ? 'chevron-back' : 'chevron-forward'} size={20} color={theme.textPrimary} /></Pressable>;
}

function UserRow({ user, modules, onPress }: { user: AdminUserV2; modules: BibleschoolModule[]; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const moduleIndex = modules.findIndex((module) => module.id === user.currentModuleId);
  const module = moduleIndex >= 0 ? modules[moduleIndex] : null;
  const programCompleted = modules.length > 0 && user.completedModuleCount >= modules.length;
  const progress = programCompleted ? 100 : user.progressPercentage;
  const statusLabel = programCompleted
    ? t('admin.v2.programCompleted')
    : user.currentModuleStatus === 'in_progress'
      ? t('admin.v2.inProgress')
      : user.currentModuleStatus === 'ready_for_next'
        ? t('admin.v2.readyForNext')
        : t('admin.v2.notStarted');
  const positionLabel = programCompleted
    ? t('admin.v2.programCompleted')
    : module
      ? t('admin.v2.modulePosition', { current: moduleIndex + 1, total: modules.length })
      : t('admin.v2.notStarted');

  return (
    <Pressable onPress={onPress} style={{ minHeight: 138, padding: 14, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 8, backgroundColor: theme.cardBg }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} className="text-sm font-bold" style={{ color: theme.textPrimary }}>{user.fullName || user.email}</Text>
          <Text numberOfLines={1} className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>{user.email}</Text>
        </View>
        <Text className="text-xs font-semibold" style={{ color: theme.textSecondary }}>{user.locale.toUpperCase()} · {user.simpleMode ? t('admin.v2.simpleShort') : t('admin.v2.normalShort')}</Text>
      </View>
      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} className="text-xs" style={{ color: theme.textSecondary }}>{positionLabel} · {statusLabel}</Text>
          <Text numberOfLines={1} className="mt-0.5 text-sm font-semibold" style={{ color: theme.textPrimary }}>{programCompleted ? t('admin.v2.allModulesCompleted') : module?.title ?? t('admin.v2.notStarted')}</Text>
          <View style={{ height: 5, marginTop: 7, backgroundColor: theme.cardBorder, borderRadius: 3 }}><View style={{ width: `${progress}%`, height: 5, backgroundColor: theme.dataVizPrimary, borderRadius: 3 }} /></View>
        </View>
        <Text className="text-xs font-semibold" style={{ color: theme.textPrimary }}>{progress}%</Text>
        {user.signals.length ? <Ionicons accessibilityLabel={t('admin.v2.hasAttention')} name="alert-circle" size={18} color={theme.dataVizWarning} /> : null}
      </View>
      <View style={{ marginTop: 9, flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text className="text-xs" style={{ color: theme.textTertiary }}>{t('admin.v2.completedModulesShort', { count: user.completedModuleCount })} · {t('admin.v2.completedLessonsShort', { count: user.completedLessonCount })}</Text>
        <Text className="text-xs" style={{ color: theme.textTertiary }}>{formatRelativeDate(user.lastActivity, { yesterday: t('common.yesterday'), daysAgo: (count) => t('common.daysAgo', { count }), weeksAgo: (count) => t('common.weeksAgo', { count }) })}</Text>
      </View>
    </Pressable>
  );
}
