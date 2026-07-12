import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { ThemeColors } from '@/hooks/useTheme';
import type { ModuleProgress } from '@/types/progress';
import type { BibleschoolModule } from '@/types/bibleschool';
import { ModuleCard } from './ModuleCard';
import { ModulesYearCompleteCard } from '@/components/bibleschool/ModulesYearCompleteCard';

interface ModulesCatalogSectionsProps {
  theme: ThemeColors;
  easyReadEnabled?: boolean;
  allModulesCompleted: boolean;
  moduleCount: number;
  currentModuleLabel: string;
  allModulesLabel: string;
  year1AllModulesLabel: string;
  completedModulesLabel: string;
  currentModuleData: BibleschoolModule | undefined;
  remainingModules: BibleschoolModule[];
  completedModules: BibleschoolModule[];
  progressMap: Record<string, ModuleProgress | null | undefined>;
  attemptCountMap: Record<string, number>;
  allModulesExpanded: boolean;
  onToggleAllModules: () => void;
  completedModulesExpanded: boolean;
  onToggleCompletedModules: () => void;
  onModulePress: (module: BibleschoolModule) => void;
}

function renderModuleCard(
  module: BibleschoolModule,
  progressMap: Record<string, ModuleProgress | null | undefined>,
  attemptCountMap: Record<string, number>,
  onModulePress: (module: BibleschoolModule) => void,
) {
  return (
    <ModuleCard
      key={module.id}
      module={{
        ...module,
        title: module.title,
        backgroundImageUrl: module.backgroundImageUrl,
      }}
      progress={progressMap[module.id] ?? null}
      attemptCount={attemptCountMap[module.id] ?? 0}
      onPress={() => onModulePress(module)}
    />
  );
}

export function ModulesCatalogSections({
  theme,
  easyReadEnabled = false,
  allModulesCompleted,
  moduleCount,
  currentModuleLabel,
  allModulesLabel,
  year1AllModulesLabel,
  completedModulesLabel,
  currentModuleData,
  remainingModules,
  completedModules,
  progressMap,
  attemptCountMap,
  allModulesExpanded,
  onToggleAllModules,
  completedModulesExpanded,
  onToggleCompletedModules,
  onModulePress,
}: ModulesCatalogSectionsProps) {
  const catalogTitle = allModulesCompleted
    ? year1AllModulesLabel
    : allModulesLabel;

  if (easyReadEnabled) {
    const activeModules = currentModuleData
      ? [currentModuleData, ...remainingModules.filter((m) => m.id !== currentModuleData.id)]
      : remainingModules;

    return (
      <VStack className="gap-6">
        {allModulesCompleted ? (
          <ModulesYearCompleteCard theme={theme} moduleCount={moduleCount} />
        ) : null}
        <VStack className="gap-2">
          <Text
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.textTertiary }}
          >
            {catalogTitle}
          </Text>
          {activeModules.map((module) =>
            renderModuleCard(module, progressMap, attemptCountMap, onModulePress),
          )}
        </VStack>
        {completedModules.length > 0 ? (
          <VStack className="gap-2">
            <Text
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: theme.textTertiary }}
            >
              {completedModulesLabel}
            </Text>
            {completedModules.map((module) =>
              renderModuleCard(module, progressMap, attemptCountMap, onModulePress),
            )}
          </VStack>
        ) : null}
      </VStack>
    );
  }

  return (
    <VStack className="gap-6">
      {allModulesCompleted ? (
        <ModulesYearCompleteCard theme={theme} moduleCount={moduleCount} />
      ) : null}
      {currentModuleData ? (
        <VStack className="gap-2">
          <Text
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.textTertiary }}
          >
            {currentModuleLabel}
          </Text>
          {renderModuleCard(
            currentModuleData,
            progressMap,
            attemptCountMap,
            onModulePress,
          )}
        </VStack>
      ) : null}
      <VStack className="gap-2">
        <CollapsibleSection
          title={catalogTitle}
          collapsed={!allModulesExpanded}
          onToggle={onToggleAllModules}
          headerBg={theme.tabInactiveBg}
        >
          {remainingModules.map((module) =>
            renderModuleCard(module, progressMap, attemptCountMap, onModulePress),
          )}
        </CollapsibleSection>
        {!allModulesCompleted && completedModules.length > 0 ? (
          <CollapsibleSection
            title={completedModulesLabel}
            collapsed={!completedModulesExpanded}
            onToggle={onToggleCompletedModules}
            headerBg={theme.tabInactiveBg}
          >
            {completedModules.map((module) =>
              renderModuleCard(module, progressMap, attemptCountMap, onModulePress),
            )}
          </CollapsibleSection>
        ) : null}
      </VStack>
    </VStack>
  );
}

const __expoRouterPrivateRoute_ModulesCatalogSections = () => null;

export default __expoRouterPrivateRoute_ModulesCatalogSections;
