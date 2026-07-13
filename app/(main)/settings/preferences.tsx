import { useRef , createElement } from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { SettingsCard } from './_components/SettingsCard';
import { SettingRow } from './_components/SettingRow';
import { useTheme } from '@/hooks/useTheme';
import { useCardShadow } from '@/hooks/useShadows';
import { useTranslation } from '@/hooks/useTranslation';
import { useThemePreference } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { THEME_OPTIONS } from './_components/ThemeSwitcher';
import { LANGUAGES_FOR_UI } from '@/i18n';
import { useNavigation } from "expo-router/react-navigation";
import { SETTINGS_SECTIONS } from './_config/settingsSections';

export default function PreferencesSettingsScreen() {
  const theme = useTheme();
  const cardShadow = useCardShadow();
  const { t, locale } = useTranslation();
  const { preference } = useThemePreference();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const languageRef = useRef<{ open: () => void }>(null);
  const themeRef = useRef<{ open: () => void }>(null);

  const getPickerRef = (rowId: string) => {
    if (rowId === 'language') return languageRef;
    if (rowId === 'theme') return themeRef;
    return undefined;
  };

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
              const pickerRef = getPickerRef(row.id);

              if (pickerRef) {
                const valueLabel =
                  row.id === 'language'
                    ? languageValue
                    : row.id === 'theme'
                      ? t(themeValue)
                      : '';

                return (
                  <SettingsCard
                    key={row.id}
                    icon={row.icon}
                    titleKey={row.labelKey}
                    valueLabel={valueLabel}
                    openRef={pickerRef}
                  >
                    {createElement(Component, { ...componentProps, ref: pickerRef })}
                  </SettingsCard>
                );
              }

              return (
                <Box
                  key={row.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    ...cardShadow,
                  }}
                >
                  <SettingRow
                    icon={row.icon}
                    labelKey={row.labelKey}
                    descriptionKey={row.descriptionKey}
                    isLast={row.isLast}
                    fullWidthChildren={row.fullWidthChildren}
                  >
                    {createElement(Component, componentProps)}
                  </SettingRow>
                </Box>
              );
            })}
          </Box>
        </Box>
      </ScrollView>
    </Box>
  );
}
