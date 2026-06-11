import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useIntroductionVimeoId, useModule, useModules } from '@/hooks/useBibleschoolContent';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { useVimeoPlaybackUrl } from '@/hooks/useVimeoPlaybackUrl';
import { useVimeoThumbnail } from '@/hooks/useVimeoThumbnail';
import { useIntroVideoPosition } from '@/hooks/useIntroVideoPosition';
import { useIntroVideoWatched } from '@/hooks/useIntroVideoWatched';
import { routes } from '@/constants/routes';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { useNavigation, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from "expo-router/react-navigation";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { bzzt, bzztWarning } from '@/utils/haptics';
import { getFirstModuleId, sortLessonsByOrder } from '@/utils/bibleschoolCurriculum';
import { LockedLessonModal } from '@/app/(main)/bibleschool/(tabs)/modules/[id]/_components/LockedLessonModal';
import { LockOverlay } from '@/components/common/LockOverlay';

const MIN_PROGRESS_TO_COUNT_VIEW = 0.5;
const NEXT_THUMBNAIL_WIDTH = 120;
const NEXT_THUMBNAIL_HEIGHT = 68;

function IntroVideoPlayer({
  videoUrl,
  initialPositionSeconds,
  onMarkWatched,
  onSavePosition,
  progressRef,
  getCurrentPositionRef,
  savedByHandleBackRef,
}: {
  videoUrl: string;
  initialPositionSeconds: number;
  onMarkWatched: () => void;
  onSavePosition: (seconds: number, immediate?: boolean) => void;
  progressRef?: React.MutableRefObject<{ currentTime: number; duration: number }>;
  getCurrentPositionRef?: React.MutableRefObject<() => number>;
  savedByHandleBackRef?: React.MutableRefObject<boolean>;
}) {
  const hasMarkedWatchedRef = useRef(false);
  const lastPositionRef = useRef(initialPositionSeconds);
  const onSavePositionRef = useRef(onSavePosition);
  const hasAppliedInitialSeekRef = useRef(false);
  onSavePositionRef.current = onSavePosition;

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 1;
    if (initialPositionSeconds > 0) {
      p.currentTime = initialPositionSeconds;
    }
    p.play();
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const duration = player.duration;
    lastPositionRef.current = currentTime;
    if (progressRef && duration > 0) {
      progressRef.current = { currentTime, duration };
    }
    if (onMarkWatched && !hasMarkedWatchedRef.current && duration > 0 && currentTime / duration >= 0.9) {
      hasMarkedWatchedRef.current = true;
      onMarkWatched();
    }
  });

  useEventListener(player, 'playToEnd', () => {
    if (onMarkWatched && !hasMarkedWatchedRef.current) {
      hasMarkedWatchedRef.current = true;
      onMarkWatched();
    }
  });

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    lastPositionRef.current = player.currentTime;
    if (isPlaying) {
      const pos = Math.max(player.currentTime, lastPositionRef.current, initialPositionSeconds);
      onSavePositionRef.current(pos, false);
    }
  });

  useEventListener(player, 'statusChange', ({ status: s }) => {
    if (
      s === 'readyToPlay' &&
      initialPositionSeconds > 0 &&
      !hasAppliedInitialSeekRef.current
    ) {
      hasAppliedInitialSeekRef.current = true;
      player.currentTime = initialPositionSeconds;
    }
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const isLoading = status === 'loading' || status === 'idle';
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (getCurrentPositionRef) {
      getCurrentPositionRef.current = () =>
        Math.max(player.currentTime, lastPositionRef.current);
    }
    return () => {
      if (getCurrentPositionRef) {
        getCurrentPositionRef.current = () => 0;
      }
    };
  }, [player, getCurrentPositionRef]);

  useEffect(() => {
    if (initialPositionSeconds > 0 && !hasAppliedInitialSeekRef.current) {
      hasAppliedInitialSeekRef.current = true;
      player.currentTime = initialPositionSeconds;
    }
  }, [initialPositionSeconds, player]);

  useEffect(() => {
    if (isLoading) {
      const t = setTimeout(() => setShowLoader(true), 400);
      return () => clearTimeout(t);
    }
    setShowLoader(false);
  }, [isLoading]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (savedByHandleBackRef?.current) return;
        try {
          player.pause();
        } catch (_) {}
        const livePos = Math.max(lastPositionRef.current, initialPositionSeconds);
        onSavePositionRef.current(livePos, true);
      };
    }, [player, initialPositionSeconds, savedByHandleBackRef])
  );

  return (
    <View
      style={{
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <VideoView
        style={{ width: '100%', height: '100%' }}
        player={player}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
        contentFit="contain"
      />
      {isLoading && showLoader && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(200)}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              alignItems: 'center',
              justifyContent: 'center',
            } as const,
          ]}
        >
          <ActivityIndicator size="small" color="#e5e5e5" />
        </Animated.View>
      )}
    </View>
  );
}

