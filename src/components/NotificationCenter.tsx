import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageCircle, Heart, Reply, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Notification {
  id: string;
  type: "message" | "like" | "reply" | "achievement";
  title: string;
  description: string;
  link?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  userId: string;
}

const NotificationCenter = ({ userId }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel("notifications-messages")
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

            const newNotification: Notification = {
              id: payload.new.id,
              type: "message",
              title: "Новое сообщение",
              description: `${sender?.username || "Пользователь"}: ${(payload.new.content as string).substring(0, 50)}...`,
              link: `/chat/${payload.new.chat_id}`,
              timestamp: new Date(),
              read: false,
            };

            setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    // Subscribe to new likes on user's content
    const likesChannel = supabase
      .channel("notifications-likes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "content_likes",
        },
        async (payload) => {
          // Check if it's a like on user's content
          const contentType = payload.new.content_type;
          const contentId = payload.new.content_id;
          
          let isUserContent = false;
          let contentTitle = "";

          if (contentType === "post") {
            const { data } = await supabase
              .from("posts")
              .select("user_id, content")
              .eq("id", contentId)
              .single();
            if (data?.user_id === userId) {
              isUserContent = true;
              contentTitle = (data.content as string).substring(0, 30);
            }
          } else if (contentType === "topic") {
            const { data } = await supabase
              .from("topics")
              .select("user_id, title")
              .eq("id", contentId)
              .single();
            if (data?.user_id === userId) {
              isUserContent = true;
              contentTitle = data.title;
            }
          } else if (contentType === "resource") {
            const { data } = await supabase
              .from("resources")
              .select("user_id, title")
              .eq("id", contentId)
              .single();
            if (data?.user_id === userId) {
              isUserContent = true;
              contentTitle = data.title;
            }
          } else if (contentType === "video") {
            const { data } = await supabase
              .from("videos")
              .select("user_id, title")
              .eq("id", contentId)
              .single();
            if (data?.user_id === userId) {
              isUserContent = true;
              contentTitle = data.title;
            }
          }

          if (isUserContent && payload.new.user_id !== userId) {
            const { data: liker } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", payload.new.user_id)
              .single();

            const newNotification: Notification = {
              id: payload.new.id,
              type: "like",
              title: "Новый лайк",
              description: `${liker?.username || "Пользователь"} оценил: ${contentTitle}`,
              timestamp: new Date(),
              read: false,
            };

            setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    // Subscribe to new achievements
    const achievementsChannel = supabase
      .channel("notifications-achievements")
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
            const newNotification: Notification = {
              id: payload.new.id,
              type: "achievement",
              title: "Новое достижение!",
              description: `${achievement.icon} ${achievement.name} (+${achievement.points} очков)`,
              link: "/profile",
              timestamp: new Date(),
              read: false,
            };

            setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    // Subscribe to new replies to user's posts
    const repliesChannel = supabase
      .channel("notifications-replies")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        async (payload) => {
          // Check if it's a reply in a topic where user participated
          const { data: userTopics } = await supabase
            .from("topics")
            .select("id")
            .eq("user_id", userId);

          const { data: userPosts } = await supabase
            .from("posts")
            .select("topic_id")
            .eq("user_id", userId);

          const userTopicIds = new Set([
            ...(userTopics?.map((t) => t.id) || []),
            ...(userPosts?.map((p) => p.topic_id) || []),
          ]);

          if (
            userTopicIds.has(payload.new.topic_id) &&
            payload.new.user_id !== userId
          ) {
            const { data: replier } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", payload.new.user_id)
              .single();

            const { data: topic } = await supabase
              .from("topics")
              .select("title")
              .eq("id", payload.new.topic_id)
              .single();

            const newNotification: Notification = {
              id: payload.new.id,
              type: "reply",
              title: "Новый ответ",
              description: `${replier?.username || "Пользователь"} ответил в теме: ${topic?.title || ""}`,
              link: `/topic/${payload.new.topic_id}`,
              timestamp: new Date(),
              read: false,
            };

            setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(achievementsChannel);
      supabase.removeChannel(repliesChannel);
    };
  }, [userId]);

  const handleNotificationClick = (notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - (notification.read ? 0 : 1)));
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageCircle className="h-4 w-4" />;
      case "like":
        return <Heart className="h-4 w-4" />;
      case "reply":
        return <Reply className="h-4 w-4" />;
      case "achievement":
        return <Trophy className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Уведомления</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6"
              onClick={markAllAsRead}
            >
              Прочитать все
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground text-sm">
            Нет уведомлений
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex items-start gap-3 p-3 cursor-pointer ${
                !notification.read ? "bg-primary/5" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="mt-0.5">{getIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{notification.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {notification.description}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(notification.timestamp, {
                    addSuffix: true,
                    locale: ru,
                  })}
                </div>
              </div>
              {!notification.read && (
                <div className="h-2 w-2 bg-primary rounded-full mt-1" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;
