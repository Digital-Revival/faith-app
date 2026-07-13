import { LockOverlay } from '@/components/common/LockOverlay';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VideoThumbnail } from '@/components/ui/VideoThumbnail';
import type { ThemeColors } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

interface SimpleLessonRowProps {
  lessonNumber: string;
  title: string;
  statusLabel: string;
  actionHint: string;
  thumbnailUrl?: string;
  thumbnailLoading: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent: boolean;
  theme: ThemeColors;
  lockedLabel: string;
  onPress: () => void;
}

export function SimpleLessonRow({
  lessonNumber,
  title,
  statusLabel,
  actionHint,
  thumbnailUrl,
  thumbnailLoading,
  isCompleted,
  isLocked,
  isCurrent,
  theme,
  lockedLabel,
  onPress,
}: SimpleLessonRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${statusLabel}`}
    >
      <Box
        className="min-h-24 rounded-2xl p-3 flex-row items-center"
        style={{
          backgroundColor: theme.cardBg,
          borderWidth: isCurrent ? 2 : 1,
          borderColor: isCurrent
            ? theme.buttonPrimary
            : isLocked
              ? theme.cardBorder
              : theme.textSecondary,
          opacity: isLocked ? 0.78 : 1,
        }}
      >
        <Box className="rounded-xl overflow-hidden">
          <VideoThumbnail
            thumbnailUrl={thumbnailUrl}
            isLoading={thumbnailLoading}
            width={120}
            height={68}
            showPlayIcon={!isLocked}
          />
          <LockOverlay isLocked={isLocked} variant="thumbnail" />
        </Box>
        <Box className="flex-1 ml-4">
          <Text
            className="text-base font-medium"
            style={{ color: theme.textSecondary }}
          >
            {lessonNumber}
          </Text>
          <Text
            className="text-lg font-semibold"
            style={{ color: theme.textPrimary, lineHeight: 26 }}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Box className="mt-1 flex-row items-center gap-2">
            <Ionicons
              name={
                isCompleted
                  ? 'checkmark-circle'
                  : isLocked
                    ? 'lock-closed'
                    : 'play-circle'
              }
              size={20}
              color={
                isCompleted
                  ? theme.quizCorrect
                  : isCurrent
                    ? theme.buttonPrimary
                    : theme.textSecondary
              }
            />
            <Text
              className="text-base font-medium"
              style={{
                color: isCurrent ? theme.buttonPrimary : theme.textSecondary,
              }}
            >
              {statusLabel}
            </Text>
          </Box>
          <Text className="mt-1 text-sm" style={{ color: theme.textTertiary }}>
            {actionHint}
          </Text>
        </Box>
        {isLocked ? (
          <Box
            className="flex-row items-center gap-1.5 rounded-lg px-2.5 py-2"
            style={{ backgroundColor: theme.cardBorder }}
          >
            <Ionicons name="lock-closed" size={16} color={theme.textSecondary} />
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.textSecondary }}
            >
              {lockedLabel}
            </Text>
          </Box>
        ) : (
          <Ionicons
            name="chevron-forward"
            size={24}
            color={isCurrent ? theme.buttonPrimary : theme.textSecondary}
          />
        )}
      </Box>
    </TouchableOpacity>
  );
}

const __expoRouterPrivateRoute_SimpleLessonRow = () => null;

export default __expoRouterPrivateRoute_SimpleLessonRow;
