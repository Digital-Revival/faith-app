import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import type { ThemeColors } from '@/hooks/useTheme';
import type { BibleschoolLesson } from '@/types/bibleschool';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

export interface SimpleModeWatchPresentation {
  title: string;
  context: string;
  videoId?: string;
  thumbnailUrl?: string;
  nextLesson?: BibleschoolLesson;
  ctaLabel: string;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
}

interface SimpleModeWatchContentProps {
  presentation: SimpleModeWatchPresentation;
  currentThumbnail?: string;
  currentThumbnailLoading: boolean;
  nextThumbnail?: string;
  nextThumbnailLoading: boolean;
  theme: ThemeColors;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function SimpleModeWatchContent({
  presentation,
  currentThumbnail,
  currentThumbnailLoading,
  nextThumbnail,
  nextThumbnailLoading,
  theme,
  t,
}: SimpleModeWatchContentProps) {
  return (
    <View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={presentation.ctaLabel}
        onPress={() => {
          bzzt();
          presentation.onPress();
        }}
        activeOpacity={0.8}
        className="w-full rounded-2xl overflow-hidden items-center justify-center"
        style={{
          aspectRatio: 16 / 9,
          backgroundColor: theme.avatarPrimary,
          borderWidth: 1,
          borderColor: theme.cardBorder,
        }}
      >
        {currentThumbnail ? (
          <Image
            source={{ uri: currentThumbnail }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : currentThumbnailLoading ? (
          <ActivityIndicator size="large" color={theme.textTertiary} />
        ) : (
          <Ionicons
            name={presentation.icon}
            size={56}
            color={theme.textSecondary}
          />
        )}
        <Box
          className="absolute inset-0 items-center justify-center"
          pointerEvents="none"
        >
          <Box
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: theme.buttonPrimary }}
          >
            <Ionicons
              name={presentation.icon}
              size={30}
              color={theme.buttonPrimaryContrast}
            />
          </Box>
        </Box>
      </TouchableOpacity>

      <Text
        className="mt-5 text-2xl font-bold"
        style={{ color: theme.textPrimary, lineHeight: 32 }}
        numberOfLines={2}
      >
        {presentation.title}
      </Text>
      <Text
        className="mt-1 text-lg font-medium"
        style={{ color: theme.textSecondary, lineHeight: 26 }}
      >
        {presentation.context}
      </Text>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={presentation.ctaLabel}
        onPress={() => {
          bzzt();
          presentation.onPress();
        }}
        activeOpacity={0.7}
        className="mt-5 min-h-16 rounded-2xl px-6 flex-row items-center justify-center gap-3"
        style={{ backgroundColor: theme.buttonPrimary }}
      >
        <Ionicons
          name={presentation.icon}
          size={28}
          color={theme.buttonPrimaryContrast}
        />
        <Text
          className="text-xl font-semibold"
          style={{ color: theme.buttonPrimaryContrast }}
        >
          {presentation.ctaLabel}
        </Text>
      </TouchableOpacity>

      {presentation.nextLesson ? (
        <Box className="mt-8">
          <Text
            className="text-xl font-semibold mb-3"
            style={{ color: theme.textPrimary }}
          >
            {t('bibleschool.simpleMode.nextLessonLabel')}
          </Text>
          <Box
            className="min-h-24 rounded-2xl p-3 flex-row items-center"
            style={{
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <Box
              className="w-28 rounded-xl overflow-hidden items-center justify-center"
              style={{
                aspectRatio: 16 / 9,
                backgroundColor: theme.avatarPrimary,
              }}
            >
              {nextThumbnail ? (
                <Image
                  source={{ uri: nextThumbnail }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : nextThumbnailLoading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.textTertiary}
                />
              ) : (
                <Ionicons
                  name="play"
                  size={24}
                  color={theme.textSecondary}
                />
              )}
            </Box>
            <Box className="flex-1 ml-4">
              <Text
                className="text-base font-medium"
                style={{ color: theme.textSecondary }}
              >
                {t('lessons.lessonNumber', {
                  number: presentation.nextLesson.order,
                })}
              </Text>
              <Text
                className="text-lg font-semibold"
                style={{ color: theme.textPrimary }}
                numberOfLines={2}
              >
                {presentation.nextLesson.title}
              </Text>
            </Box>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={theme.textSecondary}
            />
          </Box>
        </Box>
      ) : null}
    </View>
  );
}
