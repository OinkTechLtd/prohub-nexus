-- Create user_reputation table for rating system
CREATE TABLE IF NOT EXISTS public.user_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reputation_points integer NOT NULL DEFAULT 0,
  likes_received integer NOT NULL DEFAULT 0,
  likes_given integer NOT NULL DEFAULT 0,
  helpful_posts integer NOT NULL DEFAULT 0,
  helpful_resources integer NOT NULL DEFAULT 0,
  helpful_videos integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view reputation"
  ON public.user_reputation FOR SELECT USING (true);

CREATE POLICY "System can manage reputation"
  ON public.user_reputation FOR ALL USING (true) WITH CHECK (true);

-- Create content_likes table for liking content
CREATE TABLE IF NOT EXISTS public.content_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('topic', 'post', 'resource', 'video')),
  content_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

ALTER TABLE public.content_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view likes"
  ON public.content_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
  ON public.content_likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
  ON public.content_likes FOR DELETE 
  USING (auth.uid() = user_id);

-- Create online_presence table for tracking online users, guests, robots
CREATE TABLE IF NOT EXISTS public.online_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid,
  user_type text NOT NULL DEFAULT 'guest' CHECK (user_type IN ('user', 'guest', 'robot')),
  current_page text,
  last_seen_at timestamp with time zone DEFAULT now(),
  user_agent text,
  ip_hash text
);

ALTER TABLE public.online_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view online presence"
  ON public.online_presence FOR SELECT USING (true);

CREATE POLICY "Anyone can insert presence"
  ON public.online_presence FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update presence"
  ON public.online_presence FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete presence"
  ON public.online_presence FOR DELETE USING (true);

-- Create ai_role_evaluations table for AI role decisions
CREATE TABLE IF NOT EXISTS public.ai_role_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  suggested_role text NOT NULL,
  reason text NOT NULL,
  was_applied boolean DEFAULT false,
  evaluated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ai_role_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view evaluations"
  ON public.ai_role_evaluations FOR SELECT 
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "System can insert evaluations"
  ON public.ai_role_evaluations FOR INSERT WITH CHECK (true);

-- Fix chat_participants policy to allow the create_private_chat function to work
DROP POLICY IF EXISTS "Users can update their last_read" ON public.chat_participants;
CREATE POLICY "Users can update their last_read"
  ON public.chat_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Add likes column to posts table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'likes') THEN
    ALTER TABLE public.posts ADD COLUMN likes integer DEFAULT 0;
  END IF;
END $$;

-- Enable realtime for online_presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_presence;