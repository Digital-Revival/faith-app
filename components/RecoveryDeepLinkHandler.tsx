import * as Linking from 'expo-linking';
import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { routes } from '@/constants/routes';
import { captureRecoveryUrl, hasRecoveryParams } from '@/utils/authDeepLink';

/**
 * Ensures password-reset deep links route to /reset-password before auth redirects run.
 */
export function RecoveryDeepLinkHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url || !hasRecoveryParams(url)) return;

      captureRecoveryUrl(url);

      if (pathname === '/reset-password') return;

      router.replace(routes.authResetPassword());
    }

    void Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => subscription.remove();
  }, [router, pathname]);

  return null;
}
