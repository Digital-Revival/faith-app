import type { Href } from 'expo-router';
import { routes } from '@/constants/routes';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runDeferredTask } from '@/utils/runDeferredTask';

export const LAST_SECTION_KEY = '@faith_app:last_section';
export const PROFILE_RETURN_HREF_KEY = '@faith_app:profile_return_href';

export async function saveProfileReturnHref(href: string): Promise<void> {
  try {
    if (
      href &&
      !href.includes('/profile') &&
      !href.includes('/settings') &&
      !href.includes('/feedback')
    ) {
      await AsyncStorage.setItem(PROFILE_RETURN_HREF_KEY, href);
    }
  } catch {
    //
  }
}

export async function getProfileReturnHref(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PROFILE_RETURN_HREF_KEY);
  } catch {
    return null;
  }
}

const RESTORABLE_SECTIONS = [
  'bibleschool',
  'podcasts',
  'sermons',
  'profile',
  'badges',
  'admin',
] as const;

export function getSectionFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter((s) => s && s !== '(main)');
  const first = segments[0];
  if (!first || first === 'index') return 'index';
  if (first.startsWith('admin')) return 'admin';
  return first;
}

function getHrefForSection(section: string): Href {
  switch (section) {
    case 'bibleschool':
      return routes.bibleschool();
    case 'podcasts':
      return routes.podcasts();
    case 'sermons':
      return routes.sermons();
    case 'profile':
      return routes.profile();
    case 'badges':
      return routes.badges();
    case 'admin':
      return routes.admin();
    default:
      return '/(main)' as Href;
  }
}

export async function getLastSectionHref(): Promise<Href> {
  try {
    const last = await AsyncStorage.getItem(LAST_SECTION_KEY);
    if (!last || last === 'index') return '/(main)' as Href;
    if (RESTORABLE_SECTIONS.includes(last as (typeof RESTORABLE_SECTIONS)[number])) {
      return getHrefForSection(last);
    }
  } catch {
    //
  }
  return '/(main)' as Href;
}

let hasAttemptedRestoreThisSession = false;

export function useLastSectionRestore() {
  const pathname = usePathname();
  const hasRunRestore = useRef(false);

  useEffect(() => {
    const section = getSectionFromPathname(pathname);
    if (
      section === 'index' ||
      section === 'admin' ||
      RESTORABLE_SECTIONS.includes(section as (typeof RESTORABLE_SECTIONS)[number])
    ) {
      AsyncStorage.setItem(LAST_SECTION_KEY, section).catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    if (hasRunRestore.current || hasAttemptedRestoreThisSession) return;

    const currentSection = getSectionFromPathname(pathname);
    if (currentSection !== 'index') return;

    hasRunRestore.current = true;
    hasAttemptedRestoreThisSession = true;

    runDeferredTask(() => {
      setTimeout(() => {
        getLastSectionHref().then((href) => {
          const hrefStr = String(href);
          if (hrefStr === '/(main)' || hrefStr === '/(main)/' || hrefStr === '/') return;
          router.replace(href as never);
        });
      }, 100);
    });
  }, [pathname]);
}
