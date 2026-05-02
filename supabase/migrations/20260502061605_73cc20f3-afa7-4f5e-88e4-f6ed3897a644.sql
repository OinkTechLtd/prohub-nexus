-- 1) Лог переименований неактивных
CREATE TABLE IF NOT EXISTS public.inactive_rename_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  renamed_count integer NOT NULL DEFAULT 0,
  duration_ms integer,
  triggered_by text DEFAULT 'cron',
  error text
);
ALTER TABLE public.inactive_rename_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view rename runs" ON public.inactive_rename_runs
  FOR SELECT USING (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Service can insert rename runs" ON public.inactive_rename_runs
  FOR INSERT WITH CHECK (true);

-- 2) Подфорумы (sub_forums) — Code Forum-подобные
CREATE TABLE IF NOT EXISTS public.sub_forums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  primary_color text DEFAULT '#10b981',
  accent_color text DEFAULT '#059669',
  bg_color text DEFAULT '#1a1a2e',
  card_bg text DEFAULT '#16213e',
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sub_forums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone view sub_forums" ON public.sub_forums FOR SELECT USING (true);
CREATE POLICY "Admins manage sub_forums" ON public.sub_forums FOR ALL
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

-- 3) Категории подфорумов (создаются прямо при создании подфорума)
CREATE TABLE IF NOT EXISTS public.sub_forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_forum_id uuid NOT NULL REFERENCES public.sub_forums(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  order_position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sub_forum_id, slug)
);
ALTER TABLE public.sub_forum_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone view sub_forum_categories" ON public.sub_forum_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage sub_forum_categories" ON public.sub_forum_categories FOR ALL
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

-- 4) Rate-limit таблица для анти-DDoS
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits(ip_hash, endpoint, window_start DESC);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view rate_limits" ON public.rate_limits FOR SELECT
  USING (public.has_role(auth.uid(),'admin'::public.app_role));

-- Функция проверки/инкремента лимита (вызывается из edge functions через service role)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _ip_hash text, _endpoint text, _limit integer DEFAULT 60, _window_seconds integer DEFAULT 60
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rec record;
  win_start timestamptz := now() - make_interval(secs => _window_seconds);
BEGIN
  -- Уже заблокирован?
  SELECT * INTO rec FROM public.rate_limits
   WHERE ip_hash = _ip_hash AND endpoint = _endpoint
     AND blocked_until IS NOT NULL AND blocked_until > now()
   ORDER BY window_start DESC LIMIT 1;
  IF FOUND THEN RETURN false; END IF;

  -- Счётчик за окно
  SELECT * INTO rec FROM public.rate_limits
   WHERE ip_hash = _ip_hash AND endpoint = _endpoint AND window_start > win_start
   ORDER BY window_start DESC LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limits(ip_hash, endpoint, request_count, window_start)
    VALUES (_ip_hash, _endpoint, 1, now());
    RETURN true;
  END IF;

  IF rec.request_count + 1 > _limit THEN
    UPDATE public.rate_limits SET blocked_until = now() + interval '5 minutes' WHERE id = rec.id;
    RETURN false;
  END IF;

  UPDATE public.rate_limits SET request_count = request_count + 1 WHERE id = rec.id;
  RETURN true;
END;
$$;

-- Очистка старых записей (вызывать из cron)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.rate_limits
   WHERE window_start < now() - interval '1 hour'
     AND (blocked_until IS NULL OR blocked_until < now());
$$;