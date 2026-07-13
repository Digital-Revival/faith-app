BEGIN;
SELECT plan(20);

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, role, aud
) VALUES (
  '30000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'atomic-signup@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Atomic Signup","bibleschool_simple_mode_enabled":true}'::jsonb,
  'authenticated',
  'authenticated'
);

SELECT is(
  (SELECT settings->'bibleschool.simple_mode' FROM public.user_settings
   WHERE user_id='30000000-0000-4000-8000-000000000001'),
  'true'::jsonb,
  'signup creates the explicit simple-mode setting in the auth transaction'
);

SELECT ok(
  (SELECT BOOL_AND(NOT has_function_privilege('anon', p.oid, 'EXECUTE'))
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN (
     'is_admin','get_user_setting','set_user_setting',
     'record_learning_activity_events','admin_period_bounds',
     'get_admin_overview_v2','get_admin_learning_analytics_v2',
     'get_admin_users_v2','get_admin_user_detail_v2'
   )),
  'anonymous users cannot execute protected settings and analytics routines'
);

SELECT ok(
  has_function_privilege(
    'authenticated',
    'public.record_learning_activity_events(jsonb)',
    'EXECUTE'
  ),
  'authenticated users can execute the learning event ingest routine'
);

SELECT set_config('request.jwt.claims', '{"sub":"20000001-0000-4000-8000-000000000001","role":"authenticated"}', true);

SELECT throws_ok(
  $$UPDATE public.users SET role = 'admin' WHERE id = '20000001-0000-4000-8000-000000000001'$$,
  'P0001',
  'Role changes require the service role',
  'a user cannot promote their own role'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"service_role"}', true);
SELECT lives_ok(
  $$UPDATE public.users SET role = 'admin' WHERE id = '20000002-0000-4000-8000-000000000002'$$,
  'the service role can change user roles'
);
UPDATE public.users SET role = 'user' WHERE id = '20000002-0000-4000-8000-000000000002';
SELECT set_config('request.jwt.claims', '{"sub":"20000001-0000-4000-8000-000000000001","role":"authenticated"}', true);

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

SELECT is(
  (public.record_learning_activity_events(jsonb_build_array(jsonb_build_object(
    'clientEventId','invalid-event-01',
    'sessionId','session-01',
    'eventType','video_position',
    'occurredAt',NOW(),
    'locale','nl',
    'simpleMode',false,
    'appVersion','test'
  ))))->>'rejectedCount',
  '1',
  'unknown event payloads are rejected without failing the batch'
);

SELECT is(
  public.record_learning_activity_events(jsonb_build_array(
    jsonb_build_object(
      'clientEventId','expired-event-0001','sessionId','session-01',
      'eventType','app_session_started','occurredAt',NOW()-INTERVAL '32 days',
      'locale','nl','simpleMode',false,'appVersion','test'
    ),
    jsonb_build_object(
      'clientEventId','mixed-valid-event-01','sessionId','session-01',
      'eventType','app_session_started','occurredAt',NOW(),
      'locale','nl','simpleMode',false,'appVersion','test'
    )
  )),
  '{"insertedCount":1,"duplicateCount":0,"rejectedCount":1}'::jsonb,
  'one expired event cannot poison valid events in the same batch'
);

DO $$
BEGIN
  PERFORM public.record_learning_activity_events(jsonb_build_array(
    jsonb_build_object(
      'clientEventId','retention-first-0001','sessionId','session-01',
      'eventType','app_session_started','occurredAt',NOW()-INTERVAL '2 days',
      'locale','nl','simpleMode',false,'appVersion','test'
    ),
    jsonb_build_object(
      'clientEventId','retention-return-001','sessionId','session-01',
      'eventType','app_session_started','occurredAt',NOW()-INTERVAL '1 day',
      'locale','nl','simpleMode',false,'appVersion','test'
    )
  ));
END;
$$;

SELECT set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

INSERT INTO public.user_module_progress (
  user_id,module_id,status,progress_percentage,created_at,updated_at
) VALUES (
  '20000030-0000-4000-8000-000000000030',
  'module-period-window',
  'in_progress',
  10,
  NOW()-INTERVAL '20 days',
  NOW()-INTERVAL '20 days'
);

SELECT is(
  jsonb_build_array(
    jsonb_array_length(public.get_admin_learning_analytics_v2(
      '7d','Europe/Amsterdam',NULL,NULL,ARRAY['module-period-window']
    )->'modules'),
    jsonb_array_length(public.get_admin_learning_analytics_v2(
      '30d','Europe/Amsterdam',NULL,NULL,ARRAY['module-period-window']
    )->'modules')
  ),
  '[0,1]'::jsonb,
  'the selected analytics period scopes module starts'
);

SELECT is(
  public.get_admin_learning_analytics_v2(
    '30d','Europe/Amsterdam',NULL,NULL,NULL
  )->'retention'->'d1',
  public.get_admin_learning_analytics_v2(
    '30d','Europe/Amsterdam',NULL,NULL,NULL
  )->'retention'->'cohorts'->0->'d1',
  'retention summary and cohort use the same return-window definition'
);

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

WITH page AS (
  SELECT item,ordinality
  FROM jsonb_array_elements(public.get_admin_users_v2(
    100,0,NULL,NULL,NULL,NULL,NULL,'progress','asc'
  )->'users') WITH ORDINALITY AS rows(item,ordinality)
  WHERE (item->>'progressPercentage')::INTEGER=0
)
SELECT is(
  (SELECT ARRAY_AGG(item->>'id' ORDER BY ordinality) FROM page),
  (SELECT ARRAY_AGG(item->>'id' ORDER BY item->>'id') FROM page),
  'pagination uses user id as a deterministic tie breaker'
);

SELECT * FROM finish();
ROLLBACK;
