import React from 'react';
import {
  Text as RNText,
  StyleSheet,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { useTypography } from '@/contexts/TypographyContext';

export type TextVariant = 'heading' | 'body' | 'caption';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
}

const classNameToFontFamily: Record<string, string> = {
  'font-thin': 'Poppins_100Thin',
  'font-extralight': 'Poppins_200ExtraLight',
  'font-light': 'Poppins_300Light',
  'font-normal': 'Poppins_400Regular',
  'font-medium': 'Poppins_500Medium',
  'font-semibold': 'Poppins_600SemiBold',
  'font-bold': 'Poppins_700Bold',
  'font-extrabold': 'Poppins_800ExtraBold',
  'font-black': 'Poppins_900Black',
};

const fontWeightToFamily: Record<string, string> = {
  '100': 'Poppins_100Thin',
  '200': 'Poppins_200ExtraLight',
  '300': 'Poppins_300Light',
  '400': 'Poppins_400Regular',
  normal: 'Poppins_400Regular',
  '500': 'Poppins_500Medium',
  '600': 'Poppins_600SemiBold',
  '700': 'Poppins_700Bold',
  bold: 'Poppins_700Bold',
  '800': 'Poppins_800ExtraBold',
  '900': 'Poppins_900Black',
};

function resolvePoppinsFamily(
  defaultFamily: string,
  className?: string,
  flatStyle?: TextStyle,
): string {
  if (flatStyle?.fontFamily) return flatStyle.fontFamily;

  if (className) {
    const classes = className.split(/\s+/);
    for (const cls of classes) {
      const mapped = classNameToFontFamily[cls];
      if (mapped) return mapped;
    }
  }

  if (flatStyle?.fontWeight) {
    return (
      fontWeightToFamily[flatStyle.fontWeight as string] ?? defaultFamily
    );
  }

  return defaultFamily;
}

function getVariantStyle(variant: TextVariant, scale: number): TextStyle {
  switch (variant) {
    case 'heading':
      return {
        fontSize: Math.round(22 * scale),
        lineHeight: Math.round(30 * scale),
      };
    case 'caption':
      return {
        fontSize: Math.round(13 * scale),
        lineHeight: Math.round(20 * scale),
      };
    case 'body':
    default:
      return {
        fontSize: Math.round(16 * scale),
        lineHeight: Math.round(24 * scale),
      };
  }
}

export const Text = React.forwardRef<
  React.ElementRef<typeof RNText>,
  AppTextProps
>(function Text({ style, className, variant, ...props }, ref) {
  const { fontFamily: defaultFamily, fontSizeScale } = useTypography();

  const flatStyle = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontFamily = resolvePoppinsFamily(defaultFamily, className, flatStyle);
  const variantStyle = variant
    ? getVariantStyle(variant, fontSizeScale)
    : undefined;

  return (
    <RNText
      ref={ref}
      style={[variantStyle, { fontFamily }, style]}
      className={className}
      {...props}
    />
  );
});
