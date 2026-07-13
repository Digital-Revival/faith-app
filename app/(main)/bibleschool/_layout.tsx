import { BibleschoolTabProvider } from "@/contexts/BibleschoolTabContext";
import { useBibleschoolSimpleMode } from "@/contexts/BibleschoolSimpleModeContext";
import { BibleschoolTabBar } from "./_components/BibleschoolTabBar";
import { StoryblokErrorBanner } from "./_components/StoryblokErrorBanner";
import {
  rootScreenOptions,
  stackScreenOptions,
} from "@/constants/screenAnimationOptions";
import { useOnboardingSection } from "@/hooks/useOnboardingSection";
import { useTheme } from "@/hooks/useTheme";
import type { Href } from "expo-router";
import { Redirect, Stack } from "expo-router";
import { View } from "react-native";

export default function BibleSchoolLayout() {
  const theme = useTheme();
  const { enabled: simpleMode, isLoading: simpleModeLoading } =
    useBibleschoolSimpleMode();
  const baseOptions = stackScreenOptions({
    headerShown: false,
    contentStyle: { backgroundColor: theme.pageBg },
  });
  const { onboardingCompleted: bsOnboardingDone, isLoading: bsOnboardingLoading } =
    useOnboardingSection('bibleschool');

  if (bsOnboardingLoading || simpleModeLoading) {
    return <View style={{ flex: 1, backgroundColor: theme.pageBg }} />;
  }

  if (!simpleMode && bsOnboardingDone === false) {
    return <Redirect href={'/onboarding?section=bibleschool' as Href} />;
  }

  return (
    <BibleschoolTabProvider>
      <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
        <StoryblokErrorBanner />
        <View style={{ flex: 1 }}>
          <Stack screenOptions={baseOptions}>
            <Stack.Screen name="(tabs)" options={rootScreenOptions()} />
            <Stack.Screen name="intro" />
          </Stack>
        </View>
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <BibleschoolTabBar />
        </View>
      </View>
    </BibleschoolTabProvider>
  );
}
