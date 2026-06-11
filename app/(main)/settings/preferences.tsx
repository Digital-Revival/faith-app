import { useRef } from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { SettingsCard } from './_components/SettingsCard';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useThemePreference } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { createElement } from 'react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeSwitcher } from './_components/ThemeSwitcher';
import { LANGUAGES_FOR_UI } from '@/i18n';
import { THEME_OPTIONS } from './_components/ThemeSwitcher';
import { useNavigation } from "expo-router/react-navigation";
import { SETTINGS_SECTIONS } from './_config/settingsSections';

export default function PreferencesSettingsScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { preference } = useThemePreference();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const languageRef = useRef<{ open: () => void }>(null);
  const themeRef = useRef<{ open: () => void }>(null);

  const section = SETTINGS_SECTIONS.find((s) => s.id === 'preferences');
  const rows = section?.rows ?? [];

  const languageValue =
    LANGUAGES_FOR_UI.find((l) => l.code === locale)?.nativeName ?? 'English';
  const themeValue =
    THEME_OPTIONS.find((o) => o.value === preference)?.labelKey ?? 'settings.themeSystem';

  return (
    <Box
      className="flex-1 px-6"
      style={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        backgroundColor: theme.pageBg,
      }}
    >
      <MainTopBar
        title={t('settings.preferences')}
        currentSection="settings"
        showBackButton
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 32,
        }}
      >
        <Box className="mb-6">
          <Text
            className="text-sm font-medium uppercase tracking-wider mb-2 px-1"
            style={{ color: theme.textTertiary }}
          >
            {t(section?.titleKey ?? 'settings.preferences')}
          </Text>
          <Box className="gap-2">
            {rows.map((row) => {
              const Component = row.component;
              const componentProps = (row.componentProps ?? {}) as Record<string, unknown>;
              const ref =
                row.id === 'language' ? languageRef : row.id === 'theme' ? themeRef : null;
              const valueLabel =
                row.id === 'language'
                  ? languageValue
                  : row.id === 'theme'
                    ? t(themeValue)
                    : '';

              if (!ref) return null;

              return (
                <SettingsCard
                  key={row.id}
                  icon={row.icon}
                  titleKey={row.labelKey}
                  valueLabel={valueLabel}
                  openRef={ref}
                >
                  {createElement(Component, { ...componentProps, ref })}
                </SettingsCard>
              );
            })}
          </Box>
        </Box>
      </ScrollView>
    </Box>
  );
}
