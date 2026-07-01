import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, LogIn, Users, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const FlexDevHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-fuchsia-500/20 bg-[#0a0118]/85 backdrop-blur-xl">
      <div
        className="absolute inset-x-0 -bottom-px h-px"
        style={{ background: "linear-gradient(90deg, transparent, #d946ef 20%, #22d3ee 50%, #ec4899 80%, transparent)" }}
      />
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/flexdev/forum" className="flex items-center gap-2 group">
          <Sparkles className="h-5 w-5 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)] group-hover:animate-pulse" />
          <span className="text-lg font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-300 to-cyan-400">
            FlexDev
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-fuchsia-500/10" onClick={() => navigate("/flexdev/forum")}>
            <Home className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Форум</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-cyan-500/10" onClick={() => navigate("/members")}>
            <Users className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Участники</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-fuchsia-500/10" onClick={() => navigate("/forum")}>
            ProHub
          </Button>
          {!user ? (
            <Button
              size="sm"
              className="bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white shadow-[0_0_16px_rgba(217,70,239,0.4)]"
              onClick={() => navigate("/auth")}
            >
              <LogIn className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Вход</span>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="border-fuchsia-500/40 text-fuchsia-200 hover:bg-fuchsia-500/10" onClick={() => navigate("/profile")}>
              Профиль
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default FlexDevHeader;
