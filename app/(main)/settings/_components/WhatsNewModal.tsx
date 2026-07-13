import { Button, ButtonText } from '@/components/ui/button';
import { BaseModal } from '@/components/ui/BaseModal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { WhatsNewRelease } from '@/constants/whatsNew';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { WhatsNewContent } from './WhatsNewContent';

interface WhatsNewModalProps {
  visible: boolean;
  unreadReleases: WhatsNewRelease[];
  onDismiss: () => void;
  onViewAll: () => void;
}

export function WhatsNewModal({
  visible,
  unreadReleases,
  onDismiss,
  onViewAll,
}: WhatsNewModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const modalContentHeight = Math.min(
    680,
    Math.max(280, windowHeight - 96),
  );

  return (
    <BaseModal
      visible={visible}
      onRequestClose={onDismiss}
      maxWidth={360}
      closeOnOverlayPress
    >
      <View style={{ height: modalContentHeight }}>
        <Text
          className="text-lg font-semibold mb-1 text-center"
          style={{ color: theme.textPrimary }}
        >
          {t('whatsNew.title')}
        </Text>
        <Text
          className="text-sm text-center leading-5 mb-4"
          style={{ color: theme.textSecondary }}
        >
          {t('whatsNew.subtitle')}
        </Text>

        <ScrollView
          showsVerticalScrollIndicator
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          nestedScrollEnabled
        >
          <WhatsNewContent variant="modal" releases={unreadReleases} />
        </ScrollView>

        <VStack className="gap-3 mt-5">
          <Button
            onPress={() => {
              bzzt();
              onDismiss();
            }}
            action="primary"
            variant="solid"
            size="md"
            className="w-full h-11 cursor-pointer rounded-full"
            style={{ backgroundColor: theme.buttonPrimary }}
          >
            <ButtonText
              className="text-sm font-semibold"
              style={{ color: theme.buttonPrimaryContrast }}
            >
              {t('whatsNew.gotIt')}
            </ButtonText>
          </Button>
          <Button
            onPress={() => {
              bzzt();
              onViewAll();
            }}
            variant="outline"
            size="md"
            className="w-full h-11 cursor-pointer rounded-full"
            style={{ borderColor: theme.cardBorder }}
          >
            <ButtonText
              className="text-sm font-medium"
              style={{ color: theme.textSecondary }}
            >
              {t('whatsNew.viewAll')}
            </ButtonText>
          </Button>
        </VStack>
      </View>
    </BaseModal>
  );
}

const __expoRouterPrivateRoute_WhatsNewModal = () => null;

export default __expoRouterPrivateRoute_WhatsNewModal;
