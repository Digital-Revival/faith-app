export type LearningActivityEventType =
  | 'app_session_started'
  | 'lesson_started'
  | 'lesson_engaged';

export interface LearningActivityEvent {
  clientEventId: string;
  sessionId: string;
  eventType: LearningActivityEventType;
  moduleId?: string;
  lessonId?: string;
  occurredAt: string;
  locale: 'nl' | 'bg' | 'hi' | 'id' | 'en';
  simpleMode: boolean;
  appVersion: string;
}
