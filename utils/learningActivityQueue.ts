import type {
  LearningActivityEvent,
  LearningActivityEventType,
} from '@/types/learningActivity';

export const LEARNING_ACTIVITY_MAX_QUEUE_SIZE = 100;
export const LEARNING_ACTIVITY_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
export const LEARNING_ACTIVITY_RETENTION_MS = 31 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

const EVENT_TYPES: ReadonlySet<string> = new Set<LearningActivityEventType>([
  'app_session_started',
  'lesson_started',
  'lesson_engaged',
]);
const LOCALES = new Set(['nl', 'bg', 'hi', 'id', 'en']);

export interface StoredLearningActivitySession {
  id: string;
  lastActivityAt: number;
}

function hasValidIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 8 && value.length <= 120;
}

function isLearningActivityEvent(
  value: unknown,
  now: number,
): value is LearningActivityEvent {
  if (!value || typeof value !== 'object') return false;

  const event = value as Partial<LearningActivityEvent>;
  const occurredAt =
    typeof event.occurredAt === 'string'
      ? Date.parse(event.occurredAt)
      : Number.NaN;
  const hasLessonContext =
    event.eventType === 'app_session_started' ||
    (hasValidIdentifier(event.moduleId) && hasValidIdentifier(event.lessonId));

  return (
    hasValidIdentifier(event.clientEventId) &&
    hasValidIdentifier(event.sessionId) &&
    typeof event.eventType === 'string' &&
    EVENT_TYPES.has(event.eventType) &&
    hasLessonContext &&
    Number.isFinite(occurredAt) &&
    occurredAt >= now - LEARNING_ACTIVITY_RETENTION_MS &&
    occurredAt <= now + MAX_FUTURE_SKEW_MS &&
    typeof event.locale === 'string' &&
    LOCALES.has(event.locale) &&
    typeof event.simpleMode === 'boolean' &&
    typeof event.appVersion === 'string' &&
    event.appVersion.length >= 1 &&
    event.appVersion.length <= 32
  );
}

export function sanitizeLearningActivityQueue(
  value: unknown,
  now = Date.now(),
): LearningActivityEvent[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((event) => isLearningActivityEvent(event, now))
    .slice(-LEARNING_ACTIVITY_MAX_QUEUE_SIZE);
}

export function resolveLearningActivitySession(
  value: unknown,
  now: number,
  createId: () => string,
): { session: StoredLearningActivitySession; isNew: boolean } {
  const stored =
    value &&
    typeof value === 'object' &&
    hasValidIdentifier((value as Partial<StoredLearningActivitySession>).id) &&
    Number.isFinite(
      (value as Partial<StoredLearningActivitySession>).lastActivityAt,
    )
      ? (value as StoredLearningActivitySession)
      : null;
  const isNew =
    !stored ||
    stored.lastActivityAt > now ||
    now - stored.lastActivityAt >= LEARNING_ACTIVITY_SESSION_TIMEOUT_MS;

  return {
    session: {
      id: isNew ? createId() : stored.id,
      lastActivityAt: now,
    },
    isNew,
  };
}
