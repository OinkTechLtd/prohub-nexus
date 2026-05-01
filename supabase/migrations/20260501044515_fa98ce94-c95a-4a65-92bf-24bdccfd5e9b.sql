-- Flair / emoji decorations for usernames
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS flair_emoji_prefix text,
  ADD COLUMN IF NOT EXISTS flair_emoji_suffix text,
  ADD COLUMN IF NOT EXISTS flair_icon text;

-- Protected usernames list (cannot be banned/warned/renamed)
CREATE TABLE IF NOT EXISTS public.protected_usernames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.protected_usernames ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view protected usernames" ON public.protected_usernames;
CREATE POLICY "Everyone can view protected usernames"
  ON public.protected_usernames FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage protected usernames" ON public.protected_usernames;
CREATE POLICY "Admins manage protected usernames"
  ON public.protected_usernames FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.protected_usernames (username, reason) VALUES
  ('ProHub', 'system bot'),
  ('Kasper', 'founder'),
  ('TwixCore', 'founder'),
  ('Twixoff', 'founder'),
  ('oinktech', 'founder/system'),
  ('ginktech', 'founder/system'),
  ('ModeratorProHub', 'system'),
  ('Platforma', 'system'),
  ('Платформа', 'system'),
  ('VanyaFilatov', 'protected')
ON CONFLICT (username) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_protected_username(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.protected_usernames pu
      ON LOWER(pu.username) = LOWER(p.username)
    WHERE p.id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.protected_users pu2 WHERE pu2.user_id = _user_id
  );
$$;

-- Block warnings/bans for protected users
CREATE OR REPLACE FUNCTION public.prevent_action_on_protected_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_protected_username(NEW.user_id) THEN
    RAISE EXCEPTION 'Этот аккаунт защищён и не может быть подвергнут модерации';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_bans ON public.user_bans;
CREATE TRIGGER protect_user_bans
  BEFORE INSERT ON public.user_bans
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_action_on_protected_user();

-- user_warnings table may exist; create trigger if so
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_warnings') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS protect_user_warnings ON public.user_warnings';
    EXECUTE 'CREATE TRIGGER protect_user_warnings BEFORE INSERT ON public.user_warnings FOR EACH ROW EXECUTE FUNCTION public.prevent_action_on_protected_user()';
  END IF;
END $$;

-- Helper to check if user is currently banned (for badge)
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_bans
    WHERE user_id = _user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Rename inactive users (called by edge function with service role)
CREATE OR REPLACE FUNCTION public.rename_inactive_users(_days integer DEFAULT 14)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  new_name text;
  cnt integer := 0;
BEGIN
  FOR rec IN
    SELECT u.id, p.username, u.last_sign_in_at
    FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE COALESCE(u.last_sign_in_at, u.created_at) < (now() - (_days || ' days')::interval)
      AND p.username NOT LIKE 'user-%'
      AND NOT public.is_protected_username(u.id)
  LOOP
    new_name := 'user-' || lpad((floor(random()*900000) + 100000)::text, 6, '0');
    -- Avoid collisions
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_name) LOOP
      new_name := 'user-' || lpad((floor(random()*900000) + 100000)::text, 6, '0');
    END LOOP;
    UPDATE public.profiles SET username = new_name WHERE id = rec.id;
    cnt := cnt + 1;
  END LOOP;
  RETURN cnt;
END;
$$;