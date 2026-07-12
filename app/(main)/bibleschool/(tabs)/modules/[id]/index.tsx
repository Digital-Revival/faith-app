import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { useIntroductionVimeoId, useModule, useModules } from '@/hooks/useBibleschoolContent';
import { useIntroVideoWatched } from '@/hooks/useIntroVideoWatched';
import { usePrefetchLessonThumbnails } from '@/hooks/usePrefetchLessonThumbnails';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { useEasyRead } from '@/contexts/EasyReadContext';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bzzt, bzztWarning } from '@/utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { queryKeys } from '@/services/queryKeys';
import { vimeoService } from '@/services/vimeo/vimeoService';
import { lessonProgressService } from '@/services/api/lessonProgressService';
import { Image } from 'expo-image';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useLessonUnlocks } from '@/hooks/useLessonUnlocks';
import { getFirstModuleId, sortModulesByOrder } from '@/utils/bibleschoolCurriculum';
import { getCurrentTargetForModule } from '@/utils/unlockLogic';
import { LockedLessonModal } from './_components/LockedLessonModal';
import { ModuleLessonList } from './_components/ModuleLessonList';
import type { BibleschoolModule, LessonLike } from '@/types/bibleschool';
import { routes } from '@/constants/routes';

function ModuleHeroBanner({ module }: { module: BibleschoolModule }) {
  if (!module.backgroundImageUrl) return null;
  return (
    <Image
      source={{ uri: module.backgroundImageUrl }}
      style={heroStyles.image}
      contentFit="cover"
    />
  );
}

const heroStyles = StyleSheet.create({
  image: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginBottom: 24,
  },
});

