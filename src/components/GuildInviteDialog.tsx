import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Send, Loader2 } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";

interface GuildInviteDialogProps {
  guildId: string;
  guildName: string;
  existingMemberIds: string[];
}

interface UserSearchResult {
  id: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
}

export default function GuildInviteDialog({
  guildId,
  guildName,
  existingMemberIds,
}: GuildInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search users
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["user-search", searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, is_verified")
        .ilike("username", `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      return data as UserSearchResult[];
    },
    enabled: searchTerm.length >= 2,
  });

  // Get pending invites for this guild
  const { data: pendingInvites } = useQuery({
    queryKey: ["guild-invites", guildId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guild_invites")
        .select("invitee_id")
        .eq("guild_id", guildId)
        .eq("status", "pending");

      if (error) throw error;
      return data?.map((i) => i.invitee_id) || [];
    },
    enabled: open,
  });

  const sendInvite = async (userId: string) => {
    setSending(userId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      const { error } = await supabase.from("guild_invites").insert({
        guild_id: guildId,
        inviter_id: user.id,
        invitee_id: userId,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Приглашение уже отправлено");
        }
        throw error;
      }

      toast({ title: "Приглашение отправлено!" });
      queryClient.invalidateQueries({ queryKey: ["guild-invites", guildId] });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const filteredResults = searchResults?.filter(
    (user) =>
      !existingMemberIds.includes(user.id) &&
      !pendingInvites?.includes(user.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Пригласить
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Пригласить в {guildName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск пользователя..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!searching && searchTerm.length >= 2 && filteredResults?.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Пользователи не найдены
              </p>
            )}

            {filteredResults?.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{user.username}</span>
                    {user.is_verified && <VerifiedBadge />}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => sendInvite(user.id)}
                  disabled={sending === user.id}
                >
                  {sending === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Пригласить
                    </>
                  )}
                </Button>
              </div>
            ))}

            {pendingInvites && pendingInvites.length > 0 && searchTerm.length < 2 && (
              <div className="text-sm text-muted-foreground text-center py-2">
                Ожидают ответа: {pendingInvites.length} приглашений
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
