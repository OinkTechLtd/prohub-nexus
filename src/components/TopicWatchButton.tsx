import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopicWatchButtonProps {
  topicId: string;
  userId?: string;
}

export const TopicWatchButton = ({ topicId, userId }: TopicWatchButtonProps) => {
  const [isWatching, setIsWatching] = useState(false);
  const [notifyOnReply, setNotifyOnReply] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId || !topicId) return;

    const checkWatchStatus = async () => {
      const { data } = await supabase
        .from("topic_watches")
        .select("id, notify_on_reply")
        .eq("user_id", userId)
        .eq("topic_id", topicId)
        .maybeSingle();

      if (data) {
        setIsWatching(true);
        setNotifyOnReply(data.notify_on_reply);
      }
    };

    checkWatchStatus();
  }, [userId, topicId]);

  const handleWatch = async () => {
    if (!userId) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите, чтобы отслеживать темы",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isWatching) {
        await supabase
          .from("topic_watches")
          .delete()
          .eq("user_id", userId)
          .eq("topic_id", topicId);

        setIsWatching(false);
        toast({
          title: "Отслеживание отключено",
          description: "Вы больше не получаете уведомления об этой теме",
        });
      } else {
        await supabase.from("topic_watches").insert({
          user_id: userId,
          topic_id: topicId,
          notify_on_reply: true,
        });

        setIsWatching(true);
        setNotifyOnReply(true);
        toast({
          title: "🔔 Тема отслеживается",
          description: "Вы получите уведомления о новых ответах",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async () => {
    if (!userId) return;

    setLoading(true);
    const newValue = !notifyOnReply;

    try {
      await supabase
        .from("topic_watches")
        .update({ notify_on_reply: newValue })
        .eq("user_id", userId)
        .eq("topic_id", topicId);

      setNotifyOnReply(newValue);
      toast({
        title: newValue ? "🔔 Уведомления включены" : "🔕 Уведомления отключены",
        description: newValue
          ? "Вы будете получать уведомления о новых ответах"
          : "Тема отслеживается без уведомлений",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Eye className="h-4 w-4 mr-1" />
        Отслеживать
      </Button>
    );
  }

  if (!isWatching) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleWatch}
        disabled={loading}
      >
        <Eye className="h-4 w-4 mr-1" />
        Отслеживать
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="bg-primary/90"
          disabled={loading}
        >
          <EyeOff className="h-4 w-4 mr-1" />
          Отслеживается
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={toggleNotifications}>
          {notifyOnReply ? (
            <>
              <BellOff className="h-4 w-4 mr-2" />
              Отключить уведомления
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Включить уведомления
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWatch} className="text-destructive">
          <EyeOff className="h-4 w-4 mr-2" />
          Прекратить отслеживание
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TopicWatchButton;
