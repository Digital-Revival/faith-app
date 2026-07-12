import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useBibleschoolTab } from '@/contexts/BibleschoolTabContext';
import { useEasyRead } from '@/contexts/EasyReadContext';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { FeedbackFab } from '@/app/(main)/_components/FeedbackFab';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { routes } from '@/constants/routes';
import { ContinueLearningCard } from '../_components/ContinueLearningCard';
import { CurrentVideoCard } from '../_components/CurrentVideoCard';
import { ProgressCard } from '../_components/ProgressCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from "expo-router/react-navigation";
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/queryKeys';
import { bibleschoolService } from '@/services/storyblok/bibleschoolService';

export default function BibleSchoolScreen() {
  const { setActiveTab } = useBibleschoolTab();
  const queryClient = useQueryClient();
  const { locale } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      setActiveTab('index');
      queryClient.prefetchQuery({
        queryKey: queryKeys.bibleschool.category(locale),
        queryFn: () => bibleschoolService.getBibleschoolCategory(locale),
      });
    }, [setActiveTab, queryClient, locale])
  );
  const theme = useTheme();
  const { t } = useTranslation();
  const { enabled: easyReadEnabled } = useEasyRead();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: ['progress'],
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.bibleschool.category(locale),
    });
    setRefreshing(false);
  }, [queryClient, locale]);

  return (
    <Box
      className="flex-1 px-6 pt-6"
      style={{
        paddingTop: insets.top + 24,
        backgroundColor: theme.pageBg,
      }}
    >
      <MainTopBar
        title={t('navbar.bibleschool')}
        currentSection="bibleschool"
        showBackButton
        onBack={() => router.replace(routes.main())}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textTertiary}
          />
        }
      >
        <VStack className="gap-6">
          <Text
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.textSecondary }}
          >
            {t('overview.sectionTitle')}
          </Text>
          <VStack className="gap-4">
            {easyReadEnabled ? <ContinueLearningCard /> : null}
            <ProgressCard />
            {!easyReadEnabled ? <CurrentVideoCard /> : null}
            {!easyReadEnabled ? <ContinueLearningCard /> : null}
          </VStack>
        </VStack>
      </ScrollView>
      <FeedbackFab variant="aboveTabBar" />
    </Box>
  );
}
