import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, MessageSquare, Package, Video } from "lucide-react";
import { useForumStats } from "@/hooks/useForumStats";

const ForumStats = () => {
  const { stats, loading } = useForumStats();

  if (loading) return null;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4">Статистика форума</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
      </CardContent>
    </Card>
  );
};

export default ForumStats;
