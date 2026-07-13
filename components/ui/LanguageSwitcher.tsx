import { forwardRef } from 'react';
import { View } from 'react-native';
import { LANGUAGES_FOR_UI, type SupportedLocale } from '@/i18n';
import { useTranslation } from '@/hooks/useTranslation';
import {
  SettingsDropdown,
  type SettingsDropdownOption,
  type SettingsDropdownRef,
} from '@/components/ui/SettingsDropdown';

export type LanguageSwitcherRef = SettingsDropdownRef;

const LANGUAGE_OPTIONS: SettingsDropdownOption<SupportedLocale>[] =
  LANGUAGES_FOR_UI.map((lang) => ({
    value: lang.code,
    label: lang.nativeName,
    flag: lang.flag,
  }));

interface LanguageSwitcherProps {
  variant?: 'default' | 'inline';
  fullWidth?: boolean;
  measureRef?: React.RefObject<View | null>;
  matchDropdownToTrigger?: boolean;
  showTriggerLabel?: boolean;
}

export const LanguageSwitcher = forwardRef<
  LanguageSwitcherRef,
  LanguageSwitcherProps
>(function LanguageSwitcher(
  {
    variant = 'default',
    fullWidth = false,
    measureRef,
    matchDropdownToTrigger = false,
    showTriggerLabel = true,
  },
  ref,
) {
  const { t, locale, changeLanguage } = useTranslation();

  const displayValue =
    LANGUAGES_FOR_UI.some((l) => l.code === locale) ? locale : (LANGUAGES_FOR_UI[0]?.code ?? locale);
  const displayLanguage = LANGUAGES_FOR_UI.find(
    (language) => language.code === displayValue,
  );

  return (
    <SettingsDropdown<SupportedLocale>
      ref={ref}
      options={LANGUAGE_OPTIONS}
      value={displayValue}
      accessibilityLabel={`${t('settings.language')}: ${displayLanguage?.nativeName ?? displayValue}`}
      onSelect={async (v) => {
        await changeLanguage(v);
      }}
      measureRef={measureRef}
      fullWidth={fullWidth}
      variant={variant}
      dropdownWidth={matchDropdownToTrigger ? 'matchTrigger' : 'full'}
      showTriggerLabel={showTriggerLabel}
    />
  );
});
