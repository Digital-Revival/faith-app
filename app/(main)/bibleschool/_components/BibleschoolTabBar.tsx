import { Text } from '@/components/ui/text';
import { useBibleschoolTab } from '@/contexts/BibleschoolTabContext';
import { useBibleschoolSimpleMode } from '@/contexts/BibleschoolSimpleModeContext';
import { routes } from '@/constants/routes';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ALL_TABS = [
  { route: 'index' as const, href: () => routes.bibleschool(), icon: 'home' as const, labelKey: 'navbar.overview' },
  { route: 'modules' as const, href: () => routes.bibleschoolModules(), icon: 'library' as const, labelKey: 'navbar.modules' },
  { route: 'voortgang' as const, href: () => routes.bibleschoolVoortgang(), icon: 'stats-chart' as const, labelKey: 'navbar.voortgang' },
];

const SIMPLE_MODE_TABS = [
  { route: 'index' as const, href: () => routes.bibleschool(), icon: 'play-circle' as const, labelKey: 'bibleschool.simpleMode.tabWatch' },
  { route: 'modules' as const, href: () => routes.bibleschoolModules(), icon: 'book' as const, labelKey: 'bibleschool.simpleMode.tabLessons' },
];

function resolveSimpleModeTab(pathname: string): 'index' | 'modules' {
  const segments = pathname.split('/').filter(Boolean);
  const modulesIndex = segments.indexOf('modules');
  if (modulesIndex === -1) return 'index';
  const segmentsAfterModules = segments.length - modulesIndex - 1;
  return segmentsAfterModules <= 1 ? 'modules' : 'index';
}

function BibleschoolTabBarInner() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const { enabled: simpleMode } = useBibleschoolSimpleMode();
  const { activeTab, setActiveTab, setNavigationDirection } = useBibleschoolTab();
  const mode = simpleMode
    ? {
        tabs: SIMPLE_MODE_TABS,
        selectedTab: resolveSimpleModeTab(pathname),
        syncActiveTab: false,
        iconSize: 24,
        iconHeight: 24,
        labelSize: 14,
        labelHeight: 18,
        verticalPadding: 9,
        horizontalPadding: 10,
        gap: 4,
      }
    : {
        tabs: ALL_TABS,
        selectedTab: activeTab,
        syncActiveTab: true,
        iconSize: 20,
        iconHeight: 20,
        labelSize: 10,
        labelHeight: 12,
        verticalPadding: 8,
        horizontalPadding: 8,
        gap: 3,
      };
  const { tabs, selectedTab } = mode;
  const isDark = theme.isDark;
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const inactiveIconColor = theme.tabInactiveText;
  const inactiveTextColor = theme.tabInactiveText;

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
          const isFocused = tab.route === selectedTab;
          const label = t(tab.labelKey);

          const onPress = () => {
            bzzt();
            const currentIndex = tabs.findIndex((t) => t.route === selectedTab);
            const targetIndex = tabs.findIndex((t) => t.route === tab.route);
            setNavigationDirection(targetIndex < currentIndex ? 'left' : 'right');
            if (mode.syncActiveTab) {
              setActiveTab(tab.route);
            }
            router.navigate(tab.href());
          };

          return (
            <TouchableOpacity
              key={tab.route}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
                paddingHorizontal: 0,
              }}
            >
              {isFocused ? (
                <View
                  style={{
                    backgroundColor: theme.buttonPrimary,
                    borderRadius: 16,
                    paddingVertical: mode.verticalPadding,
                    paddingHorizontal: mode.horizontalPadding,
                    shadowColor: theme.buttonPrimary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isDark ? 0.15 : 0.25,
                    shadowRadius: 6,
                    elevation: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: mode.gap,
                    width: '100%',
                  }}
                >
                  <View style={{ height: mode.iconHeight, justifyContent: 'center' }}>
                    <Ionicons
                      name={tab.icon}
                      size={mode.iconSize}
                      color={theme.buttonPrimaryContrast}
                    />
                  </View>
                  <View style={{ minHeight: mode.labelHeight, justifyContent: 'center' }}>
                      <Text
                        style={{
                          fontSize: mode.labelSize,
                          fontWeight: '600',
                          color: theme.buttonPrimaryContrast,
                          lineHeight: mode.labelHeight,
                        }}
                      >
                        {label}
                      </Text>
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: mode.gap,
                    paddingVertical: mode.verticalPadding,
                    paddingHorizontal: mode.horizontalPadding,
                  }}
                >
                  <View style={{ height: mode.iconHeight, justifyContent: 'center' }}>
                    <Ionicons
                      name={`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap}
                      size={mode.iconSize}
                      color={inactiveIconColor}
                    />
                  </View>
                  <View style={{ minHeight: mode.labelHeight, justifyContent: 'center' }}>
                      <Text
                        style={{
                          fontSize: mode.labelSize,
                          fontWeight: '500',
                          color: inactiveTextColor,
                          lineHeight: mode.labelHeight,
                        }}
                      >
                        {label}
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
