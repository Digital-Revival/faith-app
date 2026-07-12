import { Box } from '@/components/ui/box';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Text } from '@/components/ui/text';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { useBibleschoolTab } from '@/contexts/BibleschoolTabContext';
import { useEasyRead } from '@/contexts/EasyReadContext';
import { routes } from '@/constants/routes';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import { useFocusEffect } from "expo-router/react-navigation";
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModuleProgressRow } from './_components/ModuleProgressRow';
import { RecentBadgesRow } from './_components/RecentBadgesRow';
import { VoortgangHero } from './_components/VoortgangHero';
import { useVoortgangData } from './_hooks/useVoortgangData';
import type { ModuleProgressData } from './_hooks/useVoortgangData';

const COLLAPSE_THRESHOLD = 3;
const COLLAPSED_VISIBLE = 2;

export default function VoortgangScreen() {
  const { setActiveTab } = useBibleschoolTab();
  const { enabled: easyReadEnabled } = useEasyRead();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const {
    isLoading,
    completedCount,
    overallPercentage,
    passedModuleCount,
    totalLessons,
    totalModules,
    streakDays,
    moduleProgressData,
    badges,
    recentBadges,
    onRefresh,
  } = useVoortgangData();

  useEffect(() => {
    if (easyReadEnabled) {
      router.replace(routes.bibleschool());
    }
  }, [easyReadEnabled]);

  useFocusEffect(
    useCallback(() => {
      setActiveTab('voortgang');
    }, [setActiveTab]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const { completedModules, activeModules } = useMemo(() => {
    const completed: ModuleProgressData[] = [];
    const active: ModuleProgressData[] = [];

    moduleProgressData.forEach((item) => {
      if (item.examStatus === 'passed') {
        completed.push(item);
      } else {
        active.push(item);
      }
    });

    return { completedModules: completed, activeModules: active };
  }, [moduleProgressData]);

  const shouldCollapse = completedModules.length >= COLLAPSE_THRESHOLD;
  const visibleCompleted = shouldCollapse && !showAllCompleted
    ? completedModules.slice(-COLLAPSED_VISIBLE)
    : completedModules;
  const hiddenCount = completedModules.length - COLLAPSED_VISIBLE;

  const flatListData: (ModuleProgressData | { type: 'collapse-toggle' })[] = useMemo(() => {
    const items: (ModuleProgressData | { type: 'collapse-toggle' })[] = [];

    if (shouldCollapse && !showAllCompleted && hiddenCount > 0) {
      items.push({ type: 'collapse-toggle' });
    }

    visibleCompleted.forEach((item) => items.push(item));
    activeModules.forEach((item) => items.push(item));

    return items;
  }, [visibleCompleted, activeModules, shouldCollapse, showAllCompleted, hiddenCount]);

  if (isLoading) {
    return <LoadingScreen message={t('common.loading')} />;
  }

  const renderHeader = () => (
    <View style={{ gap: 20, paddingBottom: 8 }}>
      <VoortgangHero
        overallPercentage={overallPercentage}
        completedCount={completedCount}
        passedModuleCount={passedModuleCount}
        streakDays={streakDays}
        totalLessons={totalLessons}
        totalModules={totalModules}
      />

      {completedModules.length > 0 && (
        <Text
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: theme.textSecondary }}
        >
          {t('voortgang.modulesSection')}
        </Text>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={{ paddingBottom: insets.bottom + 100 }}>
      {recentBadges.length > 0 && (
        <View style={{ paddingTop: 24 }}>
          <RecentBadgesRow recentBadges={recentBadges} allBadges={badges} />
        </View>
      )}
    </View>
  );

  const renderItem = ({ item }: { item: ModuleProgressData | { type: 'collapse-toggle' } }) => {
    if ('type' in item && item.type === 'collapse-toggle') {
      return (
        <TouchableOpacity
          onPress={() => { bzzt(); setShowAllCompleted(true); }}
          activeOpacity={0.7}
          style={{ marginBottom: 8 }}
        >
          <View
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: theme.cardBorder,
              paddingVertical: 12,
              paddingHorizontal: 16,
              alignItems: 'center',
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: theme.textSecondary }}
            >
              {t('voortgang.showAllCompleted', { count: hiddenCount })}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    const module = item as ModuleProgressData;
    const isFirstActive =
      module.examStatus !== 'passed' &&
      !module.isLocked &&
      activeModules[0]?.moduleId === module.moduleId;

    return (
      <View style={{ marginBottom: 8 }}>
        <ModuleProgressRow
          data={module}
          isFirstActive={isFirstActive}
          onPress={() => router.push(routes.bibleschoolModule(module.moduleId))}
        />
      </View>
    );
  };

  return (
    <Box className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <Box
        className="px-6"
        style={{ paddingTop: insets.top + 24, paddingBottom: 16 }}
      >
        <MainTopBar
          title={t('voortgang.pageTitle')}
          currentSection="bibleschool"
          showBackButton
          onBack={() => router.back()}
        />
      </Box>

      <FlatList
        data={flatListData}
        keyExtractor={(item) =>
          'type' in item ? 'collapse-toggle' : item.moduleId
        }
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.textTertiary}
          />
        }
      />
    </Box>
  );
}
