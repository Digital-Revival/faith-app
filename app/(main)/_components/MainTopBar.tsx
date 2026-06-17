import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from "expo-router/react-navigation";
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';

interface MainTopBarProps {
  title: string;
  currentSection: string;
  showBackButton?: boolean;
  showNotifications?: boolean;
  onBack?: () => void;
}

export function MainTopBar({
  title,
  currentSection,
  showBackButton = false,
  showNotifications = true,
  onBack,
}: MainTopBarProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <HStack
      className="items-center justify-between py-3 mb-2"
      style={{ minHeight: 44 }}
    >
      <Box className="w-20 items-start justify-center" style={{ minHeight: 44 }}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={() => {
              bzzt();
              if (onBack) {
                onBack();
              } else {
                router.back();
              }
            }}
            activeOpacity={0.7}
            className="flex-row items-center gap-2 cursor-pointer rounded-full pl-3 pr-4 py-2 -ml-2"
            style={{
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
            <Text
              className="text-base font-medium"
              style={{ color: theme.textPrimary }}
            >
              {t('common.back')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </Box>
      <Box
        className="flex-1 items-center justify-center px-2"
        style={{
          position: 'absolute',
          left: showBackButton ? 118 : 88,
          right: 100,
          top: 0,
          bottom: 0,
        }}
        pointerEvents="box-none"
      >
        <Text
          className="text-xl font-semibold text-center"
          style={{ color: theme.textPrimary }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </Box>
      <Box
        className="flex-row items-center justify-end gap-2"
        style={{ minHeight: 44 }}
      >
        {showNotifications && <NotificationDropdown />}
        <TouchableOpacity
          onPress={() => {
            bzzt();
            navigation.dispatch(DrawerActions.openDrawer());
          }}
          activeOpacity={0.7}
          className="cursor-pointer"
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: theme.cardBg,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme.isDark ? 0.2 : 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Ionicons name="menu" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </Box>
    </HStack>
  );
}

const __expoRouterPrivateRoute_MainTopBar = () => null;

export default __expoRouterPrivateRoute_MainTopBar;
