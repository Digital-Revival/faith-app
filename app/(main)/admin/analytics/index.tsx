import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { AdminCard, PeriodSelector } from '@/app/(main)/admin/_components/AdminAnalyticsUI';
import { AdminMultiSelectFilter } from '@/app/(main)/admin/_components/AdminMultiSelectFilter';
import { Text } from '@/components/ui/text';
import { useAdminAnalyticsFilters } from '@/hooks/useAdminDashboardPreferences';
import { useModules } from '@/hooks/useBibleschoolContent';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/hooks/useTranslation';
import { adminAnalyticsService } from '@/services/api/adminAnalyticsService';
import { queryKeys } from '@/services/queryKeys';
import { getAdminTimezone } from '@/utils/adminAnalytics';
import { buildLearningAnalyticsCsv } from '@/utils/exportAnalytics';

type Tab = 'path' | 'modules' | 'exams' | 'retention';
const TABS: Tab[] = ['path','modules','exams','retention'];

export default function AdminLearningAnalyticsScreen() {
  const theme = useTheme(); const { t, locale } = useTranslation(); const insets = useSafeAreaInsets(); const toast = useToast();
  const { data: curriculum = [] } = useModules(locale); const { filters, setFilters } = useAdminAnalyticsFilters();
  const timezone = getAdminTimezone(); const [tab, setTab] = useState<Tab>('path'); const [expandedModule,setExpandedModule]=useState<string|null>(null);
  const queryFilters = useMemo(() => ({ locales: filters.locales, simpleModes: filters.simpleModes, moduleIds: filters.moduleIds }), [filters.locales, filters.moduleIds, filters.simpleModes]);
  const query = useQuery({ queryKey: queryKeys.admin.learningV2(filters.period, timezone, queryFilters), queryFn: () => adminAnalyticsService.getLearningAnalyticsV2(filters.period, timezone, queryFilters) });
  const moduleNames = useMemo(() => new Map(curriculum.map((module) => [module.id, module.title])), [curriculum]);
  const languageOptions = useMemo(() => [
    { value: 'nl', label: 'Nederlands', leading: '🇳🇱' },
    { value: 'bg', label: 'Български', leading: '🇧🇬' },
    { value: 'hi', label: 'हिन्दी', leading: '🇮🇳' },
    { value: 'id', label: 'Bahasa Indonesia', leading: '🇮🇩' },
    { value: 'en', label: 'English', leading: '🇬🇧' },
  ], []);
  const modeOptions = useMemo(() => [
    { value: 'simple', label: t('admin.v2.simpleMode') },
    { value: 'normal', label: t('admin.v2.normalMode') },
  ], [t]);
  const moduleOptions = useMemo(() => curriculum.map((module) => ({ value: module.id, label: module.title })), [curriculum]);
  const exportCsv = async () => {
    if (!query.data) return;
    try { const available = await Sharing.isAvailableAsync(); if (!available) throw new Error('unavailable');
      const path = `${FileSystem.cacheDirectory}faith-admin-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(path, buildLearningAnalyticsCsv(query.data), { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: t('admin.exportAnalytics') });
    } catch { toast.error(t('admin.exportFailed')); }
  };
  const periodLabels = { '7d':'7d','30d':'30d','90d':'90d',all:t('admin.allTime') };

  return <View style={{ flex:1, paddingTop:insets.top+24, backgroundColor:theme.pageBg }}>
    <View style={{ paddingHorizontal:24 }}><MainTopBar title={t('admin.analytics')} currentSection="admin" showBackButton /></View>
    <ScrollView contentContainerStyle={{ paddingHorizontal:24, paddingBottom:insets.bottom+48, gap:18 }} showsVerticalScrollIndicator={false}>
      <PeriodSelector value={filters.period} onChange={(period) => setFilters({ ...filters, period })} labels={periodLabels} />
      <View style={{ gap: 10 }}>
        <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>{t('admin.v2.filters')}</Text>
        <AdminMultiSelectFilter label={t('admin.v2.languages')} allLabel={t('admin.v2.allLanguages')} selectedValues={filters.locales} options={languageOptions} onApply={(locales) => setFilters({ ...filters, locales })} />
        <AdminMultiSelectFilter label={t('admin.v2.modes')} allLabel={t('admin.v2.allModes')} selectedValues={filters.simpleModes.map((mode) => mode ? 'simple' : 'normal')} options={modeOptions} onApply={(values) => setFilters({ ...filters, simpleModes: values.map((value) => value === 'simple') })} />
        <AdminMultiSelectFilter label={t('admin.v2.modules')} allLabel={t('admin.v2.allModules')} selectedValues={filters.moduleIds} options={moduleOptions} onApply={(moduleIds) => setFilters({ ...filters, moduleIds })} />
      </View>
      <View accessibilityRole="tablist" style={{ flexDirection:'row', borderBottomWidth:1, borderBottomColor:theme.cardBorder }}>{TABS.map((item)=><Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected:tab===item }} onPress={()=>setTab(item)} style={{ flex:1, minHeight:46, justifyContent:'center', alignItems:'center', borderBottomWidth:2, borderBottomColor:tab===item?theme.dataVizPrimary:'transparent' }}><Text className="text-xs font-semibold" style={{ color:tab===item?theme.textPrimary:theme.textSecondary }}>{t(`admin.v2.tabs.${item}`)}</Text></Pressable>)}</View>
      {query.isLoading ? <AdminCard><Text style={{ color:theme.textSecondary }}>{t('common.loading')}</Text></AdminCard> : null}
      {query.isError ? <AdminCard><Text style={{ color:theme.dataVizRisk }}>{t('admin.v2.loadError')}</Text></AdminCard> : null}
      {query.data && tab==='path' ? <AdminCard>{query.data.funnel.map((stage,index)=>{ const first=query.data!.funnel[0]?.value||1; const width=Math.max(4,(stage.value/first)*100); return <View key={stage.id} style={{ marginBottom:index===query.data!.funnel.length-1?0:18 }}><View style={{ flexDirection:'row',justifyContent:'space-between' }}><Text className="text-sm font-semibold" style={{ color:theme.textPrimary }}>{t(`admin.v2.funnel.${stage.id}`)}</Text><Text className="text-sm font-bold" style={{ color:theme.textPrimary }}>{stage.value}</Text></View><View style={{ height:8,backgroundColor:theme.cardBorder,borderRadius:4,marginTop:8 }}><View style={{ width:`${width}%`,height:8,backgroundColor:theme.dataVizPrimary,borderRadius:4 }} /></View></View>;})}</AdminCard> : null}
      {query.data && tab==='modules' ? query.data.modules.map((module)=><AdminCard key={module.moduleId}><Pressable accessibilityState={{expanded:expandedModule===module.moduleId}} onPress={()=>setExpandedModule(expandedModule===module.moduleId?null:module.moduleId)} style={{minHeight:44,justifyContent:'center'}}><View style={{ flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12 }}><Text className="flex-1 text-sm font-bold" style={{ color:theme.textPrimary }}>{moduleNames.get(module.moduleId)??module.moduleId}</Text><Text className="text-sm font-bold" style={{ color:theme.dataVizPrimary }}>{module.completionRate}%</Text><Ionicons name={expandedModule===module.moduleId?'chevron-up':'chevron-down'} size={18} color={theme.textSecondary}/></View><Text className="mt-2 text-xs" style={{ color:theme.textSecondary }}>{module.starters} {t('admin.v2.starters')} · {module.completers} {t('admin.v2.completers')} · {module.dropoff} {t('admin.v2.dropoff')}</Text><Text className="mt-1 text-xs" style={{ color:theme.textSecondary }}>{t('admin.v2.medianDays', { count:module.medianDays })}</Text></Pressable>{expandedModule===module.moduleId?<View style={{marginTop:10}}>{module.lessons.map((lesson,index)=><View key={lesson.lessonId} style={{minHeight:42,flexDirection:'row',alignItems:'center',borderTopWidth:1,borderTopColor:theme.cardBorder}}><Text numberOfLines={1} className="flex-1 text-xs" style={{color:theme.textSecondary}}>{lesson.lessonId}</Text><Text className="text-xs font-semibold" style={{color:theme.textPrimary}}>{lesson.completed}/{lesson.started}</Text></View>)}</View>:null}</AdminCard>) : null}
      {query.data && tab==='exams' ? query.data.exams.map((exam)=><AdminCard key={exam.moduleId}><Text className="text-sm font-bold" style={{ color:theme.textPrimary }}>{moduleNames.get(exam.moduleId)??exam.moduleId}</Text><View style={{ flexDirection:'row',justifyContent:'space-between',marginTop:14 }}><Value label={t('admin.v2.firstAttempt')} value={`${exam.firstAttemptPassRate}%`} /><Value label={t('admin.avgScore')} value={`${exam.averageScore}%`} /><Value label={t('admin.v2.retries')} value={String(exam.retryCount)} /></View></AdminCard>) : null}
      {query.data && tab==='retention' ? <AdminCard>{query.data.retention.isBuilding?<View style={{ flexDirection:'row',gap:10 }}><Ionicons name="hourglass-outline" size={20} color={theme.dataVizWarning}/><Text className="flex-1 text-sm" style={{ color:theme.textSecondary }}>{t('admin.v2.retentionBuilding')}</Text></View>:<><View style={{ flexDirection:'row',justifyContent:'space-between',paddingBottom:14 }}><Value label="D1" value={`${query.data.retention.d1}%`}/><Value label="D7" value={`${query.data.retention.d7}%`}/><Value label="D30" value={`${query.data.retention.d30}%`}/></View>{query.data.retention.cohorts.map((cohort)=><View key={cohort.weekStart} style={{minHeight:48,flexDirection:'row',alignItems:'center',borderTopWidth:1,borderTopColor:theme.cardBorder}}><Text className="flex-1 text-xs" style={{color:theme.textSecondary}}>{cohort.weekStart} · n={cohort.size}</Text><Text className="text-xs font-semibold" style={{color:theme.textPrimary}}>{cohort.d1}% · {cohort.d7}% · {cohort.d30}%</Text></View>)}</>}</AdminCard> : null}
      <Pressable onPress={exportCsv} disabled={!query.data} style={{ minHeight:48,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderWidth:1,borderColor:theme.cardBorder,borderRadius:8,opacity:query.data?1:.5 }}><Ionicons name="download-outline" size={20} color={theme.textPrimary}/><Text className="text-sm font-semibold" style={{ color:theme.textPrimary }}>{t('admin.export')}</Text></Pressable>
    </ScrollView>
  </View>;
}

function Value({ label,value }:{ label:string;value:string }) { const theme=useTheme(); return <View><Text className="text-xs" style={{ color:theme.textSecondary }}>{label}</Text><Text className="mt-1 text-lg font-bold" style={{ color:theme.textPrimary }}>{value}</Text></View>; }
