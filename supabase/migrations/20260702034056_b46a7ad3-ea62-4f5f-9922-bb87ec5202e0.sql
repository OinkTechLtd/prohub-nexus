ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS forum_id text NOT NULL DEFAULT 'prohub';
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS author_brand_id uuid REFERENCES public.brand_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS author_brand_id uuid REFERENCES public.brand_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_brand_id uuid REFERENCES public.brand_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.resource_comments ADD COLUMN IF NOT EXISTS author_brand_id uuid REFERENCES public.brand_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.brand_accounts ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'business';

CREATE INDEX IF NOT EXISTS idx_resources_forum_id_created ON public.resources(forum_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_author_brand ON public.topics(author_brand_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_brand ON public.posts(author_brand_id);
CREATE INDEX IF NOT EXISTS idx_resources_author_brand ON public.resources(author_brand_id);
CREATE INDEX IF NOT EXISTS idx_resource_comments_author_brand ON public.resource_comments(author_brand_id);

INSERT INTO public.categories (name, slug, description, icon, order_position, forum_id)
VALUES
  ('Frontend & UI', 'flexdev-frontend-ui', 'React, интерфейсы, дизайн-системы, анимации и UX.', '⚡', 10, 'flexdev'),
  ('Backend & Cloud', 'flexdev-backend-cloud', 'API, базы данных, авторизация, edge-функции и инфраструктура.', '🛠️', 20, 'flexdev'),
  ('Showcase', 'flexdev-showcase', 'Покажи проект, получи фидбек и найди команду.', '🚀', 30, 'flexdev'),
  ('Jobs & Collab', 'flexdev-jobs-collab', 'Заказы, вакансии, коллаборации и поиск разработчиков.', '🤝', 40, 'flexdev')
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.moderate_topic(_scope text, _topic_id uuid, _action text, _reason text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_can boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  v_can := public.can_moderate_content(v_uid, 'topic');
  IF NOT v_can THEN RAISE EXCEPTION 'Forbidden'; END IF;

  IF _scope IN ('prohub','codeforum','flexdev') THEN
    IF _action = 'pin'    THEN UPDATE public.topics SET is_pinned = true  WHERE id=_topic_id AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = topics.category_id AND c.forum_id = _scope);
    ELSIF _action='unpin' THEN UPDATE public.topics SET is_pinned = false WHERE id=_topic_id AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = topics.category_id AND c.forum_id = _scope);
    ELSIF _action='lock'  THEN UPDATE public.topics SET is_locked = true  WHERE id=_topic_id AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = topics.category_id AND c.forum_id = _scope);
    ELSIF _action='unlock'THEN UPDATE public.topics SET is_locked = false WHERE id=_topic_id AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = topics.category_id AND c.forum_id = _scope);
    ELSIF _action='hide'  THEN
      IF _reason IS NULL OR btrim(_reason)='' THEN RAISE EXCEPTION 'Reason required'; END IF;
      UPDATE public.topics SET is_hidden = true, hidden_reason = _reason WHERE id=_topic_id AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = topics.category_id AND c.forum_id = _scope);
    ELSIF _action='show'  THEN UPDATE public.topics SET is_hidden = false, hidden_reason = NULL WHERE id=_topic_id AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = topics.category_id AND c.forum_id = _scope);
    ELSE RAISE EXCEPTION 'Unknown action'; END IF;
  ELSIF _scope='subforum' THEN
    IF _action = 'pin'    THEN UPDATE public.sub_forum_topics SET is_pinned = true  WHERE id=_topic_id;
    ELSIF _action='unpin' THEN UPDATE public.sub_forum_topics SET is_pinned = false WHERE id=_topic_id;
    ELSIF _action='lock'  THEN UPDATE public.sub_forum_topics SET is_locked = true  WHERE id=_topic_id;
    ELSIF _action='unlock'THEN UPDATE public.sub_forum_topics SET is_locked = false WHERE id=_topic_id;
    ELSIF _action='hide'  THEN
      IF _reason IS NULL OR btrim(_reason)='' THEN RAISE EXCEPTION 'Reason required'; END IF;
      UPDATE public.sub_forum_topics SET is_hidden = true, hidden_reason = _reason WHERE id=_topic_id;
    ELSIF _action='show'  THEN UPDATE public.sub_forum_topics SET is_hidden = false, hidden_reason = NULL WHERE id=_topic_id;
    ELSE RAISE EXCEPTION 'Unknown action'; END IF;
  ELSE RAISE EXCEPTION 'Unknown scope'; END IF;

  IF NOT FOUND THEN RAISE EXCEPTION 'Content not found in scope'; END IF;
  INSERT INTO public.moderation_audit_log(moderator_id, scope, content_type, content_id, action, reason)
  VALUES (v_uid, _scope, 'topic', _topic_id, _action, _reason);
END $function$;

