import React, { useContext } from 'react';
import {
  Text as RNText,
  StyleSheet,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { EasyReadContext } from '@/contexts/EasyReadContext';
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

const TAILWIND_FONT_SIZES: Record<string, number> = {
  'text-xs': 12,
  'text-sm': 14,
  'text-base': 16,
  'text-lg': 18,
  'text-xl': 20,
  'text-2xl': 24,
  'text-3xl': 30,
};

const TAILWIND_LINE_HEIGHTS: Record<string, number> = {
  'leading-none': 1,
  'leading-tight': 1.25,
  'leading-snug': 1.375,
  'leading-normal': 1.5,
  'leading-relaxed': 1.625,
  'leading-loose': 2,
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

function parseFontSizeFromClassName(className?: string): number | undefined {
  if (!className) return undefined;
  const classes = className.split(/\s+/);
  for (const cls of classes) {
    const size = TAILWIND_FONT_SIZES[cls];
    if (size !== undefined) return size;
  }
  return undefined;
}

function parseLineHeightRatioFromClassName(
  className?: string,
): number | undefined {
  if (!className) return undefined;
  const classes = className.split(/\s+/);
  for (const cls of classes) {
    const ratio = TAILWIND_LINE_HEIGHTS[cls];
    if (ratio !== undefined) return ratio;
  }
  return undefined;
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

function getScaledTypographyStyle(
  className: string | undefined,
  flatStyle: TextStyle | undefined,
  fontSizeScale: number,
  lineHeightMultiplier: number,
): TextStyle | undefined {
  const classFontSize = parseFontSizeFromClassName(className);
  const baseFontSize = flatStyle?.fontSize ?? classFontSize;

  if (baseFontSize === undefined) {
    return undefined;
  }

  const scaledFontSize = Math.round(Number(baseFontSize) * fontSizeScale);
  const classLineHeightRatio = parseLineHeightRatioFromClassName(className);

  let scaledLineHeight: number | undefined;
  if (flatStyle?.lineHeight !== undefined) {
    scaledLineHeight = Math.round(
      Number(flatStyle.lineHeight) * lineHeightMultiplier,
    );
  } else if (classLineHeightRatio !== undefined) {
    scaledLineHeight = Math.round(scaledFontSize * classLineHeightRatio);
  } else {
    scaledLineHeight = Math.round(scaledFontSize * 1.5 * lineHeightMultiplier);
  }

  return {
    fontSize: scaledFontSize,
    lineHeight: scaledLineHeight,
  };
}

export const Text = React.forwardRef<
  React.ElementRef<typeof RNText>,
  AppTextProps
>(function Text({ style, className, variant, ...props }, ref) {
  const { fontFamily: defaultFamily, fontSizeScale } = useTypography();
  const easyReadCtx = useContext(EasyReadContext);
  const lineHeightMultiplier =
    easyReadCtx?.typography.lineHeightMultiplier ?? 1.0;

  const flatStyle = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontFamily = resolvePoppinsFamily(defaultFamily, className, flatStyle);
  const variantStyle = variant
    ? getVariantStyle(variant, fontSizeScale)
    : undefined;
  const scaledTypographyStyle = getScaledTypographyStyle(
    className,
    flatStyle,
    fontSizeScale,
    lineHeightMultiplier,
  );

  return (
    <RNText
      ref={ref}
      style={[variantStyle, { fontFamily }, style, scaledTypographyStyle]}
      className={className}
      {...props}
    />
  );
});
