import { Box } from '@/components/ui/box';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Text } from '@/components/ui/text';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useCompletedLessons } from '@/hooks/useCompletedLessons';
import { useTheme } from '@/hooks/useTheme';
import { useUserBadges } from '@/hooks/useUserBadges';
import { useTranslation } from '@/hooks/useTranslation';
import { moduleProgressService } from '@/services/api/moduleProgressService';
import { queryKeys } from '@/services/queryKeys';
import { useQuery } from '@tanstack/react-query';
import type { Badge as BadgeType, BadgeCategory } from '@/types/badge';
import { bzzt } from '@/utils/haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { runDeferredTask } from '@/utils/runDeferredTask';
import { useStreak } from '@/hooks/useStreak';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BadgeDetailModal } from './_components/BadgeDetailModal';

const COLS = 3;
const GAP = 16;
const CATEGORY_ORDER: BadgeCategory[] = ['special', 'streak', 'lesson', 'module', 'exam'];

function getBadgeProgress(
  badge: BadgeType,
  earned: boolean,
  lessonCount: number,
  moduleCount: number,
  completedModuleIds: Set<string>,
  streak: number,
): { current: number; target: number } | undefined {
  if (earned || badge.target_value <= 0) return undefined;
  if (badge.category === 'streak') {
    return {
      current: Math.min(streak, badge.target_value),
      target: badge.target_value,
    };
  }
  if (badge.id.startsWith('lesson_milestone_')) {
    return {
      current: Math.min(lessonCount, badge.target_value),
      target: badge.target_value,
    };
  }
  if (badge.id === 'student_van_het_woord') {
    return { current: Math.min(lessonCount, 10), target: 10 };
  }
  if (badge.id === 'schriftgeleerde') {
    return { current: Math.min(lessonCount, 100), target: 100 };
  }
  if (badge.id === 'bijbelleraar') {
    return { current: Math.min(moduleCount, 5), target: 5 };
  }
  if (badge.id === 'faith_finisher') {
    return { current: Math.min(moduleCount, 20), target: 20 };
  }
  if (badge.id.startsWith('module_')) {
    const moduleNum = parseInt(badge.id.replace('module_', ''), 10);
    const moduleId = `module-${moduleNum}`;
    const completed = completedModuleIds.has(moduleId) ? 1 : 0;
    return { current: completed, target: 1 };
  }
  return undefined;
}

