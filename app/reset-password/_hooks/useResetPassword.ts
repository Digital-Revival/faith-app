import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';

import { routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/hooks/useTranslation';
import { AppError, AppErrorCode } from '@/services/api/baseService';
import { authService } from '@/services/api/authService';
import { clearProcessedRecoveryUrl } from '@/utils/authDeepLink';
import { getErrorMessage } from '@/utils/errors';

interface UseResetPasswordOptions {
  onSuccess?: () => void;
}

interface UseResetPasswordReturn {
  resetPassword: (password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

function mapResetPasswordError(err: unknown, t: (key: string) => string): string {
  if (err instanceof AppError) {
    if (err.code === AppErrorCode.AUTH_WEAK_PASSWORD) {
      return t('auth.passwordMinLength');
    }
    if (err.code === AppErrorCode.RATE_LIMIT) {
      return t('auth.resetPasswordRateLimited');
    }
    const msg = err.message.toLowerCase();
    if (msg.includes('expired')) {
      return t('auth.passwordResetLinkExpired');
    }
    if (msg.includes('invalid token') || msg.includes('already been used')) {
      return t('auth.passwordResetLinkUsed');
    }
  }
  return getErrorMessage(err, t('auth.resetPasswordFailed'));
}

export function useResetPassword(
  options?: UseResetPasswordOptions,
): UseResetPasswordReturn {
  const { t } = useTranslation();
  const toast = useToast();
  const { signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (password: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await authService.updatePassword(password);
    },
    onSuccess: async () => {
      options?.onSuccess?.();
      await clearProcessedRecoveryUrl();
      await signOut();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(t('auth.resetPasswordSuccess'));
      router.replace(routes.auth('login'));
    },
    onError: async (err: unknown) => {
      setError(mapResetPasswordError(err, t));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const resetPassword = async (password: string) => {
    setError(null);
    await mutation.mutateAsync(password);
  };

  return {
    resetPassword,
    isLoading: mutation.isPending,
    error,
    clearError: () => setError(null),
  };
}

const __expoRouterPrivateRoute_useResetPassword = () => null;

export default __expoRouterPrivateRoute_useResetPassword;
