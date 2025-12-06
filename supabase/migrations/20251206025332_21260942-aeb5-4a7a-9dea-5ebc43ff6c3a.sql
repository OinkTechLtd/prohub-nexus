-- Add verified checkmark to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Add admin role to Twixoff_yt
INSERT INTO public.user_roles (user_id, role, can_moderate_resources, can_moderate_topics)
VALUES ('aa75a652-5aaa-4673-a7ca-e693a76eba89', 'admin', true, true)
ON CONFLICT (user_id, role) DO UPDATE SET can_moderate_resources = true, can_moderate_topics = true;

-- Give verified checkmarks to specified users
UPDATE public.profiles SET is_verified = true WHERE id IN (
  'aa75a652-5aaa-4673-a7ca-e693a76eba89', -- Twixoff_yt
  'dd15f76e-28a7-47c5-8363-75bba7cc4613', -- VladimirPutin
  '8d138b33-968e-4d48-b70f-629b6070f58f'  -- ModeratorProHub
);

-- Delete all videos
DELETE FROM public.videos;