import { BrandedSplashScreen } from "@/components/ui/BrandedSplashScreen";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { routes } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import {
  SectionNavigationProvider,
  useSectionNavigation,
} from "@/contexts/SectionNavigationContext";
import { useLastSectionRestore } from "@/hooks/useLastSectionRestore";
import { useStreak } from "@/hooks/useStreak";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { DrawerContent } from "./_components/DrawerContent";

const LOADING_DELAY_MS = 300;

function MainLayoutContent() {
  const { session } = useAuth();
  const { isNavigating, targetSection } = useSectionNavigation();
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  useLastSectionRestore();
  useStreak();
  const { t } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    if (!isNavigating) {
      setShowLoadingOverlay(false);
      return;
    }
    const timer = setTimeout(
      () => setShowLoadingOverlay(true),
      LOADING_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [isNavigating]);

  if (!session) return <Redirect href="/(auth)/login" />;

  const loadingMessage =
    targetSection === "index"
      ? t("common.loading")
      : targetSection
        ? t(`loading.section.${targetSection}` as any)
        : t("common.loading");

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerPosition: "right",
          drawerStyle: { backgroundColor: theme.pageBg },
          swipeEdgeWidth: 80,
          swipeEnabled: true,
        }}
        drawerContent={(props) => <DrawerContent {...props} />}
      >
        <Drawer.Screen name="index" />
        <Drawer.Screen name="admin" />
        <Drawer.Screen name="bibleschool" />
        <Drawer.Screen name="podcasts" />
        <Drawer.Screen name="sermons" />
        <Drawer.Screen name="faith-business-school" />
        <Drawer.Screen name="hub-teaser" />
        <Drawer.Screen name="profile" />
        <Drawer.Screen name="badges/index" />
        <Drawer.Screen name="feedback/index" />
        <Drawer.Screen name="settings" />
      </Drawer>
      {showLoadingOverlay && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
          }}
        >
          <LoadingScreen message={loadingMessage} />
        </View>
      )}
    </View>
  );
}

export default function MainLayout() {
  const { session, isLoading, pendingPasswordRecovery } = useAuth();

  if (isLoading) {
    return <BrandedSplashScreen />;
  }
  if (!session) return <Redirect href="/(auth)/login" />;
  if (pendingPasswordRecovery) {
    return <Redirect href={routes.authResetPassword()} />;
  }

  return (
    <SectionNavigationProvider>
      <MainLayoutContent />
    </SectionNavigationProvider>
  );
}
