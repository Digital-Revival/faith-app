import assert from 'node:assert/strict';

import { buildLearningAnalyticsCsv } from '../utils/exportAnalytics';
import { chartScale, getAdminPaginationItems, metricDelta, normalizeAdminDashboardLayout } from '../utils/adminAnalytics';
import type { AdminLearningAnalyticsResponse } from '../types/analytics';

assert.equal(metricDelta({ id: 'active', value: 12, previousValue: 10 }), 20);
assert.equal(metricDelta({ id: 'active', value: 12, previousValue: 0 }), null);
const scale = chartScale([0, 5, 10], 100);
assert.equal(scale.max, 10);
assert.equal(scale.y(5), 50);
assert.deepEqual(getAdminPaginationItems(1, 3), [1, 2, 3]);
assert.deepEqual(getAdminPaginationItems(2, 10), [1, 2, 3, 'ellipsis', 10]);
assert.deepEqual(getAdminPaginationItems(6, 10), [1, 'ellipsis', 6, 'ellipsis', 10]);
assert.deepEqual(getAdminPaginationItems(10, 10), [1, 'ellipsis', 8, 9, 10]);

const migrated = normalizeAdminDashboardLayout({ widgets: [{ id: 'attention', visible: false }] });
assert.equal(migrated.widgets.length, 3);
assert.equal(migrated.widgets[0].id, 'attention');
assert.equal(migrated.widgets.some((item) => item.visible), true);

const fixture: AdminLearningAnalyticsResponse = {
  generatedAt: '2026-07-13T12:00:00Z', period: '30d', timezone: 'Europe/Amsterdam',
  bounds: { from: '2026-06-14', to: '2026-07-13', previousFrom: null, previousTo: null, bucket: 'day' },
  filters: { locales: ['nl'], simpleModes: [true], moduleIds: [] }, eventCoverage: { startedAt: null, isBuilding: true }, metricDefinitions: {},
  funnel: [{ id: 'registered', value: 2 }], modules: [], exams: [], retention: { d1: 0, d7: 0, d30: 0, isBuilding: true, startedAt: null, cohorts: [] },
};
const csv = buildLearningAnalyticsCsv(fixture);
assert.match(csv, /Europe\/Amsterdam/);
assert.match(csv, /Simple Modes,true/);
console.log('Admin analytics unit tests passed');
