import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { adminAnalyticsService } from '@/services/api/adminAnalyticsService';
import { queryKeys } from '@/services/queryKeys';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, TouchableOpacity } from 'react-native';

import { routes } from '@/constants/routes';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { OverviewCard } from '../bibleschool/_components/OverviewCard';

export default function AdminOverviewScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: analytics } = useQuery({
    queryKey: queryKeys.admin.bibleschoolAnalytics(),
    queryFn: () => adminAnalyticsService.getBibleschoolAnalytics(),
  });

  const totalUsers = analytics?.totalUsers ?? 0;
  const totalCompleted = analytics?.moduleStats.reduce(
    (sum, s) => sum + s.completedCount,
    0,
  ) ?? 0;

  const quickLinks = [
    {
      icon: 'school' as const,
      labelKey: 'admin.analytics',
      route: routes.admin('analytics'),
    },
    {
      icon: 'people' as const,
      labelKey: 'admin.users',
      route: routes.admin('users'),
    },
  ];

  return (
    <Box
      className="flex-1 px-6"
      style={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        backgroundColor: theme.pageBg,
      }}
    >
      <MainTopBar
        title={t('admin.overview')}
        currentSection="admin"
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <VStack className="gap-6">
          <VStack className="gap-2">
            <Text
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: theme.textSecondary }}
            >
              {t('admin.overview')}
            </Text>
            <Text
              className="text-2xl font-bold"
              style={{ color: theme.textPrimary }}
            >
              {t('admin.welcome')}
            </Text>
          </VStack>

          <VStack className="gap-4">
            <OverviewCard>
              <Box className="p-5 flex-row items-center gap-4">
                <Box
                  className="rounded-xl p-3"
                  style={{ backgroundColor: theme.avatarPrimary }}
                >
                  <Ionicons name="people" size={28} color={theme.textPrimary} />
                </Box>
                <Box>
                  <Text
                    className="text-sm font-medium"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('admin.totalUsers')}
                  </Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {totalUsers}
                  </Text>
                </Box>
              </Box>
            </OverviewCard>

            <OverviewCard>
              <Box className="p-5 flex-row items-center gap-4">
                <Box
                  className="rounded-xl p-3"
                  style={{ backgroundColor: theme.avatarPrimary }}
                >
                  <Ionicons name="checkmark-done" size={28} color={theme.textPrimary} />
                </Box>
                <Box>
                  <Text
                    className="text-sm font-medium"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('admin.totalModuleCompletions')}
                  </Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {totalCompleted}
                  </Text>
                </Box>
              </Box>
            </OverviewCard>
          </VStack>

          <VStack className="gap-2">
            <Text
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: theme.textSecondary }}
            >
              {t('admin.quickLinks')}
            </Text>
            <VStack className="gap-3">
              {quickLinks.map((link) => (
                <TouchableOpacity
                  key={link.labelKey}
                  onPress={() => router.push(link.route as never)}
                  activeOpacity={0.7}
                >
                  <OverviewCard>
                    <Box className="p-5 flex-row items-center gap-4">
                      <Box
                        className="rounded-xl p-3"
                        style={{ backgroundColor: theme.cardBorder }}
                      >
                        <Ionicons
                          name={link.icon}
                          size={24}
                          color={theme.textPrimary}
                        />
                      </Box>
                      <Text
                        className="flex-1 text-base font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {t(link.labelKey)}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme.textSecondary}
                      />
                    </Box>
                  </OverviewCard>
                </TouchableOpacity>
              ))}
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}
