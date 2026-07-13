import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { supabase } from '@/services/supabase/client';
import type { LearningActivityEvent, LearningActivityEventType } from '@/types/learningActivity';
import {
  LEARNING_ACTIVITY_MAX_QUEUE_SIZE,
  resolveLearningActivitySession,
  sanitizeLearningActivityQueue,
  type StoredLearningActivitySession,
} from '@/utils/learningActivityQueue';

const QUEUE_PREFIX = 'learning-activity.queue.v1';
const SESSION_PREFIX = 'learning-activity.session.v1';

export interface LearningEventContext {
  userId: string;
  locale: LearningActivityEvent['locale'];
  simpleMode: boolean;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
const queueKey = (userId: string) => `${QUEUE_PREFIX}:${userId}`;
const sessionKey = (userId: string) => `${SESSION_PREFIX}:${userId}`;

async function readQueue(userId: string): Promise<LearningActivityEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(queueKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    const queue = sanitizeLearningActivityQueue(parsed);
    if (raw && (!Array.isArray(parsed) || queue.length !== parsed.length)) {
      if (queue.length) {
        await AsyncStorage.setItem(queueKey(userId), JSON.stringify(queue));
      } else {
        await AsyncStorage.removeItem(queueKey(userId));
      }
    }
    return queue;
  } catch {
    await AsyncStorage.removeItem(queueKey(userId)).catch(() => undefined);
    return [];
  }
}

async function getSession(userId: string): Promise<{ session: StoredLearningActivitySession; isNew: boolean }> {
  const now = Date.now();
  let stored: unknown = null;
  try {
    const raw = await AsyncStorage.getItem(sessionKey(userId));
    stored = raw ? JSON.parse(raw) : null;
  } catch {}
  const { session, isNew } = resolveLearningActivitySession(
    stored,
    now,
    () => createId('session'),
  );
  await AsyncStorage.setItem(sessionKey(userId), JSON.stringify(session));
  return { session, isNew };
}

class LearningActivityService {
  private writes = Promise.resolve();

  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.writes.then(operation, operation);
    this.writes = next.then(() => undefined, () => undefined);
    return next;
  }

  async startOrResumeSession(context: LearningEventContext): Promise<void> {
    await this.serialize(async () => {
      const { session, isNew } = await getSession(context.userId);
      if (isNew) await this.enqueue(context, session.id, 'app_session_started');
      await this.flushQueue(context.userId);
    });
  }

  async record(context: LearningEventContext, eventType: LearningActivityEventType, details: { moduleId: string; lessonId: string }): Promise<void> {
    await this.serialize(async () => {
      const { session, isNew } = await getSession(context.userId);
      if (isNew) await this.enqueue(context, session.id, 'app_session_started');
      await this.enqueue(context, session.id, eventType, details);
      await this.flushQueue(context.userId);
    });
  }

  async flush(userId: string): Promise<void> {
    await this.serialize(() => this.flushQueue(userId));
  }

  private async enqueue(context: LearningEventContext, sessionId: string, eventType: LearningActivityEventType, details?: { moduleId: string; lessonId: string }) {
    const queue = await readQueue(context.userId);
    const event: LearningActivityEvent = {
      clientEventId: createId('event'), sessionId, eventType,
      moduleId: details?.moduleId, lessonId: details?.lessonId,
      occurredAt: new Date().toISOString(), locale: context.locale,
      simpleMode: context.simpleMode,
      appVersion: Constants.expoConfig?.version ?? 'unknown',
    };
    await AsyncStorage.setItem(
      queueKey(context.userId),
      JSON.stringify(
        [...queue, event].slice(-LEARNING_ACTIVITY_MAX_QUEUE_SIZE),
      ),
    );
  }

  private async flushQueue(userId: string): Promise<void> {
    const queue = await readQueue(userId);
    if (!queue.length) return;
    const { error } = await supabase.rpc('record_learning_activity_events', { p_events: queue });
    if (!error) await AsyncStorage.removeItem(queueKey(userId));
  }
}

export const learningActivityService = new LearningActivityService();
