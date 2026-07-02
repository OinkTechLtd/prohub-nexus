import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FlexDevHeader from "@/components/FlexDevHeader";
import StyledUsername from "@/components/StyledUsername";
import BBCodeRenderer from "@/components/BBCodeRenderer";
import BBCodeToolbar from "@/components/BBCodeToolbar";
import { LikeButton } from "@/components/LikeButton";
import QuoteButton from "@/components/QuoteButton";
import ShareButton from "@/components/ShareButton";
import ReportDialog from "@/components/ReportDialog";
import UserSignature from "@/components/UserSignature";
import { useToast } from "@/hooks/use-toast";
import { useFlexDevRole } from "@/hooks/useFlexDevRole";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Pin, PinOff, Lock, Unlock, Send, Eye, EyeOff } from "lucide-react";
import BannedUserBadge from "@/components/BannedUserBadge";
import BannedUserInlineBadge from "@/components/BannedUserInlineBadge";
import HiddenContentBanner from "@/components/HiddenContentBanner";
import SeasonalCountdown from "@/components/SeasonalCountdown";

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_hidden: boolean;
  profiles: { username: string; avatar_url: string | null; username_css: string | null };
}

const FlexDevTopicView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();
  const { canModerate } = useFlexDevRole(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadData();
    incrementViews();
    if (!id) return;
    const ch = supabase.channel(`cf-topic-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts", filter: `topic_id=eq.${id}` }, () => loadData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "topics", filter: `id=eq.${id}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const incrementViews = async () => {
    if (!id) return;
    let key = localStorage.getItem("ph_viewer_key");
    if (!key) { key = crypto.randomUUID(); localStorage.setItem("ph_viewer_key", key); }
    await supabase.rpc("increment_topic_views" as any, { _scope: "flexdev", _topic_id: id, _viewer_key: user?.id || key });
  };

  const loadData = async () => {
    try {
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select("*, profiles(username, avatar_url, username_css), categories(name, slug, forum_id)")
        .eq("id", id)
        .single();
      if (topicError) throw topicError;

      // Verify this topic belongs to codeforum
      if (topicData.categories?.forum_id !== "flexdev") {
        navigate(`/topic/${id}`);
        return;
      }

      setTopic(topicData);

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*, profiles(username, avatar_url, username_css)")
        .eq("topic_id", id)
        .order("created_at", { ascending: true });
      if (postsError) throw postsError;
      setPosts(postsData || []);
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleQuote = useCallback((quotedText: string) => {
    setNewPost((prev) => quotedText + prev);
    document.getElementById("cf-reply-form")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleHidePost = async (postId: string, hidden: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("codeforum-moderate", {
        body: {
          action: hidden ? "hide" : "show",
          contentType: "post",
          contentId: postId,
          reason: hidden ? "Скрыто модератором Code Forum" : "Восстановлено модератором Code Forum",
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      loadData();
      toast({ title: hidden ? "Пост скрыт" : "Пост восстановлен" });
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  const handleHideTopic = async (hidden: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("codeforum-moderate", {
        body: {
          action: hidden ? "hide" : "show",
          contentType: "topic",
          contentId: topic.id,
          reason: hidden ? "Тема скрыта модератором Code Forum" : "Тема восстановлена модератором Code Forum",
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      loadData();
      toast({ title: hidden ? "Тема скрыта" : "Тема восстановлена" });
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.trim()) return;

    setPosting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: moderationResult, error: moderationError } = await supabase.functions.invoke(
        "moderate-content",
        {
          body: { content: newPost, type: "post" },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }
      );
      if (moderationError) throw moderationError;
      if (!moderationResult.approved) {
        toast({ title: "Неприемлемый контент", description: moderationResult.reason, variant: "destructive" });
        setPosting(false);
        return;
      }

      const { error } = await supabase.from("posts").insert({
        topic_id: id,
        user_id: user.id,
        content: newPost.trim(),
      });
      if (error) throw error;

      setNewPost("");
      loadData();
      toast({ title: "Ответ отправлен" });
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0118]">
        <FlexDevHeader />
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">Загрузка...</div>
      </div>
    );
  }

  const visiblePosts = canModerate ? posts : posts.filter((p) => !p.is_hidden);

  return (
    <div className="min-h-screen bg-[#0a0118] text-gray-200">
      <FlexDevHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <button
            onClick={() => navigate(`/flexdev/category/${topic?.categories?.slug}`)}
            className="text-sm text-fuchsia-400 hover:text-fuchsia-300"
          >
            ← {topic?.categories?.name}
          </button>
        </div>

        {/* Topic header */}
        <div className="bg-[#120425] border border-[#2a1145] rounded-lg p-4 md:p-6 mb-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {topic?.is_pinned && <Pin className="h-4 w-4 text-fuchsia-400" />}
            {topic?.is_locked && <Lock className="h-4 w-4 text-gray-500" />}
            <h1 className="text-lg md:text-2xl font-bold text-white">{topic?.title}</h1>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4" onClick={(e) => e.stopPropagation()}>
            <StyledUsername
              username={topic?.profiles?.username}
              usernameCss={topic?.profiles?.username_css}
              profilePath={`/flexdev/profile/${encodeURIComponent(topic?.profiles?.username || "")}`}
            />
            <BannedUserInlineBadge userId={topic?.user_id} />
            <span>•</span>
            <span>
              {topic?.created_at &&
                formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: ru })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{topic?.views}</span>
          </div>

          <div className="prose prose-invert prose-sm max-w-none mb-4">
            <BBCodeRenderer content={topic?.content || ""} />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-[#2a1145] flex-wrap">
            <LikeButton contentType="topic" contentId={topic?.id} authorId={topic?.user_id} />
            <ShareButton title={topic?.title || ""} />
            {user && topic?.profiles?.username && (
              <QuoteButton username={topic.profiles.username} content={topic.content} onQuote={handleQuote} />
            )}
            {user && topic?.user_id !== user.id && (
              <ReportDialog contentType="topic" contentId={topic?.id} contentAuthorId={topic?.user_id} />
            )}
            {canModerate && topic?.id && (
              <>
                <button
                  onClick={async () => {
                    const { error } = await supabase.rpc("moderate_topic" as any, { _scope: "flexdev", _topic_id: topic.id, _action: topic.is_pinned ? "unpin" : "pin", _reason: null });
                    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
                    else { toast({ title: topic.is_pinned ? "Откреплена" : "Закреплена" }); loadData(); }
                  }}
                  className="text-xs text-gray-400 hover:text-fuchsia-400 flex items-center gap-1"
                >
                  {topic.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                  {topic.is_pinned ? "Открепить" : "Закрепить"}
                </button>
                <button
                  onClick={async () => {
                    const { error } = await supabase.rpc("moderate_topic" as any, { _scope: "flexdev", _topic_id: topic.id, _action: topic.is_locked ? "unlock" : "lock", _reason: null });
                    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
                    else { toast({ title: topic.is_locked ? "Открыта" : "Закрыта" }); loadData(); }
                  }}
                  className="text-xs text-gray-400 hover:text-fuchsia-400 flex items-center gap-1"
                >
                  {topic.is_locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {topic.is_locked ? "Открыть" : "Закрыть"}
                </button>
                <button
                  onClick={() => handleHideTopic(!topic.is_hidden)}
                  className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1"
                >
                  {topic.is_hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {topic.is_hidden ? "Показать тему" : "Скрыть тему"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-3 mb-6">
          {visiblePosts.map((post) => (
            <div
              key={post.id}
              className={`bg-[#120425] border rounded-lg p-4 ${
                post.is_hidden ? "border-red-800/50 opacity-60" : "border-[#2a1145]"
              }`}
            >
              <BannedUserBadge userId={post.user_id} className="mb-3" />
              <div className="flex items-center gap-2 mb-2 text-sm" onClick={(e) => e.stopPropagation()}>
                <StyledUsername
                  username={post.profiles?.username}
                  usernameCss={post.profiles?.username_css}
                  profilePath={`/flexdev/profile/${encodeURIComponent(post.profiles?.username || "")}`}
                />
                <BannedUserInlineBadge userId={post.user_id} />
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ru })}
                </span>
                {post.is_hidden && <span className="text-xs text-red-400">[скрыт]</span>}
              </div>

              <div className="prose prose-invert prose-sm max-w-none mb-2">
                <BBCodeRenderer content={post.content} />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <LikeButton contentType="post" contentId={post.id} authorId={post.user_id} size="sm" />
                {user && (
                  <QuoteButton username={post.profiles?.username} content={post.content} onQuote={handleQuote} />
                )}
                {user && post.user_id !== user.id && (
                  <ReportDialog contentType="post" contentId={post.id} contentAuthorId={post.user_id} />
                )}
                {canModerate && (
                  <button
                    onClick={() => handleHidePost(post.id, !post.is_hidden)}
                    className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1"
                  >
                    {post.is_hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {post.is_hidden ? "Показать" : "Скрыть"}
                  </button>
                )}
              </div>
              <UserSignature userId={post.user_id} />
            </div>
          ))}
        </div>

        {/* Reply form */}
        {user && !topic?.is_locked && (
          <div id="cf-reply-form" className="bg-[#120425] border border-[#2a1145] rounded-lg p-4">
            <form onSubmit={handlePostSubmit} className="space-y-3">
              <BBCodeToolbar
                onInsert={(before, after) => {
                  const textarea = document.getElementById("cf-reply-textarea") as HTMLTextAreaElement;
                  if (!textarea) return;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const selected = newPost.substring(start, end);
                  setNewPost(
                    newPost.substring(0, start) + before + selected + after + newPost.substring(end)
                  );
                  setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
                  }, 0);
                }}
              />
              <textarea
                id="cf-reply-textarea"
                placeholder="Написать ответ..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={4}
                className="w-full bg-[#1a0b2e] border border-[#2a1145] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 resize-y min-h-[100px]"
                required
              />
              <button
                type="submit"
                disabled={posting}
                className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white text-sm rounded flex items-center gap-2 transition-colors"
              >
                <Send className="h-4 w-4" />
                {posting ? "Отправка..." : "Ответить"}
              </button>
            </form>
          </div>
        )}

        {!user && (
          <div className="bg-[#1a0b2e] border border-[#2a1145] rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-3">Войдите, чтобы оставить комментарий</p>
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm rounded"
            >
              Войти
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default FlexDevTopicView;
