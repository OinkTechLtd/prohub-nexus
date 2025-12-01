-- Таблица рекламных кампаний
CREATE TABLE public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('video', 'banner', 'text')),
  target_interests TEXT[], -- Массив интересов для таргетинга
  budget_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  budget_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_per_view DECIMAL(10,4) NOT NULL DEFAULT 0.01, -- Цена за просмотр
  cost_per_click DECIMAL(10,4) NOT NULL DEFAULT 0.05, -- Цена за клик
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица объявлений
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT, -- URL видео или изображения
  click_url TEXT, -- Куда ведет клик по рекламе
  width INTEGER, -- Для баннеров
  height INTEGER, -- Для баннеров
  duration INTEGER, -- Для видео (секунды)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица показов рекламы
CREATE TABLE public.ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_viewed INTEGER -- Сколько секунд просмотрено (для видео)
);

-- Таблица кликов по рекламе
CREATE TABLE public.ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица интересов пользователей (для таргетинга)
CREATE TABLE public.user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest TEXT NOT NULL, -- например: 'programming', 'design', 'video', 'tutorials'
  score DECIMAL(5,2) DEFAULT 1.0, -- Насколько сильно пользователь интересуется этим
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interest)
);

-- Таблица заработка пользователей от рекламы
CREATE TABLE public.user_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  source TEXT NOT NULL, -- 'ad_views', 'ad_clicks'
  ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn BOOLEAN DEFAULT FALSE,
  crypto_tx_id TEXT -- ID транзакции вывода на крипту
);

-- Таблица запросов на вывод средств
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  crypto_address TEXT NOT NULL,
  crypto_currency TEXT NOT NULL DEFAULT 'USDT', -- USDT, BTC, ETH
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  tx_id TEXT, -- ID транзакции в блокчейне
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies для ad_campaigns
CREATE POLICY "Users can view all active campaigns"
ON public.ad_campaigns FOR SELECT
USING (status = 'active');

CREATE POLICY "Users can create their own campaigns"
ON public.ad_campaigns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
ON public.ad_campaigns FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies для ads
CREATE POLICY "Everyone can view ads"
ON public.ads FOR SELECT
USING (true);

CREATE POLICY "Users can create ads for their campaigns"
ON public.ads FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ad_campaigns 
    WHERE id = campaign_id AND user_id = auth.uid()
  )
);

-- RLS Policies для ad_impressions
CREATE POLICY "Users can create impressions"
ON public.ad_impressions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own impressions"
ON public.ad_impressions FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies для ad_clicks
CREATE POLICY "Users can create clicks"
ON public.ad_clicks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own clicks"
ON public.ad_clicks FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies для user_interests
CREATE POLICY "Users can view their own interests"
ON public.user_interests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage interests"
ON public.user_interests FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies для user_earnings
CREATE POLICY "Users can view their own earnings"
ON public.user_earnings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can add earnings"
ON public.user_earnings FOR INSERT
WITH CHECK (true);

-- RLS Policies для withdrawal_requests
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawal_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Индексы для производительности
CREATE INDEX idx_ad_campaigns_user_id ON public.ad_campaigns(user_id);
CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns(status);
CREATE INDEX idx_ads_campaign_id ON public.ads(campaign_id);
CREATE INDEX idx_ad_impressions_ad_id ON public.ad_impressions(ad_id);
CREATE INDEX idx_ad_impressions_user_id ON public.ad_impressions(user_id);
CREATE INDEX idx_ad_clicks_ad_id ON public.ad_clicks(ad_id);
CREATE INDEX idx_user_interests_user_id ON public.user_interests(user_id);
CREATE INDEX idx_user_earnings_user_id ON public.user_earnings(user_id);

-- Триггеры для updated_at
CREATE TRIGGER update_ad_campaigns_updated_at
BEFORE UPDATE ON public.ad_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_interests_updated_at
BEFORE UPDATE ON public.user_interests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();