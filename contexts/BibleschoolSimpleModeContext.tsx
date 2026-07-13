import { useAuth } from '@/contexts/AuthContext';
import { BIBLEschool_SIMPLE_MODE_KEY } from '@/constants/bibleschoolSimpleMode';
import { userSettingsService } from '@/services/api/userSettingsService';
import { queryKeys } from '@/services/queryKeys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';

export interface BibleschoolSimpleModeContextValue {
  enabled: boolean;
  isLoading: boolean;
  setEnabled: (value: boolean) => Promise<void>;
}

const BibleschoolSimpleModeContext =
  createContext<BibleschoolSimpleModeContextValue | undefined>(undefined);

export function BibleschoolSimpleModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? '';

  const { data: enabled = false, isLoading } = useQuery({
    queryKey: queryKeys.userSettings.simpleMode(userId),
    queryFn: async () => {
      const stored = await userSettingsService.getSetting<boolean>(
        user!.id,
        BIBLEschool_SIMPLE_MODE_KEY,
      );
      return stored === true;
    },
    enabled: !!user?.id,
  });

  const mutation = useMutation({
    mutationFn: async (value: boolean) => {
      await userSettingsService.setSetting(
        user!.id,
        BIBLEschool_SIMPLE_MODE_KEY,
        value,
      );
    },
    onMutate: async (value) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.userSettings.simpleMode(userId),
      });
      const previous = queryClient.getQueryData<boolean>(
        queryKeys.userSettings.simpleMode(userId),
      );
      queryClient.setQueryData(
        queryKeys.userSettings.simpleMode(userId),
        value,
      );
      return { previous };
    },
    onError: (_err, _value, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          queryKeys.userSettings.simpleMode(userId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.userSettings.simpleMode(userId),
      });
    },
  });

  const setEnabled = useCallback(
    async (value: boolean) => {
      if (!user?.id) return;
      await mutation.mutateAsync(value);
    },
    [user?.id, mutation.mutateAsync],
  );

  const value = useMemo(
    () => ({
      enabled,
      isLoading: isLoading || mutation.isPending,
      setEnabled,
    }),
    [enabled, isLoading, mutation.isPending, setEnabled],
  );

  return (
    <BibleschoolSimpleModeContext.Provider value={value}>
      {children}
    </BibleschoolSimpleModeContext.Provider>
  );
}

export function useBibleschoolSimpleMode(): BibleschoolSimpleModeContextValue {
  const ctx = useContext(BibleschoolSimpleModeContext);
  if (!ctx) {
    return {
      enabled: false,
      isLoading: false,
      setEnabled: async () => {},
    };
  }
  return ctx;
}
