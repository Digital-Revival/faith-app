import { MainTopBar } from "@/app/(main)/_components/MainTopBar";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { routes } from "@/constants/routes";
import {
  useIntroductionVimeoId,
  useModules,
} from "@/hooks/useBibleschoolContent";
import { useLessonUnlocks } from "@/hooks/useLessonUnlocks";
import { prefetchLessonThumbnailsForModule } from "@/hooks/usePrefetchLessonThumbnails";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import type { BibleschoolModule } from "@/types/bibleschool";
import { getFirstModuleId } from "@/utils/bibleschoolCurriculum";
import { filterBibleschoolModulesBySearch } from "@/utils/bibleschoolModuleSearch";
import { bzzt } from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from "react-native";
import { runDeferredTask } from "@/utils/runDeferredTask";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModulesCatalogSections } from "./_components/ModulesCatalogSections";
import { ModulesSearchBar } from "./_components/ModulesSearchBar";
import { useModuleProgress } from "./_hooks/useModuleProgress";

export default function BibleSchoolModulesScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: introductionVimeoId } = useIntroductionVimeoId(locale);
  const { progressMap, attemptCountMap } = useModuleProgress();
  const { data: modules } = useModules(locale);
  const { nextUnlockedTarget } = useLessonUnlocks();
  const [searchQuery, setSearchQuery] = useState("");

  const firstModuleId = useMemo(() => getFirstModuleId(modules ?? []), [modules]);

  const filteredModules = useMemo(() => {
    if (!modules?.length) return [];
    return filterBibleschoolModulesBySearch(modules, searchQuery);
  }, [modules, searchQuery]);

  const moduleToPrefetch = useMemo(() => {
    if (!modules?.length) return undefined;
    const resumeModuleId = nextUnlockedTarget?.module.id;
    const cmd = resumeModuleId
      ? modules.find((m) => m.id === resumeModuleId)
      : undefined;
    const pool = cmd
      ? modules.filter((m) => m.id !== cmd.id)
      : modules;
    const remaining = pool.filter(
      (m) => progressMap[m.id]?.status !== "completed",
    );
    return cmd ?? remaining[0];
  }, [modules, nextUnlockedTarget?.module.id, progressMap]);

  const handleModulePress = useCallback(
    (module: BibleschoolModule) => {
      bzzt();
      const full = modules?.find((m) => m.id === module.id);
      const lessons = full?.lessons ?? module.lessons ?? [];
      prefetchLessonThumbnailsForModule(
        queryClient,
        module.id,
        lessons,
        introductionVimeoId ?? undefined,
        firstModuleId,
      );
      router.push(routes.bibleschoolModule(module.id));
    },
    [queryClient, introductionVimeoId, firstModuleId, modules],
  );

  const allModulesCompleted = useMemo(() => {
    if (!modules?.length) return false;
    return modules.every((m) => progressMap[m.id]?.status === "completed");
  }, [modules, progressMap]);

  const currentModuleData = useMemo(() => {
    if (allModulesCompleted || !filteredModules?.length) return undefined;

    const resumeModuleId = nextUnlockedTarget?.module.id;
    if (resumeModuleId) {
      const resumeModule = filteredModules.find((m) => m.id === resumeModuleId);
      if (resumeModule && progressMap[resumeModule.id]?.status !== "completed") {
        return resumeModule;
      }
    }

    return filteredModules.find(
      (m) => progressMap[m.id]?.status !== "completed",
    );
  }, [filteredModules, nextUnlockedTarget?.module.id, progressMap, allModulesCompleted]);

  const completedModules = useMemo(() => {
    if (!filteredModules?.length) return [];
    return filteredModules.filter(
      (m) => progressMap[m.id]?.status === "completed",
    );
  }, [filteredModules, progressMap]);

  const allModulesExcludingCurrent = useMemo(() => {
    if (!filteredModules?.length) return [];
    if (allModulesCompleted || !currentModuleData) return filteredModules;
    return filteredModules.filter((m) => m.id !== currentModuleData.id);
  }, [filteredModules, currentModuleData, allModulesCompleted]);

  const remainingModules = useMemo(() => {
    if (allModulesCompleted) return allModulesExcludingCurrent;
    return allModulesExcludingCurrent.filter(
      (m) => progressMap[m.id]?.status !== "completed",
    );
  }, [allModulesExcludingCurrent, progressMap, allModulesCompleted]);

  useEffect(() => {
    if (!moduleToPrefetch || !modules?.length) return;
    const task = runDeferredTask(() => {
      prefetchLessonThumbnailsForModule(
        queryClient,
        moduleToPrefetch.id,
        moduleToPrefetch.lessons ?? [],
        introductionVimeoId ?? undefined,
        firstModuleId,
      );
    });
    return () => task.cancel();
  }, [
    moduleToPrefetch,
    queryClient,
    introductionVimeoId,
    firstModuleId,
    modules?.length,
  ]);

  const [completedModulesExpanded, setCompletedModulesExpanded] =
    useState(true);
  const [allModulesExpanded, setAllModulesExpanded] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const SCROLL_THRESHOLD = 150;

  const searchTrimmed = searchQuery.trim();
  const hasNoSearchResults =
    searchTrimmed.length > 0 && filteredModules.length === 0;

  if (!modules?.length) {
    return (
      <Box
        className="flex-1 items-center justify-center px-6"
        style={{
          paddingTop: insets.top + 24,
          backgroundColor: theme.pageBg,
        }}
      >
        <MainTopBar
          title={t("navbar.bibleschool")}
          currentSection="bibleschool"
          showBackButton
          onBack={() => router.replace(routes.bibleschool())}
        />
        <Box className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.textSecondary} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className="flex-1 px-6 pt-6"
      style={{
        paddingTop: insets.top + 24,
        backgroundColor: theme.pageBg,
      }}
    >
      <MainTopBar
        title={t("navbar.bibleschool")}
        currentSection="bibleschool"
        showBackButton
        onBack={() => router.replace(routes.bibleschool())}
      />
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          setShowScrollToTop(y > SCROLL_THRESHOLD);
        }}
        scrollEventThrottle={100}
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <Text
          className="text-2xl font-bold mb-4"
          style={{ color: theme.textPrimary }}
        >
          {t("navbar.modules")}
        </Text>
        <ModulesSearchBar value={searchQuery} onChangeText={setSearchQuery} />
        {hasNoSearchResults ? (
          <Text
            className="text-center text-base py-8 px-2"
            style={{ color: theme.textSecondary }}
          >
            {t("modules.searchNoResults")}
          </Text>
        ) : (
          <ModulesCatalogSections
            theme={theme}
            allModulesCompleted={allModulesCompleted}
            moduleCount={modules.length}
            currentModuleLabel={t("modules.currentModule")}
            allModulesLabel={t("modules.allModules")}
            year1AllModulesLabel={t("modules.year1AllModules", {
              year: t("modules.year1Label"),
            })}
            completedModulesLabel={t("modules.completedModules")}
            currentModuleData={currentModuleData}
            remainingModules={remainingModules}
            completedModules={completedModules}
            progressMap={progressMap}
            attemptCountMap={attemptCountMap}
            allModulesExpanded={allModulesExpanded}
            onToggleAllModules={() =>
              setAllModulesExpanded((v) => !v)
            }
            completedModulesExpanded={completedModulesExpanded}
            onToggleCompletedModules={() =>
              setCompletedModulesExpanded((v) => !v)
            }
            onModulePress={handleModulePress}
          />
        )}
      </ScrollView>
      {showScrollToTop && (
        <View
          style={{
            position: "absolute",
            right: 12,
            bottom: insets.bottom + 90,
          }}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={() => {
              bzzt();
              scrollRef.current?.scrollTo({ y: 0, animated: true });
            }}
            activeOpacity={0.7}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="arrow-up-circle"
              size={28}
              color={theme.textPrimary}
            />
          </TouchableOpacity>
        </View>
      )}
    </Box>
  );
}
