import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pin, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import SubForumHeader from "@/components/SubForumHeader";
import StyledUsername from "@/components/StyledUsername";
import AvatarWithBorder from "@/components/AvatarWithBorder";
import BannedUserBadge from "@/components/BannedUserBadge";
import BBCodeRenderer from "@/components/BBCodeRenderer";
import { useToast } from "@/hooks/use-toast";

const SubForumTopicView = () => {
  const { slug, topicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forum, setForum] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: f } = await supabase.from("sub_forums" as any).select("*").eq("slug", slug).maybeSingle();
    if (!f) { setLoading(false); return; }
    setForum(f);
    const { data: t } = await supabase.from("sub_forum_topics" as any)
      .select("*, profiles:user_id(username, avatar_url, is_verified, username_css)")
      .eq("id", topicId).maybeSingle();
    if (!t) { setLoading(false); return; }
    setTopic(t);
    await supabase.from("sub_forum_topics" as any).update({ views: ((t as any).views || 0) + 1 } as any).eq("id", topicId);
    const { data: p } = await supabase.from("sub_forum_posts" as any)
      .select("*, profiles:user_id(username, avatar_url, is_verified, username_css)")
      .eq("topic_id", topicId).eq("is_hidden", false).order("created_at");
    setPosts((p as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    load();

    const ch = supabase.channel(`sft-${topicId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sub_forum_posts", filter: `topic_id=eq.${topicId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [slug, topicId]);

  const submitReply = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!reply.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("sub_forum_posts" as any).insert({
      topic_id: topicId, user_id: user.id, content: reply.trim(),
    });
    setPosting(false);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    setReply("");
    load();
  };

  if (loading) return <div className="p-8 text-center text-white">Загрузка...</div>;
  if (!forum || !topic) return <div className="p-8 text-center text-white">Тема не найдена</div>;

  return (
    <div className="min-h-screen text-white" style={{ background: forum.bg_color }}>
      <SubForumHeader forum={forum} />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl">
        <Link to={`/f/${slug}`} className="text-xs text-white/50 hover:underline">← {forum.name}</Link>
        <div className="flex items-center gap-2 mb-3 mt-1 flex-wrap">
          {topic.is_pinned && <Pin className="h-4 w-4" style={{ color: forum.accent_color }} />}
          {topic.is_locked && <Lock className="h-4 w-4 text-white/50" />}
          <h1 className="text-xl sm:text-2xl font-bold break-words" style={{ color: forum.primary_color }}>{topic.title}</h1>
        </div>

        <Card style={{ background: forum.card_bg }} className="border-0 mb-3">
          <CardContent className="p-3 sm:p-4">
            <BannedUserBadge userId={topic.user_id} className="mb-2" />
            <div className="flex items-start gap-3">
              <AvatarWithBorder src={topic.profiles?.avatar_url} fallback={topic.profiles?.username?.[0]?.toUpperCase() || "?"} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 text-xs text-white/60">
                  <StyledUsername username={topic.profiles?.username || "—"} userId={topic.user_id} className="text-sm" />
                  <span>· {formatDistanceToNow(new Date(topic.created_at), { locale: ru, addSuffix: true })}</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none break-words">
                  <BBCodeRenderer content={topic.content} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {posts.map(p => (
            <Card key={p.id} style={{ background: forum.card_bg }} className="border-0">
              <CardContent className="p-3 sm:p-4">
                <BannedUserBadge userId={p.user_id} className="mb-2" />
                <div className="flex items-start gap-3">
                  <AvatarWithBorder src={p.profiles?.avatar_url} fallback={p.profiles?.username?.[0]?.toUpperCase() || "?"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 text-xs text-white/60">
                      <StyledUsername username={p.profiles?.username || "—"} userId={p.user_id} className="text-sm" />
                      <span>· {formatDistanceToNow(new Date(p.created_at), { locale: ru, addSuffix: true })}</span>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none break-words">
                      <BBCodeRenderer content={p.content} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!topic.is_locked && (
          <Card style={{ background: forum.card_bg }} className="border-0 mt-4">
            <CardContent className="p-3 sm:p-4 space-y-2">
              <h3 className="text-sm font-semibold" style={{ color: forum.primary_color }}>Ответить</h3>
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} className="bg-white/5 border-white/10 text-white" placeholder="Поддерживается BBCode..." />
              <div className="flex justify-end">
                <Button size="sm" onClick={submitReply} disabled={posting || !reply.trim()} style={{ background: forum.primary_color }} className="text-white">
                  {posting ? "Отправка..." : "Отправить"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SubForumTopicView;
