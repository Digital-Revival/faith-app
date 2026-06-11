import type { Badge, UserBadge } from '@/types/badge';
import { getEligibleBadgeIds } from '@/utils/badgeEligibility';

import { lessonProgressService } from './lessonProgressService';
import { moduleProgressService } from './moduleProgressService';
import { notificationService } from './notificationService';
import { streakService } from './streakService';
import { userSettingsService } from './userSettingsService';
import { BaseService } from './baseService';
import { supabase } from '@/services/supabase/client';

const INTRO_WATCHED_KEY = 'bibleschool.intro_video_watched';

class BadgeService extends BaseService {
  protected tableName = 'badges';

  async listAll(): Promise<Badge[]> {
    return this.list<Badge>({
      sort: [{ field: 'order', ascending: true }],
    });
  }
}

class UserBadgeService extends BaseService {
  protected tableName = 'user_badges';

  async listByUser(userId: string): Promise<UserBadge[]> {
    return this.list<UserBadge>({
      filters: [{ field: 'user_id', operator: 'eq', value: userId }],
      sort: [{ field: 'earned_at', ascending: false }],
    });
  }

  async createForUser(userId: string, badgeId: string): Promise<UserBadge> {
    return this.create<UserBadge>({ user_id: userId, badge_id: badgeId });
  }

  async batchCreateForUser(
    userId: string,
    badgeIds: string[],
  ): Promise<UserBadge[]> {
    if (badgeIds.length === 0) return [];
    const items = badgeIds.map((badge_id) => ({ user_id: userId, badge_id }));
    return this.batchCreate<UserBadge>(items);
  }
}

const badgeService = new BadgeService();
const userBadgeService = new UserBadgeService();

export async function getBadges(): Promise<Badge[]> {
  const data = await badgeService.listAll();
  return data ?? [];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  return userBadgeService.listByUser(userId);
}

export async function checkAndAwardBadges(
  userId: string,
  options?: { notify?: boolean },
): Promise<{ badge: Badge }[]> {
  const notify = options?.notify !== false;
  const [badges, earnedBadgeIds, completedLessons, moduleProgress, dbStreak] =
    await Promise.all([
      getBadges(),
      getUserBadges(userId).then((ub) => ub.map((u) => u.badge_id)),
      lessonProgressService.listCompletedByUser(userId),
      moduleProgressService.listByUser(userId),
      streakService.getStreak(userId).catch(() => null),
    ]);

  const quizPassedRows = await supabase
    .from('user_quiz_attempts')
    .select('id')
    .eq('user_id', userId)
    .eq('passed', true)
    .limit(1);
  const hasPassedQuiz = (quizPassedRows.data?.length ?? 0) > 0;

  const introWatched =
    (await userSettingsService.getSetting<boolean>(
      userId,
      INTRO_WATCHED_KEY,
    )) === true;

  const lessonCount = completedLessons.length;
  const completedModules = moduleProgress.filter(
    (m) => m.status === 'completed',
  );
  const moduleCount = completedModules.length;
  const streak = dbStreak?.days ?? 0;

  const completedModuleIds = new Set(completedModules.map((m) => m.module_id));
  const earnedBadgeIdSet = new Set(earnedBadgeIds);

  const badgeIdsToAward = getEligibleBadgeIds(badges, earnedBadgeIdSet, {
    lessonCount,
    completedModuleIds,
    moduleCount,
    streakDays: streak,
    hasPassedQuiz,
    introWatched,
  });

  const newlyEarned = badgeIdsToAward.flatMap((id) => {
    const badge = badges.find((b) => b.id === id);
    return badge ? [{ badge }] : [];
  });

  if (badgeIdsToAward.length > 0) {
    try {
      await userBadgeService.batchCreateForUser(userId, badgeIdsToAward);
    } catch {
      return [];
    }
    if (notify) {
      await notificationService
        .createForBadges(userId, newlyEarned)
        .catch(() => {});
    }
  }

  return newlyEarned;
}
