import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Eye, EyeOff, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CodeForumHeader from "@/components/CodeForumHeader";
import StyledUsername from "@/components/StyledUsername";
import { useToast } from "@/hooks/use-toast";
import { useCodeForumRole } from "@/hooks/useCodeForumRole";

const CodeForumModeratorPanel = () => {
  const [user, setUser] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { canModerate, loading: roleLoading } = useCodeForumRole(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!roleLoading) {
      if (canModerate) {
        loadData();
      } else {
        setLoading(false);
      }
    }
  }, [roleLoading, canModerate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: categories } = await supabase.from("categories").select("id").eq("forum_id", "codeforum");
      const categoryIds = (categories || []).map((item) => item.id);

      if (categoryIds.length === 0) {
        setTopics([]);
        setPosts([]);
        return;
      }

      const { data: topicsData } = await supabase
        .from("topics")
        .select("id, title, created_at, is_hidden, user_id, profiles(username, username_css)")
        .in("category_id", categoryIds)
        .order("created_at", { ascending: false })
        .limit(40);

      const topicIds = (topicsData || []).map((item) => item.id);

      const { data: postsData } = topicIds.length > 0
        ? await supabase
            .from("posts")
            .select("id, topic_id, content, created_at, is_hidden, user_id, profiles(username, username_css)")
            .in("topic_id", topicIds)
            .order("created_at", { ascending: false })
            .limit(60)
        : { data: [] as any[] };

      const topicTitleById = new Map((topicsData || []).map((item) => [item.id, item.title]));

      setTopics(topicsData || []);
      setPosts(((postsData as any[]) || []).map((post) => ({ ...post, topicTitle: topicTitleById.get(post.topic_id) || "Тема" })));
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleContent = async (contentType: "topic" | "post", contentId: string, hidden: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("codeforum-moderate", {
        body: {
          action: hidden ? "hide" : "show",
          contentType,
          contentId,
          reason: hidden ? "Скрыто модератором Code Forum" : "Восстановлено модератором Code Forum",
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: hidden ? "Контент скрыт" : "Контент восстановлен" });
      loadData();
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <CodeForumHeader user={user} />

      <main className="container mx-auto px-4 py-4 md:py-6 space-y-4">
        <div className="rounded-xl border border-[#1a1a3e] bg-[#0f0f23] p-4 md:p-6">
          <h1 className="flex items-center gap-2 text-xl font-bold text-white md:text-2xl">
            <Shield className="h-5 w-5 text-emerald-400" />
            Панель модерации Code Forum
          </h1>
          <p className="mt-2 text-sm text-gray-400">Здесь можно быстро скрывать и возвращать темы и сообщения внутри Code Forum.</p>
        </div>

        {!loading && !canModerate && (
          <div className="rounded-xl border border-[#1a1a3e] bg-[#0f0f23] p-6 text-sm text-gray-400">
            Доступ только для редакторов и модераторов Code Forum.
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-[#1a1a3e] bg-[#0f0f23] p-6 text-center text-gray-400">Загрузка модерации...</div>
        ) : canModerate ? (
          <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
            <section className="rounded-xl border border-[#1a1a3e] bg-[#0f0f23] p-4 md:p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">Темы</h2>
              <div className="space-y-3">
                {topics.length === 0 ? (
                  <p className="text-sm text-gray-500">Пока нет тем.</p>
                ) : topics.map((topic) => (
                  <div key={topic.id} className={`rounded-lg border px-3 py-3 ${topic.is_hidden ? "border-red-800/50 bg-red-950/10" : "border-[#1a1a3e] bg-[#16213e]/40"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white">{topic.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <StyledUsername
                            username={topic.profiles?.username}
                            usernameCss={topic.profiles?.username_css}
                            profilePath={`/codeforum/profile/${encodeURIComponent(topic.profiles?.username || "")}`}
                            className="text-xs"
                          />
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: ru })}</span>
                        </div>
                      </div>
                      <button onClick={() => toggleContent("topic", topic.id, !topic.is_hidden)} className="inline-flex flex-shrink-0 items-center gap-1 rounded border border-[#1a1a3e] px-2 py-1 text-xs text-gray-300 hover:border-emerald-500 hover:text-white">
                        {topic.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {topic.is_hidden ? "Показать" : "Скрыть"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#1a1a3e] bg-[#0f0f23] p-4 md:p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">Сообщения</h2>
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <p className="text-sm text-gray-500">Пока нет сообщений.</p>
                ) : posts.map((post) => (
                  <div key={post.id} className={`rounded-lg border px-3 py-3 ${post.is_hidden ? "border-red-800/50 bg-red-950/10" : "border-[#1a1a3e] bg-[#16213e]/40"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">{post.topicTitle}</div>
                        <div className="mt-1 text-sm text-gray-400 line-clamp-3">{post.content}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <StyledUsername
                            username={post.profiles?.username}
                            usernameCss={post.profiles?.username_css}
                            profilePath={`/codeforum/profile/${encodeURIComponent(post.profiles?.username || "")}`}
                            className="text-xs"
                          />
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ru })}</span>
                        </div>
                      </div>
                      <button onClick={() => toggleContent("post", post.id, !post.is_hidden)} className="inline-flex flex-shrink-0 items-center gap-1 rounded border border-[#1a1a3e] px-2 py-1 text-xs text-gray-300 hover:border-emerald-500 hover:text-white">
                        {post.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {post.is_hidden ? "Показать" : "Скрыть"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default CodeForumModeratorPanel;