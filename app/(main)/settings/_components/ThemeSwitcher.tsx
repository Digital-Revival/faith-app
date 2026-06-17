import { forwardRef } from 'react';
import { useThemePreference } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { ThemePreference } from '@/contexts/ThemeContext';
import {
  SettingsDropdown,
  type SettingsDropdownOption,
  type SettingsDropdownRef,
} from '@/components/ui/SettingsDropdown';
import { View } from 'react-native';

export type ThemeSwitcherRef = SettingsDropdownRef;

export const THEME_OPTIONS: {
  value: ThemePreference;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
}[] = [
  { value: 'light', icon: 'sunny', labelKey: 'settings.themeLight' },
  { value: 'dark', icon: 'moon', labelKey: 'settings.themeDark' },
  { value: 'system', icon: 'phone-portrait', labelKey: 'settings.themeSystem' },
];

const THEME_DROPDOWN_OPTIONS: SettingsDropdownOption<ThemePreference>[] =
  THEME_OPTIONS;

interface ThemeSwitcherProps {
  fullWidth?: boolean;
  measureRef?: React.RefObject<View | null>;
}

export const ThemeSwitcher = forwardRef<ThemeSwitcherRef, ThemeSwitcherProps>(
  function ThemeSwitcher({ fullWidth = false, measureRef }, ref) {
    const { preference, setPreference } = useThemePreference();

    return (
      <SettingsDropdown<ThemePreference>
        ref={ref}
        options={THEME_DROPDOWN_OPTIONS}
        value={preference}
        onSelect={async (v) => {
          await setPreference(v);
        }}
        measureRef={measureRef}
        fullWidth={fullWidth}
      />
    );
  },
);

const __expoRouterPrivateRoute_ThemeSwitcher = () => null;

export default __expoRouterPrivateRoute_ThemeSwitcher;
