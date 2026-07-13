/**
 * Single source of truth for app colors.
 * Edit this file only to change primary, secondary, and semantic colors globally.
 * useTheme and gluestack config both derive from these tokens.
 */

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : '0 0 0';
};

export const primary = {
  light: '#171717',
  dark: '#FAFAFA',
  lightRgb: hexToRgb('#171717'),
  darkRgb: hexToRgb('#FAFAFA'),
  mutedLight: 'rgba(23, 23, 23, 0.2)',
  mutedDark: 'rgba(250, 250, 250, 0.25)',
} as const;

export const primaryContrast = {
  light: '#FFFFFF',
  dark: '#171717',
} as const;

export const decline = {
  light: '#b91c1c',
  dark: '#f87171',
  contrast: '#FFFFFF',
} as const;

export const success = '#4d7c59';

export const dataViz = {
  light: { primary: '#2563EB', comparison: '#64748B', warning: '#B45309', risk: '#B91C1C' },
  dark: { primary: '#60A5FA', comparison: '#94A3B8', warning: '#FBBF24', risk: '#F87171' },
} as const;

export const accept = {
  light: '#10b981',
  dark: '#10b981',
} as const;

export const error = {
  light: '#b91c1c',
  dark: '#f87171',
} as const;

export const quizIncorrect = {
  light: '#DD4B4B',
  dark: '#DD4B4B',
  bgLight: '#FCE8E8',
  bgDark: 'rgba(221, 75, 75, 0.18)',
} as const;

export const quizCorrect = {
  light: '#4BDD83',
  dark: '#4BDD83',
  bgLight: '#E8F9F0',
  bgDark: 'rgba(75, 221, 131, 0.18)',
} as const;

export const primaryScaleLight = {
  400: '115 115 115',
  500: primary.lightRgb,
  600: '23 23 23',
  700: '10 10 10',
};

export const primaryScaleDark = {
  400: '115 115 115',
  500: primary.darkRgb,
  600: '250 250 250',
  700: '252 252 252',
};

export const declineRgb = {
  light: hexToRgb(decline.light),
  dark: hexToRgb(decline.dark),
} as const;
