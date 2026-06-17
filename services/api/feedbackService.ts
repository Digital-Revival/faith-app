import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';

import { supabase } from '@/services/supabase/client';
import type { SendFeedbackPayload } from '@/types/feedback';

import { AppError, AppErrorCode } from './baseService';

function isFunctionsHttpError(error: unknown): error is FunctionsHttpError {
  return (
    error instanceof FunctionsHttpError ||
    (error instanceof Error &&
      error.name === 'FunctionsHttpError' &&
      'context' in error)
  );
}

function logFeedbackError(stage: string, error: unknown, details?: string): void {
  if (!__DEV__) return;

  console.error(`[feedbackService] ${stage}`, {
    details,
    error,
    message: error instanceof Error ? error.message : String(error),
  });
}

interface FeedbackErrorBody {
  error?: string;
  code?: string;
}

interface SendFeedbackResponse {
  ok?: boolean;
}

async function parseHttpError(
  error: FunctionsHttpError,
): Promise<{ status: number; message: string }> {
  const response = error.context as Response;
  const status = response.status;
  let message = error.message;

  try {
    const body = (await response.json()) as FeedbackErrorBody;
    if (body.error) {
      message = body.error;
    }
  } catch {
    // Keep default message when body is not JSON.
  }

  return { status, message };
}

function mapStatusToAppError(status: number, message: string): AppError {
  if (status === 400) {
    return new AppError(message, AppErrorCode.DATABASE_VALIDATION);
  }
  if (status === 401) {
    return new AppError(message, AppErrorCode.AUTH_SESSION_MISSING);
  }
  if (status === 502) {
    return new AppError(message, AppErrorCode.NETWORK);
  }
  return new AppError(message, AppErrorCode.UNKNOWN);
}

export class FeedbackService {
  async sendFeedback(payload: SendFeedbackPayload): Promise<void> {
    const { data, error } = await supabase.functions.invoke<SendFeedbackResponse>(
      'send-feedback',
      { body: payload },
    );

    if (error) {
      if (isFunctionsHttpError(error)) {
        const { status, message } = await parseHttpError(error);
        logFeedbackError('edge function HTTP error', error, `${status}: ${message}`);
        throw mapStatusToAppError(status, message);
      }

      if (error instanceof FunctionsFetchError) {
        logFeedbackError('network/fetch error', error);
        throw new AppError(error.message, AppErrorCode.NETWORK, error);
      }

      if (error instanceof FunctionsRelayError) {
        logFeedbackError('relay error', error);
        throw new AppError(error.message, AppErrorCode.NETWORK, error);
      }

      logFeedbackError('unknown invoke error', error);
      throw new AppError(
        error instanceof Error ? error.message : 'Unknown error',
        AppErrorCode.UNKNOWN,
        error instanceof Error ? error : undefined,
      );
    }

    if (data?.ok !== true) {
      logFeedbackError('unexpected response body', data);
      throw new AppError('Unexpected response', AppErrorCode.UNKNOWN);
    }
  }
}

export const feedbackService = new FeedbackService();
