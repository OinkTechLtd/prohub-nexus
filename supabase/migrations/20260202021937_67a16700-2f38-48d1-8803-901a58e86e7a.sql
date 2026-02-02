-- Create guild invites table
CREATE TABLE public.guild_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(guild_id, invitee_id)
);

-- Enable RLS
ALTER TABLE public.guild_invites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view invites they sent or received"
ON public.guild_invites
FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Guild members can send invites"
ON public.guild_invites
FOR INSERT
WITH CHECK (
  auth.uid() = inviter_id AND
  EXISTS (
    SELECT 1 FROM public.guild_members
    WHERE guild_id = guild_invites.guild_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin', 'moderator', 'officer')
  )
);

CREATE POLICY "Invitees can update their invites"
ON public.guild_invites
FOR UPDATE
USING (auth.uid() = invitee_id);

CREATE POLICY "Inviters can delete their invites"
ON public.guild_invites
FOR DELETE
USING (auth.uid() = inviter_id);