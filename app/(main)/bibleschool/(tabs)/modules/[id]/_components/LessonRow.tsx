import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VideoThumbnail } from '@/components/ui/VideoThumbnail';
import { LockOverlay } from '@/components/common/LockOverlay';
import { useTheme } from '@/hooks/useTheme';
import { queryKeys } from '@/services/queryKeys';
import {
  pickThumbnailUrlFromPictures,
  vimeoService,
} from '@/services/vimeo/vimeoService';
import type { LessonLike } from '@/types/bibleschool';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SimpleLessonRow } from './SimpleLessonRow';

const rowStyles = StyleSheet.create({
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  durationText: {
    fontSize: 12,
    lineHeight: 16,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export function LessonRow({
  lesson,
  theme,
  t,
  isCompleted,
  isLocked,
  isCurrent = false,
  videoPositionSeconds,
  onPress,
  onLockedPress,
  variant,
}: {
  lesson: LessonLike;
  theme: ReturnType<typeof useTheme>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent?: boolean;
  videoPositionSeconds?: number;
  onPress: () => void;
  onLockedPress?: (lesson: LessonLike) => void;
  variant: 'standard' | 'simple';
}) {
  const simpleMode = variant === 'simple';
  const videoIdForThumb = !lesson.thumbnailUrl && lesson.videoId ? lesson.videoId : undefined;
  const vimeoMetaEnabled = !!lesson.videoId && (!lesson.thumbnailUrl || !isLocked);

  const { data: metaRaw, isLoading: metaLoading } = useQuery({
    queryKey: queryKeys.vimeo.meta(lesson.videoId ?? ''),
    queryFn: () => vimeoService.getVimeoVideoMetaRaw(lesson.videoId!),
    enabled: vimeoMetaEnabled,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });

  const vimeoThumbnail = metaRaw
    ? pickThumbnailUrlFromPictures(metaRaw.pictures)
    : null;
  const thumbnailUrl = lesson.thumbnailUrl ?? vimeoThumbnail ?? undefined;
  const thumbnailLoading = !!videoIdForThumb && metaLoading && !thumbnailUrl;

  const durationSeconds =
    !isLocked && metaRaw ? metaRaw.durationSeconds ?? undefined : undefined;

  const totalMinutes = durationSeconds ? Math.max(1, Math.round(durationSeconds / 60)) : null;
  const hasProgress =
    !isCompleted &&
    videoPositionSeconds !== undefined &&
    videoPositionSeconds > 0 &&
    durationSeconds != null &&
    durationSeconds > 0;
  const progressFraction = hasProgress
    ? Math.min((videoPositionSeconds ?? 0) / (durationSeconds ?? 1), 1)
    : 0;
  const remainingMinutes = hasProgress
    ? Math.max(1, Math.round(((durationSeconds ?? 0) - (videoPositionSeconds ?? 0)) / 60))
    : 0;

  const handlePress = () => {
    if (isLocked) {
      onLockedPress?.(lesson);
    } else {
      onPress();
    }
  };

  const lessonNumberStr = t('lessons.lessonNumber', { number: lesson.order });
  const titleStr = lesson.title ?? (lesson.titleKey ? t(lesson.titleKey as never) : '');
  const showNumberSeparately = !titleStr.trim().toLowerCase().startsWith(lessonNumberStr.trim().toLowerCase());

  if (simpleMode) {
    const statusLabel = isCompleted
      ? t('lessons.completed')
      : isLocked
        ? t('lessons.locked')
        : isCurrent
          ? t('lessonsPage.currentLesson')
          : t('bibleschool.simpleMode.tapToWatch');
    const actionHint = isLocked
      ? t('bibleschool.simpleMode.lockedHint')
      : t('bibleschool.simpleMode.tapToWatch');

    return (
      <SimpleLessonRow
        lessonNumber={lessonNumberStr}
        title={titleStr}
        statusLabel={statusLabel}
        actionHint={actionHint}
        thumbnailUrl={thumbnailUrl}
        thumbnailLoading={thumbnailLoading}
        isCompleted={isCompleted}
        isLocked={isLocked}
        isCurrent={isCurrent}
        theme={theme}
        lockedLabel={t('lessons.locked')}
        onPress={handlePress}
      />
    );
  }

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
                position: 'relative',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <VideoThumbnail
                thumbnailUrl={thumbnailUrl}
                isLoading={thumbnailLoading}
              />
              <LockOverlay isLocked={isLocked} variant="thumbnail" />
            </Box>
          </Box>
          <Box className="flex-1 min-w-0">
            {showNumberSeparately && (
              <Text
                className="text-xs font-medium mb-0.5"
                style={{ color: theme.textSecondary }}
              >
                {lessonNumberStr}
              </Text>
            )}
            <Text
              className="text-base font-medium"
              style={{ color: theme.textPrimary }}
              numberOfLines={2}
            >
              {titleStr}
            </Text>
            {totalMinutes !== null && !isLocked && (
              <View style={rowStyles.durationRow}>
                <View style={[rowStyles.dot, { backgroundColor: theme.quizCorrect }]} />
                <Text style={[rowStyles.durationText, { color: theme.textSecondary }]}>
                  {totalMinutes} min.
                </Text>
                {hasProgress && (
                  <Text style={[rowStyles.durationText, { color: theme.textSecondary }]}>
                    {'  ·  '}{t('lessonsPage.remaining', { count: remainingMinutes })}
                  </Text>
                )}
              </View>
            )}
            {hasProgress && progressFraction > 0 && (
              <View style={[rowStyles.progressTrack, { backgroundColor: theme.cardBorder }]}>
                <View
                  style={[
                    rowStyles.progressFill,
                    {
                      width: `${Math.round(progressFraction * 100)}%` as `${number}%`,
                      backgroundColor: theme.quizCorrect,
                    },
                  ]}
                />
              </View>
            )}
          </Box>
          <Box className="flex-col items-center gap-1 ml-2">
            {isLocked ? (
              <Box
                className="flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5"
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
              <Box className="flex-row items-center gap-1">
                {isCompleted && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.quizCorrect} />
                )}
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </TouchableOpacity>
  );
}

const __expoRouterPrivateRoute_LessonRow = () => null;

export default __expoRouterPrivateRoute_LessonRow;
