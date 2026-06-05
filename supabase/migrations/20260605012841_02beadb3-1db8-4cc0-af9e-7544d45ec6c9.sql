ALTER TABLE public.brand_accounts
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS bio text;