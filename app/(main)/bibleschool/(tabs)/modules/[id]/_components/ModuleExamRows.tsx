import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import type { ExamStatusForModule } from '@/hooks/useLessonUnlocks';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { routes } from '@/constants/routes';
import { TouchableOpacity } from 'react-native';

interface ModuleExamInteractiveRowProps {
  moduleId: string;
  examStatus: ExamStatusForModule;
}

export function ModuleExamInteractiveRow({
  moduleId,
  examStatus,
}: ModuleExamInteractiveRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={() => {
        bzzt();
        router.push(routes.bibleschoolModuleExam(moduleId));
      }}
      activeOpacity={0.7}
      className="cursor-pointer"
    >
      <Box
        className="rounded-2xl flex-row items-center py-4 px-4"
        style={{
          backgroundColor: theme.cardBg,
          borderWidth: 1,
          borderColor: theme.cardBorder,
        }}
      >
        <Box
          className="rounded-full p-2.5 mr-3"
          style={{ backgroundColor: theme.avatarPrimary }}
        >
          <Ionicons name="document-text" size={24} color={theme.textPrimary} />
        </Box>
        <Box className="flex-1">
          <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
            {examStatus.latestFailedAttempt
              ? examStatus.latestFailedAttempt.correct != null &&
                examStatus.latestFailedAttempt.total != null
                ? t('exam.failedScore', {
                    score: examStatus.latestFailedAttempt.score,
                    correct: examStatus.latestFailedAttempt.correct,
                    total: examStatus.latestFailedAttempt.total,
                  })
                : t('exam.failedScorePercent', {
                    score: examStatus.latestFailedAttempt.score,
                  })
              : t('exam.takeExam')}
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
            {examStatus.latestFailedAttempt
              ? examStatus.attemptCount
                ? t('exam.retryHintWithAttempt', { count: examStatus.attemptCount })
                : t('exam.retryHint')
              : t('exam.readyHint')}
          </Text>
        </Box>
        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
      </Box>
    </TouchableOpacity>
  );
}

export function ModuleExamPassedRow() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box
      className="rounded-2xl flex-row items-center py-4 px-4"
      style={{
        backgroundColor: theme.cardBg,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        opacity: 0.7,
      }}
    >
      <Box className="rounded-full p-2.5 mr-3" style={{ backgroundColor: theme.badgeSuccess }}>
        <Ionicons name="checkmark-circle" size={24} color={theme.textPrimary} />
      </Box>
      <Box className="flex-1">
        <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
          {t('exam.passed')}
        </Text>
        <Text className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
          {t('exam.passedHint')}
        </Text>
      </Box>
      <Ionicons name="lock-closed" size={20} color={theme.textSecondary} />
    </Box>
  );
}

const __expoRouterPrivateRoute_ModuleExamRows = () => null;

export default __expoRouterPrivateRoute_ModuleExamRows;
