import type { BibleschoolModule } from '@/types/bibleschool';
import { sortModulesByOrder } from '@/utils/bibleschoolCurriculum';

/** First module without a passed exam — where the learner should still be active. */
export function getActiveModuleId(
  curriculum: BibleschoolModule[],
  passedModuleIds: ReadonlySet<string>,
): string | undefined {
  const sorted = sortModulesByOrder(curriculum);
  const blocker = sorted.find((module) => !passedModuleIds.has(module.id));
  return blocker?.id;
}

export function isModuleReachable(
  curriculum: BibleschoolModule[],
  moduleId: string,
  passedModuleIds: ReadonlySet<string>,
): boolean {
  const activeModuleId = getActiveModuleId(curriculum, passedModuleIds);
  if (!activeModuleId) return true;

  const sorted = sortModulesByOrder(curriculum);
  const activeIndex = sorted.findIndex((m) => m.id === activeModuleId);
  const moduleIndex = sorted.findIndex((m) => m.id === moduleId);
  if (moduleIndex === -1 || activeIndex === -1) return false;

  return moduleIndex <= activeIndex || passedModuleIds.has(moduleId);
}
