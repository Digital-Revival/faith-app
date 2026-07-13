import { Box } from '@/components/ui/box';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { useAuth } from '@/contexts/AuthContext';
import { useBibleschoolSimpleMode } from '@/contexts/BibleschoolSimpleModeContext';
import { useLearningActivity } from '@/contexts/LearningActivityContext';
import { routes } from '@/constants/routes';
import { useModule, useModules } from '@/hooks/useBibleschoolContent';
import { useLessonDetailProgress } from '@/hooks/useLessonDetailProgress';
import { useLessonUnlocks } from '@/hooks/useLessonUnlocks';
import { useSimpleModeAutoAdvance } from '@/hooks/useSimpleModeAutoAdvance';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/hooks/useTranslation';
import { useVimeoPlaybackUrl } from '@/hooks/useVimeoPlaybackUrl';
import { bzzt, bzztWarning } from '@/utils/haptics';
import { useNavigation, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockedLessonModal } from '@/app/(main)/bibleschool/(tabs)/modules/[id]/_components/LockedLessonModal';
import { getDisplayModuleNumber } from '@/utils/bibleschoolCurriculum';
import { LessonDetailScrollContent } from './LessonDetailScrollContent';
import { LessonDetailVideoSection } from './LessonDetailVideoSection';
import { NextLessonPreloader } from './NextLessonPreloader';
import { SimpleModeLessonOrientation } from './SimpleModeLessonOrientation';

interface LessonDetailScreenProps {
  moduleId: string;
  lessonId: string;
}

