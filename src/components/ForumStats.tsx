import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, MessageSquare, Package, Video, Globe, Bot, Eye } from "lucide-react";
import { useForumStats } from "@/hooks/useForumStats";
import { usePresenceTracking } from "@/hooks/usePresenceTracking";

const ForumStats = () => {
  const { stats, loading } = useForumStats();
  const { counts } = usePresenceTracking();

  if (loading) return null;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4">Статистика форума</h3>
        
        {/* Main stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Пользователей</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalTopics}</p>
              <p className="text-xs text-muted-foreground">Тем</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalPosts}</p>
              <p className="text-xs text-muted-foreground">Постов</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalResources}</p>
              <p className="text-xs text-muted-foreground">Ресурсов</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalVideos}</p>
              <p className="text-xs text-muted-foreground">Видео</p>
            </div>
          </div>
        </div>

        {/* Online stats */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Сейчас на форуме</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xl font-bold">{counts.total}</p>
                <p className="text-xs text-muted-foreground">Всего онлайн</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xl font-bold">{counts.users}</p>
                <p className="text-xs text-muted-foreground">Пользователей</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-xl font-bold">{counts.guests}</p>
                <p className="text-xs text-muted-foreground">Гостей</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xl font-bold">{counts.robots}</p>
                <p className="text-xs text-muted-foreground">Роботов</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForumStats;
