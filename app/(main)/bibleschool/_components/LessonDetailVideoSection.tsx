import { bzzt } from '@/utils/haptics';
import type { ThemeColors } from '@/hooks/useTheme';
import type { MutableRefObject } from 'react';
import { LessonVideoLoadError } from './LessonVideoLoadError';
import { LessonVideoPlaceholder } from './LessonVideoPlaceholder';
import { LessonVideoPlayer } from './LessonVideoPlayer';

export function LessonDetailVideoSection({
  videoUrl,
  progressLoading,
  hasUser,
  videoLoading,
  showVimeoRetry,
  theme,
  t,
  onRefetchVimeo,
  onSavePosition,
  onMarkComplete,
  onPlaybackStarted,
  onPlaybackEngaged,
  pipRef,
  initialPositionSeconds,
}: {
  videoUrl?: string;
  progressLoading: boolean;
  hasUser: boolean;
  videoLoading: boolean;
  showVimeoRetry: boolean;
  theme: ThemeColors;
  t: (key: string, params?: Record<string, string | number>) => string;
  onRefetchVimeo: () => void;
  onSavePosition: (seconds: number, immediate?: boolean) => void;
  onMarkComplete?: () => void;
  onPlaybackStarted?: () => void;
  onPlaybackEngaged?: () => void;
  pipRef: MutableRefObject<{
    start: () => void;
    stop: () => void;
    onPiPStop: (() => void) | null;
  } | null>;
  initialPositionSeconds: number;
}) {
  if (videoUrl) {
    if ((progressLoading && hasUser) || videoLoading) {
      return <LessonVideoPlaceholder theme={theme} />;
    }
    return (
      <LessonVideoPlayer
        videoUrl={videoUrl}
        initialPositionSeconds={initialPositionSeconds}
        onSavePosition={onSavePosition}
        onMarkComplete={onMarkComplete}
        onPlaybackStarted={onPlaybackStarted}
        onPlaybackEngaged={onPlaybackEngaged}
        pipRef={pipRef}
      />
    );
  }
  if (showVimeoRetry) {
    return (
      <LessonVideoLoadError
        theme={theme}
        message={t('lessons.videoLoadError')}
        onRetry={() => {
          bzzt();
          onRefetchVimeo();
        }}
      />
    );
  }
  return <LessonVideoPlaceholder theme={theme} />;
}

const __expoRouterPrivateRoute_LessonDetailVideoSection = () => null;

export default __expoRouterPrivateRoute_LessonDetailVideoSection;
