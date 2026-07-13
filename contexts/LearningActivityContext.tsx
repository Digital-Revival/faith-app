import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useBibleschoolSimpleMode } from '@/contexts/BibleschoolSimpleModeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { learningActivityService, type LearningEventContext } from '@/services/learningActivityService';

interface Value {
  recordLessonStarted: (moduleId: string, lessonId: string) => void;
  recordLessonEngaged: (moduleId: string, lessonId: string) => void;
}
const LearningActivityContext = createContext<Value>({ recordLessonStarted: () => {}, recordLessonEngaged: () => {} });

export function LearningActivityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const { enabled: simpleMode } = useBibleschoolSimpleMode();
  const eventContext = useMemo<LearningEventContext | null>(() => user?.id ? { userId: user.id, locale, simpleMode } : null, [locale, simpleMode, user?.id]);

  useEffect(() => {
    if (!eventContext) return;
    void learningActivityService.startOrResumeSession(eventContext);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void learningActivityService.startOrResumeSession(eventContext);
    });
    const network = NetInfo.addEventListener((state) => {
      if (state.isConnected) void learningActivityService.flush(eventContext.userId);
    });
    return () => { appState.remove(); network(); };
  }, [eventContext]);

  const recordLessonStarted = useCallback((moduleId: string, lessonId: string) => {
    if (eventContext) void learningActivityService.record(eventContext, 'lesson_started', { moduleId, lessonId });
  }, [eventContext]);
  const recordLessonEngaged = useCallback((moduleId: string, lessonId: string) => {
    if (eventContext) void learningActivityService.record(eventContext, 'lesson_engaged', { moduleId, lessonId });
  }, [eventContext]);
  const value = useMemo(() => ({ recordLessonStarted, recordLessonEngaged }), [recordLessonEngaged, recordLessonStarted]);
  return <LearningActivityContext.Provider value={value}>{children}</LearningActivityContext.Provider>;
}

export const useLearningActivity = () => useContext(LearningActivityContext);
