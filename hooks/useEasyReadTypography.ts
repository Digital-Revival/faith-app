import { useEasyRead } from '@/contexts/EasyReadContext';
import { useMemo } from 'react';
import type { ViewStyle } from 'react-native';

export function useEasyReadTypography() {
  const { typography } = useEasyRead();

  return useMemo(
    () => ({
      fontSizeScale: typography.fontSizeScale,
      lineHeightMultiplier: typography.lineHeightMultiplier,
      minTouchTarget: typography.minTouchTarget,
      scaleFontSize: (size: number) =>
        Math.round(size * typography.fontSizeScale),
      scaleIconSize: (size: number) =>
        Math.round(size * typography.fontSizeScale),
      minTouchTargetStyle: {
        minHeight: typography.minTouchTarget,
        minWidth: typography.minTouchTarget,
      } satisfies ViewStyle,
    }),
    [typography],
  );
}
