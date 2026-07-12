import { Text } from '@/components/ui/text';
import { useBibleschoolTab } from '@/contexts/BibleschoolTabContext';
import { useEasyRead } from '@/contexts/EasyReadContext';
import { routes } from '@/constants/routes';
import { useEasyReadTypography } from '@/hooks/useEasyReadTypography';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { memo, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ALL_TABS = [
  { route: 'index' as const, href: () => routes.bibleschool(), icon: 'home' as const, labelKey: 'navbar.overview' },
  { route: 'modules' as const, href: () => routes.bibleschoolModules(), icon: 'library' as const, labelKey: 'navbar.modules' },
  { route: 'voortgang' as const, href: () => routes.bibleschoolVoortgang(), icon: 'stats-chart' as const, labelKey: 'navbar.voortgang' },
];

function BibleschoolTabBarInner() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { enabled: easyReadEnabled } = useEasyRead();
  const { scaleFontSize, scaleIconSize, minTouchTargetStyle } =
    useEasyReadTypography();
  const { activeTab, setActiveTab, setNavigationDirection } = useBibleschoolTab();
  const isDark = theme.isDark;
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const inactiveIconColor = theme.tabInactiveText;
  const inactiveTextColor = theme.tabInactiveText;

  const tabs = useMemo(
    () =>
      easyReadEnabled
        ? ALL_TABS.filter((tab) => tab.route !== 'voortgang')
        : ALL_TABS,
    [easyReadEnabled],
  );

  const labelFontSize = scaleFontSize(easyReadEnabled ? 14 : 10);
  const labelLineHeight = scaleFontSize(easyReadEnabled ? 18 : 12);
  const iconSize = scaleIconSize(20);
  const iconContainerHeight = scaleIconSize(20);
  const labelContainerHeight = scaleFontSize(easyReadEnabled ? 18 : 12);

  const getIsFocused = (tab: (typeof ALL_TABS)[0]) => {
    return tab.route === activeTab;
  };

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingBottom: insets.bottom,
        paddingTop: 8,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.cardBg,
          borderRadius: 24,
          paddingVertical: 4,
          paddingHorizontal: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.25 : 0.1,
          shadowRadius: 24,
          elevation: 12,
          borderWidth: 1,
          borderColor,
        }}
      >
        {tabs.map((tab) => {
          const isFocused = getIsFocused(tab);
          const config = { icon: tab.icon, label: t(tab.labelKey) };

          const onPress = () => {
            bzzt();
            const currentIndex = tabs.findIndex((item) => item.route === activeTab);
            const targetIndex = tabs.findIndex((item) => item.route === tab.route);
            setNavigationDirection(targetIndex < currentIndex ? 'left' : 'right');
            setActiveTab(tab.route);
            router.navigate(tab.href());
          };

          return (
            <TouchableOpacity
              key={tab.route}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
                paddingHorizontal: 0,
                ...minTouchTargetStyle,
              }}
            >
              {isFocused ? (
                <LinearGradient
                  colors={[theme.buttonPrimary, theme.buttonPrimary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    shadowColor: theme.buttonPrimary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isDark ? 0.15 : 0.25,
                    shadowRadius: 6,
                    elevation: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    width: '100%',
                  }}
                >
                  <View style={{ height: iconContainerHeight, justifyContent: 'center' }}>
                    <Ionicons
                      name={config.icon}
                      size={iconSize}
                      color={theme.buttonPrimaryContrast}
                    />
                  </View>
                  <View style={{ height: labelContainerHeight, justifyContent: 'center' }}>
                    <Text
                      style={{
                        fontSize: labelFontSize,
                        fontWeight: '600',
                        color: theme.buttonPrimaryContrast,
                        lineHeight: labelLineHeight,
                      }}
                    >
                      {config.label}
                    </Text>
                  </View>
                </LinearGradient>
              ) : (
                <View
                  style={{
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                  }}
                >
                  <View style={{ height: iconContainerHeight, justifyContent: 'center' }}>
                    <Ionicons
                      name={`${config.icon}-outline` as keyof typeof Ionicons.glyphMap}
                      size={iconSize}
                      color={inactiveIconColor}
                    />
                  </View>
                  <View style={{ height: labelContainerHeight, justifyContent: 'center' }}>
                    <Text
                      style={{
                        fontSize: labelFontSize,
                        fontWeight: '500',
                        color: inactiveTextColor,
                        lineHeight: labelLineHeight,
                      }}
                    >
                      {config.label}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export const BibleschoolTabBar = memo(BibleschoolTabBarInner);

const __expoRouterPrivateRoute_BibleschoolTabBar = () => null;

export default __expoRouterPrivateRoute_BibleschoolTabBar;
