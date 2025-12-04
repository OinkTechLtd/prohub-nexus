-- Create a security definer function to get user's chat IDs without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_chat_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT chat_id FROM public.chat_participants WHERE user_id = _user_id
$$;

-- Drop old problematic policies
DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.messages;

-- Create new policies using the security definer function
CREATE POLICY "Users can view participants in their chats"
  ON public.chat_participants FOR SELECT
  USING (chat_id IN (SELECT get_user_chat_ids(auth.uid())));

CREATE POLICY "Users can view their chats"
  ON public.chats FOR SELECT
  USING (id IN (SELECT get_user_chat_ids(auth.uid())));

CREATE POLICY "Users can update their chats"
  ON public.chats FOR UPDATE
  USING (id IN (SELECT get_user_chat_ids(auth.uid())));

CREATE POLICY "Users can view messages in their chats"
  ON public.messages FOR SELECT
  USING (chat_id IN (SELECT get_user_chat_ids(auth.uid())));

CREATE POLICY "Users can send messages in their chats"
  ON public.messages FOR INSERT
  WITH CHECK (user_id = auth.uid() AND chat_id IN (SELECT get_user_chat_ids(auth.uid())));