function NextLessonCard({
  lesson,
  theme,
  t,
  isLocked,
  onPress,
  onLockedPress,
}: {
  lesson: { id: string; order: number; title?: string; titleKey?: string; thumbnailUrl?: string; videoId?: string };
  theme: ReturnType<typeof useTheme>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLocked: boolean;
  onPress: () => void;
  onLockedPress: () => void;
}) {
  const { data: vimeoThumbnail, isLoading } = useVimeoThumbnail(
    !lesson.thumbnailUrl && lesson.videoId ? lesson.videoId : undefined
  );
  const thumbnailUrl = lesson.thumbnailUrl ?? vimeoThumbnail ?? undefined;

  const handlePress = () => {
    if (isLocked) {
      onLockedPress();
    } else {
      onPress();
    }
  };

  const titleStr =
    lesson.title ?? (lesson.titleKey ? t(lesson.titleKey as never) : '');

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="cursor-pointer"
      style={isLocked ? { opacity: 0.6 } : undefined}
    >
      <Box
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: theme.cardBg,
          borderWidth: 1,
          borderColor: theme.cardBorder,
        }}
      >
        <Box className="flex-row items-center py-3 pr-4">
          <Box className="pl-3 mr-4">
            <Box
              style={{
                width: NEXT_THUMBNAIL_WIDTH,
                height: NEXT_THUMBNAIL_HEIGHT,
                position: 'relative',
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: theme.avatarPrimary,
              }}
            >
              {thumbnailUrl ? (
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={{ width: NEXT_THUMBNAIL_WIDTH, height: NEXT_THUMBNAIL_HEIGHT }}
                  contentFit="cover"
                />
              ) : isLoading ? (
                <ActivityIndicator size="small" color={theme.textTertiary} />
              ) : null}
              <Box
                className="absolute inset-0 items-center justify-center"
                pointerEvents="none"
              >
                <Box className="rounded-full p-2">
                  <Ionicons name="play" size={18} color="#ffffff" />
                </Box>
              </Box>
              <LockOverlay isLocked={isLocked} variant="thumbnail" />
            </Box>
          </Box>
          <Box className="flex-1 justify-center min-w-0">
            <Text
              className="text-xs font-medium mb-0.5"
              style={{ color: theme.textSecondary }}
            >
              {t('lessons.nextLesson', { number: lesson.order })}
            </Text>
            <Text
              className="text-base font-medium"
              style={{ color: theme.textPrimary }}
              numberOfLines={2}
            >
              {titleStr}
            </Text>
          </Box>
          {isLocked ? (
            <Box
              className="flex-row items-center gap-1.5 mr-2 rounded-lg px-2.5 py-1.5"
              style={{ backgroundColor: theme.cardBorder }}
            >
              <Ionicons name="lock-closed" size={14} color={theme.textSecondary} />
              <Text
                className="text-xs font-semibold"
                style={{ color: theme.textSecondary }}
              >
                {t('lessons.locked')}
              </Text>
            </Box>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          )}
        </Box>
      </Box>
    </TouchableOpacity>
  );
}

