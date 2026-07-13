import {
  rootScreenOptions,
  stackScreenOptions,
  STACK_ANIMATION,
} from '@/constants/screenAnimationOptions';
import { useBibleschoolTab } from '@/contexts/BibleschoolTabContext';
import { useBibleschoolSimpleMode } from '@/contexts/BibleschoolSimpleModeContext';
import { routes } from '@/constants/routes';
import { useTheme } from '@/hooks/useTheme';
import { Redirect, Stack, usePathname } from 'expo-router';

export default function BibleSchoolTabsLayout() {
  const theme = useTheme();
  const pathname = usePathname();
  const { enabled: simpleMode } = useBibleschoolSimpleMode();
  const { navigationDirection } = useBibleschoolTab();

  const baseOptions = stackScreenOptions({
    headerShown: false,
    contentStyle: { backgroundColor: theme.pageBg },
  });

  const modulesAnimation =
    navigationDirection === 'left' ? STACK_ANIMATION.pop : STACK_ANIMATION.push;

  if (simpleMode && pathname.includes('/voortgang')) {
    return <Redirect href={routes.bibleschool()} />;
  }

  return (
    <Stack screenOptions={baseOptions}>
      <Stack.Screen name="index" options={rootScreenOptions({ title: 'Overview' })} />
      <Stack.Screen name="modules" options={{ title: 'Modules', animation: modulesAnimation }} />
      <Stack.Screen name="voortgang/index" options={{ title: 'Voortgang' }} />
    </Stack>
  );
}
