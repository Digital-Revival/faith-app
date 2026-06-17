import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';

import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { SectionCard } from '@/app/(main)/_components/SectionCard';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useCompletedLessons } from '@/hooks/useCompletedLessons';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useStreak } from '@/hooks/useStreak';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserBadges } from '@/hooks/useUserBadges';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getProfileReturnHref } from '@/hooks/useLastSectionRestore';
import { bzzt } from '@/utils/haptics';
import { useAvatarUpload } from './_hooks/useAvatarUpload';

const TOTAL_LESSONS = 100;
const TOTAL_MODULES = 20;

function getInitials(fullName: string | null): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatMemberSince(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { userBadges, badges } = useUserBadges(user?.id);
  const { data: completedLessons } = useCompletedLessons(user?.id);
  const { data: moduleProgress } = useModuleProgress(user?.id);
  const { days: streakDays } = useStreak();
  const { pickAndUpload, isUploading } = useAvatarUpload(user?.id);

  const handleBack = () => {
    getProfileReturnHref().then((href) => {
      if (href && !href.includes('profile')) {
        router.replace(href as never);
      } else {
        router.replace(routes.main() as never);
      }
    });
  };

  if (profileLoading && user?.id) {
    return <LoadingScreen message={t('loading.section.profile')} />;
  }

  const lessonsCount = completedLessons?.length ?? 0;
  const modulesCount = moduleProgress?.filter((m) => m.status === 'completed').length ?? 0;
  const progressPercent = Math.round((lessonsCount / TOTAL_LESSONS) * 100);

  const recentBadges = userBadges
    .slice(0, 3)
    .map((ub) => badges.find((b) => b.id === ub.badge_id))
    .filter(Boolean);

  const initials = getInitials(profile?.full_name ?? null);
  const memberSince = profile?.created_at ? formatMemberSince(profile.created_at) : undefined;

  return (
    <Box
      className="flex-1 px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: 0, backgroundColor: theme.pageBg }}
    >
      <MainTopBar
        title={t('navbar.profile')}
        currentSection="profile"
        showBackButton
        onBack={handleBack}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: insets.bottom + 100 }}
      >
        <VStack className="gap-5 items-center">
          {/* Avatar */}
          <TouchableOpacity onPress={pickAndUpload} activeOpacity={0.8} disabled={isUploading}>
            <View style={{ position: 'relative' }}>
              <Box
                className="rounded-full w-20 h-20 items-center justify-center overflow-hidden"
                style={{ backgroundColor: theme.avatarPrimary }}
              >
                {isUploading ? (
                  <ActivityIndicator color={theme.textSecondary} />
                ) : profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={{ width: 80, height: 80 }}
                    contentFit="cover"
                  />
                ) : initials ? (
                  <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                    {initials}
                  </Text>
                ) : (
                  <Ionicons name="person" size={32} color={theme.textSecondary} />
                )}
              </Box>
              {!isUploading && (
                <Box
                  className="absolute bottom-0 right-0 rounded-full w-7 h-7 items-center justify-center"
                  style={{
                    backgroundColor: theme.buttonPrimary,
                    borderWidth: 2,
                    borderColor: theme.pageBg,
                  }}
                >
                  <Ionicons name="camera" size={13} color={theme.buttonPrimaryContrast} />
                </Box>
              )}
            </View>
          </TouchableOpacity>

          {/* Identity */}
          <VStack className="gap-1 items-center">
            <Text className="text-xl font-bold text-center" style={{ color: theme.textPrimary }}>
              {profile?.full_name ?? t('navbar.profile')}
            </Text>
            <Text className="text-sm text-center" style={{ color: theme.textSecondary }}>
              {profile?.email ?? user?.email ?? ''}
            </Text>
            {memberSince && (
              <Text className="text-xs text-center mt-0.5" style={{ color: theme.textTertiary }}>
                {t('profile.memberSince', { date: memberSince })}
              </Text>
            )}
          </VStack>

          {/* Progress card */}
          <Box
            className="w-full rounded-2xl p-5 gap-4"
            style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.cardBorder }}
          >
            <Text
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: theme.textSecondary }}
            >
              {t('profile.progressTitle')}
            </Text>
            <HStack className="justify-between">
              <VStack className="items-center flex-1 gap-1">
                <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                  {streakDays}
                </Text>
                <Text className="text-xs text-center" style={{ color: theme.textSecondary }}>
                  {t('profile.streakLabel')}
                </Text>
              </VStack>
              <Box style={{ width: 1, alignSelf: 'stretch', backgroundColor: theme.cardBorder }} />
              <VStack className="items-center flex-1 gap-1">
                <HStack className="items-baseline gap-0.5">
                  <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                    {lessonsCount}
                  </Text>
                  <Text className="text-sm" style={{ color: theme.textSecondary }}>
                    /{TOTAL_LESSONS}
                  </Text>
                </HStack>
                <Text className="text-xs text-center" style={{ color: theme.textSecondary }}>
                  {t('profile.lessonsCompleted')}
                </Text>
              </VStack>
              <Box style={{ width: 1, alignSelf: 'stretch', backgroundColor: theme.cardBorder }} />
              <VStack className="items-center flex-1 gap-1">
                <HStack className="items-baseline gap-0.5">
                  <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                    {modulesCount}
                  </Text>
                  <Text className="text-sm" style={{ color: theme.textSecondary }}>
                    /{TOTAL_MODULES}
                  </Text>
                </HStack>
                <Text className="text-xs text-center" style={{ color: theme.textSecondary }}>
                  {t('profile.modulesCompleted')}
                </Text>
              </VStack>
            </HStack>
            <ProgressBar value={progressPercent} />
          </Box>

          {/* Recent badges */}
          {userBadges.length > 0 && (
            <Box
              className="w-full rounded-2xl p-5 gap-3"
              style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.cardBorder }}
            >
              <HStack className="justify-between items-center">
                <Text
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ color: theme.textSecondary }}
                >
                  {t('profile.recentBadges')}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push(routes.badges())}
                  activeOpacity={0.7}
                >
                  <Text className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                    {t('profile.viewAll')}
                  </Text>
                </TouchableOpacity>
              </HStack>
              <HStack className="gap-3">
                {recentBadges.map((badge) =>
                  badge ? (
                    <Box
                      key={badge.id}
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: theme.buttonPrimary }}
                    >
                      <Ionicons
                        name={badge.icon as keyof typeof Ionicons.glyphMap}
                        size={22}
                        color={theme.buttonPrimaryContrast}
                      />
                    </Box>
                  ) : null,
                )}
              </HStack>
            </Box>
          )}

          {/* Navigation cards */}
          <VStack className="gap-3 w-full">
            <SectionCard
              icon="person-outline"
              title={t('profile.information')}
              subtitle={t('profile.informationSubtitle')}
              onPress={() => router.push(routes.profile('information'))}
              compact
            />
            <SectionCard
              icon="lock-closed-outline"
              title={t('profile.changePassword')}
              subtitle={t('profile.changePasswordSubtitle')}
              onPress={() => router.push(routes.profile('password'))}
              compact
            />
            <SectionCard
              icon="ribbon-outline"
              title={t('badges.title')}
              subtitle={t('badges.subtitle', { count: userBadges.length })}
              badge={String(userBadges.length)}
              onPress={() => router.push(routes.badges())}
              compact
            />
          </VStack>
        </VStack>
      </ScrollView>

      <Box
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: insets.bottom + 24,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            bzzt();
            signOut();
          }}
          activeOpacity={0.7}
          className="rounded-full py-3 px-5 cursor-pointer"
          style={{ backgroundColor: theme.buttonDecline, alignItems: 'center', justifyContent: 'center' }}
        >
          <HStack className="items-center gap-2">
            <Ionicons name="log-out-outline" size={20} color={theme.buttonDeclineContrast} />
            <Text className="text-base font-semibold" style={{ color: theme.buttonDeclineContrast }}>
              {t('home.signOut')}
            </Text>
          </HStack>
        </TouchableOpacity>
      </Box>
    </Box>
  );
}
