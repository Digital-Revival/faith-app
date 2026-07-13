import { useEasyRead } from '@/contexts/EasyReadContext';
import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';

export function useEasyReadTypography() {
  const { typography } = useEasyRead();

  return useMemo(
    () => ({
      minTouchTarget: typography.minTouchTarget,
      minTouchTargetStyle: {
        minHeight: typography.minTouchTarget,
        minWidth: typography.minTouchTarget,
      } satisfies ViewStyle,
    }),
    [typography],
  );
}
