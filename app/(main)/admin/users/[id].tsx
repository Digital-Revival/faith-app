import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { AdminCard, SectionTitle } from '@/app/(main)/admin/_components/AdminAnalyticsUI';
import { Text } from '@/components/ui/text';
import { useModules } from '@/hooks/useBibleschoolContent';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/hooks/useTranslation';
import { adminAnalyticsService } from '@/services/api/adminAnalyticsService';
import { queryKeys } from '@/services/queryKeys';
import type { AdminUserModuleProgress } from '@/types/analytics';
import { formatFullDate } from '@/utils/formatters';

export default function AdminUserDetailScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: modules = [] } = useModules(locale);
  const moduleNames = useMemo(() => new Map(modules.map((module) => [module.id, module.title])), [modules]);
  const lessonNames = useMemo(() => new Map(modules.flatMap((module) => module.lessons.map((lesson) => [lesson.id, lesson.title] as const))), [modules]);
  const query = useQuery({
    queryKey: queryKeys.admin.userDetailV2(id ?? ''),
    queryFn: () => adminAnalyticsService.getAdminUserDetailV2(id!),
    enabled: !!id,
  });
  const data = query.data;

  const emailUser = async () => {
    if (!data) return;
    const url = `mailto:${encodeURIComponent(data.user.email)}?subject=${encodeURIComponent(t('admin.v2.emailSubject'))}`;
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }
    } catch {}
    await Clipboard.setStringAsync(data.user.email);
    toast.success(t('admin.v2.emailCopied'));
  };

  if (query.isLoading || !data) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pageBg }}><Text style={{ color: theme.textSecondary }}>{query.isError ? t('admin.v2.loadError') : t('common.loading')}</Text></View>;
  }

  const progressByModule = new Map(data.moduleProgress.map((progress) => [progress.moduleId, progress]));
  const completedModules = new Set(data.moduleProgress.filter((progress) => progress.status === 'completed').map((progress) => progress.moduleId));
  const activeProgress = [...modules]
    .reverse()
    .map((module) => progressByModule.get(module.id))
    .find((progress): progress is AdminUserModuleProgress => progress?.status === 'in_progress');
  const programCompleted = modules.length > 0 && completedModules.size >= modules.length;
  const currentModule = programCompleted
    ? modules[modules.length - 1]
    : modules.find((module) => module.id === activeProgress?.moduleId) ?? modules.find((module) => !completedModules.has(module.id)) ?? null;
  const currentProgress = currentModule ? progressByModule.get(currentModule.id) : undefined;
  const currentIndex = currentModule ? modules.findIndex((module) => module.id === currentModule.id) : -1;
  const currentPercentage = programCompleted ? 100 : currentProgress?.progressPercentage ?? 0;
  const currentStatus = programCompleted
    ? t('admin.v2.programCompleted')
    : activeProgress
      ? t('admin.v2.inProgress')
      : completedModules.size
        ? t('admin.v2.readyForNext')
        : t('admin.v2.notStarted');
  const completedLessonCount = currentProgress?.completedLessonCount ?? 0;
  const lastLessonTitle = currentProgress?.lastLessonId ? lessonNames.get(currentProgress.lastLessonId) ?? currentProgress.lastLessonId : null;

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 24, backgroundColor: theme.pageBg }}>
      <View style={{ paddingHorizontal: 24 }}><MainTopBar title={data.user.fullName || data.user.email} currentSection="admin" showBackButton /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 48, gap: 18 }} showsVerticalScrollIndicator={false}>
        <AdminCard>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>{data.user.fullName || data.user.email}</Text>
              <Text selectable className="mt-1 text-sm" style={{ color: theme.textSecondary }}>{data.user.email}</Text>
              <Text className="mt-2 text-xs" style={{ color: theme.textTertiary }}>{t('admin.joined')}: {formatFullDate(data.user.createdAt)} · {data.user.locale.toUpperCase()} · {data.user.simpleMode ? t('admin.v2.simpleMode') : t('admin.v2.normalMode')}</Text>
            </View>
            <Pressable accessibilityLabel={t('admin.v2.sendEmail')} onPress={emailUser} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 8 }}><Ionicons name="mail-outline" size={21} color={theme.textPrimary} /></Pressable>
          </View>
        </AdminCard>

        <View style={{ gap: 10 }}>
          <SectionTitle title={t('admin.v2.currentPosition')} />
          <AdminCard>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text className="text-xs font-semibold" style={{ color: theme.dataVizPrimary }}>{currentIndex >= 0 ? t('admin.v2.modulePosition', { current: currentIndex + 1, total: modules.length }) : t('admin.v2.notStarted')}</Text>
                <Text className="mt-1 text-lg font-bold" style={{ color: theme.textPrimary }}>{currentModule?.title ?? t('admin.v2.notStarted')}</Text>
                <Text className="mt-1 text-sm" style={{ color: theme.textSecondary }}>{currentStatus}</Text>
              </View>
              <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>{currentPercentage}%</Text>
            </View>
            <View style={{ height: 7, marginTop: 14, backgroundColor: theme.cardBorder, borderRadius: 4 }}><View style={{ width: `${currentPercentage}%`, height: 7, backgroundColor: theme.dataVizPrimary, borderRadius: 4 }} /></View>
            {currentModule ? <Text className="mt-3 text-xs" style={{ color: theme.textSecondary }}>{t('admin.v2.lessonsInModule', { completed: completedLessonCount, total: currentModule.lessonCount })}</Text> : null}
            {lastLessonTitle ? <Text className="mt-1 text-xs" style={{ color: theme.textTertiary }}>{t('admin.v2.lastLesson')}: {lastLessonTitle}</Text> : null}
          </AdminCard>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label={t('admin.lessonsCompleted')} value={data.lessonCompletedCount} />
          <Stat label={t('admin.modulesCompleted')} value={completedModules.size} />
          <Stat label={t('admin.quizAttempts')} value={data.quizAttempts.length} />
        </View>

        {data.signals.length ? <View style={{ gap: 10 }}><SectionTitle title={t('admin.v2.attention')} /><AdminCard>{data.signals.map((signal) => <View key={signal.type} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 }}><Ionicons name="alert-circle-outline" size={20} color={theme.dataVizWarning} /><Text className="flex-1 text-sm" style={{ color: theme.textPrimary }}>{t(`admin.v2.signals.${signal.type}`)}</Text></View>)}</AdminCard></View> : null}

        <View style={{ gap: 10 }}>
          <SectionTitle title={t('admin.v2.curriculumProgress')} />
          <AdminCard>
            {modules.map((module, index) => {
              const progress = progressByModule.get(module.id);
              const isCompleted = progress?.status === 'completed';
              const isActive = module.id === currentModule?.id && !programCompleted;
              const percentage = isCompleted ? 100 : progress?.progressPercentage ?? 0;
              const statusLabel = isCompleted ? t('admin.v2.completed') : isActive ? currentStatus : t('admin.v2.notStarted');
              return <View key={module.id} style={{ minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: index === modules.length - 1 ? 0 : 1, borderBottomColor: theme.cardBorder }}><View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: isCompleted ? theme.badgeSuccessBg : isActive ? theme.brandAccentMuted : theme.avatarPrimary }}><Ionicons name={isCompleted ? 'checkmark' : isActive ? 'play' : 'lock-closed-outline'} size={15} color={isCompleted || isActive ? theme.dataVizPrimary : theme.textTertiary} /></View><View style={{ flex: 1 }}><Text numberOfLines={1} className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{index + 1}. {module.title}</Text><Text className="mt-0.5 text-xs" style={{ color: isActive ? theme.dataVizPrimary : theme.textSecondary }}>{statusLabel}</Text></View><Text className="text-xs font-semibold" style={{ color: theme.textSecondary }}>{percentage}%</Text></View>;
            })}
          </AdminCard>
        </View>

        {data.quizAttempts.length ? <View style={{ gap: 10 }}><SectionTitle title={t('admin.v2.examHistory')} /><AdminCard>{data.quizAttempts.map((attempt, index) => <View key={`${attempt.moduleId}-${attempt.attemptNumber}-${attempt.completedAt}`} style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: index === data.quizAttempts.length - 1 ? 0 : 1, borderBottomColor: theme.cardBorder }}><Ionicons name={attempt.passed ? 'checkmark-circle' : 'close-circle-outline'} size={21} color={attempt.passed ? theme.dataVizPrimary : theme.dataVizRisk} /><View style={{ flex: 1 }}><Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{moduleNames.get(attempt.moduleId) ?? attempt.moduleId}</Text><Text className="text-xs" style={{ color: theme.textSecondary }}>{t('admin.v2.attemptNumber', { count: attempt.attemptNumber })} · {formatFullDate(attempt.completedAt)}</Text></View><Text className="text-sm font-bold" style={{ color: attempt.passed ? theme.dataVizPrimary : theme.dataVizRisk }}>{attempt.scorePercentage}%</Text></View>)}</AdminCard></View> : null}

        <View style={{ gap: 10 }}>
          <SectionTitle title={t('admin.v2.progressTimeline')} />
          <AdminCard>{data.timeline.length ? data.timeline.slice(0, 30).map((event, index) => <View key={`${event.type}-${event.at}-${index}`} style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: index === Math.min(data.timeline.length, 30) - 1 ? 0 : 1, borderBottomColor: theme.cardBorder }}><View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.avatarPrimary }}><Ionicons name={event.type === 'exam_attempt' ? 'document-text-outline' : event.type === 'module_completed' ? 'ribbon-outline' : 'checkmark-outline'} size={17} color={theme.textPrimary} /></View><View style={{ flex: 1 }}><Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{t(`admin.v2.timeline.${event.type}`)}</Text><Text numberOfLines={1} className="text-xs" style={{ color: theme.textSecondary }}>{moduleNames.get(event.moduleId) ?? event.moduleId}{event.score !== undefined ? ` · ${event.score}%` : ''}</Text></View><Text className="text-xs" style={{ color: theme.textTertiary }}>{formatFullDate(event.at)}</Text></View>) : <Text className="text-sm" style={{ color: theme.textSecondary }}>{t('admin.v2.noTimeline')}</Text>}</AdminCard>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const theme = useTheme();
  return <View style={{ flex: 1, minHeight: 94, padding: 12, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 8, backgroundColor: theme.cardBg }}><Text className="text-xs" style={{ color: theme.textSecondary }}>{label}</Text><Text className="mt-2 text-xl font-bold" style={{ color: theme.textPrimary }}>{value}</Text></View>;
}
