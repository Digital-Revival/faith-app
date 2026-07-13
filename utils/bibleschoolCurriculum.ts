import type { BibleschoolLesson, BibleschoolModule } from '@/types/bibleschool';

export function sortModulesByOrder(modules: BibleschoolModule[]): BibleschoolModule[] {
  return [...modules].sort((a, b) => a.order - b.order);
}

export function sortLessonsByOrder(module: BibleschoolModule): BibleschoolLesson[] {
  return [...module.lessons].sort((a, b) => a.order - b.order);
}

export function totalLessonCountInCurriculum(modules: BibleschoolModule[]): number {
  return modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

export function getFirstModuleId(modules: BibleschoolModule[]): string | undefined {
  return sortModulesByOrder(modules)[0]?.id;
}

/** Storyblok module `order` is 0-based; UI labels use 1-based human numbers. */
export function getDisplayModuleNumber(order: number): number {
  return order + 1;
}
