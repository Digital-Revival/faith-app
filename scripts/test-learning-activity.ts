import assert from 'node:assert/strict';

import type { LearningActivityEvent } from '../types/learningActivity';
import {
  LEARNING_ACTIVITY_MAX_QUEUE_SIZE,
  LEARNING_ACTIVITY_RETENTION_MS,
  LEARNING_ACTIVITY_SESSION_TIMEOUT_MS,
  resolveLearningActivitySession,
  sanitizeLearningActivityQueue,
} from '../utils/learningActivityQueue';

const now = Date.parse('2026-07-13T12:00:00Z');
const event = (index: number, occurredAt = now): LearningActivityEvent => ({
  clientEventId: `event-${index.toString().padStart(8, '0')}`,
  sessionId: 'session-00000001',
  eventType: 'app_session_started',
  occurredAt: new Date(occurredAt).toISOString(),
  locale: 'nl',
  simpleMode: false,
  appVersion: 'test',
});

const fresh = event(1);
const expired = event(2, now - LEARNING_ACTIVITY_RETENTION_MS - 1);
assert.deepEqual(
  sanitizeLearningActivityQueue([expired, fresh], now),
  [fresh],
  'an expired item cannot poison a valid queued event',
);
assert.deepEqual(
  sanitizeLearningActivityQueue([{ ...fresh, eventType: 'unknown' }], now),
  [],
  'malformed persisted events are removed before upload',
);

const oversized = Array.from(
  { length: LEARNING_ACTIVITY_MAX_QUEUE_SIZE + 5 },
  (_, index) => event(index),
);
assert.deepEqual(
  sanitizeLearningActivityQueue(oversized, now),
  oversized.slice(-LEARNING_ACTIVITY_MAX_QUEUE_SIZE),
  'the queue keeps only its newest one hundred valid events',
);

const active = resolveLearningActivitySession(
  { id: 'session-00000001', lastActivityAt: now - 1_000 },
  now,
  () => 'session-new-00001',
);
assert.equal(active.isNew, false);
assert.equal(active.session.id, 'session-00000001');

const expiredSession = resolveLearningActivitySession(
  {
    id: 'session-00000001',
    lastActivityAt: now - LEARNING_ACTIVITY_SESSION_TIMEOUT_MS,
  },
  now,
  () => 'session-new-00001',
);
assert.equal(expiredSession.isNew, true);
assert.equal(expiredSession.session.id, 'session-new-00001');

const corruptSession = resolveLearningActivitySession(
  { id: 'short', lastActivityAt: 'yesterday' },
  now,
  () => 'session-new-00002',
);
assert.equal(corruptSession.isNew, true);

const futureSession = resolveLearningActivitySession(
  { id: 'session-00000001', lastActivityAt: now + 1_000 },
  now,
  () => 'session-new-00003',
);
assert.equal(futureSession.isNew, true);

console.log('Learning activity queue and session checks passed.');
