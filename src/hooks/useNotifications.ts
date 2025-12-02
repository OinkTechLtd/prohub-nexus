import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "achievement" | "message" | "earnings";
  title: string;
  description: string;
  timestamp: string;
}

export const useNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new achievements
    const achievementsChannel = supabase
      .channel("user-achievements-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const { data: achievement } = await supabase
            .from("achievements")
            .select("name, icon, points")
            .eq("id", payload.new.achievement_id)
            .single();

          if (achievement) {
            toast({
              title: `🎉 Достижение получено: ${achievement.icon} ${achievement.name}`,
              description: `+${achievement.points} очков`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel("user-messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          // Check if message is for this user
          const { data: participant } = await supabase
            .from("chat_participants")
            .select("chat_id")
            .eq("user_id", userId)
            .eq("chat_id", payload.new.chat_id)
            .single();

          if (participant && payload.new.user_id !== userId) {
            const { data: sender } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", payload.new.user_id)
              .single();

            toast({
              title: `💬 Новое сообщение от ${sender?.username || "пользователя"}`,
              description: payload.new.content.substring(0, 50) + "...",
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new earnings
    const earningsChannel = supabase
      .channel("user-earnings-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_earnings",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          toast({
            title: `💰 Новый заработок: $${parseFloat(payload.new.amount).toFixed(2)}`,
            description: `Источник: ${payload.new.source === "ad_views" ? "просмотр рекламы" : "клик по рекламе"}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(achievementsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(earningsChannel);
    };
  }, [userId, toast]);

  return { notifications };
};
