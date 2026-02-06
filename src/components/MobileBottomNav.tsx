import { Link, useLocation } from "react-router-dom";
import { Package, MessageCircle, Plus, User, Home, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface MobileBottomNavProps {
  user: any;
}

const MobileBottomNav = ({ user }: MobileBottomNavProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const { totalUnread } = useUnreadMessages(user?.id);

  useEffect(() => {
    const checkWidth = () => {
      setIsVisible(window.innerWidth < 1024);
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const hiddenPaths = ['/blocked', '/auth', '/videos/swipe', '/chat/'];
  if (!isVisible || hiddenPaths.some(p => location.pathname.startsWith(p))) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/", icon: Home, label: "Форум" },
    { path: "/resources", icon: Package, label: "Ресурсы" },
    { path: "/create-topic", icon: Plus, label: "Создать", isCreate: true },
    { path: "/messages", icon: MessageCircle, label: "Чаты", badge: totalUnread },
    { path: user ? "/profile" : "/auth", icon: User, label: user ? "Профиль" : "Войти" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-lg lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          if (item.isCreate) {
            return (
              <Link
                key={item.path}
                to={user ? item.path : "/auth"}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                  <Icon className="h-7 w-7" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 transition-colors relative",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", active && "text-primary")} />
                {item.badge && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center p-0 text-[9px]"
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
