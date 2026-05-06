REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_banned(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.increment_topic_views(text, uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.moderate_topic(text, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_post(text, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_content_hidden(text, uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_daily_streak(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_quest_progress(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_award_achievements(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_upgrade_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_apply_sanctions(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_reputation_on_like(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_reputation_on_unlike(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_private_chat(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.rename_inactive_users(integer) TO service_role;

DROP POLICY IF EXISTS "Videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view resource files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile covers" ON storage.objects;

DO $$
BEGIN
  BEGIN
    ALTER TABLE public.topics REPLICA IDENTITY FULL;
    ALTER TABLE public.posts REPLICA IDENTITY FULL;
    ALTER TABLE public.sub_forum_topics REPLICA IDENTITY FULL;
    ALTER TABLE public.sub_forum_posts REPLICA IDENTITY FULL;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.topics;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sub_forum_topics;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sub_forum_posts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;