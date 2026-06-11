import { Text } from '@/components/ui/text';
import { routes } from '@/constants/routes';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from "expo-router/js-tabs";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { memo, useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface TabItem {
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
}

const TAB_CONFIG: Record<string, TabItem[]> = {
  bibleschool: [
    { route: 'index', icon: 'home', labelKey: 'navbar.overview' },
    { route: 'modules', icon: 'library', labelKey: 'navbar.modules' },
  ],
  podcasts: [{ route: 'index', icon: 'mic', labelKey: 'navbar.browse' }],
  sermons: [{ route: 'index', icon: 'videocam', labelKey: 'navbar.latest' }],
};

interface CustomTabBarProps extends BottomTabBarProps {
  section: keyof typeof TAB_CONFIG;
}

const SPRING_CONFIG = { damping: 18, stiffness: 400 };

const AnimatedTabPill = memo(function AnimatedTabPill({
  isFocused,
  children,
}: {
  isFocused: boolean;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.04 : 1, SPRING_CONFIG);
  }, [isFocused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[animatedStyle, { width: '100%' }]}>{children}</Animated.View>;
});

export function CustomTabBar({ state, descriptors, navigation, section }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.isDark;

  const tabItems = TAB_CONFIG[section];
  if (!tabItems || tabItems.length <= 1) return null;

  const inactiveIconColor = theme.tabInactiveText;
  const inactiveTextColor = theme.tabInactiveText;
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom,
        left: 16,
        right: 16,
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
        {state.routes.map((route) => {
          const index = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === index;
          const routeName = route.name;
          const tabItem = tabItems.find((t) => t.route === routeName);
          if (!tabItem) return null;
          const config = { icon: tabItem.icon, label: t(tabItem.labelKey) };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              bzzt();
              if (section === 'bibleschool') {
                const href = routeName === 'modules' ? routes.bibleschoolModules() : routes.bibleschool();
                router.navigate(href);
              } else {
                if (!isFocused) {
                  navigation.navigate(route.name as never);
                }
              }
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
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
              }}
            >
              {isFocused ? (
                <AnimatedTabPill isFocused={isFocused}>
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
                    <View style={{ height: 20, justifyContent: 'center' }}>
                      <Ionicons
                        name={config.icon as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={theme.buttonPrimaryContrast}
                      />
                    </View>
                    <View style={{ height: 12, justifyContent: 'center' }}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '600',
                          color: theme.buttonPrimaryContrast,
                          lineHeight: 12,
                        }}
                      >
                        {config.label}
                    </Text>
                  </View>
                </LinearGradient>
                </AnimatedTabPill>
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
                  <View style={{ height: 20, justifyContent: 'center' }}>
                    <Ionicons
                      name={
                        (config.icon === 'ellipsis-horizontal'
                          ? 'ellipsis-horizontal'
                          : `${config.icon}-outline`) as keyof typeof Ionicons.glyphMap
                      }
                      size={20}
                      color={inactiveIconColor}
                    />
                  </View>
                  <View style={{ height: 12, justifyContent: 'center' }}>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '500',
                        color: inactiveTextColor,
                        lineHeight: 12,
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

const __expoRouterPrivateRoute_CustomTabBar = () => null;

export default __expoRouterPrivateRoute_CustomTabBar;
