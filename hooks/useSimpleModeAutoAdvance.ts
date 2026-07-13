import { SIMPLE_MODE_AUTO_ADVANCE_MS } from '@/constants/bibleschoolSimpleMode';
import { routes } from '@/constants/routes';
import type { BibleschoolLesson } from '@/types/bibleschool';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SimpleModeAutoAdvanceOptions {
  enabled: boolean;
  moduleId: string;
  nextLesson?: BibleschoolLesson;
  isLessonUnlocked: (
    moduleId: string,
    lesson: { id: string; moduleId: string; order: number },
  ) => boolean;
  isExamUnlocked: (moduleId: string) => boolean;
  markComplete: () => Promise<boolean>;
  onError: () => void;
}

export function useSimpleModeAutoAdvance({
  enabled,
  moduleId,
  nextLesson,
  isLessonUnlocked,
  isExamUnlocked,
  markComplete,
  onError,
}: SimpleModeAutoAdvanceOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [awaitingAdvance, setAwaitingAdvance] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setAwaitingAdvance(false);
    setCountdown(null);
  }, []);

  useEffect(() => cancel, [cancel]);
  useFocusEffect(useCallback(() => cancel, [cancel]));

  const complete = useCallback(async () => {
    try {
      if (await markComplete()) setAwaitingAdvance(true);
    } catch {
      onError();
    }
  }, [markComplete, onError]);

  useEffect(() => {
    if (!enabled || !awaitingAdvance || timerRef.current) return;

    const targetUnlocked = nextLesson
      ? isLessonUnlocked(moduleId, nextLesson)
      : isExamUnlocked(moduleId);
    if (!targetUnlocked) {
      const resetTimer = setTimeout(() => setAwaitingAdvance(false), 0);
      return () => clearTimeout(resetTimer);
    }

    const nextHref = nextLesson
      ? routes.bibleschoolModuleLesson(moduleId, nextLesson.id)
      : routes.bibleschoolModuleExam(moduleId);
    const tick = (remaining: number) => {
      if (remaining <= 0) {
        cancel();
        requestAnimationFrame(() => router.replace(nextHref));
        return;
      }
      setCountdown(remaining);
      timerRef.current = setTimeout(() => tick(remaining - 1), 1000);
    };

    timerRef.current = setTimeout(
      () => tick(Math.ceil(SIMPLE_MODE_AUTO_ADVANCE_MS / 1000)),
      0,
    );
  }, [
    awaitingAdvance,
    cancel,
    enabled,
    isExamUnlocked,
    isLessonUnlocked,
    moduleId,
    nextLesson,
  ]);

  return { cancel, complete, countdown };
}
