import { useMutation } from '@tanstack/react-query';

import { authService } from '@/services/api/authService';
import { AppError, AppErrorCode } from '@/services/api/baseService';
import type { ChangePasswordData } from '@/types/auth';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';

export function useChangePassword(email: string | undefined) {
  const toast = useToast();
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      if (!email) {
        throw new AppError('No email', AppErrorCode.AUTH_SESSION_MISSING);
      }
      await authService.verifyPassword(email, data.currentPassword);
      await authService.updatePassword(data.password);
    },
    onSuccess: () => {
      bzzt();
      toast.success(t('profile.passwordChanged'));
    },
    onError: (err: unknown) => {
      if (err instanceof AppError) {
        switch (err.code) {
          case AppErrorCode.AUTH_INVALID_CREDENTIALS:
            toast.error(t('auth.invalidCredentials'));
            return;
          case AppErrorCode.AUTH_WEAK_PASSWORD:
            toast.error(t('auth.passwordMinLength'));
            return;
          case AppErrorCode.RATE_LIMIT:
            toast.error(t('auth.resetPasswordRateLimited'));
            return;
        }
      }
      toast.error(t('profile.passwordChangeFailed'));
    },
  });

  return {
    changePassword: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}

const __expoRouterPrivateRoute_useChangePassword = () => null;

export default __expoRouterPrivateRoute_useChangePassword;
