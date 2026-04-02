import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CodeForumHeader from "@/components/CodeForumHeader";
import StyledUsername from "@/components/StyledUsername";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Pin, Lock, Eye, MessageSquare } from "lucide-react";

interface Topic {
  id: string;
  title: string;
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  user_id: string;
  profiles: { username: string; avatar_url: string | null; username_css: string | null };
  postCount?: number;
}

const CodeForumCategoryView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    try {
      const { data: cat, error: catError } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .eq("forum_id", "codeforum")
        .single();

      if (catError) throw catError;
      setCategory(cat);

      const { data: topicsData, error: topicsError } = await supabase
        .from("topics")
        .select("*, profiles(username, avatar_url, username_css)")
        .eq("category_id", cat.id)
        .eq("is_hidden", false)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (topicsError) throw topicsError;

      // Get post counts
      const enriched = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { count } = await supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("topic_id", topic.id)
            .eq("is_hidden", false);
          return { ...topic, postCount: count || 0 };
        })
      );

      setTopics(enriched);
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <CodeForumHeader user={user} />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <button
            onClick={() => navigate("/codeforum/forum")}
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            ← Вернуться к форуму
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{category?.icon || "💬"}</span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">{category?.name}</h1>
              <p className="text-sm text-gray-400">{category?.description}</p>
            </div>
          </div>
          {user && (
            <button
              onClick={() => navigate("/codeforum/create-topic", { state: { categoryId: category?.id } })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors"
            >
              + Создать тему
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : topics.length === 0 ? (
          <div className="bg-[#16213e] border border-[#1a1a3e] rounded-lg p-8 text-center text-gray-400">
            Нет тем в этой категории
          </div>
        ) : (
          <div className="bg-[#0f0f23] border border-[#1a1a3e] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#16213e]/50 text-xs text-gray-400 uppercase tracking-wider border-b border-[#1a1a3e]">
              <div className="col-span-7">Тема</div>
              <div className="col-span-1 hidden md:block text-center">Ответы</div>
              <div className="col-span-1 hidden md:block text-center">Просмотры</div>
              <div className="col-span-5 md:col-span-3 text-right">Автор / Дата</div>
            </div>

            {topics.map((topic, idx) => (
              <div
                key={topic.id}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-[#16213e]/30 cursor-pointer transition-colors ${
                  idx < topics.length - 1 ? "border-b border-[#1a1a3e]/50" : ""
                } ${topic.is_pinned ? "bg-emerald-900/10" : ""}`}
                onClick={() => navigate(`/codeforum/topic/${topic.id}`)}
              >
                <div className="col-span-7 flex items-center gap-2 min-w-0">
                  {topic.is_pinned && <Pin className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                  {topic.is_locked && <Lock className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />}
                  <span className="text-sm text-gray-100 truncate hover:text-emerald-400 transition-colors">
                    {topic.title}
                  </span>
                </div>
                <div className="col-span-1 hidden md:block text-center text-sm text-gray-400">
                  {topic.postCount}
                </div>
                <div className="col-span-1 hidden md:flex items-center justify-center gap-1 text-sm text-gray-400">
                  <Eye className="h-3 w-3" />
                  {topic.views}
                </div>
                <div className="col-span-5 md:col-span-3 text-right">
                  <div className="text-xs" onClick={(e) => e.stopPropagation()}>
                    <StyledUsername
                      username={topic.profiles?.username}
                      usernameCss={topic.profiles?.username_css}
                      className="text-xs justify-end"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: ru })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CodeForumCategoryView;
