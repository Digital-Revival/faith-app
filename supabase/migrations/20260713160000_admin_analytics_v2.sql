-- Admin Analytics 2.0: private learning events, hardened settings and v2 RPCs.

-- Keep the explicit registration choice in the same transaction as auth.users.
-- The existing auth trigger already points at this function, so replacing it is
-- enough to make profile and initial settings creation atomic for new users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  IF NEW.raw_user_meta_data->>'bibleschool_simple_mode_enabled' IN ('true', 'false') THEN
    INSERT INTO public.user_settings (user_id, settings)
    VALUES (
      NEW.id,
      jsonb_build_object(
        'bibleschool.simple_mode',
        (NEW.raw_user_meta_data->>'bibleschool_simple_mode_enabled')::BOOLEAN
      )
    )
    ON CONFLICT (user_id) DO UPDATE SET
      settings = public.user_settings.settings || EXCLUDED.settings,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_client_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT (
       SESSION_USER = 'postgres'
       AND COALESCE(auth.role(), '') = ''
     ) THEN
    RAISE EXCEPTION 'Role changes require the service role';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_client_role_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_client_role_change ON public.users;
CREATE TRIGGER prevent_client_role_change
  BEFORE UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_client_role_change();

CREATE OR REPLACE FUNCTION public.get_user_setting(p_user_id UUID, p_setting_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  setting_value JSONB;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Permission denied: settings belong to another user';
  END IF;

  SELECT settings->p_setting_key INTO setting_value
  FROM public.user_settings
  WHERE user_id = p_user_id;
  RETURN setting_value;
END;
$$;
REVOKE ALL ON FUNCTION public.get_user_setting(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_setting(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_user_setting(p_user_id UUID, p_setting_key TEXT, p_setting_value JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_settings JSONB;
  user_exists BOOLEAN;
  retry_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Permission denied: settings belong to another user';
  END IF;

  LOOP
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = p_user_id) INTO user_exists;
    EXIT WHEN user_exists;
    IF retry_count >= 3 THEN
      RAISE EXCEPTION 'User record not found in public.users';
    END IF;
    PERFORM pg_sleep(0.1);
    retry_count := retry_count + 1;
  END LOOP;

  INSERT INTO public.user_settings (user_id, settings)
  VALUES (p_user_id, jsonb_build_object(p_setting_key, p_setting_value))
  ON CONFLICT (user_id) DO UPDATE SET
    settings = user_settings.settings || jsonb_build_object(p_setting_key, p_setting_value),
    updated_at = NOW()
  RETURNING settings INTO updated_settings;
  RETURN updated_settings;
END;
$$;
REVOKE ALL ON FUNCTION public.set_user_setting(UUID, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_setting(UUID, TEXT, JSONB) TO authenticated;

CREATE TABLE IF NOT EXISTS public.learning_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_event_id TEXT NOT NULL UNIQUE CHECK (length(client_event_id) BETWEEN 8 AND 120),
  session_id TEXT NOT NULL CHECK (length(session_id) BETWEEN 8 AND 120),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('app_session_started', 'lesson_started', 'lesson_engaged')),
  module_id TEXT,
  lesson_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('nl', 'bg', 'hi', 'id', 'en')),
  simple_mode BOOLEAN NOT NULL DEFAULT false,
  app_version TEXT NOT NULL CHECK (length(app_version) BETWEEN 1 AND 32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lesson_event_context CHECK (
    event_type = 'app_session_started'
    OR (module_id IS NOT NULL AND lesson_id IS NOT NULL)
  )
);

ALTER TABLE public.learning_activity_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.learning_activity_events FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_learning_events_occurred_at
  ON public.learning_activity_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_events_user_time
  ON public.learning_activity_events (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_events_type_time
  ON public.learning_activity_events (event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_updated_user
  ON public.user_lesson_progress (updated_at DESC, user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed_user
  ON public.user_lesson_progress (completed_at DESC, user_id) WHERE completed;
CREATE INDEX IF NOT EXISTS idx_module_progress_updated_user
  ON public.user_module_progress (updated_at DESC, user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_completed_user
  ON public.user_module_progress (completed_at DESC, user_id) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_user
  ON public.user_quiz_attempts (completed_at DESC, user_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users (created_at DESC);

CREATE OR REPLACE FUNCTION public.record_learning_activity_events(p_events JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  inserted_count INTEGER := 0;
  duplicate_count INTEGER := 0;
  rejected_count INTEGER := 0;
  affected INTEGER;
  event_type TEXT;
  occurred_at TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF jsonb_typeof(p_events) <> 'array' OR jsonb_array_length(p_events) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Events must be an array containing 1 to 100 items';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_events)
  LOOP
    BEGIN
      event_type := item->>'eventType';
      IF event_type NOT IN ('app_session_started', 'lesson_started', 'lesson_engaged') THEN
        RAISE EXCEPTION 'Invalid event type';
      END IF;
      IF COALESCE(length(item->>'clientEventId'), 0) NOT BETWEEN 8 AND 120
         OR COALESCE(length(item->>'sessionId'), 0) NOT BETWEEN 8 AND 120 THEN
        RAISE EXCEPTION 'Invalid event identifier';
      END IF;
      IF event_type <> 'app_session_started'
         AND (NULLIF(item->>'moduleId', '') IS NULL OR NULLIF(item->>'lessonId', '') IS NULL) THEN
        RAISE EXCEPTION 'Lesson events require module and lesson identifiers';
      END IF;
      occurred_at := (item->>'occurredAt')::TIMESTAMPTZ;
      IF occurred_at > NOW() + INTERVAL '5 minutes' OR occurred_at < NOW() - INTERVAL '31 days' THEN
        RAISE EXCEPTION 'Event timestamp is outside the accepted window';
      END IF;

      INSERT INTO public.learning_activity_events (
        client_event_id, session_id, user_id, event_type, module_id, lesson_id,
        occurred_at, locale, simple_mode, app_version
      ) VALUES (
        item->>'clientEventId', item->>'sessionId', auth.uid(), event_type,
        NULLIF(item->>'moduleId', ''), NULLIF(item->>'lessonId', ''), occurred_at,
        CASE WHEN item->>'locale' IN ('nl','bg','hi','id','en') THEN item->>'locale' ELSE 'en' END,
        COALESCE((item->>'simpleMode')::BOOLEAN, false),
        LEFT(COALESCE(NULLIF(item->>'appVersion', ''), 'unknown'), 32)
      ) ON CONFLICT (client_event_id) DO NOTHING;

      GET DIAGNOSTICS affected = ROW_COUNT;
      inserted_count := inserted_count + affected;
      duplicate_count := duplicate_count + (1 - affected);
    EXCEPTION
      WHEN raise_exception
        OR invalid_text_representation
        OR datetime_field_overflow
        OR check_violation
        OR not_null_violation
        OR string_data_right_truncation THEN
        rejected_count := rejected_count + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'insertedCount', inserted_count,
    'duplicateCount', duplicate_count,
    'rejectedCount', rejected_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_learning_activity_events(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_learning_activity_events(JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_period_bounds(p_period TEXT, p_timezone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  local_today DATE;
  from_at TIMESTAMPTZ;
  to_at TIMESTAMPTZ := NOW();
  previous_from TIMESTAMPTZ;
  bucket TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Permission denied: admin role required'; END IF;
  PERFORM NOW() AT TIME ZONE p_timezone;
  local_today := (NOW() AT TIME ZONE p_timezone)::DATE;
  CASE p_period
    WHEN '7d' THEN from_at := (local_today - 6) AT TIME ZONE p_timezone; bucket := 'day';
    WHEN '30d' THEN from_at := (local_today - 29) AT TIME ZONE p_timezone; bucket := 'day';
    WHEN '90d' THEN from_at := (local_today - 89) AT TIME ZONE p_timezone; bucket := 'week';
    WHEN 'all' THEN
      SELECT COALESCE(MIN(created_at), to_at) INTO from_at FROM public.users;
      bucket := 'month';
    ELSE RAISE EXCEPTION 'Unsupported period';
  END CASE;
  previous_from := CASE WHEN p_period = 'all' THEN NULL ELSE from_at - (to_at - from_at) END;
  RETURN jsonb_build_object('from', from_at, 'to', to_at, 'previousFrom', previous_from,
    'previousTo', CASE WHEN p_period = 'all' THEN NULL ELSE from_at END, 'bucket', bucket);
EXCEPTION WHEN invalid_parameter_value THEN
  RAISE EXCEPTION 'Invalid IANA timezone';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_period_bounds(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_period_bounds(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_overview_v2(
  p_period TEXT DEFAULT '30d', p_timezone TEXT DEFAULT 'UTC'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bounds JSONB;
  from_at TIMESTAMPTZ;
  to_at TIMESTAMPTZ;
  previous_from TIMESTAMPTZ;
  bucket TEXT;
  active_count INTEGER;
  engaged_count INTEGER;
  new_count INTEGER;
  completed_count INTEGER;
  previous_active INTEGER;
  previous_engaged INTEGER;
  previous_new INTEGER;
  previous_completed INTEGER;
  trends JSONB;
  attention JSONB;
  modules JSONB;
  exams JSONB;
  coverage_start TIMESTAMPTZ;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Permission denied: admin role required'; END IF;
  bounds := public.admin_period_bounds(p_period, p_timezone);
  from_at := (bounds->>'from')::TIMESTAMPTZ;
  to_at := (bounds->>'to')::TIMESTAMPTZ;
  previous_from := NULLIF(bounds->>'previousFrom', '')::TIMESTAMPTZ;
  bucket := bounds->>'bucket';

  SELECT COUNT(DISTINCT user_id) INTO active_count FROM (
    SELECT user_id FROM public.learning_activity_events WHERE occurred_at BETWEEN from_at AND to_at
    UNION SELECT user_id FROM public.user_lesson_progress WHERE updated_at BETWEEN from_at AND to_at
    UNION SELECT user_id FROM public.user_module_progress WHERE updated_at BETWEEN from_at AND to_at
    UNION SELECT user_id FROM public.user_quiz_attempts WHERE completed_at BETWEEN from_at AND to_at
  ) a;
  SELECT COUNT(DISTINCT user_id) INTO engaged_count FROM (
    SELECT user_id FROM public.learning_activity_events WHERE event_type='lesson_engaged' AND occurred_at BETWEEN from_at AND to_at
    UNION SELECT user_id FROM public.user_lesson_progress WHERE completed AND completed_at BETWEEN from_at AND to_at
    UNION SELECT user_id FROM public.user_quiz_attempts WHERE completed_at BETWEEN from_at AND to_at
  ) e;
  SELECT COUNT(*) INTO new_count FROM public.users WHERE created_at BETWEEN from_at AND to_at;
  SELECT COUNT(DISTINCT user_id) INTO completed_count FROM public.user_module_progress
    WHERE status='completed' AND completed_at BETWEEN from_at AND to_at;

  IF previous_from IS NOT NULL THEN
    SELECT COUNT(DISTINCT user_id) INTO previous_active FROM (
      SELECT user_id FROM public.learning_activity_events WHERE occurred_at >= previous_from AND occurred_at < from_at
      UNION SELECT user_id FROM public.user_lesson_progress WHERE updated_at >= previous_from AND updated_at < from_at
      UNION SELECT user_id FROM public.user_module_progress WHERE updated_at >= previous_from AND updated_at < from_at
      UNION SELECT user_id FROM public.user_quiz_attempts WHERE completed_at >= previous_from AND completed_at < from_at
    ) a;
    SELECT COUNT(DISTINCT user_id) INTO previous_engaged FROM (
      SELECT user_id FROM public.learning_activity_events WHERE event_type='lesson_engaged' AND occurred_at >= previous_from AND occurred_at < from_at
      UNION SELECT user_id FROM public.user_lesson_progress WHERE completed AND completed_at >= previous_from AND completed_at < from_at
      UNION SELECT user_id FROM public.user_quiz_attempts WHERE completed_at >= previous_from AND completed_at < from_at
    ) e;
    SELECT COUNT(*) INTO previous_new FROM public.users WHERE created_at >= previous_from AND created_at < from_at;
    SELECT COUNT(DISTINCT user_id) INTO previous_completed FROM public.user_module_progress
      WHERE status='completed' AND completed_at >= previous_from AND completed_at < from_at;
  END IF;

  WITH points AS (
    SELECT generate_series(
      date_trunc(bucket, from_at AT TIME ZONE p_timezone),
      date_trunc(bucket, to_at AT TIME ZONE p_timezone),
      CASE bucket WHEN 'day' THEN INTERVAL '1 day' WHEN 'week' THEN INTERVAL '1 week' ELSE INTERVAL '1 month' END
    ) AS local_start
  ), activity AS (
    SELECT user_id, occurred_at AS at FROM public.learning_activity_events
    UNION ALL SELECT user_id, updated_at FROM public.user_lesson_progress
    UNION ALL SELECT user_id, updated_at FROM public.user_module_progress
    UNION ALL SELECT user_id, completed_at FROM public.user_quiz_attempts
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', p.local_start::DATE,
    'activeUsers', (SELECT COUNT(DISTINCT user_id) FROM activity a WHERE date_trunc(bucket, a.at AT TIME ZONE p_timezone)=p.local_start),
    'newUsers', (SELECT COUNT(*) FROM public.users u WHERE date_trunc(bucket, u.created_at AT TIME ZONE p_timezone)=p.local_start),
    'lessonCompletions', (SELECT COUNT(*) FROM public.user_lesson_progress l WHERE l.completed AND date_trunc(bucket, l.completed_at AT TIME ZONE p_timezone)=p.local_start),
    'moduleCompletions', (SELECT COUNT(*) FROM public.user_module_progress m WHERE m.status='completed' AND date_trunc(bucket, m.completed_at AT TIME ZONE p_timezone)=p.local_start)
  ) ORDER BY p.local_start), '[]'::JSONB) INTO trends FROM points p;

  WITH last_activity AS (
    SELECT u.id, u.created_at, GREATEST(
      (SELECT MAX(e.occurred_at) FROM public.learning_activity_events e WHERE e.user_id=u.id),
      (SELECT MAX(l.updated_at) FROM public.user_lesson_progress l WHERE l.user_id=u.id),
      (SELECT MAX(m.updated_at) FROM public.user_module_progress m WHERE m.user_id=u.id),
      (SELECT MAX(q.completed_at) FROM public.user_quiz_attempts q WHERE q.user_id=u.id)
    ) AS last_at FROM public.users u WHERE u.role='user'
  ), signals AS (
    SELECT 'no_first_lesson' kind, COUNT(*)::INT count FROM last_activity l
      WHERE l.created_at < NOW()-INTERVAL '7 days' AND NOT EXISTS (SELECT 1 FROM public.user_lesson_progress p WHERE p.user_id=l.id)
    UNION ALL SELECT 'inactive_after_start', COUNT(*)::INT FROM last_activity l
      WHERE l.last_at < NOW()-INTERVAL '14 days' AND EXISTS (SELECT 1 FROM public.user_lesson_progress p WHERE p.user_id=l.id)
    UNION ALL SELECT 'stalled_module', COUNT(DISTINCT m.user_id)::INT FROM public.user_module_progress m
      WHERE m.status='in_progress' AND m.updated_at < NOW()-INTERVAL '7 days'
    UNION ALL SELECT 'repeated_exam_failure', COUNT(*)::INT FROM (
      SELECT user_id,module_id FROM public.user_quiz_attempts GROUP BY user_id,module_id
      HAVING COUNT(*) FILTER(WHERE NOT passed)>=2 AND NOT BOOL_OR(passed)
    ) f
  ) SELECT COALESCE(jsonb_agg(jsonb_build_object('type',kind,'count',count)), '[]'::JSONB) INTO attention FROM signals;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('moduleId', module_id, 'starters', starters,
    'completers', completers, 'completionRate', CASE WHEN starters=0 THEN 0 ELSE ROUND(completers*100.0/starters,1) END)
    ORDER BY module_id), '[]'::JSONB) INTO modules FROM (
      SELECT module_id, COUNT(DISTINCT user_id)::INT starters,
        COUNT(DISTINCT user_id) FILTER(WHERE status='completed')::INT completers
      FROM public.user_module_progress GROUP BY module_id
    ) m;
  SELECT jsonb_build_object(
    'firstAttemptPassRate', COALESCE(ROUND(100.0*COUNT(*) FILTER(WHERE attempt_number=1 AND passed)/NULLIF(COUNT(*) FILTER(WHERE attempt_number=1),0),1),0),
    'overallPassRate', COALESCE(ROUND(100.0*COUNT(*) FILTER(WHERE passed)/NULLIF(COUNT(*),0),1),0),
    'averageScore', COALESCE(ROUND(AVG(score_percentage),1),0),
    'retryCount', COUNT(*) FILTER(WHERE attempt_number>1)
  ) INTO exams FROM public.user_quiz_attempts WHERE completed_at BETWEEN from_at AND to_at;
  SELECT MIN(occurred_at) INTO coverage_start FROM public.learning_activity_events;

  RETURN jsonb_build_object(
    'generatedAt', NOW(), 'period', p_period, 'timezone', p_timezone, 'bounds', bounds,
    'eventCoverage', jsonb_build_object('startedAt', coverage_start, 'isBuilding', coverage_start IS NULL OR coverage_start > NOW()-INTERVAL '14 days'),
    'metricDefinitions', jsonb_build_object('active','Unique students with a session, progress or exam activity','engaged','Unique students with 30 seconds engagement, a completion or an exam attempt','moduleCompletion','Unique module starters compared with unique completers','examPass','First-attempt pass rate'),
    'metrics', jsonb_build_array(
      jsonb_build_object('id','active','value',active_count,'previousValue',previous_active),
      jsonb_build_object('id','engaged','value',engaged_count,'previousValue',previous_engaged),
      jsonb_build_object('id','new','value',new_count,'previousValue',previous_new),
      jsonb_build_object('id','modulesCompleted','value',completed_count,'previousValue',previous_completed)
    ), 'trends', trends, 'attention', attention, 'modulePulse', modules, 'examPulse', exams
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_overview_v2(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview_v2(TEXT, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.get_admin_learning_analytics_v2(TEXT,TEXT,TEXT,BOOLEAN,TEXT);

CREATE OR REPLACE FUNCTION public.get_admin_learning_analytics_v2(
  p_period TEXT DEFAULT '30d', p_timezone TEXT DEFAULT 'UTC', p_locales TEXT[] DEFAULT NULL,
  p_simple_modes BOOLEAN[] DEFAULT NULL, p_module_ids TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bounds JSONB; from_at TIMESTAMPTZ; to_at TIMESTAMPTZ;
  funnel JSONB; modules JSONB; exams JSONB; retention JSONB; cohorts JSONB; coverage_start TIMESTAMPTZ;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Permission denied: admin role required'; END IF;
  bounds := public.admin_period_bounds(p_period,p_timezone);
  from_at := (bounds->>'from')::TIMESTAMPTZ; to_at := (bounds->>'to')::TIMESTAMPTZ;

  WITH eligible AS (
    SELECT u.id,u.created_at FROM public.users u LEFT JOIN public.user_settings s ON s.user_id=u.id
    WHERE u.role='user' AND u.created_at BETWEEN from_at AND to_at
      AND (p_locales IS NULL OR cardinality(p_locales)=0 OR COALESCE(s.settings->>'language','en')=ANY(p_locales))
      AND (p_simple_modes IS NULL OR cardinality(p_simple_modes)=0 OR COALESCE((s.settings->>'bibleschool.simple_mode')::BOOLEAN,false)=ANY(p_simple_modes))
  ) SELECT jsonb_build_array(
    jsonb_build_object('id','registered','value',COUNT(*)),
    jsonb_build_object('id','started','value',COUNT(*) FILTER(WHERE EXISTS(SELECT 1 FROM public.user_lesson_progress l WHERE l.user_id=eligible.id AND (p_module_ids IS NULL OR cardinality(p_module_ids)=0 OR l.module_id=ANY(p_module_ids))))),
    jsonb_build_object('id','lessonCompleted','value',COUNT(*) FILTER(WHERE EXISTS(SELECT 1 FROM public.user_lesson_progress l WHERE l.user_id=eligible.id AND l.completed AND (p_module_ids IS NULL OR cardinality(p_module_ids)=0 OR l.module_id=ANY(p_module_ids))))),
    jsonb_build_object('id','moduleCompleted','value',COUNT(*) FILTER(WHERE EXISTS(SELECT 1 FROM public.user_module_progress m WHERE m.user_id=eligible.id AND m.status='completed' AND (p_module_ids IS NULL OR cardinality(p_module_ids)=0 OR m.module_id=ANY(p_module_ids))))),
    jsonb_build_object('id','examPassed','value',COUNT(*) FILTER(WHERE EXISTS(SELECT 1 FROM public.user_quiz_attempts q WHERE q.user_id=eligible.id AND q.passed AND (p_module_ids IS NULL OR cardinality(p_module_ids)=0 OR q.module_id=ANY(p_module_ids)))))
  ) INTO funnel FROM eligible;

  WITH eligible AS (
    SELECT u.id FROM public.users u LEFT JOIN public.user_settings s ON s.user_id=u.id
    WHERE u.role='user' AND (p_locales IS NULL OR cardinality(p_locales)=0 OR COALESCE(s.settings->>'language','en')=ANY(p_locales))
      AND (p_simple_modes IS NULL OR cardinality(p_simple_modes)=0 OR COALESCE((s.settings->>'bibleschool.simple_mode')::BOOLEAN,false)=ANY(p_simple_modes))
  ), module_starts AS (
    SELECT m.* FROM public.user_module_progress m JOIN eligible e ON e.id=m.user_id
    WHERE m.created_at BETWEEN from_at AND to_at
      AND (p_module_ids IS NULL OR cardinality(p_module_ids)=0 OR m.module_id=ANY(p_module_ids))
  ) SELECT COALESCE(jsonb_agg(jsonb_build_object('moduleId',module_id,'starters',starters,'completers',completers,
    'dropoff',GREATEST(starters-completers,0),'completionRate',CASE WHEN starters=0 THEN 0 ELSE ROUND(completers*100.0/starters,1) END,
    'medianDays',median_days,'lessons',lessons) ORDER BY module_id),'[]'::JSONB) INTO modules FROM (
    SELECT m.module_id, COUNT(DISTINCT m.user_id)::INT starters, COUNT(DISTINCT m.user_id) FILTER(WHERE m.status='completed')::INT completers,
      COALESCE(ROUND(GREATEST(0, percentile_cont(0.5) WITHIN GROUP(ORDER BY EXTRACT(EPOCH FROM (m.completed_at-m.created_at))/86400))::NUMERIC,1),0) median_days,
      (SELECT COALESCE(jsonb_agg(jsonb_build_object('lessonId',lesson_id,'started',started,'completed',completed) ORDER BY lesson_id),'[]'::JSONB)
       FROM (SELECT lesson_id,COUNT(DISTINCT user_id)::INT started,COUNT(DISTINCT user_id) FILTER(WHERE completed)::INT completed
             FROM public.user_lesson_progress l
             WHERE l.module_id=m.module_id
               AND l.created_at BETWEEN from_at AND to_at
               AND EXISTS(SELECT 1 FROM module_starts ms WHERE ms.user_id=l.user_id AND ms.module_id=l.module_id)
             GROUP BY lesson_id) x) lessons
    FROM module_starts m GROUP BY m.module_id
  ) x;

  WITH eligible AS (
    SELECT u.id FROM public.users u LEFT JOIN public.user_settings s ON s.user_id=u.id
    WHERE u.role='user' AND (p_locales IS NULL OR cardinality(p_locales)=0 OR COALESCE(s.settings->>'language','en')=ANY(p_locales))
      AND (p_simple_modes IS NULL OR cardinality(p_simple_modes)=0 OR COALESCE((s.settings->>'bibleschool.simple_mode')::BOOLEAN,false)=ANY(p_simple_modes))
  ) SELECT COALESCE(jsonb_agg(jsonb_build_object('moduleId',module_id,'attempts',attempts,'firstAttemptPassRate',first_pass,
    'overallPassRate',overall_pass,'averageScore',average_score,'retryCount',retries) ORDER BY module_id),'[]'::JSONB) INTO exams FROM (
    SELECT module_id,COUNT(*)::INT attempts,
      COALESCE(ROUND(100.0*COUNT(*) FILTER(WHERE attempt_number=1 AND passed)/NULLIF(COUNT(*) FILTER(WHERE attempt_number=1),0),1),0) first_pass,
      COALESCE(ROUND(100.0*COUNT(*) FILTER(WHERE passed)/NULLIF(COUNT(*),0),1),0) overall_pass,
      COALESCE(ROUND(AVG(score_percentage),1),0) average_score,COUNT(*) FILTER(WHERE attempt_number>1)::INT retries
    FROM public.user_quiz_attempts q JOIN eligible e ON e.id=q.user_id
    WHERE completed_at BETWEEN from_at AND to_at AND (p_module_ids IS NULL OR cardinality(p_module_ids)=0 OR module_id=ANY(p_module_ids)) GROUP BY module_id
  ) x;

  SELECT MIN(occurred_at) INTO coverage_start FROM public.learning_activity_events;
  WITH eligible AS (
    SELECT u.id FROM public.users u LEFT JOIN public.user_settings s ON s.user_id=u.id
    WHERE u.role='user' AND (p_locales IS NULL OR cardinality(p_locales)=0 OR COALESCE(s.settings->>'language','en')=ANY(p_locales))
      AND (p_simple_modes IS NULL OR cardinality(p_simple_modes)=0 OR COALESCE((s.settings->>'bibleschool.simple_mode')::BOOLEAN,false)=ANY(p_simple_modes))
  ), first_sessions AS (
    SELECT e.user_id,MIN(e.occurred_at) first_at FROM public.learning_activity_events e JOIN eligible u ON u.id=e.user_id
    WHERE e.event_type='app_session_started' GROUP BY e.user_id
  ), returns AS (
    SELECT f.user_id,f.first_at,
      EXISTS(SELECT 1 FROM public.learning_activity_events e WHERE e.user_id=f.user_id AND e.event_type='app_session_started' AND e.occurred_at>=f.first_at+INTERVAL '1 day' AND e.occurred_at<f.first_at+INTERVAL '2 days') d1,
      EXISTS(SELECT 1 FROM public.learning_activity_events e WHERE e.user_id=f.user_id AND e.event_type='app_session_started' AND e.occurred_at>=f.first_at+INTERVAL '7 days' AND e.occurred_at<f.first_at+INTERVAL '8 days') d7,
      EXISTS(SELECT 1 FROM public.learning_activity_events e WHERE e.user_id=f.user_id AND e.event_type='app_session_started' AND e.occurred_at>=f.first_at+INTERVAL '30 days' AND e.occurred_at<f.first_at+INTERVAL '31 days') d30
    FROM first_sessions f
  ), grouped AS (
    SELECT date_trunc('week',first_at AT TIME ZONE p_timezone)::DATE week_start,COUNT(*)::INT size,
      COUNT(*) FILTER(WHERE d1)::INT d1,COUNT(*) FILTER(WHERE d7)::INT d7,COUNT(*) FILTER(WHERE d30)::INT d30
    FROM returns GROUP BY date_trunc('week',first_at AT TIME ZONE p_timezone)::DATE
  ), summary AS (
    SELECT jsonb_build_object(
      'd1',COALESCE(ROUND(100.0*COUNT(*) FILTER(WHERE d1)/NULLIF(COUNT(*),0),1),0),
      'd7',COALESCE(ROUND(100.0*COUNT(*) FILTER(WHERE d7)/NULLIF(COUNT(*),0),1),0),
      'd30',COALESCE(ROUND(100.0*COUNT(*) FILTER(WHERE d30)/NULLIF(COUNT(*),0),1),0),
      'isBuilding',coverage_start IS NULL OR coverage_start>NOW()-INTERVAL '14 days',
      'startedAt',coverage_start
    ) value FROM returns
  ), cohort_summary AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('weekStart',week_start,'size',size,
      'd1',CASE WHEN size=0 THEN 0 ELSE ROUND(d1*100.0/size,1) END,
      'd7',CASE WHEN size=0 THEN 0 ELSE ROUND(d7*100.0/size,1) END,
      'd30',CASE WHEN size=0 THEN 0 ELSE ROUND(d30*100.0/size,1) END) ORDER BY week_start DESC),'[]'::JSONB) value
    FROM grouped
  ) SELECT summary.value,cohort_summary.value INTO retention,cohorts FROM summary CROSS JOIN cohort_summary;
  retention := retention || jsonb_build_object('cohorts',cohorts);

  RETURN jsonb_build_object('generatedAt',NOW(),'period',p_period,'timezone',p_timezone,'bounds',bounds,
    'filters',jsonb_build_object('locales',COALESCE(to_jsonb(p_locales),'[]'::JSONB),'simpleModes',COALESCE(to_jsonb(p_simple_modes),'[]'::JSONB),'moduleIds',COALESCE(to_jsonb(p_module_ids),'[]'::JSONB)),
    'eventCoverage',jsonb_build_object('startedAt',coverage_start,'isBuilding',coverage_start IS NULL OR coverage_start>NOW()-INTERVAL '14 days'),
    'metricDefinitions',jsonb_build_object('funnel','Unique students at each learning milestone','retention','Return after the first measured session'),
    'funnel',funnel,'modules',modules,'exams',exams,'retention',retention);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_learning_analytics_v2(TEXT,TEXT,TEXT[],BOOLEAN[],TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_learning_analytics_v2(TEXT,TEXT,TEXT[],BOOLEAN[],TEXT[]) TO authenticated;

DROP FUNCTION IF EXISTS public.get_admin_users_v2(INTEGER,INTEGER,TEXT,TEXT,BOOLEAN,TEXT,TEXT,TEXT);
DROP FUNCTION IF EXISTS public.get_admin_users_v2(INTEGER,INTEGER,TEXT,TEXT[],BOOLEAN[],TEXT[],TEXT[],TEXT,TEXT);

CREATE OR REPLACE FUNCTION public.get_admin_users_v2(
  p_limit INTEGER DEFAULT 30, p_offset INTEGER DEFAULT 0, p_search TEXT DEFAULT NULL,
  p_locales TEXT[] DEFAULT NULL, p_simple_modes BOOLEAN[] DEFAULT NULL,
  p_signals TEXT[] DEFAULT NULL, p_module_ids TEXT[] DEFAULT NULL,
  p_sort TEXT DEFAULT 'last_activity', p_direction TEXT DEFAULT 'desc'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE users_json JSONB; total_count BIGINT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Permission denied: admin role required'; END IF;
  IF p_limit NOT BETWEEN 1 AND 100 OR p_offset < 0 THEN RAISE EXCEPTION 'Invalid pagination'; END IF;
  IF p_sort NOT IN ('name','created_at','last_activity','progress') OR p_direction NOT IN ('asc','desc') THEN RAISE EXCEPTION 'Invalid sort'; END IF;

  WITH rows AS (
    SELECT u.id,u.email,u.full_name,u.role,u.created_at,COALESCE(s.settings->>'language','en') locale,
      COALESCE((s.settings->>'bibleschool.simple_mode')::BOOLEAN,false) simple_mode,
      GREATEST((SELECT MAX(e.occurred_at) FROM public.learning_activity_events e WHERE e.user_id=u.id),
        (SELECT MAX(l.updated_at) FROM public.user_lesson_progress l WHERE l.user_id=u.id),
        (SELECT MAX(m.updated_at) FROM public.user_module_progress m WHERE m.user_id=u.id),
        (SELECT MAX(q.completed_at) FROM public.user_quiz_attempts q WHERE q.user_id=u.id)) last_activity,
      COALESCE(active_module.module_id,
        CASE WHEN completed_modules.last_module_number IS NOT NULL
          THEN 'module-'||(completed_modules.last_module_number+1)::TEXT END) current_module,
      CASE WHEN active_module.module_id IS NOT NULL THEN 'in_progress'
        WHEN completed_modules.completed_count>0 THEN 'ready_for_next'
        ELSE 'not_started' END current_module_status,
      COALESCE(active_module.progress_percentage,0) progress,
      COALESCE(completed_modules.completed_count,0) completed_module_count,
      completed_modules.last_module_id last_completed_module_id,
      COALESCE(completed_lessons.completed_count,0) completed_lesson_count,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN u.created_at<NOW()-INTERVAL '7 days' AND NOT EXISTS(SELECT 1 FROM public.user_lesson_progress l WHERE l.user_id=u.id) THEN 'no_first_lesson' END,
        CASE WHEN EXISTS(SELECT 1 FROM public.user_lesson_progress l WHERE l.user_id=u.id)
          AND GREATEST((SELECT MAX(e.occurred_at) FROM public.learning_activity_events e WHERE e.user_id=u.id),
            (SELECT MAX(l.updated_at) FROM public.user_lesson_progress l WHERE l.user_id=u.id),
            (SELECT MAX(m.updated_at) FROM public.user_module_progress m WHERE m.user_id=u.id),
            (SELECT MAX(q.completed_at) FROM public.user_quiz_attempts q WHERE q.user_id=u.id)) < NOW()-INTERVAL '14 days'
          THEN 'inactive_after_start' END,
        CASE WHEN EXISTS(SELECT 1 FROM public.user_module_progress m WHERE m.user_id=u.id AND m.status='in_progress' AND m.updated_at<NOW()-INTERVAL '7 days') THEN 'stalled_module' END,
        CASE WHEN EXISTS(SELECT 1 FROM public.user_quiz_attempts q WHERE q.user_id=u.id GROUP BY q.module_id HAVING COUNT(*) FILTER(WHERE NOT passed)>=2 AND NOT BOOL_OR(passed)) THEN 'repeated_exam_failure' END
      ],NULL) signals
    FROM public.users u
    LEFT JOIN public.user_settings s ON s.user_id=u.id
    LEFT JOIN LATERAL (
      SELECT m.module_id,m.progress_percentage
      FROM public.user_module_progress m
      WHERE m.user_id=u.id AND m.status='in_progress'
      ORDER BY COALESCE(NULLIF(regexp_replace(m.module_id,'\D','','g'),''),'0')::INTEGER DESC,
        m.updated_at DESC,m.module_id DESC
      LIMIT 1
    ) active_module ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::INTEGER completed_count,
        (ARRAY_AGG(module_id ORDER BY module_number DESC,module_id DESC))[1] last_module_id,
        MAX(module_number) last_module_number
      FROM (
        SELECT m.module_id,COALESCE(NULLIF(regexp_replace(m.module_id,'\D','','g'),''),'0')::INTEGER module_number
        FROM public.user_module_progress m
        WHERE m.user_id=u.id AND m.status='completed'
      ) completed_rows
    ) completed_modules ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::INTEGER completed_count
      FROM public.user_lesson_progress l
      WHERE l.user_id=u.id AND l.completed
    ) completed_lessons ON TRUE
    WHERE u.role='user'
  ), filtered AS (
    SELECT * FROM rows WHERE (p_search IS NULL OR p_search='' OR email ILIKE '%'||p_search||'%' OR full_name ILIKE '%'||p_search||'%')
      AND (p_locales IS NULL OR cardinality(p_locales)=0 OR locale=ANY(p_locales))
      AND (p_simple_modes IS NULL OR cardinality(p_simple_modes)=0 OR simple_mode=ANY(p_simple_modes))
      AND (p_signals IS NULL OR cardinality(p_signals)=0 OR signals&&p_signals)
      AND (p_module_ids IS NULL OR cardinality(p_module_ids)=0 OR current_module=ANY(p_module_ids))
  ), ranked AS (
    SELECT filtered.*,ROW_NUMBER() OVER(ORDER BY
      CASE WHEN p_sort='name' AND p_direction='asc' THEN COALESCE(full_name,email) END ASC,
      CASE WHEN p_sort='name' AND p_direction='desc' THEN COALESCE(full_name,email) END DESC,
      CASE WHEN p_sort='created_at' AND p_direction='asc' THEN created_at END ASC,
      CASE WHEN p_sort='created_at' AND p_direction='desc' THEN created_at END DESC,
      CASE WHEN p_sort='last_activity' AND p_direction='asc' THEN last_activity END ASC NULLS LAST,
      CASE WHEN p_sort='last_activity' AND p_direction='desc' THEN last_activity END DESC NULLS LAST,
      CASE WHEN p_sort='progress' AND p_direction='asc' THEN progress END ASC,
      CASE WHEN p_sort='progress' AND p_direction='desc' THEN progress END DESC,
      id ASC
    ) rn FROM filtered
  )
  SELECT COUNT(*), COALESCE(jsonb_agg(jsonb_build_object('id',id,'email',email,'fullName',full_name,'role',role,
    'createdAt',created_at,'lastActivity',last_activity,'locale',locale,'simpleMode',simple_mode,'currentModuleId',current_module,
    'currentModuleStatus',current_module_status,'progressPercentage',progress,'completedModuleCount',completed_module_count,
    'completedLessonCount',completed_lesson_count,'lastCompletedModuleId',last_completed_module_id,'signals',to_jsonb(signals)) ORDER BY rn
    ) FILTER(WHERE rn>p_offset AND rn<=p_offset+p_limit),'[]'::JSONB)
  INTO total_count,users_json FROM ranked;
  RETURN jsonb_build_object('generatedAt',NOW(),'users',users_json,'totalCount',total_count,'limit',p_limit,'offset',p_offset);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_users_v2(INTEGER,INTEGER,TEXT,TEXT[],BOOLEAN[],TEXT[],TEXT[],TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_users_v2(INTEGER,INTEGER,TEXT,TEXT[],BOOLEAN[],TEXT[],TEXT[],TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_user_detail_v2(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSONB;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Permission denied: admin role required'; END IF;
  SELECT jsonb_build_object(
    'generatedAt',NOW(),
    'user',jsonb_build_object('id',u.id,'email',u.email,'fullName',u.full_name,'role',u.role,'createdAt',u.created_at,
      'updatedAt',u.updated_at,'locale',COALESCE(s.settings->>'language','en'),'simpleMode',COALESCE((s.settings->>'bibleschool.simple_mode')::BOOLEAN,false)),
    'lessonCompletedCount',(SELECT COUNT(*) FROM public.user_lesson_progress l WHERE l.user_id=u.id AND l.completed),
    'moduleProgress',(SELECT COALESCE(jsonb_agg(jsonb_build_object('moduleId',m.module_id,'status',m.status,'progressPercentage',m.progress_percentage,
      'createdAt',m.created_at,'updatedAt',m.updated_at,'completedAt',m.completed_at,
      'startedLessonCount',(SELECT COUNT(*) FROM public.user_lesson_progress l WHERE l.user_id=u.id AND l.module_id=m.module_id),
      'completedLessonCount',(SELECT COUNT(*) FROM public.user_lesson_progress l WHERE l.user_id=u.id AND l.module_id=m.module_id AND l.completed),
      'lastLessonId',(SELECT l.lesson_id FROM public.user_lesson_progress l WHERE l.user_id=u.id AND l.module_id=m.module_id ORDER BY l.updated_at DESC,l.lesson_id DESC LIMIT 1),
      'lastLessonAt',(SELECT l.updated_at FROM public.user_lesson_progress l WHERE l.user_id=u.id AND l.module_id=m.module_id ORDER BY l.updated_at DESC,l.lesson_id DESC LIMIT 1))
      ORDER BY COALESCE(NULLIF(regexp_replace(m.module_id,'\D','','g'),''),'0')::INTEGER,m.module_id),'[]'::JSONB)
      FROM public.user_module_progress m WHERE m.user_id=u.id),
    'quizAttempts',(SELECT COALESCE(jsonb_agg(jsonb_build_object('moduleId',q.module_id,'attemptNumber',q.attempt_number,'scorePercentage',q.score_percentage,
      'passed',q.passed,'completedAt',q.completed_at) ORDER BY q.completed_at DESC),'[]'::JSONB) FROM public.user_quiz_attempts q WHERE q.user_id=u.id),
    'timeline',(SELECT COALESCE(jsonb_agg(event ORDER BY at DESC),'[]'::JSONB) FROM (
      SELECT jsonb_build_object('type','lesson_completed','at',completed_at,'moduleId',module_id,'lessonId',lesson_id) event,completed_at at FROM public.user_lesson_progress WHERE user_id=u.id AND completed
      UNION ALL SELECT jsonb_build_object('type','module_completed','at',completed_at,'moduleId',module_id),completed_at FROM public.user_module_progress WHERE user_id=u.id AND status='completed'
      UNION ALL SELECT jsonb_build_object('type','exam_attempt','at',completed_at,'moduleId',module_id,'score',score_percentage,'passed',passed),completed_at FROM public.user_quiz_attempts WHERE user_id=u.id
    ) events),
    'signals',(SELECT COALESCE(jsonb_agg(jsonb_build_object('type',signal_type,'count',1)),'[]'::JSONB) FROM (
      SELECT 'no_first_lesson' signal_type WHERE u.created_at<NOW()-INTERVAL '7 days' AND NOT EXISTS(SELECT 1 FROM public.user_lesson_progress l WHERE l.user_id=u.id)
      UNION ALL SELECT 'inactive_after_start' WHERE EXISTS(SELECT 1 FROM public.user_lesson_progress l WHERE l.user_id=u.id)
        AND GREATEST((SELECT MAX(e.occurred_at) FROM public.learning_activity_events e WHERE e.user_id=u.id),
          (SELECT MAX(l.updated_at) FROM public.user_lesson_progress l WHERE l.user_id=u.id),
          (SELECT MAX(m.updated_at) FROM public.user_module_progress m WHERE m.user_id=u.id),
          (SELECT MAX(q.completed_at) FROM public.user_quiz_attempts q WHERE q.user_id=u.id))<NOW()-INTERVAL '14 days'
      UNION ALL SELECT 'stalled_module' WHERE EXISTS(SELECT 1 FROM public.user_module_progress m WHERE m.user_id=u.id AND m.status='in_progress' AND m.updated_at<NOW()-INTERVAL '7 days')
      UNION ALL SELECT 'repeated_exam_failure' WHERE EXISTS(SELECT 1 FROM public.user_quiz_attempts q WHERE q.user_id=u.id GROUP BY q.module_id HAVING COUNT(*) FILTER(WHERE NOT passed)>=2 AND NOT BOOL_OR(passed))
    ) user_signals)
  ) INTO result FROM public.users u LEFT JOIN public.user_settings s ON s.user_id=u.id WHERE u.id=p_user_id;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_user_detail_v2(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_detail_v2(UUID) TO authenticated;
