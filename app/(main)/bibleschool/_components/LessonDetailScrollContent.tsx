import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { ThemeColors } from '@/hooks/useTheme';
import type { BibleschoolLesson, BibleschoolModule } from '@/types/bibleschool';
import { HandoutButton } from './HandoutButton';
import { LessonLessonBodyCard } from './LessonLessonBodyCard';
import { NextLessonCard } from './NextLessonCard';
import { StartExamCard } from './StartExamCard';

export function LessonDetailScrollContent({
  lesson,
  module,
  theme,
  t,
  moduleId,
  nextLesson,
  isLessonUnlocked,
  isExamUnlocked,
  onNextLessonPress,
  onLockedPress,
  onLessonHandout,
  onModuleHandout,
}: {
  lesson: BibleschoolLesson;
  module: BibleschoolModule;
  theme: ThemeColors;
  t: (key: string, params?: Record<string, string | number>) => string;
  moduleId: string;
  nextLesson: BibleschoolLesson | undefined;
  isLessonUnlocked: (
    mid: string,
    l: { id: string; moduleId: string; order: number },
  ) => boolean;
  isExamUnlocked: (mid: string) => boolean;
  onNextLessonPress: () => void;
  onLockedPress: () => void;
  onLessonHandout: () => void;
  onModuleHandout: () => void;
}) {
  const moduleHandoutUrl = module.moduleHandoutUrl ?? lesson.moduleHandoutUrl;
  const hasLessonHandout = !!lesson.lessonHandoutUrl;
  const hasModuleHandout = !!moduleHandoutUrl;
  const hasAnyHandout = hasLessonHandout || hasModuleHandout;

  return (
    <>
      <LessonLessonBodyCard lesson={lesson} theme={theme} t={t} />

      {hasAnyHandout ? (
        <>
          <Text
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: theme.textSecondary }}
          >
            {t('handouts.title')}
          </Text>
          <VStack className="gap-3 mb-8">
            {hasLessonHandout ? (
              <HandoutButton
                label={t('handouts.lesson')}
                theme={theme}
                onPress={onLessonHandout}
              />
            ) : null}
            {hasModuleHandout ? (
              <HandoutButton
                label={t('handouts.module')}
                theme={theme}
                onPress={onModuleHandout}
              />
            ) : null}
          </VStack>
        </>
      ) : null}

      <Text
        className="text-sm font-semibold uppercase tracking-wider mb-3"
        style={{ color: theme.textSecondary }}
      >
        {nextLesson
          ? t('lessons.nextLesson', { number: nextLesson.order })
          : t('exam.takeExam')}
      </Text>
      {nextLesson ? (
        <NextLessonCard
          nextLesson={nextLesson}
          theme={theme}
          t={t}
          isLocked={!isLessonUnlocked(moduleId, nextLesson)}
          onPress={onNextLessonPress}
          onLockedPress={onLockedPress}
        />
      ) : (
        <StartExamCard
          moduleId={moduleId}
          theme={theme}
          t={t}
          isLocked={!isExamUnlocked(moduleId)}
          onLockedPress={onLockedPress}
        />
      )}
    </>
  );
}

const __expoRouterPrivateRoute_LessonDetailScrollContent = () => null;

export default __expoRouterPrivateRoute_LessonDetailScrollContent;
