BEGIN;
SELECT plan(12);

SELECT set_config('request.jwt.claims', '{"sub":"20000001-0000-4000-8000-000000000001","role":"authenticated"}', true);

SELECT throws_ok(
  $$UPDATE public.users SET role = 'admin' WHERE id = '20000001-0000-4000-8000-000000000001'$$,
  'P0001',
  'Role changes require the service role',
  'a user cannot promote their own role'
);

SELECT throws_ok(
  $$SELECT public.get_user_setting('20000002-0000-4000-8000-000000000002', 'language')$$,
  'P0001',
  'Permission denied: settings belong to another user',
  'a user cannot read another user setting'
);

SELECT throws_ok(
  $$SELECT public.set_user_setting('20000002-0000-4000-8000-000000000002', 'language', '"nl"'::jsonb)$$,
  'P0001',
  'Permission denied: settings belong to another user',
  'a user cannot write another user setting'
);

SELECT lives_ok(
  $$SELECT public.set_user_setting('20000001-0000-4000-8000-000000000001', 'analytics.test', 'true'::jsonb)$$,
  'a user can write their own setting'
);

SELECT throws_ok(
  $$SELECT public.get_admin_overview_v2('30d', 'Europe/Amsterdam')$$,
  'P0001',
  'Permission denied: admin role required',
  'non admins cannot read analytics'
);

SELECT is(
  (public.record_learning_activity_events(jsonb_build_array(jsonb_build_object(
    'clientEventId','test-event-deduplicate-01',
    'sessionId','test-session-01',
    'eventType','app_session_started',
    'occurredAt',NOW(),
    'locale','nl',
    'simpleMode',false,
    'appVersion','test'
  ))))->>'insertedCount',
  '1',
  'a valid event batch is accepted'
);

SELECT is(
  (public.record_learning_activity_events(jsonb_build_array(jsonb_build_object(
    'clientEventId','test-event-deduplicate-01',
    'sessionId','test-session-01',
    'eventType','app_session_started',
    'occurredAt',NOW(),
    'locale','nl',
    'simpleMode',false,
    'appVersion','test'
  ))))->>'duplicateCount',
  '1',
  'duplicate client event ids are idempotent'
);

SELECT throws_ok(
  $$SELECT public.record_learning_activity_events('[{"clientEventId":"invalid-event-01","sessionId":"session-01","eventType":"video_position","occurredAt":"2026-07-13T12:00:00Z","locale":"nl","simpleMode":false,"appVersion":"test"}]'::jsonb)$$,
  'P0001',
  'Invalid event type',
  'unknown event payloads are rejected'
);

SELECT set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

SELECT is(
  public.get_admin_learning_analytics_v2(
    '30d',
    'Europe/Amsterdam',
    ARRAY['nl', 'en'],
    ARRAY[true, false],
    ARRAY['module-1', 'module-2']
  )->'filters',
  '{"locales":["nl","en"],"simpleModes":[true,false],"moduleIds":["module-1","module-2"]}'::jsonb,
  'learning analytics preserves combined multi-select filters'
);

SELECT is(
  public.get_admin_learning_analytics_v2(
    '30d',
    'Europe/Amsterdam',
    ARRAY['locale-without-users'],
    NULL::BOOLEAN[],
    NULL::TEXT[]
  )->'modules',
  '[]'::jsonb,
  'language multi-select filters the learning analytics result'
);

SELECT is(
  (SELECT user_item->>'currentModuleId'
   FROM jsonb_array_elements(public.get_admin_users_v2(30,0,'user1@test.com',NULL,NULL,NULL,NULL,'progress','desc')->'users') user_item
   WHERE user_item->>'email'='user1@test.com'),
  'module-13',
  'current module prefers the actual in-progress curriculum position'
);

SELECT is(
  public.get_admin_users_v2(30,0,NULL,ARRAY['en'],ARRAY[false],NULL,ARRAY['module-13'],'progress','desc')->>'totalCount',
  '1',
  'user analytics combines language mode and module multi-select filters'
);

SELECT * FROM finish();
ROLLBACK;
