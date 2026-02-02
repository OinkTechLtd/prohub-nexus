import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Check, X, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface GuildInvite {
  id: string;
  guild_id: string;
  inviter_id: string;
  status: string;
  created_at: string;
  guilds: {
    name: string;
    tag: string;
    color: string;
    logo_url: string | null;
  };
  inviter: {
    username: string;
    avatar_url: string | null;
  };
}

export default function GuildInviteNotifications() {
  const [userId, setUserId] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const { data: invites, isLoading } = useQuery({
    queryKey: ["my-guild-invites", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("guild_invites")
        .select(`
          id,
          guild_id,
          inviter_id,
          status,
          created_at,
          guilds:guild_id (name, tag, color, logo_url),
          inviter:inviter_id (username, avatar_url)
        `)
        .eq("invitee_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as GuildInvite[];
    },
    enabled: !!userId,
  });

  const respondToInvite = async (inviteId: string, accept: boolean) => {
    setResponding(inviteId);
    try {
      const invite = invites?.find((i) => i.id === inviteId);
      if (!invite) return;

      if (accept) {
        // Join the guild
        const { error: joinError } = await supabase
          .from("guild_members")
          .insert({
            guild_id: invite.guild_id,
            user_id: userId,
            role: "member",
          });

        if (joinError) throw joinError;
      }

      // Update invite status
      const { error } = await supabase
        .from("guild_invites")
        .update({
          status: accept ? "accepted" : "declined",
          responded_at: new Date().toISOString(),
        })
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: accept ? "Вы вступили в гильдию!" : "Приглашение отклонено",
      });

      queryClient.invalidateQueries({ queryKey: ["my-guild-invites"] });
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      queryClient.invalidateQueries({ queryKey: ["user-guilds"] });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResponding(null);
    }
  };

  if (!userId || (invites?.length === 0 && !isLoading)) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Mail className="h-5 w-5" />
          {invites && invites.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {invites.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold">Приглашения в гильдии</h4>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : invites?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Нет приглашений
            </p>
          ) : (
            invites?.map((invite) => (
              <div key={invite.id} className="p-3 border-b last:border-0">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    {invite.guilds?.logo_url ? (
                      <AvatarImage src={invite.guilds.logo_url} />
                    ) : (
                      <AvatarFallback
                        style={{ backgroundColor: invite.guilds?.color }}
                        className="text-white text-xs"
                      >
                        {invite.guilds?.tag}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {invite.guilds?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      От: {invite.inviter?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(invite.created_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => respondToInvite(invite.id, true)}
                    disabled={responding === invite.id}
                  >
                    {responding === invite.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Принять
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => respondToInvite(invite.id, false)}
                    disabled={responding === invite.id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Отклонить
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
