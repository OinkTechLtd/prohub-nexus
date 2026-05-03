
-- Sub-forum topics and posts (mirror prohub topics/posts)
CREATE TABLE public.sub_forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_forum_id uuid NOT NULL,
  category_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  views integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sub_forum_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view sub_forum_topics" ON public.sub_forum_topics FOR SELECT USING (true);
CREATE POLICY "create sub_forum_topics" ON public.sub_forum_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own sub_forum_topics" ON public.sub_forum_topics FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "delete own sub_forum_topics" ON public.sub_forum_topics FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_sub_forum_topics_updated BEFORE UPDATE ON public.sub_forum_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_sft_forum ON public.sub_forum_topics(sub_forum_id, created_at DESC);
CREATE INDEX idx_sft_cat ON public.sub_forum_topics(category_id, created_at DESC);

CREATE TABLE public.sub_forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_hidden boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sub_forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view sub_forum_posts" ON public.sub_forum_posts FOR SELECT USING (true);
CREATE POLICY "create sub_forum_posts" ON public.sub_forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own sub_forum_posts" ON public.sub_forum_posts FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "delete own sub_forum_posts" ON public.sub_forum_posts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_sub_forum_posts_updated BEFORE UPDATE ON public.sub_forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_sfp_topic ON public.sub_forum_posts(topic_id, created_at);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sub_forum_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sub_forum_posts;

-- Changelog setting (one row in forum_settings)
INSERT INTO public.forum_settings(key, value, description)
VALUES ('changelog_version', '1', 'Bumped to show "What''s new" modal'),
       ('changelog_content', 'Полноценные подфорумы с темами и ответами\nRSS-ленты для подфорумов и категорий\nБаннер блокировки во всех списках\nДекорации никнейма в шапке профиля\nВозвращён лендинг Code Forum\nМобильная админка ≤360px\nАвто-обновление приложения у всех', 'JSON or newline-separated changelog entries')
ON CONFLICT (key) DO NOTHING;
