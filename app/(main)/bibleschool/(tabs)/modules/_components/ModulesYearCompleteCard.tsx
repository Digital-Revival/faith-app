import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { ThemeColors } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

interface ModulesYearCompleteCardProps {
  theme: ThemeColors;
  moduleCount: number;
}

export function ModulesYearCompleteCard({
  theme,
  moduleCount,
}: ModulesYearCompleteCardProps) {
  const { t } = useTranslation();
  const year1 = t('modules.year1Label');
  const year2 = t('modules.year2Label');

  return (
    <VStack className="gap-4">
      <Card
        className="rounded-2xl p-5"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        }}
      >
        <VStack className="gap-3">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: theme.badgeSuccessBg }}
          >
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={theme.buttonAccept}
            />
          </View>
          <Text
            className="text-lg font-semibold"
            style={{ color: theme.textPrimary }}
          >
            {t('modules.allModulesCompletedTitle', { year: year1 })}
          </Text>
          <Text className="text-sm leading-5" style={{ color: theme.textSecondary }}>
            {t('modules.allModulesCompletedSubtitle', { count: moduleCount })}
          </Text>
        </VStack>
      </Card>
      <Card
        className="rounded-2xl p-5"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          borderStyle: 'dashed',
        }}
      >
        <VStack className="gap-2">
          <Text
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.textTertiary }}
          >
            {t('modules.year2ComingSoonLabel')}
          </Text>
          <Text
            className="text-base font-semibold"
            style={{ color: theme.textPrimary }}
          >
            {t('modules.year2ComingSoonTitle', { year: year2 })}
          </Text>
          <Text className="text-sm leading-5" style={{ color: theme.textSecondary }}>
            {t('modules.year2ComingSoonBody', { year: year2 })}
          </Text>
        </VStack>
      </Card>
    </VStack>
  );
}
