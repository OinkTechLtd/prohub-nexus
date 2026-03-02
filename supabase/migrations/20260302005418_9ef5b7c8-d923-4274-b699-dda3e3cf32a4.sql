
-- User streaks table
CREATE TABLE public.user_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_visit_date date,
  streak_bonus_claimed boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own streak" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own streak" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own streak" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- Function to update quest progress server-side
CREATE OR REPLACE FUNCTION public.increment_quest_progress(_user_id uuid, _action_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quest RECORD;
  period_start_val date;
  existing_progress RECORD;
  new_val integer;
  is_done boolean;
BEGIN
  FOR quest IN 
    SELECT * FROM daily_quests WHERE action_type = _action_type AND is_active = true
  LOOP
    -- Calculate period start
    IF quest.quest_type = 'daily' THEN
      period_start_val := CURRENT_DATE;
    ELSE
      -- Monday of current week
      period_start_val := date_trunc('week', CURRENT_DATE)::date;
    END IF;

    -- Find or create progress
    SELECT * INTO existing_progress
    FROM user_quest_progress
    WHERE user_id = _user_id AND quest_id = quest.id AND period_start = period_start_val;

    IF existing_progress IS NULL THEN
      INSERT INTO user_quest_progress (user_id, quest_id, current_value, is_completed, period_start)
      VALUES (_user_id, quest.id, 1, 1 >= quest.target_value, period_start_val);
    ELSIF NOT existing_progress.is_completed THEN
      new_val := existing_progress.current_value + 1;
      is_done := new_val >= quest.target_value;
      UPDATE user_quest_progress
      SET current_value = new_val,
          is_completed = is_done,
          completed_at = CASE WHEN is_done THEN now() ELSE NULL END
      WHERE id = existing_progress.id;
    END IF;
  END LOOP;
END;
$$;

-- Function to update daily streak
CREATE OR REPLACE FUNCTION public.update_daily_streak(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak RECORD;
  result jsonb;
BEGIN
  SELECT * INTO streak FROM user_streaks WHERE user_id = _user_id;

  IF streak IS NULL THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_visit_date)
    VALUES (_user_id, 1, 1, CURRENT_DATE);
    result := jsonb_build_object('current_streak', 1, 'longest_streak', 1, 'is_new_day', true);
  ELSIF streak.last_visit_date = CURRENT_DATE THEN
    -- Already visited today
    result := jsonb_build_object('current_streak', streak.current_streak, 'longest_streak', streak.longest_streak, 'is_new_day', false);
  ELSIF streak.last_visit_date = CURRENT_DATE - 1 THEN
    -- Consecutive day
    UPDATE user_streaks
    SET current_streak = streak.current_streak + 1,
        longest_streak = GREATEST(streak.longest_streak, streak.current_streak + 1),
        last_visit_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = _user_id;
    result := jsonb_build_object('current_streak', streak.current_streak + 1, 'longest_streak', GREATEST(streak.longest_streak, streak.current_streak + 1), 'is_new_day', true);
  ELSE
    -- Streak broken
    UPDATE user_streaks
    SET current_streak = 1,
        last_visit_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = _user_id;
    result := jsonb_build_object('current_streak', 1, 'longest_streak', streak.longest_streak, 'is_new_day', true, 'streak_broken', true);
  END IF;

  -- Also increment login quest
  PERFORM increment_quest_progress(_user_id, 'logins');

  RETURN result;
END;
$$;
