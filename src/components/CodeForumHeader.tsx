import { useNavigate, useLocation } from "react-router-dom";
import { Code, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CodeForumHeaderProps {
  user: any;
}

const CodeForumHeader = ({ user }: CodeForumHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "Форум", path: "/codeforum/forum" },
    { label: "Что нового?", path: "/codeforum/new" },
    { label: "Участники", path: "/codeforum/members" },
    { label: "ProHub", path: "/forum" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-[#16213e] bg-[#0f0f23]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/codeforum")}>
              <Code className="h-6 w-6 text-emerald-400" />
              <span className="text-lg font-bold text-white">CF</span>
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
                onClick={() => navigate("/profile")}
              >
                {user.user_metadata?.username || user.email?.split("@")[0]}
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
          </div>
        )}
      </div>
    </header>
  );
};

export default CodeForumHeader;
