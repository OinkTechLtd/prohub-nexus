
DO $$ BEGIN
  CREATE TYPE public.flexdev_role AS ENUM ('admin','senior_admin','curator','moderator','vip','newbie');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.flexdev_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.flexdev_role NOT NULL DEFAULT 'newbie',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT ON public.flexdev_roles TO authenticated;
GRANT ALL ON public.flexdev_roles TO service_role;

ALTER TABLE public.flexdev_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authed can read flexdev roles" ON public.flexdev_roles;
CREATE POLICY "Anyone authed can read flexdev roles"
  ON public.flexdev_roles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only platform admins manage flexdev roles" ON public.flexdev_roles;
CREATE POLICY "Only platform admins manage flexdev roles"
  ON public.flexdev_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
