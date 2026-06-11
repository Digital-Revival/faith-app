import { useBibleschoolTab } from '@/contexts/BibleschoolTabContext';
import { stackScreenOptions } from '@/constants/screenAnimationOptions';
import { useTheme } from '@/hooks/useTheme';
import { useFocusEffect } from "expo-router/react-navigation";
import { Stack } from 'expo-router';
import { useCallback } from 'react';

export default function ModulesLayout() {
  const theme = useTheme();
  const { setActiveTab } = useBibleschoolTab();

  useFocusEffect(
    useCallback(() => {
      setActiveTab('modules');
    }, [setActiveTab])
  );

  return (
    <Stack
      screenOptions={stackScreenOptions({
        headerShown: false,
        contentStyle: { backgroundColor: theme.pageBg },
      })}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
