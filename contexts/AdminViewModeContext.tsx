import { routes } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  getStoredAdminViewMode,
  setStoredAdminViewMode,
  type AppViewMode,
} from "@/services/adminViewModeStorage";
import { router } from "expo-router";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type { AppViewMode } from "@/services/adminViewModeStorage";

interface AdminViewModeContextValue {
  canUseAdminView: boolean;
  isInitialized: boolean;
  viewMode: AppViewMode;
  isAdminView: boolean;
  isTransitioning: boolean;
  transitionTarget: AppViewMode | null;
  requestViewMode: (mode: AppViewMode) => void;
  completeViewTransition: () => void;
}

const AdminViewModeContext = createContext<
  AdminViewModeContextValue | undefined
>(undefined);

const ROUTE_SETTLE_MS = 120;

export function AdminViewModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile(
    user?.id,
  );
  const canUseAdminView = profile?.role === "admin";
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewMode, setViewMode] = useState<AppViewMode>("member");
  const [transitionTarget, setTransitionTarget] = useState<AppViewMode | null>(
    null,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestViewMode = useCallback(
    (mode: AppViewMode) => {
      if (isTransitioning || mode === viewMode) return;
      if (mode === "admin" && !canUseAdminView) return;

      setViewMode(mode);
      if (user?.id) {
        void setStoredAdminViewMode(user.id, mode).catch(() => {});
      }
      setTransitionTarget(mode);
      setIsTransitioning(true);
    },
    [canUseAdminView, isTransitioning, user?.id, viewMode],
  );

  const completeViewTransition = useCallback(() => {
    if (!isTransitioning) return;
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      setIsTransitioning(false);
      setTransitionTarget(null);
      settleTimerRef.current = null;
    }, ROUTE_SETTLE_MS);
  }, [isTransitioning]);

  useEffect(() => {
    if (!isTransitioning || !transitionTarget) return;
    if (viewMode !== transitionTarget) return;

    router.replace(
      transitionTarget === "admin" ? routes.admin() : routes.main(),
    );
  }, [isTransitioning, transitionTarget, viewMode]);

  useEffect(() => {
    if (!user?.id || isProfileLoading) return;

    let cancelled = false;
    setIsInitialized(false);

    getStoredAdminViewMode(user.id).then((storedMode) => {
      if (cancelled) return;

      const restoredMode = canUseAdminView ? storedMode : "member";
      setViewMode(restoredMode);
      setIsInitialized(true);

      if (restoredMode === "admin") {
        router.replace(routes.admin());
      }

      if (storedMode === "admin" && !canUseAdminView) {
        void setStoredAdminViewMode(user.id, "member").catch(() => {});
      }
    });

    return () => {
      cancelled = true;
    };
  }, [canUseAdminView, isProfileLoading, user?.id]);

  useEffect(() => {
    if (canUseAdminView || viewMode !== "admin") return;

    setViewMode("member");
    if (user?.id) {
      void setStoredAdminViewMode(user.id, "member").catch(() => {});
    }
    setTransitionTarget(null);
    setIsTransitioning(false);
    router.replace(routes.main());
  }, [canUseAdminView, user?.id, viewMode]);

  useEffect(
    () => () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    },
    [],
  );

  const value = useMemo<AdminViewModeContextValue>(
    () => ({
      canUseAdminView,
      isInitialized,
      viewMode,
      isAdminView: viewMode === "admin",
      isTransitioning,
      transitionTarget,
      requestViewMode,
      completeViewTransition,
    }),
    [
      canUseAdminView,
      completeViewTransition,
      isInitialized,
      isTransitioning,
      requestViewMode,
      transitionTarget,
      viewMode,
    ],
  );

  return (
    <AdminViewModeContext.Provider value={value}>
      {children}
    </AdminViewModeContext.Provider>
  );
}

export function useAdminViewMode(): AdminViewModeContextValue {
  const context = useContext(AdminViewModeContext);
  if (!context) {
    throw new Error(
      "useAdminViewMode must be used within an AdminViewModeProvider",
    );
  }
  return context;
}
