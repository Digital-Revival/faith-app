import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { APP_VERSION } from '@/constants/version';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useWhatsNew } from '@/hooks/useWhatsNew';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

interface VersionWhatsNewBadgeProps {
  onPress: () => void;
}

export function VersionWhatsNewBadge({ onPress }: VersionWhatsNewBadgeProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { hasUnreadWhatsNew } = useWhatsNew();

  return (
    <TouchableOpacity
      onPress={() => {
        bzzt();
        onPress();
      }}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('app.versionWhatsNewButton', { version: APP_VERSION })}
      className="cursor-pointer"
      style={{ alignSelf: 'center' }}
    >
      <HStack
        className="items-center gap-2 px-3.5 py-2"
        style={{
          position: 'relative',
          backgroundColor: theme.tabInactiveBg,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: hasUnreadWhatsNew ? theme.buttonPrimary : theme.cardBorder,
        }}
      >
        <Ionicons
          name="sparkles-outline"
          size={14}
          color={hasUnreadWhatsNew ? theme.buttonPrimary : theme.textSecondary}
        />
        <Text
          className="text-xs font-semibold"
          style={{ color: theme.textSecondary }}
        >
          {t('app.versionWhatsNewButton', { version: APP_VERSION })}
        </Text>
        <Ionicons name="chevron-forward" size={12} color={theme.textTertiary} />
        {hasUnreadWhatsNew && (
          <Box
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.buttonDecline,
            }}
          />
        )}
      </HStack>
    </TouchableOpacity>
  );
}

const __expoRouterPrivateRoute_VersionWhatsNewBadge = () => null;

export default __expoRouterPrivateRoute_VersionWhatsNewBadge;
