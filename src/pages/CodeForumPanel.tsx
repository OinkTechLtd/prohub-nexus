import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  topicCount?: number;
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
        .eq("forum_id" as any, "codeforum")
        .order("order_position");

      if (error) throw error;

      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from("topics")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("is_hidden", false);
          return { ...category, topicCount: count || 0 };
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
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <header className="border-b border-[#16213e] bg-[#0f0f23]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/codeforum")}>
            <Code className="h-6 w-6 text-emerald-400" />
            <span className="text-lg font-bold text-white">CF</span>
          </div>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={() => navigate("/codeforum")}>
              Главная
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={() => navigate("/forum")}>
              ProHub
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={() => navigate("/resources")}>
              Ресурсы
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={() => navigate("/members")}>
              Пользователи
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">Code Forum</h1>
            <p className="text-sm text-gray-400">Форум о программировании</p>
          </div>
          {user && (
            <Button onClick={() => navigate("/create-topic")} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-1 h-4 w-4" />
              Создать тему
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : categories.length === 0 ? (
          <Card className="bg-[#16213e] border-[#1a1a3e]">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400">Категории ещё не созданы</p>
              <p className="text-xs text-gray-500 mt-2">Администратор может создать категории для Code Forum в админ-панели (Разделы → forum_id: codeforum)</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="bg-[#16213e] border-[#1a1a3e] hover:border-emerald-600/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/category/${category.slug}`)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <CardTitle className="text-base text-white">{category.name}</CardTitle>
                        <CardDescription className="text-xs text-gray-400">{category.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <MessageSquare className="mr-1 h-4 w-4" />
                      {category.topicCount}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#16213e] py-4 px-4 text-center text-xs text-gray-500 mt-8">
        Code Forum — подфорум{" "}
        <span className="text-emerald-400 cursor-pointer" onClick={() => navigate("/")}>ProHub Nexus</span>
      </footer>
    </div>
  );
};

export default CodeForumPanel;
