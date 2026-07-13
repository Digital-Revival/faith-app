import {
  accept,
  decline,
  primary,
  primaryContrast,
  quizCorrect,
  quizIncorrect,
  success,
  dataViz,
} from '@/constants/themeTokens';
import { useThemePreference } from '@/contexts/ThemeContext';

export interface ThemeColors {
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  buttonAccept: string;
  buttonDecline: string;
  buttonDeclineContrast: string;
  buttonPrimary: string;
  buttonPrimaryContrast: string;
  brandAccent: string;
  brandAccentMuted: string;
  tabActive: string;
  tabInactiveBg: string;
  tabInactiveText: string;
  avatarPrimary: string;
  avatarWarning: string;
  badgeSuccess: string;
  badgeError: string;
  quizCorrect: string;
  quizCorrectBg: string;
  quizIncorrect: string;
  quizIncorrectBg: string;
  badgeWarning: string;
  badgeInfo: string;
  emptyBg: string;
  messageBg: string;
  inputBg: string;
  overlayBg: string;
  starSuccess: string;
  badgeSuccessBg: string;
  badgeInfoBg: string;
  dataVizPrimary: string;
  dataVizComparison: string;
  dataVizWarning: string;
  dataVizRisk: string;
  isDark: boolean;
}

const lightTheme: ThemeColors = {
  pageBg: '#FFFFFF',
  cardBg: '#FAFAFA',
  cardBorder: '#E5E5E5',
  textPrimary: '#000000',
  textSecondary: '#525252',
  textTertiary: '#737373',
  buttonAccept: accept.light,
  buttonDecline: decline.light,
  buttonDeclineContrast: decline.contrast,
  buttonPrimary: primary.light,
  buttonPrimaryContrast: primaryContrast.light,
  brandAccent: primary.light,
  brandAccentMuted: primary.mutedLight,
  tabActive: primary.light,
  tabInactiveBg: '#F5F5F5',
  tabInactiveText: '#525252',
  avatarPrimary: '#E5E5E5',
  avatarWarning: '#fef3c7',
  badgeSuccess: '#dcfce7',
  badgeError: '#fee2e2',
  quizCorrect: quizCorrect.light,
  quizCorrectBg: quizCorrect.bgLight,
  quizIncorrect: quizIncorrect.light,
  quizIncorrectBg: quizIncorrect.bgLight,
  badgeWarning: '#fef3c7',
  badgeInfo: '#f5f5f5',
  emptyBg: '#F5F5F5',
  messageBg: '#FAFAFA',
  inputBg: '#FFFFFF',
  overlayBg: 'rgba(0,0,0,0.5)',
  starSuccess: success,
  badgeSuccessBg: 'rgba(74, 222, 128, 0.35)',
  badgeInfoBg: 'rgba(96, 165, 250, 0.35)',
  dataVizPrimary: dataViz.light.primary,
  dataVizComparison: dataViz.light.comparison,
  dataVizWarning: dataViz.light.warning,
  dataVizRisk: dataViz.light.risk,
  isDark: false,
};

const darkTheme: ThemeColors = {
  pageBg: '#0a0a0a',
  cardBg: '#171717',
  cardBorder: '#262626',
  textPrimary: '#FAFAFA',
  textSecondary: '#a3a3a3',
  textTertiary: '#737373',
  buttonAccept: accept.dark,
  buttonDecline: decline.dark,
  buttonDeclineContrast: decline.contrast,
  buttonPrimary: primary.dark,
  buttonPrimaryContrast: primaryContrast.dark,
  brandAccent: primary.dark,
  brandAccentMuted: primary.mutedDark,
  tabActive: primary.dark,
  tabInactiveBg: '#262626',
  tabInactiveText: '#a3a3a3',
  avatarPrimary: '#262626',
  avatarWarning: '#78350f',
  badgeSuccess: '#064e3b',
  badgeError: '#7f1d1d',
  quizCorrect: quizCorrect.dark,
  quizCorrectBg: quizCorrect.bgDark,
  quizIncorrect: quizIncorrect.dark,
  quizIncorrectBg: quizIncorrect.bgDark,
  badgeWarning: '#78350f',
  badgeInfo: '#262626',
  emptyBg: '#171717',
  messageBg: '#0a0a0a',
  inputBg: '#171717',
  overlayBg: 'rgba(0,0,0,0.7)',
  starSuccess: success,
  badgeSuccessBg: 'rgba(74, 222, 128, 0.35)',
  badgeInfoBg: 'rgba(96, 165, 250, 0.35)',
  dataVizPrimary: dataViz.dark.primary,
  dataVizComparison: dataViz.dark.comparison,
  dataVizWarning: dataViz.dark.warning,
  dataVizRisk: dataViz.dark.risk,
  isDark: true,
};

export function useTheme(): ThemeColors {
  const { effectiveScheme } = useThemePreference();
  return effectiveScheme === 'dark' ? darkTheme : lightTheme;
}