export default function BadgesScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ badgeId?: string | string[] }>();
  const badgeId = typeof params.badgeId === 'string'
    ? params.badgeId
    : Array.isArray(params.badgeId)
      ? params.badgeId[0]
      : undefined;
  const { badges, userBadges, isLoading } = useUserBadges(user?.id);
  const { days: streak } = useStreak();
  const { data: completedLessons } = useCompletedLessons(user?.id);
  const { data: moduleProgressList } = useQuery({
    queryKey: queryKeys.progress.moduleProgress.overview(user?.id ?? ''),
    queryFn: () => moduleProgressService.listByUser(user!.id),
    enabled: !!user?.id,
  });

  const lessonCount = completedLessons?.length ?? 0;
  const completedModules = useMemo(
    () => (moduleProgressList ?? []).filter((m) => m.status === 'completed'),
    [moduleProgressList],
  );
  const moduleCount = completedModules.length;
  const completedModuleIds = useMemo(
    () => new Set(completedModules.map((m) => m.module_id)),
    [completedModules],
  );
  const { width } = useWindowDimensions();
  const itemWidth = (width - 48 - GAP * (COLS - 1)) / COLS;
  const scrollViewRef = useRef<ScrollView>(null);
  const handledBadgeIdRef = useRef<string | null>(null);
  const scrollHandledRef = useRef<string | null>(null);
  const [categoryLayoutY, setCategoryLayoutY] = useState<
    Partial<Record<BadgeCategory, number>>
  >({});

  const earnedSet = useMemo(
    () => new Set(userBadges.map((ub) => ub.badge_id)),
    [userBadges],
  );

  const badgesByCategory = useMemo(() => {
    const map = new Map<BadgeCategory, BadgeType[]>();
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, badges.filter((b) => b.category === cat));
    }
    return map;
  }, [badges]);

  const [selectedBadge, setSelectedBadge] = useState<{
    badge: BadgeType;
    earned: boolean;
    progress?: { current: number; target: number };
  } | null>(null);

  const handleBack = () => {
    router.replace(routes.profile() as never);
  };

  useEffect(() => {
    if (!badgeId || isLoading || badges.length === 0) return;
    const badge = badges.find((b) => b.id === badgeId);
    if (!badge) return;
    const category = badge.category;
    const y = categoryLayoutY[category];
    const earned = earnedSet.has(badge.id);
    const progress = getBadgeProgress(
      badge,
      earned,
      lessonCount,
      moduleCount,
      completedModuleIds,
      streak,
    );
    const badgePayload = { badge, earned, progress };
    if (handledBadgeIdRef.current !== badgeId) {
      handledBadgeIdRef.current = badgeId;
      setSelectedBadge(badgePayload);
    }
    if (y !== undefined && scrollHandledRef.current !== badgeId) {
      scrollHandledRef.current = badgeId;
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - 20),
            animated: true,
          });
        }, 100);
      });
    }
  }, [
    badgeId,
    isLoading,
    badges,
    categoryLayoutY,
    earnedSet,
    streak,
    lessonCount,
    moduleCount,
    completedModuleIds,
  ]);

  if (isLoading) {
    return <LoadingScreen message={t('loading.section.profile')} />;
  }

  const earnedCount = userBadges.length;
  const totalCount = badges.length;
  const percentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  return (
    <Box
      className="flex-1 px-6"
      style={{
        paddingTop: insets.top + 24,
        paddingBottom: 0,
        backgroundColor: theme.pageBg,
      }}
    >
      <MainTopBar
        title={t('badges.title')}
        currentSection="profile"
        showBackButton
        onBack={handleBack}
      />
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <Card className="mb-6" padding="lg">
          <Box className="flex-row items-center gap-4">
            <Box
              className="rounded-2xl w-16 h-16 items-center justify-center"
              style={{ backgroundColor: theme.brandAccentMuted }}
            >
              <Ionicons
                name="trophy"
                size={32}
                color={theme.brandAccent}
              />
            </Box>
            <Box className="flex-1">
              <Text
                className="text-2xl font-bold"
                style={{ color: theme.textPrimary }}
              >
                {earnedCount}
                <Text
                  className="text-base font-medium"
                  style={{ color: theme.textSecondary }}
                >
                  {' / '}{totalCount}
                </Text>
              </Text>
              <Text
                className="text-sm mt-0.5"
                style={{ color: theme.textSecondary }}
              >
                {t('badges.earnedCount', {
                  earned: earnedCount,
                  total: totalCount,
                })}
              </Text>
              <Box className="mt-3">
                <ProgressBar value={percentage} />
              </Box>
            </Box>
          </Box>
        </Card>

        {CATEGORY_ORDER.map((category) => {
          const items = badgesByCategory.get(category) ?? [];
          if (items.length === 0) return null;

          const categoryLabel = t(`badges.category.${category}` as never as string);

          return (
            <View
              key={category}
              style={{ marginBottom: 24 }}
              onLayout={({ nativeEvent }) =>
                setCategoryLayoutY((prev) => ({
                  ...prev,
                  [category]: nativeEvent.layout.y,
                }))
              }
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name={
                    category === 'streak'
                      ? 'flame'
                      : category === 'lesson'
                        ? 'document-text'
                        : category === 'module'
                          ? 'ribbon'
                          : category === 'exam'
                            ? 'shield-checkmark'
                            : 'sparkles'
                  }
                  size={18}
                  color={theme.textSecondary}
                />
                <Text
                  className="text-sm font-semibold uppercase tracking-widest"
                  style={{ color: theme.textSecondary }}
                >
                  {categoryLabel}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: GAP,
                  justifyContent: 'flex-start',
                }}
              >
                {items.map((badge) => {
                  const earned = earnedSet.has(badge.id);
                  const progress = getBadgeProgress(
                    badge,
                    earned,
                    lessonCount,
                    moduleCount,
                    completedModuleIds,
                    streak,
                  );
                  return (
                    <View
                      key={badge.id}
                      style={{
                        width: itemWidth,
                        height: 100,
                        alignItems: 'stretch',
                        marginBottom: 6,
                      }}
                    >
                      <Badge
                        badge={badge}
                        earned={earned}
                        progress={progress}
                        onPress={() => {
                          bzzt();
                          setSelectedBadge({ badge, earned, progress });
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <BadgeDetailModal
        visible={selectedBadge !== null}
        badge={selectedBadge?.badge ?? null}
        earned={selectedBadge?.earned ?? false}
        progress={selectedBadge?.progress}
        onClose={() => {
          runDeferredTask(() => {
            setSelectedBadge(null);
          });
        }}
      />
    </Box>
  );
}
