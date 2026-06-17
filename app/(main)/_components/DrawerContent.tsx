import { StreakPill } from '@/components/ui/StreakPill';
import { useStreak } from '@/hooks/useStreak';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/contexts/AuthContext';
import { useSectionNavigation } from '@/contexts/SectionNavigationContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserProfile } from '@/hooks/useUserProfile';
import { VersionWhatsNewBadge } from '@/app/(main)/_components/VersionWhatsNewBadge';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePathname, router } from 'expo-router';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/queryKeys';
import { bibleschoolService } from '@/services/storyblok/bibleschoolService';
import { routes } from '@/constants/routes';
import { saveProfileReturnHref } from '@/hooks/useLastSectionRestore';

const CONTENT_SECTIONS: {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  enabled?: boolean;
}[] = [
  { name: 'index', icon: 'home', labelKey: 'navbar.home', enabled: true },
  { name: 'bibleschool', icon: 'school', labelKey: 'hub.bibleschool', enabled: true },
  { name: 'faith-business-school', icon: 'business', labelKey: 'hub.faithBusinessSchool', enabled: true },
  { name: 'healing-school', icon: 'heart', labelKey: 'hub.healingSchool', enabled: false },
  { name: 'sermons', icon: 'videocam', labelKey: 'hub.sermons', enabled: false },
  { name: 'podcasts', icon: 'mic', labelKey: 'hub.podcasts', enabled: false },
  { name: 'bible-verses-learn', icon: 'book', labelKey: 'hub.bibleVersesLearn', enabled: false },
  { name: 'audiobooks', icon: 'headset', labelKey: 'hub.audiobooks', enabled: false },
  { name: 'giving', icon: 'gift', labelKey: 'hub.giving', enabled: false },
  { name: 'miracles', icon: 'sparkles', labelKey: 'hub.miracles', enabled: false },
  { name: 'bible-reading-schedule', icon: 'calendar', labelKey: 'hub.bibleReadingSchedule', enabled: false },
];

const ACCOUNT_SECTIONS: {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  enabled?: boolean;
}[] = [
  { name: 'profile', icon: 'person', labelKey: 'navbar.profile', enabled: true },
  { name: 'settings', icon: 'settings', labelKey: 'navbar.settings', enabled: true },
];

const ADMIN_SECTIONS: {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  enabled?: boolean;
}[] = [
  { name: 'admin', icon: 'stats-chart', labelKey: 'admin.overview', enabled: true },
  { name: 'admin/analytics', icon: 'school', labelKey: 'admin.analytics', enabled: true },
  { name: 'admin/users', icon: 'people', labelKey: 'admin.users', enabled: true },
  { name: 'profile', icon: 'person', labelKey: 'navbar.profile', enabled: true },
  { name: 'settings', icon: 'settings', labelKey: 'navbar.settings', enabled: true },
];

const buttonStyle = (theme: ReturnType<typeof useTheme>) => ({
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
});

