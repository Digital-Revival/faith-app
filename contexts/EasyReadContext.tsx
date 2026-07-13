import { userSettingsService } from '@/services/api/userSettingsService';
import { setEasyReadHapticsDisabled } from '@/utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from './AuthContext';

export const EASY_READ_STORAGE_KEY = '@faith_app:easy_read';
export const EASY_READ_SETTING_KEY = 'accessibility.easy_read';

const NORMAL_TYPOGRAPHY = {
  minTouchTarget: 44,
} as const;

const EASY_READ_TYPOGRAPHY = {
  minTouchTarget: 48,
} as const;

interface EasyReadTypography {
  minTouchTarget: number;
}

interface EasyReadContextType {
  enabled: boolean;
  isLoading: boolean;
  setEnabled: (value: boolean) => Promise<void>;
  typography: EasyReadTypography;
}

const EasyReadContext = createContext<EasyReadContextType | undefined>(undefined);

export { EasyReadContext };

function parseStoredBoolean(value: string | null): boolean | null {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function getTypographyForEnabled(enabled: boolean): EasyReadTypography {
  return enabled ? EASY_READ_TYPOGRAPHY : NORMAL_TYPOGRAPHY;
}

export function EasyReadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [enabled, setEnabledState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const typography = useMemo(
    () => getTypographyForEnabled(enabled),
    [enabled],
  );

  useEffect(() => {
    setEasyReadHapticsDisabled(enabled);
  }, [enabled]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      if (user?.id) {
        try {
          const stored = await userSettingsService.getSetting<boolean>(
            user.id,
            EASY_READ_SETTING_KEY,
          );
          if (typeof stored === 'boolean') {
            setEnabledState(stored);
            setIsLoading(false);
            return;
          }
        } catch {
          //
        }
      }

      try {
        const local = await AsyncStorage.getItem(EASY_READ_STORAGE_KEY);
        const parsed = parseStoredBoolean(local);
        if (parsed !== null) {
          setEnabledState(parsed);
          if (user?.id) {
            try {
              await userSettingsService.setSetting(
                user.id,
                EASY_READ_SETTING_KEY,
                parsed,
              );
            } catch {
              //
            }
          }
        } else {
          setEnabledState(false);
        }
      } catch {
        setEnabledState(false);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const setEnabled = useCallback(
    async (value: boolean) => {
      setEnabledState(value);
      try {
        await AsyncStorage.setItem(EASY_READ_STORAGE_KEY, String(value));
      } catch {
        //
      }
      if (user?.id) {
        try {
          await userSettingsService.setSetting(
            user.id,
            EASY_READ_SETTING_KEY,
            value,
          );
        } catch {
          //
        }
      }
    },
    [user?.id],
  );

  const value = useMemo(
    () => ({ enabled, isLoading, setEnabled, typography }),
    [enabled, isLoading, setEnabled, typography],
  );

  return (
    <EasyReadContext.Provider value={value}>{children}</EasyReadContext.Provider>
  );
}

export function useEasyRead() {
  const ctx = useContext(EasyReadContext);
  if (!ctx) {
    throw new Error('useEasyRead must be used within EasyReadProvider');
  }
  return ctx;
}
