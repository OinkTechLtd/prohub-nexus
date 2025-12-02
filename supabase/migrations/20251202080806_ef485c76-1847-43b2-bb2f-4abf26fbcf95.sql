-- Create helper function to safely create a private chat between two users
CREATE OR REPLACE FUNCTION public.create_private_chat(
  _user1 uuid,
  _user2 uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_chat_id uuid;
BEGIN
  -- Try to find existing chat between these two users
  SELECT c.id INTO v_chat_id
  FROM chats c
  JOIN chat_participants p1 ON p1.chat_id = c.id AND p1.user_id = _user1
  JOIN chat_participants p2 ON p2.chat_id = c.id AND p2.user_id = _user2
  LIMIT 1;

  IF v_chat_id IS NOT NULL THEN
    RETURN v_chat_id;
  END IF;

  -- Create new chat
  INSERT INTO chats DEFAULT VALUES RETURNING id INTO v_chat_id;

  -- Add both participants (bypassing RLS via SECURITY DEFINER)
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES (v_chat_id, _user1),
         (v_chat_id, _user2);

  RETURN v_chat_id;
END;
$$;