CREATE OR REPLACE FUNCTION public.moderate_post(_scope text, _post_id uuid, _action text, _reason text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.can_moderate_content(v_uid, 'post') THEN RAISE EXCEPTION 'Forbidden'; END IF;

  IF _scope IN ('prohub','codeforum','flexdev') THEN
    IF _action='hide' THEN
      IF _reason IS NULL OR btrim(_reason)='' THEN RAISE EXCEPTION 'Reason required'; END IF;
      UPDATE public.posts SET is_hidden=true, hidden_reason=_reason WHERE id=_post_id AND EXISTS (SELECT 1 FROM public.topics t JOIN public.categories c ON c.id=t.category_id WHERE t.id=posts.topic_id AND c.forum_id=_scope);
    ELSIF _action='show' THEN UPDATE public.posts SET is_hidden=false, hidden_reason=NULL WHERE id=_post_id AND EXISTS (SELECT 1 FROM public.topics t JOIN public.categories c ON c.id=t.category_id WHERE t.id=posts.topic_id AND c.forum_id=_scope);
    ELSE RAISE EXCEPTION 'Unknown action'; END IF;
  ELSIF _scope='subforum' THEN
    IF _action='hide' THEN
      IF _reason IS NULL OR btrim(_reason)='' THEN RAISE EXCEPTION 'Reason required'; END IF;
      UPDATE public.sub_forum_posts SET is_hidden=true, hidden_reason=_reason WHERE id=_post_id;
    ELSIF _action='show' THEN UPDATE public.sub_forum_posts SET is_hidden=false, hidden_reason=NULL WHERE id=_post_id;
    ELSE RAISE EXCEPTION 'Unknown action'; END IF;
  ELSE RAISE EXCEPTION 'Unknown scope'; END IF;

  IF NOT FOUND THEN RAISE EXCEPTION 'Content not found in scope'; END IF;
  INSERT INTO public.moderation_audit_log(moderator_id, scope, content_type, content_id, action, reason)
  VALUES (v_uid, _scope, 'post', _post_id, _action, _reason);
END $function$;

CREATE OR REPLACE FUNCTION public.increment_topic_views(_scope text, _topic_id uuid, _viewer_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_last timestamptz;
BEGIN
  SELECT last_at INTO v_last FROM public.topic_view_throttle
   WHERE scope=_scope AND topic_id=_topic_id AND viewer_key=_viewer_key;
  IF v_last IS NOT NULL AND v_last > now() - interval '10 minutes' THEN
    RETURN;
  END IF;

  INSERT INTO public.topic_view_throttle(scope, topic_id, viewer_key, last_at)
  VALUES (_scope, _topic_id, _viewer_key, now())
  ON CONFLICT (scope, topic_id, viewer_key) DO UPDATE SET last_at = now();

  IF _scope IN ('prohub','codeforum','flexdev') THEN
    UPDATE public.topics SET views = COALESCE(views,0)+1 WHERE id=_topic_id AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = topics.category_id AND c.forum_id = _scope);
  ELSIF _scope='subforum' THEN
    UPDATE public.sub_forum_topics SET views = COALESCE(views,0)+1 WHERE id=_topic_id;
  END IF;
END $function$;

CREATE OR REPLACE FUNCTION public.update_daily_streak(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  streak RECORD;
  result jsonb;
  new_streak integer;
  milestone_bonus integer := 0;
  next_milestone integer := NULL;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO streak FROM public.user_streaks WHERE user_id = _user_id;

  IF streak IS NULL THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_visit_date)
    VALUES (_user_id, 1, 1, CURRENT_DATE);
    new_streak := 1;
    result := jsonb_build_object('current_streak', 1, 'longest_streak', 1, 'is_new_day', true);
  ELSIF streak.last_visit_date = CURRENT_DATE THEN
    new_streak := streak.current_streak;
    result := jsonb_build_object('current_streak', streak.current_streak, 'longest_streak', streak.longest_streak, 'is_new_day', false);
  ELSIF streak.last_visit_date = CURRENT_DATE - 1 THEN
    new_streak := streak.current_streak + 1;
    milestone_bonus := CASE new_streak
      WHEN 7 THEN 50
      WHEN 14 THEN 100
      WHEN 30 THEN 250
      WHEN 100 THEN 1000
      WHEN 200 THEN 2000
      WHEN 300 THEN 3000
      WHEN 365 THEN 5000
      WHEN 500 THEN 7500
      WHEN 730 THEN 12000
      WHEN 1000 THEN 20000
      WHEN 1500 THEN 30000
      WHEN 2000 THEN 45000
      WHEN 3000 THEN 75000
      WHEN 4000 THEN 120000
      ELSE 0
    END;

    IF milestone_bonus > 0 THEN
      INSERT INTO public.user_reputation (user_id, reputation_points)
      VALUES (_user_id, milestone_bonus)
      ON CONFLICT (user_id) DO UPDATE
      SET reputation_points = public.user_reputation.reputation_points + milestone_bonus,
          updated_at = now();
    END IF;

    UPDATE public.user_streaks
    SET current_streak = new_streak,
        longest_streak = GREATEST(streak.longest_streak, new_streak),
        last_visit_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = _user_id;

    result := jsonb_build_object('current_streak', new_streak, 'longest_streak', GREATEST(streak.longest_streak, new_streak), 'is_new_day', true, 'milestone_bonus', milestone_bonus);
  ELSE
    UPDATE public.user_streaks
    SET current_streak = 1,
        last_visit_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = _user_id;
    new_streak := 1;
    result := jsonb_build_object('current_streak', 1, 'longest_streak', streak.longest_streak, 'is_new_day', true, 'streak_broken', true);
  END IF;

  SELECT MIN(m) INTO next_milestone FROM (VALUES (7),(14),(30),(100),(200),(300),(365),(500),(730),(1000),(1500),(2000),(3000),(4000)) AS milestones(m) WHERE m > new_streak;

  PERFORM public.increment_quest_progress(_user_id, 'logins');
  RETURN result || jsonb_build_object('next_milestone', next_milestone, 'max_milestone', 4000);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.moderate_topic(text, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_post(text, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_topic_views(text, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_daily_streak(uuid) TO authenticated;