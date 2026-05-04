import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FolderOpen, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import SubForumHeader from "@/components/SubForumHeader";
import SubForumSearch from "@/components/SubForumSearch";

interface SubForum {
  id: string; slug: string; name: string; description: string | null;
  primary_color: string; accent_color: string; bg_color: string; card_bg: string;
  logo_url: string | null;
}
interface Cat { id: string; slug: string; name: string; description: string | null; }
interface Topic { id: string; title: string; created_at: string; category_id: string; user_id: string; }

const SubForumPanel = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [forum, setForum] = useState<SubForum | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [counts, setCounts] = useState<Record<string, { topics: number; latest?: Topic }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: f } = await supabase.from("sub_forums" as any).select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (f) {
        setForum(f as any);
        const { data: c } = await supabase.from("sub_forum_categories" as any).select("*").eq("sub_forum_id", (f as any).id).order("order_position");
        const cats = (c as any) || [];
        setCats(cats);

        // counts per category
        const map: Record<string, { topics: number; latest?: Topic }> = {};
        await Promise.all(cats.map(async (cat: Cat) => {
          const { count } = await supabase.from("sub_forum_topics" as any).select("id", { count: "exact", head: true }).eq("category_id", cat.id);
          const { data: latest } = await supabase.from("sub_forum_topics" as any).select("id,title,created_at,category_id,user_id").eq("category_id", cat.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
          map[cat.id] = { topics: count || 0, latest: (latest as any) || undefined };
        }));
        setCounts(map);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="p-8 text-center text-white">Загрузка...</div>;
  if (!forum) return <div className="p-8 text-center text-white">Подфорум не найден</div>;

  return (
    <div className="min-h-screen text-white" style={{ background: forum.bg_color }}>
      <SubForumHeader forum={forum} />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-5xl">
        {forum.description && (
          <div className="mb-4 p-3 sm:p-4 rounded-lg" style={{ background: forum.card_bg }}>
            <p className="text-sm text-white/80">{forum.description}</p>
          </div>
        )}
        <SubForumSearch forum={forum} categories={cats} />
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: forum.primary_color }}>
            <FolderOpen className="h-5 w-5" />Разделы
          </h2>
          <Button size="sm" onClick={() => navigate(`/f/${forum.slug}/new`)} style={{ background: forum.primary_color }} className="text-white">
            <Plus className="h-4 w-4 mr-1" />Создать тему
          </Button>
        </div>
        <div className="grid gap-2 sm:gap-3">
          {cats.length === 0 ? (
            <p className="text-white/60 text-center py-8">Разделов пока нет — создайте их в админ-панели.</p>
          ) : cats.map(c => {
            const stat = counts[c.id] || { topics: 0 };
            return (
              <Card
                key={c.id}
                className="cursor-pointer transition-transform hover:scale-[1.005] border-0"
                style={{ background: forum.card_bg }}
                onClick={() => navigate(`/f/${forum.slug}/c/${c.slug}`)}
              >
                <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base sm:text-lg truncate" style={{ color: forum.primary_color }}>{c.name}</h3>
                    {c.description && <p className="text-xs sm:text-sm text-white/60 mt-1 line-clamp-2">{c.description}</p>}
                    {stat.latest && (
                      <p className="text-[11px] text-white/40 mt-2 truncate">
                        Последняя: <Link to={`/f/${forum.slug}/t/${stat.latest.id}`} className="hover:underline" style={{ color: forum.accent_color }}>{stat.latest.title}</Link> · {formatDistanceToNow(new Date(stat.latest.created_at), { locale: ru, addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0 border-white/20 text-white/80">
                    <MessageSquare className="h-3 w-3 mr-1" />{stat.topics}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default SubForumPanel;
