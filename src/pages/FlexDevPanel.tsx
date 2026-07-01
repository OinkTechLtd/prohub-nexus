import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FlexDevHeader from "@/components/FlexDevHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Package, TrendingUp, Users, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import usePageBackground from "@/hooks/usePageBackground";

interface LatestTopic { id: string; title: string; created_at: string }
interface LatestResource { id: string; title: string; created_at: string }

const FlexDevPanel = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<LatestTopic[]>([]);
  const [resources, setResources] = useState<LatestResource[]>([]);
  const [stats, setStats] = useState({ users: 0, topics: 0, resources: 0 });
  usePageBackground("#0a0118");

  useEffect(() => {
    (async () => {
      const [tRes, rRes, uCnt, tCnt, rCnt] = await Promise.all([
        supabase.from("topics").select("id,title,created_at").eq("is_hidden", false).order("created_at", { ascending: false }).limit(6),
        supabase.from("resources").select("id,title,created_at").eq("is_hidden", false).order("created_at", { ascending: false }).limit(6),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("topics").select("*", { count: "exact", head: true }).eq("is_hidden", false),
        supabase.from("resources").select("*", { count: "exact", head: true }).eq("is_hidden", false),
      ]);
      setTopics(tRes.data ?? []);
      setResources(rRes.data ?? []);
      setStats({ users: uCnt.count ?? 0, topics: tCnt.count ?? 0, resources: rCnt.count ?? 0 });
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0118] text-slate-100 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="absolute top-40 -right-40 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[120px]" />
      </div>

      <FlexDevHeader />

      <div className="relative container mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Users, n: stats.users, l: "Участников", grad: "from-fuchsia-500 to-pink-500" },
            { icon: MessageSquare, n: stats.topics, l: "Тем", grad: "from-cyan-500 to-blue-500" },
            { icon: Package, n: stats.resources, l: "Ресурсов", grad: "from-purple-500 to-fuchsia-500" },
          ].map((s) => (
            <Card key={s.l} className="bg-white/5 border-white/10 backdrop-blur-md p-4">
              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white bg-gradient-to-r ${s.grad}`}>
                <s.icon className="h-3 w-3" /> {s.l}
              </div>
              <div className="mt-2 text-2xl font-bold text-white">{s.n}</div>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-white/5 border-fuchsia-500/20 backdrop-blur-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 font-bold text-white">
                <TrendingUp className="h-4 w-4 text-fuchsia-300" /> Свежие темы
              </h2>
              <Button size="sm" variant="ghost" className="text-fuchsia-300 hover:text-white hover:bg-fuchsia-500/10" onClick={() => navigate("/forum")}>
                Все <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-2">
              {topics.length === 0 && <p className="text-sm text-slate-500">Пока пусто.</p>}
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/topic/${t.id}`)}
                  className="w-full text-left rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 hover:border-fuchsia-500/30 hover:bg-fuchsia-500/5 transition"
                >
                  <div className="text-sm text-slate-100 line-clamp-1">{t.title}</div>
                  <div className="text-[11px] text-slate-500">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: ru })}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="bg-white/5 border-cyan-500/20 backdrop-blur-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 font-bold text-white">
                <Package className="h-4 w-4 text-cyan-300" /> Свежие ресурсы
              </h2>
              <Button size="sm" variant="ghost" className="text-cyan-300 hover:text-white hover:bg-cyan-500/10" onClick={() => navigate("/resources")}>
                Все <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-2">
              {resources.length === 0 && <p className="text-sm text-slate-500">Пока пусто.</p>}
              {resources.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/resource/${r.id}`)}
                  className="w-full text-left rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition"
                >
                  <div className="text-sm text-slate-100 line-clamp-1">{r.title}</div>
                  <div className="text-[11px] text-slate-500">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ru })}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlexDevPanel;
