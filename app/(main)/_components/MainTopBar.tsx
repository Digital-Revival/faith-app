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
  /** Same layout as default; slightly larger touch targets and text (simple mode). */
  enlarged?: boolean;
  onBack?: () => void;
}

export function MainTopBar({
  title,
  currentSection,
  showBackButton = false,
  showNotifications = true,
  enlarged = false,
  onBack,
}: MainTopBarProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handleBack = () => {
    bzzt();
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleOpenDrawer = () => {
    bzzt();
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const barMinHeight = enlarged ? 52 : 44;
  const backIconSize = enlarged ? 24 : 22;
  const backTextClass = enlarged ? 'text-lg font-medium' : 'text-base font-medium';
  const backPadding = enlarged ? 'gap-2 pl-4 pr-5 py-3' : 'gap-2 pl-3 pr-4 py-2';
  const titleClass = enlarged ? 'text-2xl font-semibold' : 'text-xl font-semibold';
  const menuIconSize = enlarged ? 22 : 20;
  const menuPaddingH = enlarged ? 14 : 12;
  const menuPaddingV = enlarged ? 10 : 8;
  const titleInsetLeft = showBackButton ? (enlarged ? 128 : 118) : enlarged ? 98 : 88;

  return (
    <HStack
      className="items-center justify-between mb-2"
      style={{ minHeight: barMinHeight, paddingVertical: enlarged ? 4 : 12 }}
    >
      <Box
        className="items-start justify-center"
        style={{ minHeight: barMinHeight, minWidth: enlarged ? 108 : 80 }}
      >
        {showBackButton ? (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            className={`flex-row items-center cursor-pointer rounded-full -ml-2 ${backPadding}`}
            style={{
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <Ionicons
              name="chevron-back"
              size={backIconSize}
              color={theme.textPrimary}
            />
            <Text
              className={backTextClass}
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
          left: titleInsetLeft,
          right: enlarged ? 108 : 100,
          top: 0,
          bottom: 0,
        }}
        pointerEvents="box-none"
      >
        <Text
          className={`${titleClass} text-center`}
          style={{ color: theme.textPrimary }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </Box>
      <Box
        className="flex-row items-center justify-end gap-2"
        style={{ minHeight: barMinHeight }}
      >
        {showNotifications && !enlarged ? <NotificationDropdown /> : null}
        <TouchableOpacity
          onPress={handleOpenDrawer}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('bibleschool.simpleMode.openMenu')}
          className="cursor-pointer"
          style={{
            paddingHorizontal: menuPaddingH,
            paddingVertical: menuPaddingV,
            borderRadius: enlarged ? 12 : 10,
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
          <Ionicons name="menu" size={menuIconSize} color={theme.textPrimary} />
        </TouchableOpacity>
      </Box>
    </HStack>
  );
}

const __expoRouterPrivateRoute_MainTopBar = () => null;

export default __expoRouterPrivateRoute_MainTopBar;
