import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, MessageSquare, Package, Video, Globe, Bot, Eye, MapPin } from "lucide-react";
import { useForumStats } from "@/hooks/useForumStats";
import { usePresenceTracking, OnlineUser } from "@/hooks/usePresenceTracking";

const ForumStats = () => {
  const { stats, loading } = useForumStats();
  const { counts, onlineUsers } = usePresenceTracking();

  if (loading) return null;

  const getPageName = (path: string) => {
    if (path === "/" || path === "") return "Главная";
    if (path.startsWith("/category")) return "Категория";
    if (path.startsWith("/topic")) return "Тема";
    if (path.startsWith("/resources")) return "Ресурсы";
    if (path.startsWith("/videos")) return "Видео";
    if (path.startsWith("/profile")) return "Профиль";
    if (path.startsWith("/messages")) return "Сообщения";
    if (path.startsWith("/auth")) return "Авторизация";
    return "Просмотр";
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 md:p-6">
        <h3 className="text-base md:text-lg font-bold mb-4">Статистика форума</h3>
        
        {/* Main stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-lg md:text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Пользователей</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-lg md:text-2xl font-bold">{stats.totalTopics}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Тем</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-lg md:text-2xl font-bold">{stats.totalPosts}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Постов</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-lg md:text-2xl font-bold">{stats.totalResources}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Ресурсов</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-lg md:text-2xl font-bold">{stats.totalVideos}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Видео</p>
            </div>
          </div>
        </div>

        {/* Online stats */}
        <div className="border-t pt-4">
          <h4 className="text-xs md:text-sm font-semibold mb-3 text-muted-foreground">Сейчас на форуме</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-lg md:text-xl font-bold">{counts.total}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Всего онлайн</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-lg md:text-xl font-bold">{counts.users}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Пользователей</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-lg md:text-xl font-bold">{counts.guests}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Гостей</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <div>
                <p className="text-lg md:text-xl font-bold">{counts.robots}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Роботов</p>
              </div>
            </div>
          </div>
        </div>

        {/* Online users detail */}
        {onlineUsers.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-xs md:text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Кто где находится
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {onlineUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between text-xs md:text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      user.user_type === 'user' ? 'bg-blue-500' : 
                      user.user_type === 'guest' ? 'bg-yellow-500' : 'bg-purple-500'
                    }`} />
                    <span className="font-medium truncate max-w-[120px] md:max-w-[200px]">
                      {user.username || (user.user_type === 'robot' ? 'Робот' : 'Гость')}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-[10px] md:text-xs">
                    {getPageName(user.current_page || '/')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ForumStats;
