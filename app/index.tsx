import { BrandedSplashScreen } from '@/components/ui/BrandedSplashScreen';
import { routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { getLastSectionHref } from '@/hooks/useLastSectionRestore';
import { useOnboardingSection } from '@/hooks/useOnboardingSection';
import { useUserProfile } from '@/hooks/useUserProfile';
import { isUserProfileNotFoundError } from '@/services/api/userService';
import { getStoredAdminViewMode } from '@/services/adminViewModeStorage';
import type { Href } from 'expo-router';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

interface MainDestination {
  userId: string;
  href: Href;
}

export default function Index() {
  const {
    session,
    isLoading: authLoading,
    user,
    signOut,
    pendingPasswordRecovery,
  } = useAuth();
  const router = useRouter();
  const [mainDestination, setMainDestination] =
    useState<MainDestination | null>(null);
  const userId = user?.id ?? session?.user?.id;
  const {
    data: profile,
    isLoading: profileLoading,
    isFetching,
    error: profileError,
  } = useUserProfile(userId);
  const { onboardingCompleted, isLoading: onboardingLoading } =
    useOnboardingSection('home');

  useEffect(() => {
    const handleProfileNotFound = async () => {
      if (!profileError || !session) return;

      if (isUserProfileNotFoundError(profileError)) {
        try {
          await signOut();
        } finally {
          router.replace('/');
        }
      }
    };

    handleProfileNotFound();
  }, [profileError, session, signOut, router]);

  useEffect(() => {
    if (
      !session ||
      profileLoading ||
      isFetching ||
      !profile ||
      onboardingLoading
    )
      return;

    if (profileError && isUserProfileNotFoundError(profileError)) return;

    let cancelled = false;
    void (async () => {
      const storedMode = await getStoredAdminViewMode(userId!);
      const href =
        profile.role === 'admin' && storedMode === 'admin'
          ? routes.admin()
          : await getLastSectionHref();

      if (!cancelled) setMainDestination({ userId: userId!, href });
    })();
    return () => {
      cancelled = true;
    };
  }, [
    session,
    userId,
    profile,
    profileLoading,
    isFetching,
    profileError,
    onboardingLoading,
  ]);

  if (authLoading) {
    return <BrandedSplashScreen />;
  }

  if (pendingPasswordRecovery) {
    return <Redirect href={routes.authResetPassword()} />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session && (profileLoading || isFetching)) {
    return <BrandedSplashScreen />;
  }

  const isProfileNotFound =
    !!profileError && isUserProfileNotFoundError(profileError);

  if (isProfileNotFound) {
    return <BrandedSplashScreen />;
  }

  if (!profile) {
    return <BrandedSplashScreen />;
  }

  if (onboardingLoading) {
    return <BrandedSplashScreen />;
  }

  if (onboardingCompleted === false) {
    return <Redirect href={'/onboarding?section=home' as Href} />;
  }

  if (!mainDestination || mainDestination.userId !== userId) {
    return <BrandedSplashScreen />;
  }

  return <Redirect href={mainDestination.href} />;
}
