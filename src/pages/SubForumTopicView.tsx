import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pin, PinOff, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import SubForumHeader from "@/components/SubForumHeader";
import StyledUsername from "@/components/StyledUsername";
import AvatarWithBorder from "@/components/AvatarWithBorder";
import BannedUserBadge from "@/components/BannedUserBadge";
import BannedUserInlineBadge from "@/components/BannedUserInlineBadge";
import HiddenContentBanner from "@/components/HiddenContentBanner";
import ModerationActionDialog from "@/components/ModerationActionDialog";
import BBCodeRenderer from "@/components/BBCodeRenderer";
import SeasonalCountdown from "@/components/SeasonalCountdown";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

const viewerKey = () => {
  let k = localStorage.getItem("ph_viewer_key");
  if (!k) { k = crypto.randomUUID(); localStorage.setItem("ph_viewer_key", k); }
  return k;
};

const SubForumTopicView = () => {
  const { slug, topicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isModerator } = useUserRole();
  const canModerate = isAdmin || isModerator;
  const [forum, setForum] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [author, setAuthor] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hideDialog, setHideDialog] = useState<{ kind: "topic" | "post"; id: string } | null>(null);

  const loadTopic = async () => {
    const { data: t } = await supabase
      .from("sub_forum_topics" as any)
      .select("*")
      .eq("id", topicId)
      .maybeSingle();
    if (!t) return null;
    setTopic(t);
    const { data: a } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, is_verified, username_css")
      .eq("id", (t as any).user_id)
      .maybeSingle();
    setAuthor(a);
    return t;
  };

  const loadPosts = async () => {
    const { data: p } = await supabase
      .from("sub_forum_posts" as any)
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at");
    const list = (p as any) || [];
    if (list.length) {
      const ids: string[] = Array.from(new Set(list.map((x: any) => x.user_id as string)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, is_verified, username_css")
        .in("id", ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((pr: any) => { map[pr.id] = pr; });
      list.forEach((x: any) => { x.profile = map[x.user_id]; });
    }
    setPosts(list);
  };

  const init = async () => {
    setLoading(true);
    const { data: f } = await supabase
      .from("sub_forums" as any)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (!f) { setLoading(false); return; }
    setForum(f);
    const t = await loadTopic();
    if (!t) { setLoading(false); return; }
    await loadPosts();
    setLoading(false);
    if (topicId) {
      supabase.rpc("increment_topic_views" as any, {
        _scope: "subforum", _topic_id: topicId, _viewer_key: user?.id || viewerKey(),
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  useEffect(() => {
    init();
    const ch = supabase.channel(`sft-${topicId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sub_forum_posts", filter: `topic_id=eq.${topicId}` }, () => loadPosts())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sub_forum_topics", filter: `id=eq.${topicId}` }, () => loadTopic())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  };

  const callMod = async (action: string, reason?: string, postId?: string) => {
    if (postId) {
      const { error } = await supabase.rpc("moderate_post" as any, { _scope: "subforum", _post_id: postId, _action: action, _reason: reason || null });
      if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.rpc("moderate_topic" as any, { _scope: "subforum", _topic_id: topicId, _action: action, _reason: reason || null });
      if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: "Готово" });
  };

  if (loading) return <div className="p-8 text-center text-white">Загрузка...</div>;
  if (!forum || !topic) return <div className="p-8 text-center text-white">Тема не найдена</div>;

  return (
    <div className="min-h-screen text-white" style={{ background: forum.bg_color }}>
      <SubForumHeader forum={forum} />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl">
        <SeasonalCountdown />
        <Link to={`/f/${slug}`} className="text-xs text-white/50 hover:underline">← {forum.name}</Link>
        <div className="flex items-center gap-2 mb-2 mt-1 flex-wrap">
          {topic.is_pinned && <Pin className="h-4 w-4" style={{ color: forum.accent_color }} />}
          {topic.is_locked && <Lock className="h-4 w-4 text-white/50" />}
          {topic.is_hidden && <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/60 text-red-200">скрыта</span>}
          <h1 className="text-xl sm:text-2xl font-bold break-words" style={{ color: forum.primary_color }}>{topic.title}</h1>
        </div>

        {topic.is_hidden && <HiddenContentBanner reason={topic.hidden_reason} className="mb-3" />}

        {canModerate && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Button size="sm" variant="outline" className="h-7 text-xs border-white/20 text-white" onClick={() => callMod(topic.is_pinned ? "unpin" : "pin")}>
              {topic.is_pinned ? <PinOff className="h-3 w-3 mr-1" /> : <Pin className="h-3 w-3 mr-1" />}
              {topic.is_pinned ? "Открепить" : "Закрепить"}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs border-white/20 text-white" onClick={() => callMod(topic.is_locked ? "unlock" : "lock")}>
              {topic.is_locked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
              {topic.is_locked ? "Открыть" : "Закрыть"}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs border-white/20 text-white"
              onClick={() => topic.is_hidden ? callMod("show") : setHideDialog({ kind: "topic", id: topic.id })}>
              {topic.is_hidden ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
              {topic.is_hidden ? "Показать" : "Скрыть"}
            </Button>
          </div>
        )}

        <Card style={{ background: forum.card_bg }} className="border-0 mb-3">
          <CardContent className="p-3 sm:p-4">
            <BannedUserBadge userId={topic.user_id} className="mb-2" />
            <div className="flex items-start gap-3">
              <AvatarWithBorder src={author?.avatar_url} fallback={author?.username?.[0]?.toUpperCase() || "?"} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 text-xs text-white/60 flex-wrap">
                  <StyledUsername username={author?.username || "—"} userId={topic.user_id} flairOverride={{}} className="text-sm" />
                  <BannedUserInlineBadge userId={topic.user_id} />
                  <span>· {formatDistanceToNow(new Date(topic.created_at), { locale: ru, addSuffix: true })}</span>
                  <span>· {topic.views || 0} просмотров</span>
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
                {p.is_hidden ? (
                  <HiddenContentBanner reason={p.hidden_reason} />
                ) : (
                  <>
                    <BannedUserBadge userId={p.user_id} className="mb-2" />
                    <div className="flex items-start gap-3">
                      <AvatarWithBorder src={p.profile?.avatar_url} fallback={p.profile?.username?.[0]?.toUpperCase() || "?"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 text-xs text-white/60 flex-wrap">
                          <StyledUsername username={p.profile?.username || "—"} userId={p.user_id} flairOverride={{}} className="text-sm" />
                          <BannedUserInlineBadge userId={p.user_id} />
                          <span>· {formatDistanceToNow(new Date(p.created_at), { locale: ru, addSuffix: true })}</span>
                          {canModerate && (
                            <button
                              onClick={() => setHideDialog({ kind: "post", id: p.id })}
                              className="text-[11px] text-red-400 hover:text-red-300 ml-1"
                            >Скрыть</button>
                          )}
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none break-words">
                          <BBCodeRenderer content={p.content} />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {canModerate && p.is_hidden && (
                  <Button size="sm" variant="outline" className="h-7 text-xs mt-2 border-white/20 text-white" onClick={() => callMod("show", undefined, p.id)}>Показать</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {!topic.is_locked && user && (
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

      <ModerationActionDialog
        open={!!hideDialog}
        onOpenChange={(o) => !o && setHideDialog(null)}
        title={hideDialog?.kind === "post" ? "Скрыть сообщение" : "Скрыть тему"}
        requireReason
        onConfirm={async (reason) => {
          if (!hideDialog) return;
          if (hideDialog.kind === "topic") await callMod("hide", reason);
          else await callMod("hide", reason, hideDialog.id);
        }}
      />
    </div>
  );
};

export default SubForumTopicView;
