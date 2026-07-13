import type {
  AdminUserDetail,
  AdminUsersResponse,
  BibleschoolAnalytics,
  QuizAnalytics,
  TimeAnalytics,
  AdminLearningAnalyticsResponse,
  AdminOverviewResponse,
  AdminPeriod,
  AdminUserDetailV2,
  AdminUserFilters,
  AdminUsersResponseV2,
} from '@/types/analytics';

import { BaseService } from './baseService';

class AdminAnalyticsService extends BaseService {
  async getOverviewV2(period: AdminPeriod, timezone: string): Promise<AdminOverviewResponse> {
    return this.executeRpc<AdminOverviewResponse>('get_admin_overview_v2', { p_period: period, p_timezone: timezone });
  }

  async getLearningAnalyticsV2(
    period: AdminPeriod,
    timezone: string,
    filters: { locales?: string[]; simpleModes?: boolean[]; moduleIds?: string[] } = {},
  ): Promise<AdminLearningAnalyticsResponse> {
    return this.executeRpc<AdminLearningAnalyticsResponse>('get_admin_learning_analytics_v2', {
      p_period: period, p_timezone: timezone,
      p_locales: filters.locales?.length ? filters.locales : null,
      p_simple_modes: filters.simpleModes?.length ? filters.simpleModes : null,
      p_module_ids: filters.moduleIds?.length ? filters.moduleIds : null,
    });
  }

  async getAdminUsersV2(filters: AdminUserFilters): Promise<AdminUsersResponseV2> {
    return this.executeRpc<AdminUsersResponseV2>('get_admin_users_v2', {
      p_limit: filters.limit ?? 30, p_offset: filters.offset ?? 0,
      p_search: filters.search || null,
      p_locales: filters.locales?.length ? filters.locales : null,
      p_simple_modes: filters.simpleModes?.length ? filters.simpleModes : null,
      p_signals: filters.signals?.length ? filters.signals : null,
      p_module_ids: filters.moduleIds?.length ? filters.moduleIds : null,
      p_sort: filters.sort ?? 'last_activity', p_direction: filters.direction ?? 'desc',
    });
  }

  async getAdminUserDetailV2(userId: string): Promise<AdminUserDetailV2 | null> {
    return this.executeRpc<AdminUserDetailV2 | null>('get_admin_user_detail_v2', { p_user_id: userId });
  }
  async getBibleschoolAnalytics(from?: string, to?: string): Promise<BibleschoolAnalytics> {
    const params = from && to ? { p_from: from, p_to: to } : {};
    return this.executeRpc<BibleschoolAnalytics>(
      'get_bibleschool_analytics',
      params as Record<string, unknown>,
    );
  }

  async getQuizAnalytics(from?: string, to?: string): Promise<QuizAnalytics> {
    const params = from && to ? { p_from: from, p_to: to } : {};
    return this.executeRpc<QuizAnalytics>(
      'get_quiz_analytics',
      params as Record<string, unknown>,
    );
  }

  async getTimeAnalytics(from?: string, to?: string): Promise<TimeAnalytics> {
    const fromDate =
      from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = to ?? new Date().toISOString();
    return this.executeRpc<TimeAnalytics>('get_admin_time_analytics', {
      p_from: fromDate,
      p_to: toDate,
    });
  }

  async getAdminUsers(
    limit = 50,
    offset = 0,
    search?: string,
  ): Promise<AdminUsersResponse> {
    return this.executeRpc<AdminUsersResponse>('get_admin_users', {
      p_limit: limit,
      p_offset: offset,
      p_search: search || null,
    });
  }

  async getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
    return this.executeRpc<AdminUserDetail | null>('get_admin_user_detail', {
      p_user_id: userId,
    });
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();
