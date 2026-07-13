import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useBibleschoolSimpleMode } from '@/contexts/BibleschoolSimpleModeContext';
import type { ExamStatusForModule } from '@/hooks/useLessonUnlocks';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import type { BibleschoolLesson, LessonLike } from '@/types/bibleschool';
import type { CurrentTargetForModule } from '@/utils/unlockLogic';
import { router } from 'expo-router';
import { routes } from '@/constants/routes';
import { IntroVideoRow } from './IntroVideoRow';
import { LessonRow } from './LessonRow';
import {
  ModuleExamInteractiveRow,
  ModuleExamPassedRow,
} from './ModuleExamRows';

interface ModuleLessonListProps {
  moduleId: string;
  lessons: BibleschoolLesson[];
  introductionVimeoId?: string | null;
  introWatched: boolean;
  examStatus: ExamStatusForModule;
  currentTarget: CurrentTargetForModule | null;
  showIntroInOther: boolean;
  otherLessons: BibleschoolLesson[];
  showExamInOther: boolean;
  completedLessonIds: Set<string>;
  lessonPositionMap: Map<string, number>;
  isLessonUnlocked: (
    mid: string,
    lesson: { id: string; moduleId: string; order: number },
  ) => boolean;
  onLockedPress: (lesson?: LessonLike) => void;
}

export function ModuleLessonList({
  moduleId,
  lessons,
  introductionVimeoId,
  introWatched,
  examStatus,
  currentTarget,
  showIntroInOther,
  otherLessons,
  showExamInOther,
  completedLessonIds,
  lessonPositionMap,
  isLessonUnlocked,
  onLockedPress,
}: ModuleLessonListProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { enabled: simpleMode } = useBibleschoolSimpleMode();

  const currentLessonRow =
    currentTarget?.type === 'lesson'
      ? lessons.find((l) => l.id === currentTarget.lesson.id)
      : undefined;

  return (
    <VStack className="gap-6">
      {currentTarget ? (
        <VStack className="gap-3">
          <Text
            className={
              simpleMode
                ? 'text-xl font-semibold'
                : 'text-sm font-medium uppercase tracking-wider'
            }
            style={{ color: theme.textSecondary }}
          >
            {t('lessonsPage.currentLesson')}
          </Text>
          {currentTarget.type === 'intro' && introductionVimeoId ? (
            <IntroVideoRow
              introductionVimeoId={introductionVimeoId}
              showWatchedCheck={false}
            />
          ) : currentTarget.type === 'lesson' && currentLessonRow ? (
            <LessonRow
              lesson={currentLessonRow}
              theme={theme}
              t={t}
              isCompleted={completedLessonIds.has(currentLessonRow.id)}
              isLocked={false}
              isCurrent
              videoPositionSeconds={lessonPositionMap.get(currentLessonRow.id)}
              onPress={() => {
                bzzt();
                router.push(routes.bibleschoolModuleLesson(moduleId, currentLessonRow.id));
              }}
            />
          ) : currentTarget.type === 'exam' ? (
            <ModuleExamInteractiveRow moduleId={moduleId} examStatus={examStatus} />
          ) : null}
        </VStack>
      ) : null}
      {showIntroInOther || otherLessons.length > 0 || showExamInOther ? (
        <VStack className="gap-3">
          <Text
            className={
              simpleMode
                ? 'text-xl font-semibold'
                : 'text-sm font-medium uppercase tracking-wider'
            }
            style={{ color: theme.textSecondary }}
          >
            {t('lessonsPage.otherLessons')}
          </Text>
          <VStack className="gap-3">
            {showIntroInOther && introductionVimeoId ? (
              <IntroVideoRow
                introductionVimeoId={introductionVimeoId}
                showWatchedCheck
                introWatched={introWatched}
              />
            ) : null}
            {otherLessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                theme={theme}
                t={t}
                isCompleted={completedLessonIds.has(lesson.id)}
                isLocked={!isLessonUnlocked(moduleId, lesson)}
                videoPositionSeconds={lessonPositionMap.get(lesson.id)}
                onPress={() => {
                  bzzt();
                  router.push(routes.bibleschoolModuleLesson(moduleId, lesson.id));
                }}
                onLockedPress={(l) => onLockedPress(l)}
              />
            ))}
            {showExamInOther ? (
              examStatus.passed ? (
                <ModuleExamPassedRow />
              ) : (
                <ModuleExamInteractiveRow moduleId={moduleId} examStatus={examStatus} />
              )
            ) : null}
          </VStack>
        </VStack>
      ) : null}
    </VStack>
  );
}

const __expoRouterPrivateRoute_ModuleLessonList = () => null;

export default __expoRouterPrivateRoute_ModuleLessonList;
