
-- Daily/weekly quests definition
CREATE TABLE public.daily_quests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  quest_type text NOT NULL DEFAULT 'daily', -- daily, weekly
  action_type text NOT NULL, -- posts, topics, likes_given, resources, videos, logins
  target_value integer NOT NULL DEFAULT 1,
  reward_points integer NOT NULL DEFAULT 5,
  icon text NOT NULL DEFAULT '⭐',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests viewable by everyone" ON public.daily_quests FOR SELECT USING (true);

-- User quest progress
CREATE TABLE public.user_quest_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  quest_id uuid NOT NULL REFERENCES public.daily_quests(id) ON DELETE CASCADE,
  current_value integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, quest_id, period_start)
);

ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own progress" ON public.user_quest_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert progress" ON public.user_quest_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update progress" ON public.user_quest_progress FOR UPDATE USING (auth.uid() = user_id);

-- Seed default quests
INSERT INTO public.daily_quests (name, description, quest_type, action_type, target_value, reward_points, icon) VALUES
  ('Активный писатель', 'Написать 5 постов за день', 'daily', 'posts', 5, 10, '✍️'),
  ('Создатель тем', 'Создать 2 темы за день', 'daily', 'topics', 2, 15, '📝'),
  ('Оценщик', 'Оценить 3 ресурса за день', 'daily', 'likes_given', 3, 5, '👍'),
  ('Ежедневный визит', 'Зайти на форум', 'daily', 'logins', 1, 3, '🔑'),
  ('Марафонец', 'Написать 25 постов за неделю', 'weekly', 'posts', 25, 50, '🏃'),
  ('Контент-мейкер', 'Создать 5 тем за неделю', 'weekly', 'topics', 5, 40, '🎯'),
  ('Загрузчик', 'Добавить 3 ресурса за неделю', 'weekly', 'resources', 3, 35, '📦'),
  ('Видеограф', 'Загрузить 2 видео за неделю', 'weekly', 'videos', 2, 30, '🎬'),
  ('Социальная бабочка', 'Поставить 20 лайков за неделю', 'weekly', 'likes_given', 20, 25, '🦋');
