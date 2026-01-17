import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Crown, Shield, Star, ChevronDown, UserCog, Users, ArrowUp, ArrowDown, UserMinus } from "lucide-react";
import type { GuildMember } from "@/hooks/useGuilds";

interface GuildRoleManagerProps {
  guildId: string;
  members: GuildMember[];
  currentUserId: string;
  currentUserRole: string;
}

type GuildRole = 'owner' | 'admin' | 'moderator' | 'officer' | 'member';

const ROLE_ORDER: GuildRole[] = ['owner', 'admin', 'moderator', 'officer', 'member'];

const ROLE_INFO: Record<GuildRole, { label: string; icon: JSX.Element; color: string }> = {
  owner: { label: 'Владелец', icon: <Crown className="h-4 w-4" />, color: 'text-yellow-500' },
  admin: { label: 'Администратор', icon: <Shield className="h-4 w-4" />, color: 'text-red-500' },
  moderator: { label: 'Модератор', icon: <Star className="h-4 w-4" />, color: 'text-purple-500' },
  officer: { label: 'Офицер', icon: <Shield className="h-4 w-4" />, color: 'text-blue-500' },
  member: { label: 'Участник', icon: <Users className="h-4 w-4" />, color: 'text-muted-foreground' },
};

export default function GuildRoleManager({ 
  guildId, 
  members, 
  currentUserId, 
  currentUserRole 
}: GuildRoleManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canManageRoles = ['owner', 'admin'].includes(currentUserRole);
  
  const getCurrentRoleIndex = (role: string) => ROLE_ORDER.indexOf(role as GuildRole);
  const currentUserRoleIndex = getCurrentRoleIndex(currentUserRole);

  const canChangeRole = (memberRole: string, memberId: string) => {
    if (memberId === currentUserId) return false; // Can't change own role
    if (memberRole === 'owner') return false; // Can't change owner
    
    const memberRoleIndex = getCurrentRoleIndex(memberRole);
    return memberRoleIndex > currentUserRoleIndex; // Can only manage lower roles
  };

  const getAvailableRoles = (memberRole: string): GuildRole[] => {
    // Can only assign roles lower than current user's role
    return ROLE_ORDER.filter((role, index) => {
      if (role === 'owner') return false; // Never assign owner
      return index > currentUserRoleIndex;
    });
  };

  const handleRoleChange = async (memberId: string, newRole: GuildRole) => {
    setLoading(memberId);
    try {
      const { error } = await supabase
        .from("guild_members")
        .update({ role: newRole })
        .eq("id", memberId)
        .eq("guild_id", guildId);

      if (error) throw error;

      toast({ title: "Роль успешно изменена" });
      queryClient.invalidateQueries({ queryKey: ["guild", guildId] });
    } catch (error: any) {
      toast({
        title: "Ошибка изменения роли",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleKickMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === currentUserId) return;
    
    setLoading(memberId);
    try {
      const { error } = await supabase
        .from("guild_members")
        .delete()
        .eq("id", memberId)
        .eq("guild_id", guildId);

      if (error) throw error;

      toast({ title: "Участник исключён из гильдии" });
      queryClient.invalidateQueries({ queryKey: ["guild", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
    } catch (error: any) {
      toast({
        title: "Ошибка исключения",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    const aIndex = getCurrentRoleIndex(a.role);
    const bIndex = getCurrentRoleIndex(b.role);
    return aIndex - bIndex;
  });

  if (!canManageRoles) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCog className="h-4 w-4 mr-2" />
          Управление ролями
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Управление участниками
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {sortedMembers.map((member) => {
            const roleInfo = ROLE_INFO[member.role as GuildRole] || ROLE_INFO.member;
            const canChange = canChangeRole(member.role, member.user_id);
            const availableRoles = getAvailableRoles(member.role);
            const isLoading = loading === member.id;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.profiles?.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-medium">{member.profiles?.username}</span>
                    <div className="flex items-center gap-1 text-sm">
                      <span className={roleInfo.color}>{roleInfo.icon}</span>
                      <span className="text-muted-foreground">{roleInfo.label}</span>
                    </div>
                  </div>
                </div>

                {canChange && (
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {availableRoles.map((role) => {
                          const info = ROLE_INFO[role];
                          const isCurrentRole = member.role === role;
                          return (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => handleRoleChange(member.id, role)}
                              disabled={isCurrentRole}
                              className="flex items-center gap-2"
                            >
                              <span className={info.color}>{info.icon}</span>
                              {info.label}
                              {isCurrentRole && <Badge variant="secondary" className="ml-2">Текущая</Badge>}
                            </DropdownMenuItem>
                          );
                        })}
                        <DropdownMenuItem
                          onClick={() => handleKickMember(member.id, member.user_id)}
                          className="text-destructive flex items-center gap-2"
                        >
                          <UserMinus className="h-4 w-4" />
                          Исключить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {member.user_id === currentUserId && (
                  <Badge variant="outline">Вы</Badge>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