export function DrawerContent(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.bibleschool.category(locale),
      queryFn: () => bibleschoolService.getBibleschoolCategory(locale),
    });
  }, [queryClient, locale]);
  const insets = useSafeAreaInsets();
  const isAdmin = useIsAdmin();
  const { user, signOut } = useAuth();
  const { data: profile } = useUserProfile(user?.id);
  const { days: streakDays } = useStreak();
  const { startSectionNavigation } = useSectionNavigation();
  const { state, navigation } = props;
  const pathname = usePathname();
  const currentRoute = state.routes[state.index]?.name ?? '';
  const currentSection = currentRoute === 'index' ? 'index' : currentRoute.split('/')[0] ?? currentRoute;
  const contentSections = isAdmin ? [] : CONTENT_SECTIONS.filter((s) => s.enabled !== false);
  const sections = isAdmin
    ? ADMIN_SECTIONS
    : [...contentSections, ...ACCOUNT_SECTIONS];
  const displayName = profile?.full_name ?? t('navbar.profile');
  const displayEmail = profile?.email ?? user?.email ?? '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
  const isSectionSelected = (sectionName: string) => {
    if (sectionName === 'settings') {
      return pathname.includes('settings');
    }
    if (isAdmin && sectionName.startsWith('admin')) {
      if (sectionName === 'admin') {
        const onAdminIndex = pathname.endsWith('/admin') || pathname.endsWith('/admin/');
        return onAdminIndex && !pathname.includes('/admin/analytics') && !pathname.includes('/admin/users');
      }
      return pathname.includes(sectionName);
    }
    return currentSection === sectionName;
  };

  const handleSectionChange = (section: (typeof CONTENT_SECTIONS)[0] | (typeof ACCOUNT_SECTIONS)[0] | (typeof ADMIN_SECTIONS)[0]) => {
    if (!section.enabled) return;
    bzzt();
    startSectionNavigation(section.name);
    navigation.closeDrawer();
    if (section.name.includes('/')) {
      router.push(routes.admin(section.name.replace('admin/', '')) as never);
    } else if (section.name === 'settings') {
      saveProfileReturnHref(pathname || '/(main)').then(() => {
        navigation.navigate('settings' as never);
      });
    } else {
      const routeName =
        section.name === 'index'
          ? 'index'
          : section.name === 'profile'
            ? 'profile'
            : section.name;
      if (section.name === 'profile') {
        saveProfileReturnHref(pathname || '/(main)').then(() => {
          navigation.navigate(routeName as never);
        });
      } else {
        navigation.navigate(routeName as never);
      }
    }
  };

  return (
    <Box
      className="flex-1"
      style={{
        backgroundColor: theme.pageBg,
        paddingTop: insets.top + 12,
      }}
    >
      <HStack className="items-center justify-between px-4 pb-3">
        <StreakPill days={streakDays} />
        <TouchableOpacity
          onPress={() => {
            bzzt();
            navigation.closeDrawer();
          }}
          activeOpacity={0.7}
          className="items-center justify-center cursor-pointer"
          style={buttonStyle(theme)}
        >
          <Ionicons name="close" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </HStack>
      <Box
        className="px-4 pb-4"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <HStack className="items-center gap-3">
          <Box
            className="rounded-full w-12 h-12 items-center justify-center overflow-hidden"
            style={{ backgroundColor: theme.avatarPrimary }}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 48, height: 48 }}
                contentFit="cover"
                accessibilityLabel={displayName}
              />
            ) : (
              <Text
                className="text-base font-semibold"
                style={{ color: theme.textSecondary }}
              >
                {initials}
              </Text>
            )}
          </Box>
          <VStack className="flex-1 min-w-0">
            <Text
              className="text-base font-semibold"
              style={{ color: theme.textPrimary }}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.textSecondary }}
              numberOfLines={1}
            >
              {displayEmail}
            </Text>
          </VStack>
        </HStack>
      </Box>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 4,
          paddingBottom: insets.bottom + 120,
        }}
      >
        <VStack className="gap-0">
          {sections.map((section, index) => {
            const isSelected = isSectionSelected(section.name);
            const enabled = section.enabled !== false;
            const isFirstAccountSection =
              !isAdmin &&
              section.name === 'profile' &&
              CONTENT_SECTIONS.length > 0;
            return (
              <Box key={section.name}>
                {index > 0 && !isFirstAccountSection && (
                  <Box
                    style={{
                      height: 1,
                      backgroundColor: theme.cardBorder,
                      marginHorizontal: 8,
                    }}
                  />
                )}
                {isFirstAccountSection && (
                  <Box className="pt-4 pb-2 px-4">
                    <Text
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: theme.textTertiary }}
                    >
                      {t('navbar.account')}
                    </Text>
                  </Box>
                )}
                {isFirstAccountSection && (
                  <Box
                    style={{
                      height: 1,
                      backgroundColor: theme.cardBorder,
                      marginHorizontal: 8,
                      marginBottom: 4,
                    }}
                  />
                )}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSectionChange(section)}
                  disabled={!enabled}
                  className="cursor-pointer"
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    backgroundColor: isSelected
                      ? theme.isDark
                        ? 'rgba(23, 23, 23, 0.3)'
                        : 'rgba(23, 23, 23, 0.08)'
                      : 'transparent',
                    opacity: enabled ? 1 : 0.5,
                  }}
                >
                  <HStack className="items-center gap-3">
                    <Ionicons
                      name={
                        isSelected
                          ? section.icon
                          : (`${section.icon}-outline` as typeof section.icon)
                      }
                      size={22}
                      color={
                        isSelected
                          ? theme.buttonPrimary
                          : theme.textSecondary
                      }
                    />
                    <Text
                      className="flex-1 text-base font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      {t(section.labelKey)}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.buttonPrimary}
                      />
                    )}
                  </HStack>
                </TouchableOpacity>
              </Box>
            );
          })}
        </VStack>
      </ScrollView>
      <VStack
        className="px-4 gap-3"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 12,
          paddingBottom: insets.bottom + 8,
          backgroundColor: theme.pageBg,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            bzzt();
            navigation.closeDrawer();
            router.push(routes.feedback());
          }}
          activeOpacity={0.7}
          className="cursor-pointer"
          style={{
            paddingVertical: 14,
            paddingHorizontal: 12,
          }}
        >
          <HStack className="items-center gap-3">
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color={theme.textSecondary}
            />
            <Text
              className="flex-1 text-base font-semibold"
              style={{ color: theme.textPrimary }}
            >
              {t('navbar.feedback')}
            </Text>
          </HStack>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            bzzt();
            navigation.closeDrawer();
            signOut();
          }}
          activeOpacity={0.7}
          className="rounded-full py-4 px-6 cursor-pointer items-center justify-center"
          style={{
            backgroundColor: theme.buttonDecline,
          }}
        >
          <HStack className="items-center gap-2">
            <Ionicons name="log-out-outline" size={20} color={theme.buttonDeclineContrast} />
            <Text
              className="text-base font-semibold"
              style={{ color: theme.buttonDeclineContrast }}
            >
              {t('home.signOut')}
            </Text>
          </HStack>
        </TouchableOpacity>
        <VersionWhatsNewBadge
          onPress={() => {
            navigation.closeDrawer();
            router.push(routes.settings('whats-new'));
          }}
        />
      </VStack>
    </Box>
  );
}

const __expoRouterPrivateRoute_DrawerContent = () => null;

export default __expoRouterPrivateRoute_DrawerContent;
