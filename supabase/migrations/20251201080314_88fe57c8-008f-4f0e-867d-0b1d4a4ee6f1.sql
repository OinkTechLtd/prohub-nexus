-- Исправить RLS политики для user_achievements (сделать достижения видимыми всем)
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;

CREATE POLICY "Everyone can view all achievements"
ON public.user_achievements
FOR SELECT
USING (true);