import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessages = (userId: string | undefined) => {
  const [totalUnread, setTotalUnread] = useState(0);

  const countUnread = useCallback(async () => {
    if (!userId) return;

    try {
      // Get user's chats with last_read_at
      const { data: participants } = await supabase
        .from("chat_participants")
        .select("chat_id, last_read_at")
        .eq("user_id", userId);

      if (!participants || participants.length === 0) {
        setTotalUnread(0);
        return;
      }

      let total = 0;
      for (const p of participants) {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("chat_id", p.chat_id)
          .neq("user_id", userId)
          .gt("created_at", p.last_read_at || "1970-01-01");

        total += count || 0;
      }

      setTotalUnread(total);
    } catch (err) {
      console.error("Error counting unread messages:", err);
    }
  }, [userId]);

  useEffect(() => {
    countUnread();
  }, [countUnread]);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new messages to update count
    const channel = supabase
      .channel("unread-messages-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          if (payload.new.user_id !== userId) {
            // Check if user is participant
            const { data } = await supabase
              .from("chat_participants")
              .select("id")
              .eq("user_id", userId)
              .eq("chat_id", payload.new.chat_id)
              .maybeSingle();

            if (data) {
              setTotalUnread(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { totalUnread, refreshUnread: countUnread };
};
