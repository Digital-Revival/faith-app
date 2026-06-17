import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { feedbackService } from '@/services/api/feedbackService';
import { AppError, AppErrorCode } from '@/services/api/baseService';
import type { SendFeedbackPayload } from '@/types/feedback';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';

export function useSendFeedback() {
  const toast = useToast();
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: (payload: SendFeedbackPayload) =>
      feedbackService.sendFeedback(payload),
    onSuccess: () => {
      bzzt();
      toast.success(t('feedback.success'));
      router.back();
    },
    onError: (err: unknown) => {
      if (__DEV__) {
        console.error('[useSendFeedback] send failed', err);
      }

      if (err instanceof AppError) {
        switch (err.code) {
          case AppErrorCode.DATABASE_VALIDATION:
            toast.error(t('feedback.error'));
            return;
          case AppErrorCode.AUTH_SESSION_MISSING:
            toast.error(t('feedback.error'));
            return;
          case AppErrorCode.NETWORK:
            toast.error(t('feedback.error'));
            return;
        }
      }
      toast.error(t('feedback.error'));
    },
  });

  return {
    sendFeedback: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}

const __expoRouterPrivateRoute_useSendFeedback = () => null;

export default __expoRouterPrivateRoute_useSendFeedback;