export function LessonDetailScreen({ moduleId, lessonId }: LessonDetailScreenProps) {
  const navigation = useNavigation();
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { enabled: simpleMode } = useBibleschoolSimpleMode();
  const { recordLessonStarted, recordLessonEngaged } = useLearningActivity();
  const { isLessonUnlocked, isExamUnlocked, nextUnlockedTarget } = useLessonUnlocks();
  const networkQuality = useNetworkQuality();

  const { data: moduleData } = useModule(moduleId, locale);
  const { data: modules } = useModules(locale);
  const lessons = moduleData?.lessons ?? [];
  const lesson = lessons.find((l) => l.id === lessonId);
  const nextLesson = lesson
    ? lessons.find((l) => l.order === lesson.order + 1)
    : undefined;

  const {
    progress,
    progressLoading,
    handleSavePosition,
    handleMarkComplete,
  } = useLessonDetailProgress({
    moduleId,
    lessonId,
    lessonCount: lessons.length,
  });

  const {
    data: vimeoUrl,
    isLoading: vimeoLoading,
    isError: vimeoError,
    refetch: refetchVimeo,
  } = useVimeoPlaybackUrl(
    lesson?.videoId && !lesson.videoUrl ? lesson.videoId : undefined,
    networkQuality,
  );

  const { data: nextVimeoUrl } = useVimeoPlaybackUrl(
    nextLesson?.videoId && !nextLesson?.videoUrl ? nextLesson.videoId : undefined,
    networkQuality,
  );

  const [lockedModal, setLockedModal] = useState<{
    message: string;
    prerequisiteLessonNumber: number;
    targetModuleNumber: number;
    targetModuleId: string;
    targetModuleTitle: string;
    targetLessonId: string | null;
    isExam: boolean;
  } | null>(null);
  const pipRef = useRef<{
    start: () => void;
    stop: () => void;
    onPiPStop: (() => void) | null;
  } | null>(null);

  const showCompletionError = useCallback(
    () => toast.error(t('bibleschool.simpleMode.completionSaveError')),
    [t, toast],
  );

  const {
    cancel: cancelAutoAdvance,
    complete: handleMarkCompleteWithAutoAdvance,
    countdown: autoAdvanceCountdown,
  } = useSimpleModeAutoAdvance({
    enabled: simpleMode,
    moduleId,
    nextLesson,
    isLessonUnlocked,
    isExamUnlocked,
    markComplete: handleMarkComplete,
    onError: showCompletionError,
  });

  const handleMarkCompleteStandard = useCallback(() => {
    void handleMarkComplete().catch(() => {
      showCompletionError();
    });
  }, [handleMarkComplete, showCompletionError]);

  const module = moduleData;
  if (!module || !lesson) {
    return null;
  }

  const handleLessonHandout = () => {
    bzzt();
    if (lesson.lessonHandoutUrl) {
      pipRef.current?.start();
      if (pipRef.current) {
        pipRef.current.onPiPStop = () => {
          WebBrowser.dismissBrowser().catch(() => {});
        };
      }
      requestAnimationFrame(() => {
        WebBrowser.openBrowserAsync(lesson.lessonHandoutUrl!).finally(() => {
          if (pipRef.current) pipRef.current.onPiPStop = null;
          setTimeout(() => pipRef.current?.stop(), 300);
        });
      });
    }
  };

  const handleModuleHandout = () => {
    bzzt();
    const moduleHandoutUrl = module.moduleHandoutUrl ?? lesson.moduleHandoutUrl;
    if (moduleHandoutUrl) {
      pipRef.current?.start();
      if (pipRef.current) {
        pipRef.current.onPiPStop = () => {
          WebBrowser.dismissBrowser().catch(() => {});
        };
      }
      requestAnimationFrame(() => {
        WebBrowser.openBrowserAsync(moduleHandoutUrl).finally(() => {
          if (pipRef.current) pipRef.current.onPiPStop = null;
          setTimeout(() => pipRef.current?.stop(), 300);
        });
      });
    }
  };

  const handleLockedPress = () => {
    bzztWarning();
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

  const videoUrl = lesson.videoUrl ?? vimeoUrl ?? undefined;
  const videoLoading = !lesson.videoUrl && !!lesson.videoId && vimeoLoading;
  const showVimeoRetry =
    !lesson.videoUrl && !!lesson.videoId && vimeoError && !videoUrl;
  const nextVideoUrl = nextVimeoUrl ?? nextLesson?.videoUrl;

  return (
    <Box
      className="flex-1"
      style={{ backgroundColor: theme.pageBg }}
    >
      {nextVideoUrl ? <NextLessonPreloader videoUrl={nextVideoUrl} /> : null}
      <Box
        className="px-6"
        style={{
          paddingTop: insets.top + 24,
          paddingBottom: 0,
        }}
      >
        <MainTopBar
          title={lesson.title ?? ''}
          currentSection="bibleschool"
          showBackButton
          enlarged={simpleMode}
          onBack={() => {
            cancelAutoAdvance();
            navigation.goBack();
          }}
        />
      </Box>
      <Box className="px-6 rounded-2xl overflow-hidden">
        <LessonDetailVideoSection
          videoUrl={videoUrl}
          progressLoading={progressLoading}
          hasUser={!!user}
          videoLoading={videoLoading}
          showVimeoRetry={showVimeoRetry}
          theme={theme}
          t={t}
          onRefetchVimeo={() => {
            void refetchVimeo();
          }}
          onSavePosition={handleSavePosition}
          onPlaybackStarted={() => recordLessonStarted(moduleId, lessonId)}
          onPlaybackEngaged={() => recordLessonEngaged(moduleId, lessonId)}
          onMarkComplete={
            simpleMode
              ? handleMarkCompleteWithAutoAdvance
              : handleMarkCompleteStandard
          }
          pipRef={pipRef}
          initialPositionSeconds={progress?.video_position_seconds ?? 0}
        />
      </Box>
      {!simpleMode ? (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 24,
            paddingBottom: insets.bottom + 100,
          }}
        >
          <LessonDetailScrollContent
            lesson={lesson}
            module={module}
            theme={theme}
            t={t}
            moduleId={moduleId}
            nextLesson={nextLesson}
            isLessonUnlocked={isLessonUnlocked}
            isExamUnlocked={isExamUnlocked}
            onNextLessonPress={() => {
              if (!nextLesson) return;
              bzzt();
              router.replace(routes.bibleschoolModuleLesson(moduleId, nextLesson.id));
            }}
            onLockedPress={handleLockedPress}
            onLessonHandout={handleLessonHandout}
            onModuleHandout={handleModuleHandout}
          />
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 20,
            paddingBottom: insets.bottom + 112,
          }}
        >
          <SimpleModeLessonOrientation
            lesson={lesson}
            moduleOrder={getDisplayModuleNumber(module.order)}
            nextLesson={nextLesson}
            nextUnlocked={
              nextLesson
                ? isLessonUnlocked(moduleId, nextLesson)
                : isExamUnlocked(moduleId)
            }
            countdown={autoAdvanceCountdown}
            theme={theme}
            t={t}
            onNextPress={() => {
              cancelAutoAdvance();
              bzzt();
              router.replace(
                nextLesson
                  ? routes.bibleschoolModuleLesson(moduleId, nextLesson.id)
                  : routes.bibleschoolModuleExam(moduleId),
              );
            }}
            onLockedPress={handleLockedPress}
            onStay={cancelAutoAdvance}
          />
        </ScrollView>
      )}
      <LockedLessonModal
        visible={lockedModal !== null}
        message={lockedModal?.message ?? ''}
        prerequisiteLessonNumber={lockedModal?.prerequisiteLessonNumber ?? 0}
        isExam={lockedModal?.isExam ?? false}
        targetModuleNumber={lockedModal?.targetModuleNumber ?? 0}
        targetModuleId={lockedModal?.targetModuleId ?? ''}
        targetModuleTitle={lockedModal?.targetModuleTitle ?? ''}
        targetLessonId={lockedModal?.targetLessonId ?? null}
        onClose={() => setLockedModal(null)}
        onGoToPrerequisite={() => {
          if (!lockedModal) return;
          bzzt();
          setLockedModal(null);
          if (lockedModal.isExam) {
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

const __expoRouterPrivateRoute_LessonDetailScreen = () => null;

export default __expoRouterPrivateRoute_LessonDetailScreen;
