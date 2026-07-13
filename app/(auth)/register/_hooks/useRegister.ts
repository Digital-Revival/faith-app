import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

import { REGISTRATION_ONBOARDING_SECTIONS } from '@/constants/onboarding';
import { routes } from '@/constants/routes';
import { THEME_STORAGE_KEY } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getCurrentLanguage, isSupportedLocale } from '@/i18n';
import { authService } from '@/services/api/authService';
import { isUserProfileNotFoundError, userService } from '@/services/api/userService';
import { userSettingsService } from '@/services/api/userSettingsService';
import { queryKeys } from '@/services/queryKeys';
import { getErrorMessage } from '@/utils/errors';
import {
  resolveSessionAfterSignUp,
  updateUserProfileAfterSignUp,
  waitForUserProfileRow,
} from '@/utils/postSignupBootstrap';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  birthdate?: string | null;
  country?: string;
  city?: string;
  bibleschoolSimpleModeEnabled?: boolean;
}

interface UseRegisterReturn {
  register: (data: RegisterData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useRegister(): UseRegisterReturn {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const authData = await authService.signUp({
        email: data.email,
        password: data.password,
        fullName: data.name,
        bibleschoolSimpleModeEnabled: data.bibleschoolSimpleModeEnabled,
      });
      if (!authData?.user?.id) {
        throw new Error(t('auth.registrationFailed'));
      }
      const userId = authData.user.id;
      await waitForUserProfileRow(userId);
      await updateUserProfileAfterSignUp(userId, {
        full_name: data.name,
        phone: data.phone?.trim() || undefined,
        birthdate: data.birthdate || undefined,
        country: data.country?.trim() || undefined,
        city: data.city?.trim() || undefined,
      });
      return {
        authData,
        contactEmail: data.email.trim().toLowerCase(),
        bibleschoolSimpleModeEnabled: data.bibleschoolSimpleModeEnabled,
      };
    },
    onSuccess: async ({
      authData,
      contactEmail,
      bibleschoolSimpleModeEnabled,
    }) => {
      const userId = authData.user?.id;
      if (!userId) {
        return;
      }

      const bestEffort: Promise<unknown>[] = [];

      const currentLanguage = getCurrentLanguage();
      if (isSupportedLocale(currentLanguage)) {
        bestEffort.push(
          userSettingsService
            .setSetting(userId, 'language', currentLanguage)
            .catch(() => undefined),
        );
      }

      bestEffort.push(
        (async () => {
          const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
          if (
            storedTheme &&
            (storedTheme === 'light' ||
              storedTheme === 'dark' ||
              storedTheme === 'system')
          ) {
            await userSettingsService.setSetting(
              userId,
              'theme',
              storedTheme,
            );
          }
        })().catch(() => undefined),
      );

      for (const section of REGISTRATION_ONBOARDING_SECTIONS) {
        bestEffort.push(
          userSettingsService
            .setSetting(
              userId,
              `onboarding_${section}_completed`,
              false,
            )
            .catch(() => undefined),
        );
      }

      if (typeof bibleschoolSimpleModeEnabled === 'boolean') {
        queryClient.setQueryData(
          queryKeys.userSettings.simpleMode(userId),
          bibleschoolSimpleModeEnabled,
        );
      }

      await Promise.allSettled(bestEffort);

      try {
        for (const section of REGISTRATION_ONBOARDING_SECTIONS) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.userSettings.onboardingSection(userId, section),
          });
        }
        await queryClient.invalidateQueries({
          queryKey: queryKeys.userSettings.simpleMode(userId),
        });
      } catch {
        //
      }

      try {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.users.detail(userId),
          queryFn: () => userService.getById(userId),
        });
      } catch {
        //
      }

      const session = await resolveSessionAfterSignUp(authData.session);

      if (!session) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace(routes.authVerifyEmail(contactEmail));
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/onboarding?section=home' as never);
    },
    onError: async (err: unknown) => {
      if (isUserProfileNotFoundError(err)) {
        setError(t('auth.profileSetupNotReady'));
      } else {
        setError(getErrorMessage(err, t('auth.registrationFailed')));
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const register = async (data: RegisterData) => {
    setError(null);
    await registerMutation.mutateAsync(data);
  };

  return {
    register,
    isLoading: registerMutation.isPending,
    error,
  };
}

const __expoRouterPrivateRoute_useRegister = () => null;

export default __expoRouterPrivateRoute_useRegister;
