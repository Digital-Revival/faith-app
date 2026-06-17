import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from "expo-router/react-navigation";
import { useDelayedTrue } from '@/hooks/useDelayedTrue';
import { useSyncRef } from '@/hooks/useSyncRef';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export interface LessonVideoPlayerProps {
  videoUrl: string;
  initialPositionSeconds: number;
  onSavePosition: (seconds: number, immediate?: boolean) => void;
  onMarkComplete?: () => void;
  pipRef?: MutableRefObject<{
    start: () => void;
    stop: () => void;
    onPiPStop: (() => void) | null;
  } | null>;
}

export function LessonVideoPlayer({
  videoUrl,
  initialPositionSeconds,
  onSavePosition,
  onMarkComplete,
  pipRef,
}: LessonVideoPlayerProps) {
  const videoViewRef = useRef<VideoView>(null);
  const lastPositionRef = useRef(initialPositionSeconds);
  const onSavePositionRef = useSyncRef(onSavePosition);
  const onMarkCompleteRef = useSyncRef(onMarkComplete);
  const hasAppliedInitialSeekRef = useRef(false);
  const hasMarkedCompleteRef = useRef(false);

  const SEEK_DELTA_THRESHOLD = 4;
  const SEEK_SETTLE_MS = 1500;
  const isSeekingRef = useRef(false);
  const seekSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (seekSettleTimerRef.current) clearTimeout(seekSettleTimerRef.current);
    };
  }, []);

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 2;
    p.staysActiveInBackground = true;
    if (initialPositionSeconds > 0) {
      p.currentTime = initialPositionSeconds;
      hasAppliedInitialSeekRef.current = true;
    }
    p.play();
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const prevPosition = lastPositionRef.current;
    const delta = Math.abs(currentTime - prevPosition);

    if (delta > SEEK_DELTA_THRESHOLD) {
      isSeekingRef.current = true;
      if (seekSettleTimerRef.current) clearTimeout(seekSettleTimerRef.current);
      seekSettleTimerRef.current = setTimeout(() => {
        isSeekingRef.current = false;
        seekSettleTimerRef.current = null;
        onSavePositionRef.current(lastPositionRef.current, true);
      }, SEEK_SETTLE_MS);
    }

    lastPositionRef.current = currentTime;

    if (isSeekingRef.current) return;

    onSavePositionRef.current(currentTime, false);

    if (onMarkCompleteRef.current && !hasMarkedCompleteRef.current) {
      const duration = player.duration;
      if (duration > 0 && currentTime / duration >= 0.9) {
        hasMarkedCompleteRef.current = true;
        onMarkCompleteRef.current();
      }
    }
  });

  useEventListener(player, 'playToEnd', () => {
    if (onMarkCompleteRef.current && !hasMarkedCompleteRef.current) {
      hasMarkedCompleteRef.current = true;
      onMarkCompleteRef.current();
    }
  });

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (!isPlaying) {
      const pos = player.currentTime;
      lastPositionRef.current = pos;
      if (!isSeekingRef.current) {
        onSavePositionRef.current(pos, true);
      }
    }
  });

  const [playerStatus, setPlayerStatus] = useState(player.status);

  useEventListener(player, 'statusChange', ({ status: s }) => {
    setPlayerStatus(s);
  });

  const safeStopPiP = useCallback(() => {
    try {
      const result = videoViewRef.current?.stopPictureInPicture?.();
      if (result && typeof (result as Promise<unknown>).catch === 'function') {
        (result as Promise<unknown>).catch(() => {});
      }
    } catch {}
  }, []);

  const safeStartPiP = useCallback(() => {
    try {
      const result = videoViewRef.current?.startPictureInPicture?.();
      if (result && typeof (result as Promise<unknown>).catch === 'function') {
        (result as Promise<unknown>).catch(() => {});
      }
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        safeStopPiP();
        try {
          player.pause();
        } catch {}
        onSavePositionRef.current(lastPositionRef.current, true);
      };
    }, [player, safeStopPiP, onSavePositionRef]),
  );

  useEffect(() => {
    if (pipRef) {
      pipRef.current = {
        start: safeStartPiP,
        stop: safeStopPiP,
        onPiPStop: null,
      };
      return () => {
        pipRef.current = null;
      };
    }
  }, [pipRef, safeStartPiP, safeStopPiP]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'inactive' || state === 'background') {
        requestAnimationFrame(safeStartPiP);
      }
      if (state === 'active') {
        safeStopPiP();
        try {
          player.play();
        } catch {}
      }
    });
    return () => sub.remove();
  }, [player, safeStartPiP, safeStopPiP]);

  const isLoading = playerStatus === 'loading' || playerStatus === 'idle';
  const showLoader = useDelayedTrue(isLoading, 400);

  return (
    <View
      style={{
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <VideoView
        ref={videoViewRef}
        style={{ width: '100%', height: '100%' }}
        player={player}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
        startsPictureInPictureAutomatically={true}
        contentFit="contain"
        onPictureInPictureStop={() => pipRef?.current?.onPiPStop?.()}
      />
      {isLoading && showLoader && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(200)}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              alignItems: 'center',
              justifyContent: 'center',
            } as const,
          ]}
        >
          <ActivityIndicator size="small" color="#e5e5e5" />
        </Animated.View>
      )}
    </View>
  );
}

const __expoRouterPrivateRoute_LessonVideoPlayer = () => null;

export default __expoRouterPrivateRoute_LessonVideoPlayer;
