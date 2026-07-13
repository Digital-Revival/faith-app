import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { LockOverlay } from '@/components/common/LockOverlay';
import type { ThemeColors } from '@/hooks/useTheme';
import { useVimeoThumbnail } from '@/hooks/useVimeoThumbnail';
import type { LessonLike } from '@/types/bibleschool';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring } from 'react-native-reanimated';
import {
  NEXT_THUMBNAIL_HEIGHT,
  NEXT_THUMBNAIL_WIDTH,
  NextLessonThumbnail,
} from './NextLessonThumbnail';

export function NextLessonCard({
  nextLesson,
  theme,
  t,
  isLocked,
  onPress,
  onLockedPress,
  variant = 'standard',
}: {
  nextLesson: LessonLike;
  theme: ThemeColors;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLocked: boolean;
  onPress: () => void;
  onLockedPress?: () => void;
  variant?: 'standard' | 'simple';
}) {
  const simpleMode = variant === 'simple';
  const videoIdForThumb = !nextLesson.thumbnailUrl && nextLesson.videoId ? nextLesson.videoId : undefined;
  const { data: vimeoThumbnail, isLoading } = useVimeoThumbnail(videoIdForThumb);
  const thumbnailUrl = nextLesson.thumbnailUrl ?? vimeoThumbnail ?? undefined;
  const thumbnailLoading = !!videoIdForThumb && isLoading && !thumbnailUrl;

  const cardOpacity = useSharedValue(isLocked ? 0.6 : 1);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    if (!isLocked) {
      cardOpacity.value = withSpring(1, { damping: 18, stiffness: 100 });
      cardScale.value = simpleMode
        ? 1
        : withDelay(
            2400,
            withSequence(
              withSpring(1.03, { damping: 15, stiffness: 120 }),
              withSpring(1, { damping: 15, stiffness: 120 }),
            ),
          );
    } else {
      cardOpacity.value = 0.6;
      cardScale.value = 1;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, simpleMode]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const handlePress = () => {
    if (isLocked) {
      onLockedPress?.();
    } else {
      onPress();
    }
  };

  const lessonNumberStr = t('lessons.lessonNumber', { number: nextLesson.order });
  const titleStr = nextLesson.title ?? (nextLesson.titleKey ? t(nextLesson.titleKey as never) : '');
  const showNumberSeparately = !titleStr.trim().toLowerCase().startsWith(lessonNumberStr.trim().toLowerCase());
  const accessibilityLabel = t('bibleschool.simpleMode.nextLesson', {
    number: nextLesson.order,
  });

  if (simpleMode) {
    return (
      <Animated.View style={cardAnimatedStyle}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={{
            minHeight: 88,
            borderRadius: 16,
            backgroundColor: theme.cardBg,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            opacity: isLocked ? 0.6 : 1,
          }}
        >
          <Box
            className="rounded-xl overflow-hidden"
            style={{
              width: NEXT_THUMBNAIL_WIDTH,
              height: NEXT_THUMBNAIL_HEIGHT,
            }}
          >
            <NextLessonThumbnail
              thumbnailUrl={thumbnailUrl}
              theme={theme}
              isLoading={thumbnailLoading}
            />
            <LockOverlay isLocked={isLocked} variant="thumbnail" />
          </Box>
          <Box className="flex-1 ml-4">
            <Text
              className="text-base font-medium"
              style={{ color: theme.textSecondary }}
            >
              {lessonNumberStr}
            </Text>
            <Text
              className="text-lg font-semibold"
              style={{ color: theme.textPrimary }}
              numberOfLines={2}
            >
              {titleStr}
            </Text>
          </Box>
          <Ionicons
            name={isLocked ? 'lock-closed' : 'chevron-forward'}
            size={24}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        className="cursor-pointer"
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
              }}
            >
              <NextLessonThumbnail
                thumbnailUrl={thumbnailUrl}
                theme={theme}
                isLoading={thumbnailLoading}
              />
              <LockOverlay isLocked={isLocked} variant="thumbnail" />
            </Box>
          </Box>
          <Box className="flex-1 justify-center min-w-0">
            {showNumberSeparately && (
              <Text
                className="text-xs font-medium mb-0.5"
                style={{ color: theme.textSecondary }}
              >
                {t('lessons.nextLesson', { number: nextLesson.order })}
              </Text>
            )}
            <Text
              className="text-base font-medium"
              style={{ color: theme.textPrimary }}
              numberOfLines={2}
            >
              {titleStr}
            </Text>
          </Box>
          {isLocked ? (
            <Animated.View exiting={FadeOut.duration(250)}>
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
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(300).delay(100)}>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </Animated.View>
          )}
        </Box>
      </Box>
    </TouchableOpacity>
    </Animated.View>
  );
}

const __expoRouterPrivateRoute_NextLessonCard = () => null;

export default __expoRouterPrivateRoute_NextLessonCard;
