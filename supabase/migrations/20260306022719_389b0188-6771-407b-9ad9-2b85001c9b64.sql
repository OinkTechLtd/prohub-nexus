
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS custom_title text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_title_color text DEFAULT NULL;
