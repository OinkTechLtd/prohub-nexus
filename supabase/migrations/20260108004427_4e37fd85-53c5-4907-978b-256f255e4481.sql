-- Create resource_comments table for comments on resources
CREATE TABLE public.resource_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resource_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view non-hidden comments" 
ON public.resource_comments 
FOR SELECT 
USING (is_hidden = false);

CREATE POLICY "Authenticated users can create comments" 
ON public.resource_comments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.resource_comments 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.resource_comments 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_resource_comments_updated_at
BEFORE UPDATE ON public.resource_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();