-- Resource ratings table
CREATE TABLE public.resource_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_id, user_id)
);

ALTER TABLE public.resource_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view ratings" ON public.resource_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate" ON public.resource_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their ratings" ON public.resource_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their ratings" ON public.resource_ratings FOR DELETE USING (auth.uid() = user_id);

-- Protected bot role (ProHub bot cannot have role removed)
CREATE TABLE public.protected_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  protection_type TEXT NOT NULL DEFAULT 'admin',
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.protected_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view protected users" ON public.protected_users FOR SELECT USING (true);
-- No insert/update/delete policies - only system can manage

-- Insert ProHub as protected admin
INSERT INTO public.protected_users (user_id, protection_type, reason)
VALUES ('b7a8e202-40a2-467d-a4de-c416eff4a488', 'admin', 'System bot account - cannot be demoted');

-- Ensure ProHub has admin role
INSERT INTO public.user_roles (user_id, role, can_moderate_resources, can_moderate_topics)
VALUES ('b7a8e202-40a2-467d-a4de-c416eff4a488', 'admin', true, true)
ON CONFLICT (user_id, role) DO UPDATE SET can_moderate_resources = true, can_moderate_topics = true;

-- Moderator applications table
CREATE TABLE public.moderator_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  applied_role TEXT NOT NULL DEFAULT 'moderator',
  experience TEXT,
  online_time TEXT,
  contribution TEXT,
  ai_recommendation TEXT,
  ai_analyzed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.moderator_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view applications" ON public.moderator_applications FOR SELECT USING (true);
CREATE POLICY "Users can apply" ON public.moderator_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update applications" ON public.moderator_applications FOR UPDATE 
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Bot messages log
CREATE TABLE public.bot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id UUID NOT NULL,
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  related_content_type TEXT,
  related_content_id UUID,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bot messages" ON public.bot_messages FOR SELECT 
  USING (has_role(auth.uid(), 'admin') OR auth.uid() = target_user_id);
CREATE POLICY "System can insert bot messages" ON public.bot_messages FOR INSERT WITH CHECK (true);

-- Function to calculate average rating for resource
CREATE OR REPLACE FUNCTION public.update_resource_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.resources
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.resource_ratings
    WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)
  )
  WHERE id = COALESCE(NEW.resource_id, OLD.resource_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_resource_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.resource_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_resource_rating();