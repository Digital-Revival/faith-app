import { stackScreenOptions } from '@/constants/screenAnimationOptions';
import { routes } from '@/constants/routes';
import { useAdminViewMode } from '@/contexts/AdminViewModeContext';
import { Redirect, Stack } from 'expo-router';

export default function AdminLayout() {
  const { canUseAdminView, isAdminView } = useAdminViewMode();

  if (!canUseAdminView || !isAdminView) {
    return <Redirect href={routes.main()} />;
  }

  return (
    <Stack screenOptions={stackScreenOptions({ headerShown: false })}>
      <Stack.Screen name="index" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="users" />
      <Stack.Screen name="users/[id]" />
    </Stack>
  );
}
