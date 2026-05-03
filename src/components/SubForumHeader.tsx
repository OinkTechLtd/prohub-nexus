import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Users as UsersIcon, PlusCircle, Rss } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubForumHeaderProps {
  forum: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    primary_color: string;
    accent_color: string;
    bg_color: string;
    card_bg: string;
    logo_url: string | null;
  };
}

const SubForumHeader = ({ forum }: SubForumHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const base = `/f/${forum.slug}`;
  const isActive = (p: string) => location.pathname === p || location.pathname.startsWith(p + "/");

  const rssUrl = `https://fkveoqzztgwdeayaqixv.supabase.co/functions/v1/rss-feed?forum=${encodeURIComponent(forum.slug)}`;

  const navItems = [
    { label: "Форум", path: base, icon: Home },
    { label: "Создать", path: `${base}/new`, icon: PlusCircle },
    { label: "RSS", action: () => { navigator.clipboard.writeText(rssUrl); toast({ title: "RSS-ссылка скопирована", description: rssUrl }); }, icon: Rss },
  ];

  return (
    <header
      className="border-b sticky top-0 z-40 backdrop-blur-sm"
      style={{ background: `${forum.bg_color}f0`, borderColor: forum.card_bg }}
    >
      <div className="container mx-auto px-2 sm:px-4">
        <div className="h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-white/80 hover:text-white shrink-0 px-2">
              <ArrowLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">ProHub</span>
            </Button>
            <div
              className="flex items-center gap-2 cursor-pointer min-w-0"
              onClick={() => navigate(base)}
            >
              {forum.logo_url ? (
                <img src={forum.logo_url} alt="" className="h-7 w-7 rounded shrink-0" />
              ) : (
                <div className="h-7 w-7 rounded flex items-center justify-center text-xs font-bold shrink-0"
                     style={{ background: forum.primary_color }}>
                  {forum.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-bold truncate text-sm sm:text-base" style={{ color: forum.primary_color }}>
                {forum.name}
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((it) => {
              const Icon = it.icon;
              const active = it.path && isActive(it.path);
              return (
                <button
                  key={it.label}
                  onClick={() => it.action ? it.action() : navigate(it.path!)}
                  className="px-2 py-1.5 text-xs sm:text-sm rounded transition-colors text-white/80 hover:text-white whitespace-nowrap flex items-center gap-1"
                  style={active ? { background: `${forum.primary_color}33`, color: forum.primary_color } : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{it.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default SubForumHeader;
