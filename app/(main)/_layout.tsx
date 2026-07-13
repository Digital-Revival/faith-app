import { BrandedSplashScreen } from "@/components/ui/BrandedSplashScreen";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { routes } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import {
  AdminViewModeProvider,
  useAdminViewMode,
} from "@/contexts/AdminViewModeContext";
import {
  SectionNavigationProvider,
  useSectionNavigation,
} from "@/contexts/SectionNavigationContext";
import { useLastSectionRestore } from "@/hooks/useLastSectionRestore";
import { useStreak } from "@/hooks/useStreak";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { useWhatsNew } from "@/hooks/useWhatsNew";
import { Redirect, router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useDelayedTrue } from "@/hooks/useDelayedTrue";
import { useState } from "react";
import { View } from "react-native";
import { DrawerContent } from "./_components/DrawerContent";
import { AdminViewTransitionOverlay } from "./_components/AdminViewTransitionOverlay";
import { WhatsNewModal } from "./settings/_components/WhatsNewModal";

const LOADING_DELAY_MS = 300;

function MainLayoutContent() {
  const { session } = useAuth();
  const {
    isInitialized: isAdminViewInitialized,
    isTransitioning: isAdminViewTransitioning,
    transitionTarget,
    completeViewTransition,
  } = useAdminViewMode();
  const { isNavigating, targetSection } = useSectionNavigation();
  const showLoadingOverlay = useDelayedTrue(isNavigating, LOADING_DELAY_MS);
  const [dismissedUnreadKey, setDismissedUnreadKey] = useState<string | null>(
    null,
  );
  useLastSectionRestore();
  useStreak();
  const { t } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const {
    hasUnreadWhatsNew,
    unreadReleases,
    isLoading: isWhatsNewLoading,
    markSeen,
  } = useWhatsNew();

  const unreadReleaseKey = unreadReleases
    .map((release) => release.version)
    .join(",");

  const handleWhatsNewDismiss = async () => {
    setDismissedUnreadKey(unreadReleaseKey);
    try {
      await markSeen();
    } catch {
      toast.error(t("whatsNew.markSeenError"));
    }
  };

  const handleWhatsNewViewAll = () => {
    setDismissedUnreadKey(unreadReleaseKey);
    router.push(routes.settings("whats-new"));
  };

  const showWhatsNewModal =
    !isWhatsNewLoading &&
    hasUnreadWhatsNew &&
    unreadReleases.length > 0 &&
    dismissedUnreadKey !== unreadReleaseKey;

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!isAdminViewInitialized) return <BrandedSplashScreen />;

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
      <WhatsNewModal
        visible={showWhatsNewModal}
        unreadReleases={unreadReleases}
        onDismiss={() => void handleWhatsNewDismiss()}
        onViewAll={handleWhatsNewViewAll}
      />
      <AdminViewTransitionOverlay
        visible={isAdminViewTransitioning}
        targetMode={transitionTarget}
        onComplete={completeViewTransition}
      />
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
    <AdminViewModeProvider>
      <SectionNavigationProvider>
        <MainLayoutContent />
      </SectionNavigationProvider>
    </AdminViewModeProvider>
  );
}
