import { useCallback, useEffect } from 'react';

import i18n from '@/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

export function useTranslation() {
  const { locale, changeLanguage, isInitialized } = useLanguage();

  useEffect(() => {
    i18n.locale = locale;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
    [locale],
  );

  return {
    t,
    locale,
    changeLanguage,
    isInitialized,
  };
}
