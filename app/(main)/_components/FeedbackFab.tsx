import { Text } from '@/components/ui/text';
import { routes } from '@/constants/routes';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { saveProfileReturnHref } from '@/hooks/useLastSectionRestore';
import { useButtonShadow } from '@/hooks/useShadows';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAB_HEIGHT = 48;

interface FeedbackFabProps {
  variant: 'default' | 'aboveTabBar' | 'aboveFooter';
}

export function FeedbackFab({ variant }: FeedbackFabProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const shadow = useButtonShadow();
  const pathname = usePathname();

  const bottom =
    variant === 'aboveTabBar'
      ? insets.bottom + 88
      : variant === 'aboveFooter'
        ? insets.bottom + 64
        : insets.bottom + 16;

  return (
    <TouchableOpacity
      onPress={() => {
        bzzt();
        saveProfileReturnHref(pathname || '/(main)').then(() => {
          router.push(routes.feedback());
        });
      }}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('navbar.feedback')}
      style={{
        position: 'absolute',
        right: 20,
        bottom,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: FAB_HEIGHT,
        paddingHorizontal: 16,
        borderRadius: FAB_HEIGHT / 2,
        backgroundColor: theme.buttonPrimary,
        ...shadow,
      }}
    >
      <Ionicons
        name="chatbubble-ellipses"
        size={20}
        color={theme.buttonPrimaryContrast}
      />
      <Text
        className="text-sm font-semibold"
        style={{ color: theme.buttonPrimaryContrast }}
      >
        {t('navbar.feedback')}
      </Text>
    </TouchableOpacity>
  );
}
