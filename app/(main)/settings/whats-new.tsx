import { useEffect } from 'react';
import { Box } from '@/components/ui/box';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Text } from '@/components/ui/text';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useWhatsNew } from '@/hooks/useWhatsNew';
import { useToast } from '@/hooks/useToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { useNavigation } from 'expo-router/react-navigation';
import { WhatsNewContent } from './_components/WhatsNewContent';

export default function WhatsNewScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { allReleases, isLoading, markSeen } = useWhatsNew();

  useEffect(() => {
    void markSeen().catch(() => {
      toast.error(t('whatsNew.markSeenError'));
    });
  }, [markSeen, t, toast]);

  if (isLoading) {
    return <LoadingScreen message={t('common.loading')} />;
  }

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
        title={t('whatsNew.title')}
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
        <Box className="mb-2">
          <Text
            className="text-sm leading-6 mb-6 px-1"
            style={{ color: theme.textSecondary }}
          >
            {t('whatsNew.subtitle')}
          </Text>
          <WhatsNewContent variant="full" releases={allReleases} />
        </Box>
      </ScrollView>
    </Box>
  );
}
