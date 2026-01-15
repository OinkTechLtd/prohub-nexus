-- Add foreign key for guild_members -> profiles
ALTER TABLE public.guild_members 
ADD CONSTRAINT guild_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;