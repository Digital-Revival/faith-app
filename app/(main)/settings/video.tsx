import { useRef } from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { SettingsCard } from './_components/SettingsCard';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useVideoSetting } from '@/hooks/useVideoSetting';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { createElement } from 'react';
import { VideoQualitySelector } from './_components/VideoQualitySelector';
import { VIDEO_QUALITY_OPTIONS } from './_components/VideoQualitySelector';
import { useNavigation } from "expo-router/react-navigation";
import { SETTINGS_SECTIONS } from './_config/settingsSections';

export default function VideoSettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [videoValue, , videoLoading] = useVideoSetting();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const videoRef = useRef<{ open: () => void }>(null);

  const section = SETTINGS_SECTIONS.find((s) => s.id === 'video');
  const rows = section?.rows ?? [];

  const videoValueLabel =
    videoLoading
      ? '...'
      : t(
          VIDEO_QUALITY_OPTIONS.find((o) => o.value === videoValue)?.labelKey ??
            'settings.videoQualityAuto',
        );

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
        title={t('settings.video')}
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
            {t(section?.titleKey ?? 'settings.video')}
          </Text>
          <Box className="gap-2">
            {rows.map((row) => {
              const Component = row.component;
              const componentProps = (row.componentProps ?? {}) as Record<string, unknown>;
              const ref = row.id === 'video-quality' ? videoRef : null;

              if (!ref) return null;

              return (
                <SettingsCard
                  key={row.id}
                  icon={row.icon}
                  titleKey={row.labelKey}
                  valueLabel={videoValueLabel}
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
