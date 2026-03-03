import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Medal, Award } from "lucide-react";

interface StreakEntry {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  username: string;
  avatar_url: string | null;
}

const milestones = [
  { days: 7, label: "7 дней", bonus: 50, icon: Flame },
  { days: 14, label: "14 дней", bonus: 100, icon: Medal },
  { days: 30, label: "30 дней", bonus: 250, icon: Award },
  { days: 100, label: "100 дней", bonus: 1000, icon: Trophy },
];

const StreakLeaderboard = () => {
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<StreakEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("user_id, current_streak, longest_streak")
        .order("current_streak", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map((s) => s.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        const entries: StreakEntry[] = data
          .map((s) => ({
            ...s,
            username: profileMap.get(s.user_id)?.username || "Пользователь",
            avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
          }))
          .filter((s) => s.current_streak > 0);

        setLeaderboard(entries);
      }
    } catch (error) {
      console.error("Leaderboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500" />
            Таблица серий
          </h1>
          <p className="text-muted-foreground">Кто дольше всех заходит на форум подряд</p>
        </div>

        {/* Milestones info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {milestones.map((m) => (
            <Card key={m.days} className="bg-card/50">
              <CardContent className="py-4 text-center">
                <m.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-bold text-lg">{m.label}</div>
                <div className="text-sm text-muted-foreground">+{m.bonus} очков</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">Загрузка...</div>
        ) : leaderboard.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Flame className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Пока нет активных серий</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Топ-50 по текущей серии</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/profile/${entry.username}`)}
                >
                  <div className="w-8 flex justify-center">{getRankIcon(index)}</div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback>{entry.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{entry.username}</p>
                    <p className="text-xs text-muted-foreground">
                      Рекорд: {entry.longest_streak} дн.
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {entry.current_streak} дн.
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default StreakLeaderboard;
