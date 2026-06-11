import type { QuizAttempt } from '@/types/progress';

type AttemptScoreFields = Pick<
  QuizAttempt,
  'score_percentage' | 'correct_count' | 'total_count' | 'answers'
>;

function isFirebaseAnswerBlob(answers: unknown): boolean {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return false;
  }
  const record = answers as Record<string, unknown>;
  return 'component' in record && 'answer' in record;
}

function isAppAnswerMap(answers: unknown): answers is Record<string, string> {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return false;
  }
  if (isFirebaseAnswerBlob(answers)) return false;
  return Object.keys(answers).length > 0;
}

export function resolveQuizAttemptCounts(
  attempt: AttemptScoreFields,
): { correct: number; total: number } | undefined {
  if (attempt.total_count != null && attempt.total_count > 0) {
    const total = attempt.total_count;
    const correct =
      attempt.correct_count ??
      Math.round((attempt.score_percentage / 100) * total);
    return { correct, total };
  }

  if (isAppAnswerMap(attempt.answers)) {
    const total = Object.keys(attempt.answers).length;
    const correct =
      attempt.correct_count ??
      Math.round((attempt.score_percentage / 100) * total);
    return { correct, total };
  }

  return undefined;
}
