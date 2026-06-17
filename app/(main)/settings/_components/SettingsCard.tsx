import { useRef, useCallback } from 'react';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/Card';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { TouchableOpacity } from 'react-native';
import { SettingsMeasureTargetContext } from './SettingsMeasureTargetContext';

export interface SettingsCardOpenRef {
  open: () => void;
}

interface SettingsCardProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  titleKey: string;
  valueLabel: string;
  openRef: React.RefObject<SettingsCardOpenRef | null>;
  children: React.ReactNode;
}

export function SettingsCard({
  icon,
  titleKey,
  valueLabel,
  openRef,
  children,
}: SettingsCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const cardRef = useRef<React.ComponentRef<typeof Card>>(null);
  const getMeasureTarget = useCallback(() => cardRef.current, []);

  return (
    <SettingsMeasureTargetContext.Provider value={getMeasureTarget}>
      <Card ref={cardRef} padding="none">
        <Box style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
          {children}
        </Box>
        <TouchableOpacity
          onPress={() => {
            bzzt();
            openRef.current?.open();
          }}
          activeOpacity={0.7}
          className="px-4 py-3 cursor-pointer"
        >
          <HStack className="items-center gap-4">
            <Box
              className="rounded-lg p-2"
              style={{ backgroundColor: theme.avatarPrimary }}
            >
              <Ionicons name={icon} size={22} color={theme.textPrimary} />
            </Box>
            <VStack className="flex-1 min-w-0">
              <Text
                className="text-base font-semibold"
                style={{ color: theme.textPrimary }}
              >
                {t(titleKey)}
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: theme.textSecondary }}
                numberOfLines={1}
              >
                {valueLabel}
              </Text>
            </VStack>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
          </HStack>
        </TouchableOpacity>
      </Card>
    </SettingsMeasureTargetContext.Provider>
  );
}

const __expoRouterPrivateRoute_SettingsCard = () => null;

export default __expoRouterPrivateRoute_SettingsCard;
