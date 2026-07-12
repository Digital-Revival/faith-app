import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useEasyRead } from '@/contexts/EasyReadContext';
import type { ThemeColors } from '@/hooks/useTheme';
import type { BibleschoolLesson } from '@/types/bibleschool';
import {
  resolveLessonDisplayContent,
  type ExpandState,
} from '@/utils/resolveLessonDisplayContent';
import { useState } from 'react';

export function LessonLessonBodyCard({
  lesson,
  theme,
  t,
}: {
  lesson: BibleschoolLesson;
  theme: ThemeColors;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const { enabled: easyReadEnabled } = useEasyRead();
  const [expanded, setExpanded] = useState<ExpandState>(
    easyReadEnabled ? 'collapsed' : 'full',
  );

  const display = resolveLessonDisplayContent(
    lesson,
    easyReadEnabled,
    easyReadEnabled ? expanded : 'full',
  );

  const showGoal =
    lesson.goal &&
    !lesson.content?.trim().toLowerCase().includes(lesson.goal.trim().toLowerCase()) &&
    (!easyReadEnabled || expanded === 'full');

  return (
    <Box
      className="rounded-2xl overflow-hidden p-5 mb-6"
      style={{
        backgroundColor: theme.cardBg,
        borderWidth: 1,
        borderColor: theme.cardBorder,
      }}
    >
      <Text
        className="text-sm font-medium uppercase tracking-wider mb-1"
        style={{ color: theme.textSecondary }}
      >
        {t('lessons.lessonNumber', { number: lesson.order })}
      </Text>
      <Text
        className="text-lg font-bold mb-4"
        style={{ color: theme.textPrimary }}
      >
        {lesson.title ?? ''}
      </Text>
      <VStack className="gap-4">
        <Box>
          <Text
            className="text-sm font-semibold uppercase tracking-wider mb-2"
            style={{ color: theme.textSecondary }}
          >
            {t('lessons.content')}
          </Text>

          {easyReadEnabled && expanded === 'collapsed' ? (
            <Button
              onPress={() => setExpanded('summary')}
              action="primary"
              variant="solid"
              size="lg"
              className="h-14 rounded-2xl"
              style={{ backgroundColor: theme.buttonPrimary }}
            >
              <ButtonText
                className="text-base font-semibold"
                style={{ color: theme.buttonPrimaryContrast }}
              >
                {t('lessons.readSummary')}
              </ButtonText>
            </Button>
          ) : null}

          {display.body ? (
            <Text
              className="text-base"
              style={{ color: theme.textPrimary }}
            >
              {display.body}
            </Text>
          ) : null}

          {!easyReadEnabled && !display.body ? (
            <Text
              className="text-base"
              style={{ color: theme.textPrimary }}
            >
              {t('lessonsPage.empty')}
            </Text>
          ) : null}

          {easyReadEnabled && expanded !== 'collapsed' && !display.body ? (
            <Text
              className="text-base"
              style={{ color: theme.textSecondary }}
            >
              {t('lessons.noTextAvailable')}
            </Text>
          ) : null}

          {easyReadEnabled && expanded === 'summary' && display.hasMore ? (
            <Button
              onPress={() => setExpanded('full')}
              action="primary"
              variant="outline"
              size="lg"
              className="h-14 rounded-2xl mt-3"
              style={{ borderColor: theme.cardBorder }}
            >
              <ButtonText
                className="text-base font-semibold"
                style={{ color: theme.textPrimary }}
              >
                {t('lessons.readFullText')}
              </ButtonText>
            </Button>
          ) : null}

          {easyReadEnabled && expanded === 'full' && lesson.content?.trim() ? (
            <Button
              onPress={() => setExpanded('collapsed')}
              action="primary"
              variant="outline"
              size="lg"
              className="h-14 rounded-2xl mt-3"
              style={{ borderColor: theme.cardBorder }}
            >
              <ButtonText
                className="text-base font-semibold"
                style={{ color: theme.textPrimary }}
              >
                {t('lessons.hideSummary')}
              </ButtonText>
            </Button>
          ) : null}
        </Box>
        {showGoal ? (
          <Box>
            <Text
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: theme.textSecondary }}
            >
              {t('lessons.goal')}
            </Text>
            <Text
              className="text-base"
              style={{ color: theme.textPrimary }}
            >
              {lesson.goal}
            </Text>
          </Box>
        ) : null}
      </VStack>
    </Box>
  );
}

const __expoRouterPrivateRoute_LessonLessonBodyCard = () => null;

export default __expoRouterPrivateRoute_LessonLessonBodyCard;
