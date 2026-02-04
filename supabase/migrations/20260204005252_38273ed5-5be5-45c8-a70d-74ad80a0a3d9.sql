-- Create topic watches table for following topics
CREATE TABLE public.topic_watches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notify_on_reply BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, topic_id)
);

-- Enable RLS
ALTER TABLE public.topic_watches ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own watches" ON public.topic_watches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can watch topics" ON public.topic_watches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unwatch topics" ON public.topic_watches
  FOR DELETE USING (auth.uid() = user_id);

-- Create warning types table
CREATE TABLE public.warning_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  expires_days INTEGER, -- NULL = never expires
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warning_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view warning types" ON public.warning_types
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage warning types" ON public.warning_types
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create user warnings table
CREATE TABLE public.user_warnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  moderator_id UUID NOT NULL,
  warning_type_id UUID REFERENCES public.warning_types(id),
  points INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  notes TEXT, -- internal notes for mods
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = never expires
  is_expired BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own warnings" ON public.user_warnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mods can view all warnings" ON public.user_warnings
  FOR SELECT USING (
    public.has_role(auth.uid(), 'moderator') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Mods can issue warnings" ON public.user_warnings
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'moderator') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update warnings" ON public.user_warnings
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create user bans table for automatic sanctions
CREATE TABLE public.user_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  banned_by UUID NOT NULL,
  reason TEXT NOT NULL,
  ban_type TEXT NOT NULL DEFAULT 'temporary', -- 'temporary' or 'permanent'
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bans" ON public.user_bans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mods can view all bans" ON public.user_bans
  FOR SELECT USING (
    public.has_role(auth.uid(), 'moderator') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Mods can create bans" ON public.user_bans
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'moderator') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update bans" ON public.user_bans
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Insert default warning types
INSERT INTO public.warning_types (name, points, expires_days, description) VALUES
  ('Спам', 1, 30, 'Размещение спама или рекламы'),
  ('Оскорбление', 2, 60, 'Оскорбление других пользователей'),
  ('Флуд', 1, 14, 'Бессмысленные сообщения'),
  ('Мат', 1, 30, 'Использование ненормативной лексики'),
  ('Оффтоп', 1, 14, 'Сообщения не по теме'),
  ('Провокация', 3, 90, 'Провоцирование конфликтов'),
  ('Мультиаккаунт', 5, NULL, 'Использование нескольких аккаунтов'),
  ('Обход бана', 10, NULL, 'Попытка обхода блокировки');

-- Function to calculate active warning points
CREATE OR REPLACE FUNCTION public.get_user_warning_points(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(points), 0)::INTEGER
  FROM public.user_warnings
  WHERE user_id = _user_id
    AND is_expired = false
    AND (expires_at IS NULL OR expires_at > now())
$$;

-- Function to check and apply automatic sanctions
CREATE OR REPLACE FUNCTION public.check_and_apply_sanctions(_user_id UUID, _moderator_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_points INTEGER;
  sanction_applied TEXT := NULL;
BEGIN
  SELECT public.get_user_warning_points(_user_id) INTO total_points;
  
  -- Auto-ban thresholds
  IF total_points >= 15 THEN
    -- Permanent ban
    INSERT INTO public.user_bans (user_id, banned_by, reason, ban_type, expires_at)
    VALUES (_user_id, _moderator_id, 'Автоматический бан: накоплено ' || total_points || ' баллов предупреждений', 'permanent', NULL)
    ON CONFLICT DO NOTHING;
    sanction_applied := 'permanent_ban';
  ELSIF total_points >= 10 THEN
    -- 30 day ban
    INSERT INTO public.user_bans (user_id, banned_by, reason, ban_type, expires_at)
    VALUES (_user_id, _moderator_id, 'Автоматический бан на 30 дней: накоплено ' || total_points || ' баллов', 'temporary', now() + interval '30 days')
    ON CONFLICT DO NOTHING;
    sanction_applied := 'ban_30_days';
  ELSIF total_points >= 7 THEN
    -- 7 day ban
    INSERT INTO public.user_bans (user_id, banned_by, reason, ban_type, expires_at)
    VALUES (_user_id, _moderator_id, 'Автоматический бан на 7 дней: накоплено ' || total_points || ' баллов', 'temporary', now() + interval '7 days')
    ON CONFLICT DO NOTHING;
    sanction_applied := 'ban_7_days';
  ELSIF total_points >= 5 THEN
    -- 1 day ban
    INSERT INTO public.user_bans (user_id, banned_by, reason, ban_type, expires_at)
    VALUES (_user_id, _moderator_id, 'Автоматический бан на 1 день: накоплено ' || total_points || ' баллов', 'temporary', now() + interval '1 day')
    ON CONFLICT DO NOTHING;
    sanction_applied := 'ban_1_day';
  END IF;
  
  RETURN sanction_applied;
END;
$$;

-- Enable realtime for topic watches
ALTER PUBLICATION supabase_realtime ADD TABLE public.topic_watches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_warnings;