export default function IntroScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const progressRef = useRef({ currentTime: 0, duration: 1 });
  const getCurrentPositionRef = useRef<() => number>(() => 0);
  const savedByHandleBackRef = useRef(false);
  const lastSaveTimeRef = useRef(0);
  const lastSavePositionRef = useRef<number | null>(null);
  const { data: introductionVimeoId, isLoading: idLoading } =
    useIntroductionVimeoId(locale);
  const networkQuality = useNetworkQuality();
  const { data: videoUrl, isLoading: urlLoading } =
    useVimeoPlaybackUrl(introductionVimeoId, networkQuality);
  const { hasWatched, markWatched } = useIntroVideoWatched();
  const {
    positionSeconds: savedPosition,
    savePosition,
    isLoading: positionLoading,
  } = useIntroVideoPosition();
  const { data: modules = [] } = useModules(locale);
  const firstModuleId = useMemo(() => getFirstModuleId(modules), [modules]);
  const { data: moduleData } = useModule(firstModuleId, locale);
  const firstLesson = useMemo(() => {
    if (!moduleData?.lessons?.length) return undefined;
    return sortLessonsByOrder(moduleData)[0];
  }, [moduleData]);
  const [showLockedModal, setShowLockedModal] = useState(false);

  const handleSavePosition = useCallback(
    (seconds: number, immediate = false): void | Promise<void> => {
      const position = Math.floor(seconds);
      const now = Date.now();
      if (immediate) {
        lastSaveTimeRef.current = now;
        lastSavePositionRef.current = position;
        return savePosition(position);
      }
      const elapsed = now - lastSaveTimeRef.current;
      const positionDelta =
        lastSavePositionRef.current !== null
          ? Math.abs(position - lastSavePositionRef.current)
          : 999;
      if (elapsed >= 5000 || positionDelta >= 10) {
        savePosition(position);
        lastSaveTimeRef.current = now;
        lastSavePositionRef.current = position;
      }
    },
    [savePosition]
  );

  const handleBack = useCallback(async () => {
    const currentTime = Math.max(getCurrentPositionRef.current(), savedPosition);
    const { duration } = progressRef.current;
    await handleSavePosition(currentTime, true);
    if (duration > 0 && currentTime / duration >= MIN_PROGRESS_TO_COUNT_VIEW) {
      await markWatched();
    }
    savedByHandleBackRef.current = true;
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace(routes.bibleschool());
    }
  }, [markWatched, navigation, handleSavePosition, savedPosition]);

  const handleMarkWatched = useCallback(async () => {
    await markWatched();
  }, [markWatched]);

  const videoLoading =
    (!videoUrl && (idLoading || urlLoading)) || positionLoading;

  const handleNextLessonPress = useCallback(() => {
    bzzt();
    if (!firstModuleId || !firstLesson) return;
    router.replace(routes.bibleschoolModuleLesson(firstModuleId, firstLesson.id));
  }, [firstLesson, firstModuleId]);

  const handleNextLessonLockedPress = useCallback(() => {
    bzztWarning();
    setShowLockedModal(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      savedByHandleBackRef.current = false;
      return () => {
        const currentTime = getCurrentPositionRef.current();
        const { duration } = progressRef.current;
        if (duration > 0 && currentTime / duration >= MIN_PROGRESS_TO_COUNT_VIEW) {
          markWatched();
        }
      };
    }, [markWatched])
  );

  return (
    <Box className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <Box
        className="px-6"
        style={{
          paddingTop: insets.top + 24,
          paddingBottom: 0,
        }}
      >
        <MainTopBar
          title={t('overview.introVideoTitle')}
          currentSection="bibleschool"
          showBackButton
          onBack={handleBack}
        />
      </Box>
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <Box className="rounded-2xl overflow-hidden">
          {videoLoading ? (
            <Box
              className="w-full items-center justify-center rounded-2xl"
              style={{
                aspectRatio: 16 / 9,
                backgroundColor: theme.avatarPrimary,
              }}
            >
              <ActivityIndicator size="large" color={theme.textTertiary} />
            </Box>
          ) : videoUrl ? (
            <IntroVideoPlayer
              videoUrl={videoUrl}
              initialPositionSeconds={savedPosition}
              onMarkWatched={handleMarkWatched}
              onSavePosition={handleSavePosition}
              progressRef={progressRef}
              getCurrentPositionRef={getCurrentPositionRef}
              savedByHandleBackRef={savedByHandleBackRef}
            />
          ) : null}
        </Box>

        <Box
          className="rounded-2xl overflow-hidden p-5 mt-6 mb-8"
          style={{
            backgroundColor: theme.cardBg,
            borderWidth: 1,
            borderColor: theme.cardBorder,
          }}
        >
          <Text
            className="text-sm font-medium uppercase tracking-wider mb-1"
            style={{ color: theme.textSecondary }}
          >
            {t('overview.introVideoTitle')}
          </Text>
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: theme.textPrimary }}
          >
            {t('overview.introVideoSubtitle')}
          </Text>
          <Text
            className="text-base"
            style={{ color: theme.textPrimary }}
          >
            {t('overview.introVideoContent')}
          </Text>
        </Box>

        {firstLesson ? (
          <>
            <Text
              className="text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: theme.textSecondary }}
            >
              {t('lessons.nextLesson', { number: firstLesson.order })}
            </Text>
            <NextLessonCard
              lesson={firstLesson}
              theme={theme}
              t={t}
              isLocked={!hasWatched}
              onPress={handleNextLessonPress}
              onLockedPress={handleNextLessonLockedPress}
            />
          </>
        ) : null}
      </ScrollView>

      <LockedLessonModal
        visible={showLockedModal}
        message=""
        prerequisiteLessonNumber={1}
        targetModuleNumber={1}
        isExam={false}
        isOnIntroPage
        targetModuleId={firstModuleId ?? ''}
        targetModuleTitle=""
        targetLessonId={firstLesson?.id ?? null}
        onClose={() => setShowLockedModal(false)}
        onGoToPrerequisite={() => setShowLockedModal(false)}
      />
    </Box>
  );
}
