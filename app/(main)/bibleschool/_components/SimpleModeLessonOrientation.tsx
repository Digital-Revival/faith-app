import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import type { ThemeColors } from '@/hooks/useTheme';
import type { BibleschoolLesson } from '@/types/bibleschool';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { NextLessonCard } from './NextLessonCard';

interface SimpleModeLessonOrientationProps {
  lesson: BibleschoolLesson;
  moduleOrder: number;
  nextLesson?: BibleschoolLesson;
  nextUnlocked: boolean;
  countdown: number | null;
  theme: ThemeColors;
  t: (key: string, params?: Record<string, string | number>) => string;
  onStay: () => void;
  onNextPress: () => void;
  onLockedPress: () => void;
}

export function SimpleModeLessonOrientation({
  lesson,
  moduleOrder,
  nextLesson,
  nextUnlocked,
  countdown,
  theme,
  t,
  onStay,
  onNextPress,
  onLockedPress,
}: SimpleModeLessonOrientationProps) {
  return (
    <Box>
      <Text
        className="text-2xl font-bold"
        style={{ color: theme.textPrimary, lineHeight: 32 }}
      >
        {lesson.title}
      </Text>
      <Text
        className="mt-1 text-lg font-medium"
        style={{ color: theme.textSecondary, lineHeight: 26 }}
      >
        {t('bibleschool.simpleMode.lessonContext', {
          lesson: lesson.order,
          module: moduleOrder,
        })}
      </Text>

      {countdown !== null ? (
        <Box className="mt-5">
          <Box
            accessibilityLiveRegion="polite"
            className="rounded-2xl p-4 flex-row items-center"
            style={{
              backgroundColor: theme.badgeSuccessBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={theme.quizCorrect}
            />
            <Box className="flex-1 ml-3">
              <Text
                className="text-lg font-semibold"
                style={{ color: theme.textPrimary }}
              >
                {t('bibleschool.simpleMode.lessonCompleted')}
              </Text>
              <Text
                className="text-base"
                style={{ color: theme.textSecondary }}
              >
                {t('bibleschool.simpleMode.continueCountdown', {
                  count: countdown,
                })}
              </Text>
            </Box>
          </Box>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('bibleschool.simpleMode.stayHere')}
            onPress={onStay}
            activeOpacity={0.7}
            className="mt-3 min-h-12 rounded-xl items-center justify-center px-5"
            style={{
              borderWidth: 1,
              borderColor: theme.cardBorder,
              backgroundColor: theme.cardBg,
            }}
          >
            <Text
              className="text-lg font-semibold"
              style={{ color: theme.textPrimary }}
            >
              {t('bibleschool.simpleMode.stayHere')}
            </Text>
          </TouchableOpacity>
        </Box>
      ) : (
        <Text
          className="mt-4 text-base"
          style={{ color: theme.textSecondary, lineHeight: 24 }}
        >
          {t('bibleschool.simpleMode.watchToContinue')}
        </Text>
      )}

      <Text
        className="mt-6 mb-3 text-xl font-semibold"
        style={{ color: theme.textPrimary }}
      >
        {nextLesson
          ? t('bibleschool.simpleMode.nextLessonLabel')
          : t('exam.takeExam')}
      </Text>

      {nextLesson ? (
        <NextLessonCard
          nextLesson={nextLesson}
          theme={theme}
          t={t}
          isLocked={!nextUnlocked}
          onPress={onNextPress}
          onLockedPress={onLockedPress}
        />
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('exam.takeExam')}
          onPress={nextUnlocked ? onNextPress : onLockedPress}
          activeOpacity={0.7}
          className="min-h-16 rounded-2xl px-5 flex-row items-center justify-center gap-3"
          style={{
            backgroundColor: theme.buttonPrimary,
            opacity: nextUnlocked ? 1 : 0.55,
          }}
        >
          <Ionicons
            name={nextUnlocked ? 'document-text' : 'lock-closed'}
            size={26}
            color={theme.buttonPrimaryContrast}
          />
          <Text
            className="text-xl font-semibold"
            style={{ color: theme.buttonPrimaryContrast }}
          >
            {t('exam.takeExam')}
          </Text>
        </TouchableOpacity>
      )}
    </Box>
  );
}
