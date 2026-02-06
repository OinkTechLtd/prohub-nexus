
-- Create content_reports table for user reports
CREATE TABLE public.content_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'topic', 'post', 'resource', 'video'
  content_id UUID NOT NULL,
  content_author_id UUID,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  admin_id UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON public.content_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.content_reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins/moderators can view all reports
CREATE POLICY "Admins can view all reports"
  ON public.content_reports
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'moderator'::app_role)
  );

-- Admins can update reports
CREATE POLICY "Admins can update reports"
  ON public.content_reports
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'moderator'::app_role)
  );

-- Admins can delete reports
CREATE POLICY "Admins can delete reports"
  ON public.content_reports
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for content_reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_reports;
