export interface BadgeDefinition {
  id: string;
  target_value: number;
}

export interface BadgeEligibilityInput {
  lessonCount: number;
  completedModuleIds: ReadonlySet<string>;
  moduleCount: number;
  streakDays: number;
  hasPassedQuiz: boolean;
  introWatched: boolean;
}

export function badgeQualifies(
  badge: BadgeDefinition,
  input: BadgeEligibilityInput,
): boolean {
  if (badge.id === 'first_lesson') {
    return input.lessonCount >= 1;
  }
  if (badge.id.startsWith('lesson_milestone_')) {
    return input.lessonCount >= badge.target_value;
  }
  if (badge.id === 'student_van_het_woord') {
    return input.lessonCount >= 10;
  }
  if (badge.id.startsWith('streak_')) {
    return input.streakDays >= badge.target_value;
  }
  if (badge.id === 'volharder') {
    return input.streakDays >= 7;
  }
  if (badge.id === 'strijder') {
    return input.hasPassedQuiz;
  }
  if (badge.id === 'bijbelleraar') {
    return input.moduleCount >= 5;
  }
  if (badge.id === 'faith_finisher') {
    return input.moduleCount >= 20;
  }
  if (badge.id === 'schriftgeleerde') {
    return input.lessonCount >= 100;
  }
  if (badge.id.startsWith('module_')) {
    const moduleNum = parseInt(badge.id.replace('module_', ''), 10);
    if (Number.isNaN(moduleNum)) return false;
    return input.completedModuleIds.has(`module-${moduleNum}`);
  }
  if (badge.id === 'intro_watched') {
    return input.introWatched;
  }
  return false;
}

export function getEligibleBadgeIds(
  badges: BadgeDefinition[],
  earnedBadgeIds: ReadonlySet<string>,
  input: BadgeEligibilityInput,
): string[] {
  const eligible: string[] = [];
  for (const badge of badges) {
    if (earnedBadgeIds.has(badge.id)) continue;
    if (badgeQualifies(badge, input)) {
      eligible.push(badge.id);
    }
  }
  return eligible;
}
