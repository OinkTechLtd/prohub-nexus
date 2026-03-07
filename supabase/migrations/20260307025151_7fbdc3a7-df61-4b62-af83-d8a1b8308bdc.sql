
-- Forum plugins system
CREATE TABLE public.forum_plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  version text DEFAULT '1.0.0',
  author text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  code text,
  hook_points text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.forum_plugins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active plugins" ON public.forum_plugins
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage plugins" ON public.forum_plugins
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Forum templates system
CREATE TABLE public.forum_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  html_content text,
  css_content text,
  is_active boolean DEFAULT true,
  template_type text DEFAULT 'page',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.forum_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active templates" ON public.forum_templates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage templates" ON public.forum_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Forum settings (watermark, branding etc)
CREATE TABLE public.forum_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.forum_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view settings" ON public.forum_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.forum_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.forum_settings (key, value, description) VALUES
  ('footer_text', 'Made by Oink Platforms', 'Текст в подвале сайта'),
  ('footer_link', 'https://freesoft.ru/gink-platforms', 'Ссылка в подвале сайта');
