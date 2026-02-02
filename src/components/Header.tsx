import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Shield, MessageCircle, Search, Settings, Users } from "lucide-react";
import RSSFeed from "./RSSFeed";
import { useUserRole } from "@/hooks/useUserRole";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import GlobalSearch from "./GlobalSearch";
import NotificationCenter from "./NotificationCenter";
import GitHubButton from "./GitHubButton";
import GuildInviteNotifications from "./GuildInviteNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HeaderProps {
  user: any;
  onSearchActivity?: (query: string) => void;
}

const Header = ({ user, onSearchActivity }: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canModerateResources, canModerateTopics, isAdmin } = useUserRole();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Выход выполнен",
      description: "До скорой встречи!",
    });
    navigate("/auth");
  };

  const showModeratorLink = canModerateResources || canModerateTopics;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-3 md:px-4">
          <div className="flex items-center gap-2">
            <MobileNav 
              user={user} 
              showModeratorLink={showModeratorLink}
              onSignOut={handleSignOut}
            />
            
            <Link to="/" className="flex items-center">
              <span className="text-xl md:text-2xl font-bold text-primary">ProHub</span>
              <span className="ml-1 text-[10px] md:text-xs bg-primary/10 text-primary px-1 md:px-1.5 py-0.5 rounded font-medium">
                Beta
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Форум
            </Link>
            <Link to="/resources" className="text-sm font-medium hover:text-primary transition-colors">
              Ресурсы
            </Link>
            <Link to="/videos" className="text-sm font-medium hover:text-primary transition-colors">
              Видео
            </Link>
            <Link to="/guilds" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Users className="h-4 w-4" />
              Гильдии
            </Link>
            {showModeratorLink && (
              <Link to="/moderator/resources" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Модерация
              </Link>
            )}
            {user && (
              <Link to="/apply-moderator" className="text-sm font-medium hover:text-primary transition-colors">
                Стать модератором
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Админ
              </Link>
            )}
            <RSSFeed />
            <GitHubButton />
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="h-9 w-9"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            <ThemeToggle />
            
            {user ? (
              <>
                <GuildInviteNotifications />
                <NotificationCenter userId={user.id} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/messages")}
                  className="hidden md:flex h-9 w-9"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Профиль
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/messages")} className="md:hidden">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Сообщения
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Settings className="mr-2 h-4 w-4" />
                        Админ-панель
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate("/auth")}>
                Войти
              </Button>
            )}
          </div>
        </div>
      </header>

      <GlobalSearch 
        open={searchOpen} 
        onOpenChange={setSearchOpen} 
        onSearchActivity={onSearchActivity}
      />
    </>
  );
};

export default Header;