export default function ModuleLessonsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { enabled: easyReadEnabled } = useEasyRead();
  const userId = user?.id;

  const { data: module } = useModule(id, locale);
  const { data: modules } = useModules(locale);
  const curriculum = useMemo(() => sortModulesByOrder(modules ?? []), [modules]);
  const firstModuleId = useMemo(() => getFirstModuleId(modules ?? []), [modules]);
  const lessons = useMemo(() => module?.lessons ?? [], [module]);
  const {
    isLessonUnlocked,
    isExamUnlocked,
    getExamStatusForModule,
    completedLessonIds,
    passedModuleIds,
    nextUnlockedTarget,
  } = useLessonUnlocks();

  const { data: moduleLessonProgress } = useQuery({
    queryKey: queryKeys.progress.lessonProgress.byUserModule(userId ?? '', id ?? ''),
    queryFn: () => lessonProgressService.listByUserAndModule(userId!, id!),
    enabled: !!userId && !!id,
    staleTime: 2 * 60 * 1000,
  });

  const lessonPositionMap = useMemo(() => {
    const map = new Map<string, number>();
    moduleLessonProgress?.forEach((p) => {
      if (!p.completed && p.video_position_seconds > 0) {
        map.set(p.lesson_id, p.video_position_seconds);
      }
    });
    return map;
  }, [moduleLessonProgress]);

  const examStatus = getExamStatusForModule(id!);
  const [lockedModal, setLockedModal] = useState<{
    message: string;
    prerequisiteLessonNumber: number;
    targetModuleNumber: number;
    targetModuleId: string;
    targetModuleTitle: string;
    targetLessonId: string | null;
    isExam: boolean;
    isIntroRequired?: boolean;
  } | null>(null);

  const { hasWatched: introWatched } = useIntroVideoWatched();
  const { data: introductionVimeoId } = useIntroductionVimeoId(locale);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const examUnlocked = isExamUnlocked(id!);

  const currentTarget = useMemo(
    () =>
      getCurrentTargetForModule(
        curriculum,
        firstModuleId,
        id!,
        lessons,
        completedLessonIds,
        passedModuleIds,
        introWatched,
        examUnlocked,
        examStatus.passed,
      ),
    [
      curriculum,
      firstModuleId,
      id,
      lessons,
      completedLessonIds,
      passedModuleIds,
      introWatched,
      examUnlocked,
      examStatus.passed,
    ],
  );

  const currentLessonId =
    currentTarget?.type === 'lesson' ? currentTarget.lesson.id : null;

  const showIntroInOther =
    !!firstModuleId &&
    id === firstModuleId &&
    !!introductionVimeoId &&
    currentTarget?.type !== 'intro';

  const otherLessons = useMemo(
    () => lessons.filter((l) => l.id !== currentLessonId),
    [lessons, currentLessonId],
  );

  const showExamInOther = examUnlocked && currentTarget?.type !== 'exam';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const refreshTasks = [
        queryClient.invalidateQueries({
          queryKey: queryKeys.bibleschool.category(locale),
        }),
      ];

      if (userId && id) {
        refreshTasks.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.progress.lessonProgress.byUserModule(userId, id),
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.progress.lessonProgress.completedByUser(userId),
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.progress.allQuizAttempts(userId),
          }),
        );
      }

      await Promise.all(refreshTasks);
    } finally {
      setRefreshing(false);
    }
  }, [id, locale, queryClient, userId]);

  usePrefetchLessonThumbnails(
    id ?? '',
    lessons,
    introductionVimeoId ?? undefined,
    firstModuleId,
  );

  useEffect(() => {
    const ids = new Set<string>();
    if (firstModuleId && id === firstModuleId && introductionVimeoId) {
      ids.add(introductionVimeoId);
    }
    lessons
      .filter((l) => l.videoId && !l.videoUrl)
      .slice(0, 3)
      .forEach((l) => ids.add(l.videoId!));
    ids.forEach((videoId) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.vimeo.meta(videoId),
        queryFn: () => vimeoService.getVimeoVideoMetaRaw(videoId),
      });
    });
  }, [id, firstModuleId, lessons, introductionVimeoId, queryClient]);

  const handleLockedPress = (lesson?: LessonLike) => {
    bzztWarning();
    const isLesson1Module1 =
      !!firstModuleId && id === firstModuleId && lesson?.order === 1;
    if (isLesson1Module1 && !introWatched) {
      setLockedModal({
        message: t('lessons.introRequiredMessage'),
        prerequisiteLessonNumber: 0,
        targetModuleNumber: 0,
        targetModuleId: '',
        targetModuleTitle: '',
        targetLessonId: null,
        isExam: false,
        isIntroRequired: true,
      });
      return;
    }
    const target = nextUnlockedTarget;
    if (!target) return;
    const mod = modules?.find((m) => m.id === target.module.id);
    const targetModuleTitle = mod?.title ?? target.module.title;
    if (target.type === 'lesson') {
      setLockedModal({
        message: t('lessons.lockedModalMessageModuleLesson', {
          moduleNumber: target.module.order,
          number: target.lesson.order,
        }),
        prerequisiteLessonNumber: target.lesson.order,
        targetModuleNumber: target.module.order,
        targetModuleId: target.module.id,
        targetModuleTitle,
        targetLessonId: target.lesson.id,
        isExam: false,
      });
    } else {
      setLockedModal({
        message: t('lessons.lockedModalMessageExamModule', {
          moduleNumber: target.module.order,
        }),
        prerequisiteLessonNumber: 0,
        targetModuleNumber: target.module.order,
        targetModuleId: target.module.id,
        targetModuleTitle,
        targetLessonId: null,
        isExam: true,
      });
    }
  };

  if (!module) {
    return null;
  }

  return (
    <Box
      className="flex-1 px-6"
      style={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        backgroundColor: theme.pageBg,
      }}
    >
      <MainTopBar
        title={module.title}
        currentSection="bibleschool"
        showBackButton
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textTertiary}
          />
        }
      >
        <ModuleHeroBanner module={module} />
        {!easyReadEnabled && module.description.trim() ? (
          <Text
            className="text-base mb-6"
            style={{ color: theme.textSecondary }}
          >
            {module.description}
          </Text>
        ) : null}
        {lessons.length === 0 ? (
          <Box
            className="rounded-2xl p-8 items-center justify-center"
            style={{
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              className="text-base text-center"
              style={{ color: theme.textSecondary }}
            >
              {t('lessonsPage.empty')}
            </Text>
          </Box>
        ) : (
          <ModuleLessonList
            moduleId={id!}
            easyReadEnabled={easyReadEnabled}
            lessons={lessons}
            introductionVimeoId={introductionVimeoId}
            introWatched={introWatched}
            examStatus={examStatus}
            currentTarget={currentTarget}
            showIntroInOther={showIntroInOther}
            otherLessons={otherLessons}
            showExamInOther={showExamInOther}
            completedLessonIds={completedLessonIds}
            lessonPositionMap={lessonPositionMap}
            isLessonUnlocked={isLessonUnlocked}
            onLockedPress={handleLockedPress}
          />
        )}
      </ScrollView>
      <LockedLessonModal
        visible={lockedModal !== null}
        message={lockedModal?.message ?? ''}
        prerequisiteLessonNumber={lockedModal?.prerequisiteLessonNumber ?? 0}
        isExam={lockedModal?.isExam ?? false}
        isIntroRequired={lockedModal?.isIntroRequired}
        targetModuleNumber={lockedModal?.targetModuleNumber ?? 0}
        targetModuleId={lockedModal?.targetModuleId ?? ''}
        targetModuleTitle={lockedModal?.targetModuleTitle ?? ''}
        targetLessonId={lockedModal?.targetLessonId ?? null}
        onClose={() => setLockedModal(null)}
        onGoToPrerequisite={() => {
          if (!lockedModal) return;
          bzzt();
          setLockedModal(null);
          if (lockedModal.isIntroRequired) {
            router.push(routes.bibleschoolIntro());
          } else if (lockedModal.isExam) {
            router.push(routes.bibleschoolModuleExam(lockedModal.targetModuleId));
          } else if (lockedModal.targetLessonId) {
            router.push(
              routes.bibleschoolModuleLesson(
                lockedModal.targetModuleId,
                lockedModal.targetLessonId,
              ),
            );
          }
        }}
      />
    </Box>
  );
}
