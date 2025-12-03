-- Create function to update reputation on like
CREATE OR REPLACE FUNCTION public.update_reputation_on_like(_author_id uuid, _liker_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update or insert author reputation
  INSERT INTO public.user_reputation (user_id, likes_received, reputation_points)
  VALUES (_author_id, 1, 10)
  ON CONFLICT (user_id) DO UPDATE 
  SET likes_received = user_reputation.likes_received + 1,
      reputation_points = user_reputation.reputation_points + 10,
      updated_at = now();
  
  -- Update or insert liker reputation (giving likes also counts)
  INSERT INTO public.user_reputation (user_id, likes_given, reputation_points)
  VALUES (_liker_id, 1, 1)
  ON CONFLICT (user_id) DO UPDATE 
  SET likes_given = user_reputation.likes_given + 1,
      reputation_points = user_reputation.reputation_points + 1,
      updated_at = now();
END;
$$;

-- Create function to update reputation on unlike
CREATE OR REPLACE FUNCTION public.update_reputation_on_unlike(_author_id uuid, _liker_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrease author reputation
  UPDATE public.user_reputation 
  SET likes_received = GREATEST(0, likes_received - 1),
      reputation_points = GREATEST(0, reputation_points - 10),
      updated_at = now()
  WHERE user_id = _author_id;
  
  -- Decrease liker reputation
  UPDATE public.user_reputation 
  SET likes_given = GREATEST(0, likes_given - 1),
      reputation_points = GREATEST(0, reputation_points - 1),
      updated_at = now()
  WHERE user_id = _liker_id;
END;
$$;