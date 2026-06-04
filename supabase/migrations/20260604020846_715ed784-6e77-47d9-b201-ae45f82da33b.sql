
-- Fix uploads: add SELECT policy for storage.objects on public profile/resource/video buckets
CREATE POLICY "Public read profile covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-covers');

CREATE POLICY "Public read resource files"
ON storage.objects FOR SELECT
USING (bucket_id = 'resource-files');

CREATE POLICY "Public read videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Brand / organization accounts (like GitHub orgs)
CREATE TABLE public.brand_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  description TEXT,
  avatar_url TEXT,
  website_url TEXT,
  link_label TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.brand_accounts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_accounts TO authenticated;
GRANT ALL ON public.brand_accounts TO service_role;

ALTER TABLE public.brand_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand accounts are publicly readable"
ON public.brand_accounts FOR SELECT
USING (true);

-- Enforce per-user 20-brand limit via trigger
CREATE OR REPLACE FUNCTION public.enforce_brand_account_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.brand_accounts WHERE owner_user_id = NEW.owner_user_id) >= 20 THEN
    RAISE EXCEPTION 'Достигнут лимит: максимум 20 аккаунтов бренда';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER brand_account_limit
BEFORE INSERT ON public.brand_accounts
FOR EACH ROW EXECUTE FUNCTION public.enforce_brand_account_limit();

CREATE POLICY "Owners can create their brand accounts"
ON public.brand_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their brand accounts"
ON public.brand_accounts FOR UPDATE
TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete their brand accounts"
ON public.brand_accounts FOR DELETE
TO authenticated
USING (auth.uid() = owner_user_id);

CREATE TRIGGER brand_accounts_updated_at
BEFORE UPDATE ON public.brand_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_brand_accounts_owner ON public.brand_accounts(owner_user_id);
