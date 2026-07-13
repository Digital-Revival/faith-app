import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import type { BibleschoolModule } from '@/types/bibleschool';
import type { ModuleProgress } from '@/types/progress';
import { getDisplayModuleNumber } from '@/utils/bibleschoolCurriculum';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { TouchableOpacity } from 'react-native';

interface SimpleModeModuleRowProps {
  module: BibleschoolModule;
  progress: ModuleProgress | null | undefined;
  isCurrent: boolean;
  onPress: () => void;
}

export function SimpleModeModuleRow({
  module,
  progress,
  isCurrent,
  onPress,
}: SimpleModeModuleRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isCompleted = progress?.status === 'completed';
  const isInProgress = isCurrent || progress?.status === 'in_progress';
  const isLocked = !isInProgress && !isCompleted;
  const statusLabel = isCompleted
    ? t('modules.status.passed')
    : isInProgress
      ? t('modules.currentModule')
      : t('modules.status.locked');
  const actionHint = isLocked
    ? t('bibleschool.simpleMode.lockedHint')
    : t('bibleschool.simpleMode.tapToOpen');

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${module.title}. ${statusLabel}. ${actionHint}`}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={false}
    >
      <Box
        className="min-h-28 rounded-2xl p-3 flex-row items-center"
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
        <Box
          className="w-32 rounded-xl overflow-hidden items-center justify-center"
          style={{
            aspectRatio: 16 / 9,
            backgroundColor: theme.avatarPrimary,
          }}
        >
          {module.backgroundImageUrl ? (
            <Image
              source={{ uri: module.backgroundImageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Ionicons
              name="book-outline"
              size={28}
              color={theme.textSecondary}
            />
          )}
          {isLocked ? (
            <Box
              className="absolute inset-0 items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            >
              <Ionicons name="lock-closed" size={24} color="#fff" />
            </Box>
          ) : null}
        </Box>
        <Box className="flex-1 ml-4">
          <Text
            className="text-base font-medium"
            style={{ color: theme.textSecondary }}
          >
            {t('modules.moduleLabel', {
              number: getDisplayModuleNumber(module.order),
            })}
          </Text>
          <Text
            className="text-xl font-semibold"
            style={{ color: theme.textPrimary, lineHeight: 28 }}
            numberOfLines={2}
          >
            {module.title}
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
          <Text
            className="mt-1 text-sm"
            style={{ color: theme.textTertiary }}
          >
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
              {t('modules.status.locked')}
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
