import { useTheme } from '@/hooks/useTheme';
import {
  Switch,
  View,
  type AccessibilityState,
} from 'react-native';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => Promise<void>;
  isLoading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
}

export function Toggle({
  value,
  onValueChange,
  isLoading = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: ToggleProps) {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          ...accessibilityState,
          checked: value,
          busy: true,
          disabled: true,
        }}
        style={{ padding: 4 }}
      >
        <LoadingSpinner size="small" />
      </View>
    );
  }

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        ...accessibilityState,
        checked: value,
      }}
      trackColor={{
        false: theme.cardBorder,
        true: theme.buttonAccept,
      }}
      thumbColor={
        theme.isDark ? theme.buttonPrimary : theme.buttonPrimaryContrast
      }
    />
  );
}
