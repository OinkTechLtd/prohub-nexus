REVOKE EXECUTE ON FUNCTION public.is_user_banned(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_topic_views(text, uuid, text) FROM anon;

DROP POLICY IF EXISTS "Editors can update all topics" ON public.topics;
DROP POLICY IF EXISTS "Users can update their own topics" ON public.topics;
DROP POLICY IF EXISTS "Mods can moderate topics" ON public.topics;
DROP POLICY IF EXISTS "Editors can update all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "update own sub_forum_topics" ON public.sub_forum_topics;
DROP POLICY IF EXISTS "update own sub_forum_posts" ON public.sub_forum_posts;

CREATE POLICY "Users can edit own safe topic fields"
ON public.topics
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_pinned IS NOT TRUE
  AND is_locked IS NOT TRUE
  AND is_hidden IS NOT TRUE
  AND hidden_reason IS NULL
);

CREATE POLICY "Users can edit own safe post fields"
ON public.posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_hidden IS NOT TRUE
  AND hidden_reason IS NULL
);

CREATE POLICY "Users can edit own safe subforum topic fields"
ON public.sub_forum_topics
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_pinned IS NOT TRUE
  AND is_locked IS NOT TRUE
  AND is_hidden IS NOT TRUE
  AND hidden_reason IS NULL
);

CREATE POLICY "Users can edit own safe subforum post fields"
ON public.sub_forum_posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_hidden IS NOT TRUE
  AND hidden_reason IS NULL
);