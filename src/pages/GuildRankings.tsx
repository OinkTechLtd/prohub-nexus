import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  Crown, 
  Medal,
  Award,
  ArrowUpDown,
  Sparkles,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "members" | "activity" | "created";

const GuildRankings = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>("members");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const { data: guilds, isLoading } = useQuery({
    queryKey: ["guild-rankings", sortBy],
    queryFn: async () => {
      // Fetch guilds with member counts
      const { data: guildsData, error } = await supabase
        .from("guilds")
        .select(`
          *,
          guild_members(count)
        `);

      if (error) throw error;

      // Sort guilds based on selected option
      const sortedGuilds = (guildsData || []).map((guild: any) => ({
        ...guild,
        actualMemberCount: guild.guild_members?.[0]?.count || 0,
      })).sort((a: any, b: any) => {
        switch (sortBy) {
          case "members":
            return b.actualMemberCount - a.actualMemberCount;
          case "activity":
            // Use member count as activity proxy for now
            return b.actualMemberCount - a.actualMemberCount;
          case "created":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return 0;
        }
      });

      return sortedGuilds;
    },
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-amber-500";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-400";
    if (rank === 3) return "bg-gradient-to-r from-amber-500 to-orange-500";
    return "bg-muted";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Рейтинг гильдий</h1>
                <p className="text-muted-foreground">Топ гильдий по активности и участникам</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="members">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      По участникам
                    </div>
                  </SelectItem>
                  <SelectItem value="activity">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      По активности
                    </div>
                  </SelectItem>
                  <SelectItem value="created">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      По дате создания
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => navigate("/guilds")}>
                Все гильдии
              </Button>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : guilds && guilds.length > 0 ? (
          <div className="space-y-4">
            {/* Top 3 Podium */}
            {guilds.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-3 gap-4 mb-8"
              >
                {/* Second Place */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-gray-300/50 mt-8"
                  onClick={() => navigate(`/guild/${guilds[1].id}`)}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-4">
                      <Medal className="h-12 w-12 text-gray-400" />
                    </div>
                    <Avatar className="h-16 w-16 mx-auto mb-3 ring-4 ring-gray-300">
                      <AvatarImage src={guilds[1].logo_url || ""} />
                      <AvatarFallback style={{ backgroundColor: guilds[1].color || "#6366f1" }}>
                        {guilds[1].tag?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold truncate">{guilds[1].name}</h3>
                    <Badge variant="outline" className="mt-2">
                      [{guilds[1].tag}]
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      {guilds[1].actualMemberCount} участников
                    </p>
                  </CardContent>
                </Card>

                {/* First Place */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-yellow-400/50 bg-gradient-to-b from-yellow-50/50 to-transparent dark:from-yellow-900/10"
                  onClick={() => navigate(`/guild/${guilds[0].id}`)}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-4">
                      <Crown className="h-16 w-16 text-yellow-500" />
                    </div>
                    <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-yellow-400">
                      <AvatarImage src={guilds[0].logo_url || ""} />
                      <AvatarFallback style={{ backgroundColor: guilds[0].color || "#6366f1" }}>
                        {guilds[0].tag?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg truncate">{guilds[0].name}</h3>
                    <Badge className="mt-2 bg-yellow-500 text-yellow-950">
                      [{guilds[0].tag}]
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      {guilds[0].actualMemberCount} участников
                    </p>
                    {guilds[0].is_official && (
                      <Badge variant="secondary" className="mt-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Официальная
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Third Place */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-amber-500/50 mt-8"
                  onClick={() => navigate(`/guild/${guilds[2].id}`)}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-4">
                      <Award className="h-12 w-12 text-amber-600" />
                    </div>
                    <Avatar className="h-16 w-16 mx-auto mb-3 ring-4 ring-amber-500">
                      <AvatarImage src={guilds[2].logo_url || ""} />
                      <AvatarFallback style={{ backgroundColor: guilds[2].color || "#6366f1" }}>
                        {guilds[2].tag?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold truncate">{guilds[2].name}</h3>
                    <Badge variant="outline" className="mt-2">
                      [{guilds[2].tag}]
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      {guilds[2].actualMemberCount} участников
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Rest of the rankings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Полный рейтинг
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {guilds.map((guild: any, index: number) => (
                    <motion.div
                      key={guild.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                        index < 3 ? getRankBadge(index + 1) + " text-white" : "bg-muted/50"
                      }`}
                      onClick={() => navigate(`/guild/${guild.id}`)}
                    >
                      <div className="w-10 flex justify-center">
                        {getRankIcon(index + 1)}
                      </div>
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={guild.logo_url || ""} />
                        <AvatarFallback style={{ backgroundColor: index >= 3 ? (guild.color || "#6366f1") : undefined }}>
                          {guild.tag?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{guild.name}</span>
                          <Badge variant={index < 3 ? "secondary" : "outline"} className="shrink-0">
                            [{guild.tag}]
                          </Badge>
                          {guild.is_official && (
                            <Sparkles className="h-4 w-4 text-yellow-500 shrink-0" />
                          )}
                        </div>
                        <p className={`text-sm ${index < 3 ? "text-white/80" : "text-muted-foreground"}`}>
                          {guild.description?.slice(0, 50) || "Без описания"}
                          {guild.description?.length > 50 ? "..." : ""}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="font-bold">{guild.actualMemberCount}</span>
                        </div>
                        <span className={`text-xs ${index < 3 ? "text-white/60" : "text-muted-foreground"}`}>
                          участников
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Нет гильдий</h3>
              <p className="text-muted-foreground mb-4">Будьте первым, кто создаст гильдию!</p>
              <Button onClick={() => navigate("/guilds")}>Создать гильдию</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default GuildRankings;
