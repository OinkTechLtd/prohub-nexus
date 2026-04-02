import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CodeForumHeader from "@/components/CodeForumHeader";
import { MessageSquare, ChevronRight } from "lucide-react";
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

const CodeForumPanel = () => {
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
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
    } catch (error: any) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <CodeForumHeader user={user} />

      <main className="container mx-auto px-4 py-6">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Code Forum — Форум о программировании
          </h1>
          {user && (
            <button
              onClick={() => navigate("/codeforum/create-topic")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors"
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
          <div className="space-y-1">
            {/* XenForo-style category list */}
            <div className="bg-[#0f0f23] border border-[#1a1a3e] rounded-lg overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#16213e]/50 text-xs text-gray-400 uppercase tracking-wider border-b border-[#1a1a3e]">
                <div className="col-span-6 md:col-span-7">Форум</div>
                <div className="col-span-2 hidden md:block text-center">Темы</div>
                <div className="col-span-2 hidden md:block text-center">Сообщения</div>
                <div className="col-span-6 md:col-span-1 text-right md:text-left">Посл. сообщение</div>
              </div>

              {categories.map((category, idx) => (
                <div
                  key={category.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-[#16213e]/30 cursor-pointer transition-colors ${
                    idx < categories.length - 1 ? "border-b border-[#1a1a3e]/50" : ""
                  }`}
                  onClick={() => navigate(`/codeforum/category/${category.slug}`)}
                >
                  {/* Category info */}
                  <div className="col-span-6 md:col-span-7 flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{category.icon || "💬"}</span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 truncate">
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{category.description}</p>
                    </div>
                  </div>

                  {/* Counts */}
                  <div className="col-span-2 hidden md:block text-center text-sm text-gray-400">
                    {category.topicCount}
                  </div>
                  <div className="col-span-2 hidden md:block text-center text-sm text-gray-400">
                    {category.postCount}
                  </div>

                  {/* Last topic */}
                  <div className="col-span-6 md:col-span-1 text-right md:text-left">
                    {category.lastTopic ? (
                      <div className="text-xs">
                        <p className="text-gray-300 truncate max-w-[120px] md:max-w-[150px] ml-auto md:ml-0">
                          {category.lastTopic.username}
                        </p>
                        <p className="text-gray-500">
                          {formatDistanceToNow(new Date(category.lastTopic.created_at), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Online stats */}
        <div className="mt-6 bg-[#16213e] border border-[#1a1a3e] rounded-lg p-4 text-xs text-gray-400">
          <p>Code Forum — подфорум платформы <span className="text-emerald-400 cursor-pointer" onClick={() => navigate("/")}>ProHub Nexus</span></p>
        </div>
      </main>

      <footer className="border-t border-[#16213e] py-4 px-4 text-center text-xs text-gray-500 mt-8">
        Code Forum — подфорум{" "}
        <span className="text-emerald-400 cursor-pointer" onClick={() => navigate("/")}>ProHub Nexus</span>
        {" "}| ❤️ Made by Oink Platforms
      </footer>
    </div>
  );
};

export default CodeForumPanel;
