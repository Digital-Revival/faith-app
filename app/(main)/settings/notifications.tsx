import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { SettingRow } from './_components/SettingRow';
import { useTheme } from '@/hooks/useTheme';
import { useCardShadow } from '@/hooks/useShadows';
import { useTranslation } from '@/hooks/useTranslation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { createElement } from 'react';
import { useNavigation } from "expo-router/react-navigation";
import { SETTINGS_SECTIONS } from './_config/settingsSections';

export default function NotificationsSettingsScreen() {
  const theme = useTheme();
  const cardShadow = useCardShadow();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const section = SETTINGS_SECTIONS.find((s) => s.id === 'notifications');
  const rows = section?.rows ?? [];

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
        title={t('settings.notifications')}
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
            {t(section?.titleKey ?? 'settings.notifications')}
          </Text>
          <Box
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              ...cardShadow,
            }}
          >
            {rows.map((row, rowIndex) => {
              const Component = row.component;
              const componentProps = (row.componentProps ?? {}) as Record<string, unknown>;
              return (
                <Box
                  key={row.id}
                  style={{
                    borderTopWidth: rowIndex > 0 ? 1 : 0,
                    borderTopColor: theme.cardBorder,
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
