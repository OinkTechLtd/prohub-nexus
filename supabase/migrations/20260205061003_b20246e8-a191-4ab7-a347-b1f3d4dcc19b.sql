-- Add signature and banner_url to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS signature_enabled BOOLEAN DEFAULT true;

-- Add comments to explain fields
COMMENT ON COLUMN public.profiles.signature IS 'User text signature displayed under posts (like XenForo)';
COMMENT ON COLUMN public.profiles.banner_url IS 'User profile banner image URL';
COMMENT ON COLUMN public.profiles.signature_enabled IS 'Whether to show signature under posts';