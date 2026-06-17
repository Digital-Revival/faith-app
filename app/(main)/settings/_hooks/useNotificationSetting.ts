import { useAuth } from '@/contexts/AuthContext';
import { userSettingsService } from '@/services/api/userSettingsService';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useNotificationSetting(
  key: string,
  defaultValue = true,
): [boolean, (value: boolean) => Promise<void>, boolean] {
  const { user } = useAuth();
  const [value, setValueState] = useState<boolean>(defaultValue);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const cacheKey = useMemo(
    () => (user?.id ? `${user.id}:${key}` : null),
    [user, key],
  );
  const isLoading = cacheKey !== null && loadedKey !== cacheKey;

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const currentKey = `${user.id}:${key}`;
    const load = async () => {
      try {
        const stored = await userSettingsService.getSetting<boolean>(user.id, key);
        if (!cancelled && stored !== null && typeof stored === 'boolean') {
          setValueState(stored);
        }
      } catch {
        if (!cancelled) {
          setValueState(defaultValue);
        }
      } finally {
        if (!cancelled) {
          setLoadedKey(currentKey);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, key, defaultValue]);

  const setValue = useCallback(
    async (newValue: boolean) => {
      if (!user?.id) return;
      setValueState(newValue);
      try {
        await userSettingsService.setSetting(user.id, key, newValue);
      } catch {
        setValueState(value);
        throw new Error('Failed to save setting');
      }
    },
    [user, key, value],
  );

  return [value, setValue, isLoading];
}

const __expoRouterPrivateRoute_useNotificationSetting = () => null;

export default __expoRouterPrivateRoute_useNotificationSetting;
