-- Username history table
CREATE TABLE IF NOT EXISTS public.username_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_username text NOT NULL,
  new_username text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.username_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view username history (public profile feature)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'username_history'
      AND policyname = 'Username history is viewable by everyone'
  ) THEN
    CREATE POLICY "Username history is viewable by everyone"
    ON public.username_history
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Link to profiles (NOT auth.users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'username_history'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'username_history_user_id_fkey'
  ) THEN
    ALTER TABLE public.username_history
      ADD CONSTRAINT username_history_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_username_history_user_changed_at
  ON public.username_history(user_id, changed_at DESC);

-- Trigger: log username changes
CREATE OR REPLACE FUNCTION public.log_username_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.username IS DISTINCT FROM OLD.username THEN
    INSERT INTO public.username_history (user_id, old_username, new_username, changed_at)
    VALUES (NEW.id, OLD.username, NEW.username, now());
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_username_change'
  ) THEN
    CREATE TRIGGER trg_log_username_change
    AFTER UPDATE OF username ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_username_change();
  END IF;
END $$;


-- Moderation permission helper (respects granular flags)
CREATE OR REPLACE FUNCTION public.can_moderate_content(_user_id uuid, _content_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN public.has_role(_user_id, 'admin'::public.app_role) THEN true
      WHEN _content_type IN ('resource','video') THEN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = _user_id
          AND ur.role = 'moderator'::public.app_role
          AND COALESCE(ur.can_moderate_resources, false) = true
      )
      WHEN _content_type IN ('topic','post') THEN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = _user_id
          AND ur.role = 'moderator'::public.app_role
          AND COALESCE(ur.can_moderate_topics, false) = true
      )
      ELSE false
    END;
$$;

-- SECURITY DEFINER RPC: ensures hide/unhide cannot "silently" fail due to RLS
CREATE OR REPLACE FUNCTION public.set_content_hidden(
  _content_type text,
  _content_id uuid,
  _hidden boolean,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
  v_reason text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.can_moderate_content(auth.uid(), _content_type) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF _hidden THEN
    IF _reason IS NULL OR btrim(_reason) = '' THEN
      RAISE EXCEPTION 'Reason is required';
    END IF;
    v_reason := _reason;
  ELSE
    v_reason := CASE
      WHEN _reason IS NULL OR btrim(_reason) = '' THEN 'Восстановлено'
      ELSE 'Восстановлено: ' || _reason
    END;
  END IF;

  IF _content_type = 'resource' THEN
    UPDATE public.resources SET is_hidden = _hidden WHERE id = _content_id;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
  ELSIF _content_type = 'topic' THEN
    UPDATE public.topics SET is_hidden = _hidden WHERE id = _content_id;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
  ELSIF _content_type = 'post' THEN
    UPDATE public.posts SET is_hidden = _hidden WHERE id = _content_id;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
  ELSIF _content_type = 'video' THEN
    UPDATE public.videos SET is_hidden = _hidden WHERE id = _content_id;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
  ELSE
    RAISE EXCEPTION 'Invalid content type';
  END IF;

  IF v_updated = 0 THEN
    RAISE EXCEPTION 'Content not found';
  END IF;

  INSERT INTO public.moderated_content (content_type, content_id, reason, moderator_id)
  VALUES (_content_type, _content_id, v_reason, auth.uid());
END;
$$;