import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGuilds } from "@/hooks/useGuilds";
import { Users, Crown, Shield, Star, Calendar, ArrowLeft, LogOut, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const GuildView = () => {
  const { id } = useParams<{ id: string }>();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const { useGuild, joinGuild, leaveGuild } = useGuilds();
  const { data: guild, isLoading } = useGuild(id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
  }, []);

  const isMember = guild?.members?.some((m) => m.user_id === currentUser?.id);
  const memberData = guild?.members?.find((m) => m.user_id === currentUser?.id);
  const isOwner = memberData?.role === 'owner';

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'moderator':
        return <Star className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Владелец',
      admin: 'Администратор',
      moderator: 'Модератор',
      member: 'Участник',
    };
    return labels[role] || role;
  };

  const sortedMembers = guild?.members?.sort((a, b) => {
    const order: Record<string, number> = { owner: 4, admin: 3, moderator: 2, member: 1 };
    return (order[b.role] || 0) - (order[a.role] || 0);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={currentUser} />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Загрузка гильдии...
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={currentUser} />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Гильдия не найдена
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={currentUser} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/guilds")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          К списку гильдий
        </Button>

        {/* Guild Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            {/* Banner */}
            <div 
              className="h-32 relative"
              style={{ 
                background: guild.banner_url 
                  ? `url(${guild.banner_url}) center/cover`
                  : `linear-gradient(135deg, ${guild.color}, ${guild.color}80)` 
              }}
            >
              {guild.is_official && (
                <Badge className="absolute top-4 right-4 bg-yellow-500 text-black">
                  <Crown className="h-3 w-3 mr-1" />
                  Официальная гильдия
                </Badge>
              )}
            </div>

            <CardContent className="pt-0 -mt-12">
              <div className="flex flex-col md:flex-row items-start gap-4">
                {/* Logo */}
                <Avatar className="h-24 w-24 border-4 border-background">
                  {guild.logo_url ? (
                    <AvatarImage src={guild.logo_url} alt={guild.name} />
                  ) : (
                    <AvatarFallback 
                      className="text-2xl font-bold text-white"
                      style={{ backgroundColor: guild.color }}
                    >
                      {guild.tag}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Info */}
                <div className="flex-1 pt-4">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{guild.name}</h1>
                    <Badge 
                      variant="outline"
                      style={{ borderColor: guild.color, color: guild.color }}
                    >
                      [{guild.tag}]
                    </Badge>
                  </div>

                  {guild.description && (
                    <p className="text-muted-foreground mb-4">{guild.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {guild.member_count} участников
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Создана {formatDistanceToNow(new Date(guild.created_at), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {currentUser && (
                  <div className="pt-4">
                    {isMember ? (
                      !isOwner && (
                        <Button 
                          variant="outline"
                          onClick={() => leaveGuild.mutate(guild.id)}
                          disabled={leaveGuild.isPending}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Покинуть
                        </Button>
                      )
                    ) : (
                      <Button 
                        onClick={() => joinGuild.mutate(guild.id)}
                        disabled={joinGuild.isPending}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Вступить
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Участники ({guild.member_count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedMembers?.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/profile/${member.profiles?.username}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {member.profiles?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.profiles?.username}</span>
                          {getRoleIcon(member.role)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(member.joined_at), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default GuildView;
