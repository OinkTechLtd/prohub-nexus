import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pin, Lock, Rss } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import SubForumHeader from "@/components/SubForumHeader";
import StyledUsername from "@/components/StyledUsername";
import BannedUserInlineBadge from "@/components/BannedUserInlineBadge";
import { useToast } from "@/hooks/use-toast";

const SubForumCategoryView = () => {
  const { slug, catSlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forum, setForum] = useState<any>(null);
  const [cat, setCat] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: f } = await supabase.from("sub_forums" as any).select("*").eq("slug", slug).maybeSingle();
      if (!f) { setLoading(false); return; }
      setForum(f);
      const { data: c } = await supabase.from("sub_forum_categories" as any).select("*").eq("sub_forum_id", (f as any).id).eq("slug", catSlug).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCat(c);
      const { data: t } = await supabase.from("sub_forum_topics" as any)
        .select("*, profiles:user_id(username, avatar_url, is_verified, username_css)")
        .eq("category_id", (c as any).id)
        .eq("is_hidden", false)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      setTopics((t as any) || []);
      setLoading(false);
    })();
  }, [slug, catSlug]);

  if (loading) return <div className="p-8 text-center text-white">Загрузка...</div>;
  if (!forum || !cat) return <div className="p-8 text-center text-white">Не найдено</div>;

  const rssUrl = `https://fkveoqzztgwdeayaqixv.supabase.co/functions/v1/rss-feed?forum=${encodeURIComponent(slug!)}&category=${encodeURIComponent(catSlug!)}`;

  return (
    <div className="min-h-screen text-white" style={{ background: forum.bg_color }}>
      <SubForumHeader forum={forum} />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="min-w-0">
            <Link to={`/f/${slug}`} className="text-xs text-white/50 hover:underline">← {forum.name}</Link>
            <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: forum.primary_color }}>{cat.name}</h1>
            {cat.description && <p className="text-sm text-white/60">{cat.description}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="border-white/20 text-white" onClick={() => { navigator.clipboard.writeText(rssUrl); toast({ title: "RSS скопирован" }); }}>
              <Rss className="h-4 w-4 mr-1" />RSS
            </Button>
            <Button size="sm" onClick={() => navigate(`/f/${forum.slug}/new?cat=${cat.slug}`)} style={{ background: forum.primary_color }} className="text-white">
              <Plus className="h-4 w-4 mr-1" />Создать тему
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {topics.length === 0 ? (
            <Card style={{ background: forum.card_bg }} className="border-0">
              <CardContent className="p-6 text-center text-white/60">Тем пока нет. Будьте первым!</CardContent>
            </Card>
          ) : topics.map(t => (
            <Card key={t.id} className="cursor-pointer border-0" style={{ background: forum.card_bg }} onClick={() => navigate(`/f/${forum.slug}/t/${t.id}`)}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {t.is_pinned && <Pin className="h-3.5 w-3.5" style={{ color: forum.accent_color }} />}
                    {t.is_locked && <Lock className="h-3.5 w-3.5 text-white/50" />}
                    <h3 className="font-medium truncate text-sm sm:text-base">{t.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-white/50 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <StyledUsername username={t.profiles?.username || "—"} userId={t.user_id} disableMiniProfile className="text-xs" />
                      <BannedUserInlineBadge userId={t.user_id} />
                    </span>
                    <span>· {formatDistanceToNow(new Date(t.created_at), { locale: ru, addSuffix: true })}</span>
                    <Badge variant="outline" className="border-white/20 text-white/70 text-[10px]">{t.views || 0} просмотров</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SubForumCategoryView;
