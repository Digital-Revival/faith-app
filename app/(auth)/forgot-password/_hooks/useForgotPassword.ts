import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

import { authService } from '@/services/api/authService';

interface UseForgotPasswordReturn {
  requestReset: (email: string) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [isSuccess, setIsSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await authService.requestPasswordReset(email);
    },
    onSuccess: async () => {
      setIsSuccess(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const requestReset = async (email: string) => {
    try {
      await mutation.mutateAsync(email);
    } catch {
      // Anti-enumeration: always show success state
      setIsSuccess(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return {
    requestReset,
    isLoading: mutation.isPending,
    isSuccess,
  };
}

const __expoRouterPrivateRoute_useForgotPassword = () => null;

export default __expoRouterPrivateRoute_useForgotPassword;
