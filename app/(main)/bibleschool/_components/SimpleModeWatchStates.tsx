import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { routes } from '@/constants/routes';
import type { ThemeColors } from '@/hooks/useTheme';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, TouchableOpacity } from 'react-native';

interface StateProps {
  theme: ThemeColors;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function SimpleModeWatchLoading({ theme, t }: StateProps) {
  return (
    <Box
      className="flex-1 items-center justify-center"
      style={{ minHeight: 420 }}
    >
      <ActivityIndicator size="large" color={theme.textSecondary} />
      <Text
        className="mt-4 text-lg font-medium"
        style={{ color: theme.textSecondary }}
      >
        {t('bibleschool.simpleMode.loadingWatch')}
      </Text>
    </Box>
  );
}

export function SimpleModeWatchError({
  theme,
  t,
  onRetry,
}: StateProps & { onRetry: () => void }) {
  return (
    <Box
      className="flex-1 items-center justify-center px-4"
      style={{ minHeight: 420 }}
    >
      <Ionicons
        name="cloud-offline-outline"
        size={40}
        color={theme.textSecondary}
      />
      <Text
        className="mt-4 text-xl font-semibold text-center"
        style={{ color: theme.textPrimary }}
      >
        {t('bibleschool.simpleMode.loadError')}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('bibleschool.simpleMode.retry')}
        onPress={() => {
          bzzt();
          onRetry();
        }}
        activeOpacity={0.7}
        className="mt-6 min-h-14 rounded-2xl px-8 items-center justify-center"
        style={{ backgroundColor: theme.buttonPrimary }}
      >
        <Text
          className="text-lg font-semibold"
          style={{ color: theme.buttonPrimaryContrast }}
        >
          {t('bibleschool.simpleMode.retry')}
        </Text>
      </TouchableOpacity>
    </Box>
  );
}

export function SimpleModeWatchDone({ theme, t }: StateProps) {
  return (
    <Box
      className="flex-1 items-center justify-center px-4"
      style={{ minHeight: 420 }}
    >
      <Ionicons
        name="checkmark-circle"
        size={56}
        color={theme.quizCorrect}
      />
      <Text
        className="mt-4 text-2xl font-bold text-center"
        style={{ color: theme.textPrimary }}
      >
        {t('bibleschool.simpleMode.allDoneTitle')}
      </Text>
      <Text
        className="mt-2 text-lg text-center"
        style={{ color: theme.textSecondary }}
      >
        {t('bibleschool.simpleMode.allDoneContext')}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('bibleschool.simpleMode.viewLessons')}
        onPress={() => {
          bzzt();
          router.push(routes.bibleschoolModules());
        }}
        activeOpacity={0.7}
        className="mt-6 min-h-14 rounded-2xl px-8 items-center justify-center"
        style={{ backgroundColor: theme.buttonPrimary }}
      >
        <Text
          className="text-lg font-semibold"
          style={{ color: theme.buttonPrimaryContrast }}
        >
          {t('bibleschool.simpleMode.viewLessons')}
        </Text>
      </TouchableOpacity>
    </Box>
  );
}
