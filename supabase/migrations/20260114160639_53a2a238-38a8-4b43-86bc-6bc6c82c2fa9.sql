-- Таблица гильдий (как в XenForo)
CREATE TABLE public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tag TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  owner_id UUID NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  member_count INTEGER DEFAULT 0,
  is_official BOOLEAN DEFAULT false
);

-- Участники гильдий
CREATE TABLE public.guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guild_id, user_id)
);

-- 2FA TOTP secrets
CREATE TABLE public.user_totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_totp_secrets ENABLE ROW LEVEL SECURITY;

-- Guilds policies (публичный просмотр)
CREATE POLICY "Anyone can view guilds" ON public.guilds FOR SELECT USING (true);
CREATE POLICY "Owners can update guilds" ON public.guilds FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Authenticated can create guilds" ON public.guilds FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Guild members policies
CREATE POLICY "Anyone can view guild members" ON public.guild_members FOR SELECT USING (true);
CREATE POLICY "Guild owners can manage members" ON public.guild_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.guilds WHERE id = guild_id AND owner_id = auth.uid()));
CREATE POLICY "Users can join guilds" ON public.guild_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave guilds" ON public.guild_members FOR DELETE
  USING (auth.uid() = user_id);

-- TOTP secrets policies (только свои)
CREATE POLICY "Users can manage own TOTP" ON public.user_totp_secrets FOR ALL USING (auth.uid() = user_id);

-- Триггер обновления счётчика участников
CREATE OR REPLACE FUNCTION public.update_guild_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.guilds SET member_count = member_count + 1 WHERE id = NEW.guild_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.guilds SET member_count = member_count - 1 WHERE id = OLD.guild_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_guild_member_count_trigger
AFTER INSERT OR DELETE ON public.guild_members
FOR EACH ROW EXECUTE FUNCTION public.update_guild_member_count();

-- Индексы
CREATE INDEX idx_guilds_tag ON public.guilds(tag);
CREATE INDEX idx_guild_members_user ON public.guild_members(user_id);
CREATE INDEX idx_guild_members_guild ON public.guild_members(guild_id);
CREATE INDEX idx_totp_user ON public.user_totp_secrets(user_id);