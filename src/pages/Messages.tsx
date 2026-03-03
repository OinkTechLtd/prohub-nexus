import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Chat {
  id: string;
  updated_at: string;
  last_message?: {
    content: string;
    created_at: string;
  };
  other_user?: {
    username: string;
    avatar_url: string;
  };
  unread_count: number;
}

const Messages = () => {
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  const loadChats = async () => {
    try {
      // Get user's chat IDs via RPC (uses SECURITY DEFINER)
      const { data: chatIds, error: chatIdsError } = await supabase.rpc(
        "get_user_chat_ids",
        { _user_id: user.id }
      );

      if (chatIdsError) throw chatIdsError;

      if (!chatIds || chatIds.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      // Load chats
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select("id, updated_at")
        .in("id", chatIds)
        .order("updated_at", { ascending: false });

      if (chatsError) throw chatsError;

      if (!chatsData || chatsData.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      // Load all participants for these chats at once
      const { data: allParticipants } = await supabase
        .from("chat_participants")
        .select("chat_id, user_id, last_read_at")
        .in("chat_id", chatIds);

      // Get other user IDs
      const otherUserIds = new Set<string>();
      const chatOtherUserMap = new Map<string, string>();
      const chatLastReadMap = new Map<string, string>();

      (allParticipants || []).forEach((p) => {
        if (p.user_id !== user.id) {
          otherUserIds.add(p.user_id);
          chatOtherUserMap.set(p.chat_id, p.user_id);
        } else {
          chatLastReadMap.set(p.chat_id, p.last_read_at || "1970-01-01");
        }
      });

      // Load profiles in batch
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", Array.from(otherUserIds));

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      // Load last messages for all chats in one query using distinct
      const lastMessages = new Map<string, { content: string; created_at: string }>();
      for (const chatId of chatIds) {
        const { data: msg } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (msg) lastMessages.set(chatId, msg);
      }

      // Count unread messages per chat
      const chatsWithDetails: Chat[] = await Promise.all(
        chatsData.map(async (chat) => {
          const lastRead = chatLastReadMap.get(chat.id) || "1970-01-01";
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("chat_id", chat.id)
            .neq("user_id", user.id)
            .gt("created_at", lastRead);

          const otherUserId = chatOtherUserMap.get(chat.id);
          const otherProfile = otherUserId ? profileMap.get(otherUserId) : null;

          return {
            id: chat.id,
            updated_at: chat.updated_at,
            last_message: lastMessages.get(chat.id),
            other_user: otherProfile
              ? { username: otherProfile.username, avatar_url: otherProfile.avatar_url || "" }
              : undefined,
            unread_count: count || 0,
          };
        })
      );

      setChats(chatsWithDetails);
    } catch (error: any) {
      console.error("Chat load error:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Сообщения</h1>
          <p className="text-muted-foreground">Ваши чаты с другими пользователями</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">У вас пока нет сообщений</p>
              <p className="text-sm text-muted-foreground">
                Начните общение, перейдя в профиль пользователя
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <Card
                key={chat.id}
                className="hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/chat/${chat.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.other_user?.avatar_url || undefined} />
                      <AvatarFallback>
                        {chat.other_user?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {chat.other_user?.username || "Пользователь"}
                        </h3>
                        <div className="flex items-center gap-2">
                          {chat.unread_count > 0 && (
                            <Badge variant="default">{chat.unread_count}</Badge>
                          )}
                          {chat.last_message && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(chat.last_message.created_at), {
                                addSuffix: true,
                                locale: ru,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      {chat.last_message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;
