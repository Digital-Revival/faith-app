import "@/utils/suppressConsoleWarnings";
import "@/global.css";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";

import { ThemeLayout } from "@/components/ThemeLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { EasyReadProvider } from "@/contexts/EasyReadContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { TypographyProvider } from "@/contexts/TypographyContext";
import { BrandedSplashScreen } from "@/components/ui/BrandedSplashScreen";
import { QueryProvider } from "@/providers/QueryProvider";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <BrandedSplashScreen useSystemFonts />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <TypographyProvider>
            <QueryProvider>
              <AuthProvider>
                <EasyReadProvider>
                  <ThemeProvider>
                    <LanguageProvider>
                    <ToastProvider>
                      <ThemeLayout />
                    </ToastProvider>
                    </LanguageProvider>
                  </ThemeProvider>
                </EasyReadProvider>
              </AuthProvider>
            </QueryProvider>
          </TypographyProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
