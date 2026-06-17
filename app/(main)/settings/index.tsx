import { Box } from '@/components/ui/box';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { SectionCard } from '@/app/(main)/_components/SectionCard';
import { useTheme } from '@/hooks/useTheme';
import { routes } from '@/constants/routes';
import { router } from 'expo-router';
import { useTranslation } from '@/hooks/useTranslation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { getProfileReturnHref } from '@/hooks/useLastSectionRestore';
import { useWhatsNew } from '@/hooks/useWhatsNew';

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { hasUnreadWhatsNew } = useWhatsNew();

  const handleBack = () => {
    getProfileReturnHref().then((href) => {
      if (href && !href.includes('profile') && !href.includes('settings')) {
        router.replace(href as never);
      } else {
        router.replace(routes.main() as never);
      }
    });
  };

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
        title={t('navbar.settings')}
        currentSection="settings"
        showBackButton
        onBack={handleBack}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 32,
        }}
      >
        <VStack className="gap-3">
          <SectionCard
            icon="color-palette"
            title={t('settings.preferences')}
            subtitle={t('settings.preferencesSubtitle')}
            onPress={() => router.push(routes.settings('preferences'))}
            compact
          />
          <SectionCard
            icon="videocam"
            title={t('settings.video')}
            subtitle={t('settings.videoSubtitle')}
            onPress={() => router.push(routes.settings('video'))}
            compact
          />
          <SectionCard
            icon="notifications"
            title={t('settings.notifications')}
            subtitle={t('settings.notificationsSubtitle')}
            onPress={() => router.push(routes.settings('notifications'))}
            compact
          />
          <SectionCard
            icon="sparkles-outline"
            title={t('settings.whatsNew')}
            subtitle={t('settings.whatsNewSubtitle')}
            onPress={() => router.push(routes.settings('whats-new'))}
            badge={hasUnreadWhatsNew ? t('whatsNew.badgeNew') : undefined}
            compact
          />
        </VStack>
      </ScrollView>
    </Box>
  );
}
