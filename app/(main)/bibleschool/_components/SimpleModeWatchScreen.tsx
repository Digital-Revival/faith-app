import { routes } from '@/constants/routes';
import { useIntroductionVimeoId, useModules } from '@/hooks/useBibleschoolContent';
import { useIntroVideoWatched } from '@/hooks/useIntroVideoWatched';
import { useLastWatchedLesson } from '@/hooks/useLastWatchedLesson';
import { useLessonUnlocks } from '@/hooks/useLessonUnlocks';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useVimeoThumbnail } from '@/hooks/useVimeoThumbnail';
import {
  getDisplayModuleNumber,
  sortLessonsByOrder,
  sortModulesByOrder,
} from '@/utils/bibleschoolCurriculum';
import { router } from 'expo-router';
import {
  SimpleModeWatchContent,
  type SimpleModeWatchPresentation,
} from './SimpleModeWatchContent';
import {
  SimpleModeWatchDone,
  SimpleModeWatchError,
  SimpleModeWatchLoading,
} from './SimpleModeWatchStates';

export function SimpleModeWatchScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const {
    data: modules = [],
    isLoading: modulesLoading,
    isError: modulesError,
    refetch: refetchModules,
  } = useModules(locale);
  const { data: introVideoId, isLoading: introContentLoading } =
    useIntroductionVimeoId(locale);
  const { hasWatched: introWatched, isLoading: introLoading } =
    useIntroVideoWatched();
  const {
    nextUnlockedTarget,
    isLoading: unlocksLoading,
    isError: unlocksError,
    refetch: refetchUnlocks,
  } = useLessonUnlocks();
  const {
    lesson: lastWatchedLesson,
    positionSeconds,
    isLoading: lastWatchedLoading,
    isError: lastWatchedError,
    refetch: refetchLastWatched,
  } = useLastWatchedLesson();

  let presentation: SimpleModeWatchPresentation | undefined;

  if (!introWatched && introVideoId) {
    const firstModule = sortModulesByOrder(modules)[0];
    presentation = {
      title: t('overview.introVideoTitle'),
      context: t('bibleschool.simpleMode.introContext'),
      videoId: introVideoId,
      nextLesson: firstModule
        ? sortLessonsByOrder(firstModule)[0]
        : undefined,
      ctaLabel: t('bibleschool.simpleMode.startVideo'),
      onPress: () => router.push(routes.bibleschoolIntro()),
      icon: 'play',
    };
  } else if (nextUnlockedTarget?.type === 'lesson') {
    const { lesson, module } = nextUnlockedTarget;
    const nextLesson = sortLessonsByOrder(module).find(
      (candidate) => candidate.order === lesson.order + 1,
    );
    const canResume =
      lastWatchedLesson?.id === lesson.id && positionSeconds > 0;
    presentation = {
      title: lesson.title,
      context: t('bibleschool.simpleMode.lessonContext', {
        lesson: lesson.order,
        module: getDisplayModuleNumber(module.order),
      }),
      videoId: lesson.videoId,
      thumbnailUrl: lesson.thumbnailUrl,
      nextLesson,
      ctaLabel: canResume
        ? t('bibleschool.simpleMode.continueWatching')
        : t('bibleschool.simpleMode.startVideo'),
      onPress: () =>
        router.push(routes.bibleschoolModuleLesson(module.id, lesson.id)),
      icon: 'play',
    };
  } else if (nextUnlockedTarget?.type === 'exam') {
    const orderedLessons = sortLessonsByOrder(nextUnlockedTarget.module);
    const finalLesson = orderedLessons[orderedLessons.length - 1];
    presentation = {
      title: t('exam.takeExam'),
      context: t('bibleschool.simpleMode.examContext', {
        module: getDisplayModuleNumber(nextUnlockedTarget.module.order),
      }),
      videoId: finalLesson?.videoId,
      thumbnailUrl: finalLesson?.thumbnailUrl,
      ctaLabel: t('exam.takeExam'),
      onPress: () =>
        router.push(
          routes.bibleschoolModuleExam(nextUnlockedTarget.module.id),
        ),
      icon: 'document-text',
    };
  }

  const currentVideoId =
    presentation && !presentation.thumbnailUrl
      ? presentation.videoId
      : undefined;
  const nextVideoId =
    presentation?.nextLesson && !presentation.nextLesson.thumbnailUrl
      ? presentation.nextLesson.videoId
      : undefined;
  const { data: currentVimeoThumbnail, isLoading: currentThumbnailLoading } =
    useVimeoThumbnail(currentVideoId);
  const { data: nextVimeoThumbnail, isLoading: nextThumbnailLoading } =
    useVimeoThumbnail(nextVideoId);

  if (
    modulesLoading ||
    introContentLoading ||
    introLoading ||
    unlocksLoading ||
    lastWatchedLoading
  ) {
    return <SimpleModeWatchLoading theme={theme} t={t} />;
  }

  if (
    modulesError ||
    unlocksError ||
    lastWatchedError ||
    modules.length === 0 ||
    (!introWatched && !introVideoId)
  ) {
    return (
      <SimpleModeWatchError
        theme={theme}
        t={t}
        onRetry={() => {
          void Promise.all([
            refetchModules(),
            refetchUnlocks(),
            refetchLastWatched(),
          ]);
        }}
      />
    );
  }

  if (!presentation) {
    return <SimpleModeWatchDone theme={theme} t={t} />;
  }

  return (
    <SimpleModeWatchContent
      presentation={presentation}
      currentThumbnail={
        presentation.thumbnailUrl ?? currentVimeoThumbnail ?? undefined
      }
      currentThumbnailLoading={currentThumbnailLoading}
      nextThumbnail={
        presentation.nextLesson?.thumbnailUrl ??
        nextVimeoThumbnail ??
        undefined
      }
      nextThumbnailLoading={nextThumbnailLoading}
      theme={theme}
      t={t}
    />
  );
}
