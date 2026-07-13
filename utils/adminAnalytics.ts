import type { AdminDashboardWidgetId, AdminMetric, AdminPeriod } from '@/types/analytics';

export const ADMIN_PERIODS: AdminPeriod[] = ['7d', '30d', '90d', 'all'];
export const ADMIN_DASHBOARD_WIDGETS: AdminDashboardWidgetId[] = [
  'schoolHealth',
  'activityTrend',
  'attention',
];

export function normalizeAdminDashboardLayout(value: { widgets: { id: AdminDashboardWidgetId; visible: boolean }[] } | null) {
  const known = new Map((value?.widgets ?? []).map((item) => [item.id, item.visible]));
  const ordered = (value?.widgets ?? []).filter((item) => ADMIN_DASHBOARD_WIDGETS.includes(item.id));
  const missing = ADMIN_DASHBOARD_WIDGETS.filter((id) => !known.has(id)).map((id) => ({ id, visible: true }));
  const widgets = [...ordered, ...missing];
  if (!widgets.some((item) => item.visible) && widgets[0]) widgets[0].visible = true;
  return { widgets };
}

export function metricDelta(metric: AdminMetric): number | null {
  if (metric.previousValue === null || metric.previousValue === 0) return null;
  return Math.round(((metric.value - metric.previousValue) / metric.previousValue) * 100);
}

export function getAdminTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function chartScale(values: number[], height: number) {
  const max = Math.max(1, ...values);
  return { max, y: (value: number) => height - (value / max) * height };
}

export function getAdminPaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 2) return [1, 2, 3, 'ellipsis', totalPages];
  if (currentPage >= totalPages - 1) return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
  return [1, 'ellipsis', currentPage, 'ellipsis', totalPages];
}
