ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS forum_id text NOT NULL DEFAULT 'prohub';

CREATE TABLE IF NOT EXISTS public.codeforum_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'newbie',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.codeforum_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view codeforum roles" ON public.codeforum_roles FOR SELECT USING (true);
CREATE POLICY "Admins can manage codeforum roles" ON public.codeforum_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));