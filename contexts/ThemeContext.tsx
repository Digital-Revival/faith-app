import { userSettingsService } from '@/services/api/userSettingsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';

import { useAuth } from './AuthContext';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = '@faith_app:theme';

interface ThemeContextType {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  effectiveScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function normalizeColorScheme(
  scheme: ColorSchemeName | null | undefined,
): 'light' | 'dark' | null {
  return scheme === 'light' || scheme === 'dark' ? scheme : null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark' | null>(
    () => normalizeColorScheme(Appearance.getColorScheme()),
  );
  const { user } = useAuth();

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(normalizeColorScheme(colorScheme));
    });
    setSystemScheme(normalizeColorScheme(Appearance.getColorScheme()));
    return () => subscription.remove();
  }, []);
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (user?.id) {
        try {
          const stored = await userSettingsService.getSetting<string>(
            user.id,
            'theme',
          );
          if (
            stored &&
            (stored === 'light' || stored === 'dark' || stored === 'system')
          ) {
            setPreferenceState(stored);
            setIsLoaded(true);
            return;
          }
        } catch {
          //
        }
      }
      try {
        const local = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const validTheme =
          local &&
          (local === 'light' || local === 'dark' || local === 'system');
        if (validTheme) {
          setPreferenceState(local);
          if (user?.id) {
            try {
              await userSettingsService.setSetting(user.id, 'theme', local);
            } catch {
              //
            }
          }
        } else {
          setPreferenceState('system');
        }
      } catch {
        setPreferenceState('system');
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, [user?.id]);

  const setPreference = useCallback(
    async (newPreference: ThemePreference) => {
      setPreferenceState(newPreference);
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newPreference);
      } catch {
        //
      }
      if (user?.id) {
        try {
          await userSettingsService.setSetting(user.id, 'theme', newPreference);
        } catch {
          //
        }
      }
    },
    [user?.id],
  );

  const effectiveScheme: 'light' | 'dark' =
    preference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;

  const value = useMemo(
    () => ({ preference, setPreference, effectiveScheme }),
    [preference, setPreference, effectiveScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemePreference must be used within ThemeProvider');
  }
  return ctx;
}
