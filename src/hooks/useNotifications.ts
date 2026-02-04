import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface Notification {
  id: string;
  type: "achievement" | "message" | "earnings" | "topic_reply";
  title: string;
  description: string;
  timestamp: string;
}

export const useNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { toast } = useToast();
  const { playNotificationSound, playSuccessSound } = useNotificationSound();

  const showNotification = useCallback(
    (title: string, description: string, playSound: boolean = true) => {
      toast({ title, description });
      if (playSound && soundEnabled) {
        playNotificationSound();
      }
    },
    [toast, soundEnabled, playNotificationSound]
  );

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
            if (soundEnabled) playSuccessSound();
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

            showNotification(
              `💬 Новое сообщение от ${sender?.username || "пользователя"}`,
              payload.new.content.substring(0, 50) + "..."
            );
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
          if (soundEnabled) playSuccessSound();
          toast({
            title: `💰 Новый заработок: $${parseFloat(payload.new.amount).toFixed(2)}`,
            description: `Источник: ${payload.new.source === "ad_views" ? "просмотр рекламы" : "клик по рекламе"}`,
          });
        }
      )
      .subscribe();

    // Subscribe to new posts in watched topics
    const postsChannel = supabase
      .channel("watched-topics-posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        async (payload) => {
          // Check if user is watching this topic
          const { data: watch } = await supabase
            .from("topic_watches")
            .select("id, notify_on_reply")
            .eq("user_id", userId)
            .eq("topic_id", payload.new.topic_id)
            .maybeSingle();

          // Only notify if watching with notifications enabled and not own post
          if (watch?.notify_on_reply && payload.new.user_id !== userId) {
            const [{ data: topic }, { data: author }] = await Promise.all([
              supabase
                .from("topics")
                .select("title")
                .eq("id", payload.new.topic_id)
                .single(),
              supabase
                .from("profiles")
                .select("username")
                .eq("id", payload.new.user_id)
                .single(),
            ]);

            showNotification(
              `📝 Новый ответ в отслеживаемой теме`,
              `${author?.username || "Пользователь"} ответил в "${topic?.title?.substring(0, 40)}..."`
            );
          }
        }
      )
      .subscribe();

    // Subscribe to warnings
    const warningsChannel = supabase
      .channel("user-warnings-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_warnings",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (soundEnabled) playNotificationSound();
          toast({
            title: `⚠️ Вы получили предупреждение`,
            description: `${payload.new.points} балл(ов): ${payload.new.reason.substring(0, 50)}...`,
            variant: "destructive",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(achievementsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(earningsChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(warningsChannel);
    };
  }, [userId, toast, soundEnabled, playNotificationSound, playSuccessSound, showNotification]);

  return { notifications, soundEnabled, setSoundEnabled };
};
