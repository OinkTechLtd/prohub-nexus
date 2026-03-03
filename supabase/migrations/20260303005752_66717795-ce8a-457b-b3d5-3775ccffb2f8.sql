
-- Allow everyone to view streaks (for leaderboard)
CREATE POLICY "Everyone can view streaks"
ON public.user_streaks
FOR SELECT
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users view own streak" ON public.user_streaks;

-- Update the streak function to award milestone bonuses
CREATE OR REPLACE FUNCTION public.update_daily_streak(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  streak RECORD;
  result jsonb;
  new_streak integer;
  milestone_bonus integer := 0;
BEGIN
  SELECT * INTO streak FROM user_streaks WHERE user_id = _user_id;

  IF streak IS NULL THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_visit_date)
    VALUES (_user_id, 1, 1, CURRENT_DATE);
    result := jsonb_build_object('current_streak', 1, 'longest_streak', 1, 'is_new_day', true);
  ELSIF streak.last_visit_date = CURRENT_DATE THEN
    result := jsonb_build_object('current_streak', streak.current_streak, 'longest_streak', streak.longest_streak, 'is_new_day', false);
  ELSIF streak.last_visit_date = CURRENT_DATE - 1 THEN
    new_streak := streak.current_streak + 1;
    
    -- Check milestones and award bonus reputation
    IF new_streak = 7 THEN milestone_bonus := 50;
    ELSIF new_streak = 14 THEN milestone_bonus := 100;
    ELSIF new_streak = 30 THEN milestone_bonus := 250;
    ELSIF new_streak = 100 THEN milestone_bonus := 1000;
    END IF;
    
    IF milestone_bonus > 0 THEN
      INSERT INTO public.user_reputation (user_id, reputation_points)
      VALUES (_user_id, milestone_bonus)
      ON CONFLICT (user_id) DO UPDATE
      SET reputation_points = user_reputation.reputation_points + milestone_bonus,
          updated_at = now();
    END IF;
    
    UPDATE user_streaks
    SET current_streak = new_streak,
        longest_streak = GREATEST(streak.longest_streak, new_streak),
        last_visit_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = _user_id;
    
    result := jsonb_build_object(
      'current_streak', new_streak,
      'longest_streak', GREATEST(streak.longest_streak, new_streak),
      'is_new_day', true,
      'milestone_bonus', milestone_bonus
    );
  ELSE
    UPDATE user_streaks
    SET current_streak = 1,
        last_visit_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = _user_id;
    result := jsonb_build_object('current_streak', 1, 'longest_streak', streak.longest_streak, 'is_new_day', true, 'streak_broken', true);
  END IF;

  PERFORM increment_quest_progress(_user_id, 'logins');
  RETURN result;
END;
$$;
