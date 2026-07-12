import type { BibleschoolLesson } from '@/types/bibleschool';

import { truncateToSentences } from './truncateToSentences';

export type ExpandState = 'collapsed' | 'summary' | 'full';

export interface LessonDisplayContent {
  showBlock: boolean;
  body: string | undefined;
  hasMore: boolean;
}

export function resolveLessonDisplayContent(
  lesson: BibleschoolLesson,
  easyRead: boolean,
  expanded: ExpandState,
): LessonDisplayContent {
  const rawContent = lesson.content?.trim() ?? '';
  const hasContent = rawContent.length > 0;

  if (!easyRead) {
    return {
      showBlock: true,
      body: rawContent || undefined,
      hasMore: false,
    };
  }

  switch (expanded) {
    case 'collapsed':
      return {
        showBlock: true,
        body: undefined,
        hasMore: hasContent,
      };
    case 'summary': {
      if (!hasContent) {
        return { showBlock: true, body: undefined, hasMore: false };
      }
      const { text, truncated } = truncateToSentences(rawContent, 3);
      return {
        showBlock: true,
        body: text,
        hasMore: truncated,
      };
    }
    case 'full':
      return {
        showBlock: true,
        body: rawContent || undefined,
        hasMore: false,
      };
    default:
      return {
        showBlock: true,
        body: undefined,
        hasMore: hasContent,
      };
  }
}
