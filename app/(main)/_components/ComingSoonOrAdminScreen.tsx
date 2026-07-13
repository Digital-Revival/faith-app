import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { MainTopBar } from './MainTopBar';
import { ComingSoonSection } from './ComingSoonSection';
import { useAdminViewMode } from '@/contexts/AdminViewModeContext';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ComingSoonOrAdminScreenProps {
  titleKey: string;
  currentSection: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  subtitleKey: string;
  descriptionKey: string;
}

export function ComingSoonOrAdminScreen({
  titleKey,
  currentSection,
  icon,
  subtitleKey,
  descriptionKey,
}: ComingSoonOrAdminScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isAdminView } = useAdminViewMode();

  if (isAdminView) {
    return (
      <Box
        className="flex-1 px-6 pt-6"
        style={{
          paddingTop: insets.top + 24,
          backgroundColor: theme.pageBg,
        }}
      >
        <MainTopBar
          title={t(titleKey)}
          currentSection={currentSection}
          showBackButton
        />
        <Box className="flex-1 items-center justify-center p-8">
          <Ionicons name="analytics-outline" size={48} color={theme.textSecondary} />
          <Text
            className="text-base mt-4 text-center"
            style={{ color: theme.textSecondary }}
          >
            {t('admin.analyticsComingSoon')}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className="flex-1 px-6 pt-6"
      style={{
        paddingTop: insets.top + 24,
        backgroundColor: theme.pageBg,
      }}
    >
      <MainTopBar
        title={t(titleKey)}
        currentSection={currentSection}
        showBackButton
      />
      <ComingSoonSection
        icon={icon}
        titleKey={titleKey}
        subtitleKey={subtitleKey}
        descriptionKey={descriptionKey}
      />
    </Box>
  );
}

const __expoRouterPrivateRoute_ComingSoonOrAdminScreen = () => null;

export default __expoRouterPrivateRoute_ComingSoonOrAdminScreen;
