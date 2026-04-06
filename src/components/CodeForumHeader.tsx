import { useNavigate, useLocation } from "react-router-dom";
import { Code, Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCodeForumRole } from "@/hooks/useCodeForumRole";
import StyledUsername from "@/components/StyledUsername";

interface CodeForumHeaderProps {
  user: any;
}

const CodeForumHeader = ({ user }: CodeForumHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { canModerate } = useCodeForumRole(user?.id);

  const navItems = [
    { label: "Форум", path: "/codeforum" },
    { label: "Ресурсы", path: "/codeforum/resources" },
    { label: "Участники", path: "/codeforum/members" },
    { label: "Профиль", path: "/codeforum/profile" },
    ...(canModerate ? [{ label: "Модерация", path: "/codeforum/moderator" }] : []),
  ];

  const isActive = (path: string) => {
    if (path === "/codeforum") {
      return location.pathname === "/codeforum" || location.pathname === "/codeforum/forum" || location.pathname.startsWith("/codeforum/category/") || location.pathname.startsWith("/codeforum/topic/") || location.pathname.startsWith("/codeforum/create-topic");
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="border-b border-[#16213e] bg-[#0f0f23]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/codeforum/forum")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600/20 text-emerald-400">
                <Code className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <span className="block text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">Code Forum</span>
                <span className="block text-[10px] text-gray-500 leading-tight">Development Of Forums by ProHub Nexsus Forum</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    isActive(item.path)
                      ? "bg-emerald-600/20 text-emerald-400"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white"
                onClick={() => navigate("/codeforum/profile")}
              >
                <StyledUsername
                  username={user.user_metadata?.username || user.email?.split("@")[0] || "Профиль"}
                  userId={user.id}
                  profilePath="/codeforum/profile"
                  className="max-w-[140px]"
                />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={() => navigate("/auth")}>
                  Вход
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/auth")}>
                  Регистрация
                </Button>
              </>
            )}
            <button className="md:hidden text-gray-300" onClick={() => setMenuOpen(!menuOpen)}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 text-sm rounded ${
                  isActive(item.path) ? "bg-emerald-600/20 text-emerald-400" : "text-gray-300"
                }`}
              >
                {item.label}
              </button>
            ))}
            {canModerate && !navItems.some((item) => item.path === "/codeforum/moderator") && (
              <button
                onClick={() => { navigate("/codeforum/moderator"); setMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm rounded text-gray-300"
              >
                <span className="inline-flex items-center gap-2"><Shield className="h-4 w-4" />Модерация</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default CodeForumHeader;
