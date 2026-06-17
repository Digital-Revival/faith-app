import { stackScreenOptions } from '@/constants/screenAnimationOptions';
import { useTheme } from '@/hooks/useTheme';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={stackScreenOptions({
        headerShown: false,
        contentStyle: { backgroundColor: theme.pageBg },
      })}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="video" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="whats-new" />
    </Stack>
  );
}
