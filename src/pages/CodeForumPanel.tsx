import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CodeForumHeader from "@/components/CodeForumHeader";
import { MessageSquare, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  topicCount: number;
  postCount: number;
  lastTopic?: { title: string; id: string; created_at: string; username: string } | null;
}

interface LatestTopic {
  id: string;
  title: string;
  created_at: string;
}

interface LatestResource {
  id: string;
  title: string;
  created_at: string;
}

const CodeForumPanel = () => {
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestTopics, setLatestTopics] = useState<LatestTopic[]>([]);
  const [latestResources, setLatestResources] = useState<LatestResource[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: categoriesData, error } = await supabase
        .from("categories")
        .select("*")
        .eq("forum_id", "codeforum")
        .order("order_position");

      if (error) throw error;

      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count: topicCount } = await supabase
            .from("topics")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("is_hidden", false);

          const { count: postCount } = await supabase
            .from("posts")
            .select("*, topics!inner(category_id)", { count: "exact", head: true })
            .eq("topics.category_id", category.id)
            .eq("is_hidden", false);

          // Get last topic
          const { data: lastTopicData } = await supabase
            .from("topics")
            .select("id, title, created_at, profiles(username)")
            .eq("category_id", category.id)
            .eq("is_hidden", false)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...category,
            topicCount: topicCount || 0,
            postCount: postCount || 0,
            lastTopic: lastTopicData ? {
              title: lastTopicData.title,
              id: lastTopicData.id,
              created_at: lastTopicData.created_at,
              username: (lastTopicData.profiles as any)?.username || "Unknown",
            } : null,
          };
        })
      );

      setCategories(categoriesWithCounts);

      const categoryIds = (categoriesData || []).map((category) => category.id);
      const [{ data: latestTopicsData }, { data: latestResourcesData }] = await Promise.all([
        categoryIds.length > 0
          ? supabase
              .from("topics")
              .select("id, title, created_at")
              .in("category_id", categoryIds)
              .eq("is_hidden", false)
              .order("created_at", { ascending: false })
              .limit(6)
          : Promise.resolve({ data: [] as LatestTopic[] }),
        supabase
          .from("resources")
          .select("id, title, created_at")
          .eq("is_hidden", false)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      setLatestTopics((latestTopicsData as LatestTopic[]) || []);
      setLatestResources((latestResourcesData as LatestResource[]) || []);
    } catch (error: any) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <CodeForumHeader user={user} />

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Title bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
            Code Forum — Форум о программировании
          </h1>
          {user && (
            <button
              onClick={() => navigate("/codeforum/create-topic")}
              className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm rounded transition-colors whitespace-nowrap"
            >
              + Создать тему
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Загрузка категорий...</div>
        ) : categories.length === 0 ? (
          <div className="bg-[#16213e] border border-[#1a1a3e] rounded-lg p-8 text-center">
            <p className="text-gray-400">Категории ещё не созданы для Code Forum</p>
            <p className="text-xs text-gray-500 mt-2">
              Администратор может создать категории с forum_id: codeforum
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-1">
              <div className="bg-[#0f0f23] border border-[#1a1a3e] rounded-lg overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 px-3 sm:px-4 py-2 bg-[#16213e]/50 text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider border-b border-[#1a1a3e]">
                <div className="col-span-12 sm:col-span-7">Форум</div>
                <div className="hidden sm:block col-span-2 text-center">Темы</div>
                <div className="hidden sm:block col-span-2 text-center">Сообщения</div>
                <div className="hidden sm:block col-span-1">Посл.</div>
              </div>

              {categories.map((category, idx) => (
                <div
                  key={category.id}
                  className={`px-3 sm:px-4 py-3 hover:bg-[#16213e]/30 cursor-pointer transition-colors ${
                    idx < categories.length - 1 ? "border-b border-[#1a1a3e]/50" : ""
                  }`}
                  onClick={() => navigate(`/codeforum/category/${category.slug}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl flex-shrink-0">{category.icon || "💬"}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 truncate">
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{category.description}</p>
                      <div className="flex items-center gap-3 mt-1 sm:hidden text-xs text-gray-400">
                        <span>{category.topicCount} тем</span>
                        <span>{category.postCount} сообщений</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-sm text-gray-400 flex-shrink-0">
                      <span className="w-12 text-center">{category.topicCount}</span>
                      <span className="w-12 text-center">{category.postCount}</span>
                    </div>
                  </div>
                  {category.lastTopic && (
                    <div className="mt-1 ml-9 sm:ml-11 text-xs text-gray-500 truncate">
                      {category.lastTopic.username} · {formatDistanceToNow(new Date(category.lastTopic.created_at), { addSuffix: true, locale: ru })}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-[#1a1a3e] bg-[#0f0f23] p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">Что нового</h2>
                <div className="space-y-2">
                  {latestTopics.length === 0 ? (
                    <p className="text-sm text-gray-500">Пока нет новых тем</p>
                  ) : latestTopics.map((topic) => (
                    <button key={topic.id} onClick={() => navigate(`/codeforum/topic/${topic.id}`)} className="block w-full text-left rounded border border-[#1a1a3e] bg-[#16213e]/30 px-3 py-2 text-sm text-gray-200 hover:border-emerald-600 hover:text-white">
                      <div className="truncate">{topic.title}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: ru })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#1a1a3e] bg-[#0f0f23] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Новые ресурсы</h2>
                  <button onClick={() => navigate("/codeforum/resources")} className="text-xs text-gray-400 hover:text-emerald-300">Все</button>
                </div>
                <div className="space-y-2">
                  {latestResources.length === 0 ? (
                    <p className="text-sm text-gray-500">Пока нет ресурсов</p>
                  ) : latestResources.map((resource) => (
                    <button key={resource.id} onClick={() => navigate(`/codeforum/resource/${resource.id}`)} className="block w-full text-left rounded border border-[#1a1a3e] bg-[#16213e]/30 px-3 py-2 text-sm text-gray-200 hover:border-emerald-600 hover:text-white">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-emerald-400" />
                        <span className="truncate">{resource.title}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true, locale: ru })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#1a1a3e] bg-[#16213e] p-4 text-xs text-gray-400">
                <p>Code Forum теперь работает как отдельная форумная оболочка: свои категории, свои профили, свои участники и свои страницы ресурсов.</p>
              </div>
            </aside>
          </div>
        )}
      </main>

      <footer className="mt-8 border-t border-[#16213e] px-4 py-4 text-center text-xs text-gray-500 space-y-1">
        <p>Code Forum • developer community shell</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={() => navigate("/codeforum/rules")} className="hover:text-emerald-400 transition-colors">Правила</button>
          <span>•</span>
          <button onClick={() => navigate("/codeforum/privacy")} className="hover:text-emerald-400 transition-colors">Конфиденциальность</button>
          <span>•</span>
          <button onClick={() => navigate("/codeforum/terms")} className="hover:text-emerald-400 transition-colors">Условия использования</button>
        </div>
        <p>❤️ Made by <a href="https://freesoft.ru/gink-platforms" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Oink Platforms</a></p>
      </footer>
    </div>
  );
};

export default CodeForumPanel;
