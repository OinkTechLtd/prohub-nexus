import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import AdDisplay from "@/components/AdDisplay";
import ForumStats from "@/components/ForumStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  topicCount?: number;
}

const Forum = () => {
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Enable real-time notifications
  useNotifications(user?.id);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("order_position");

      if (categoriesError) throw categoriesError;

      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from("topics")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("is_hidden", false);

          return {
            ...category,
            topicCount: count || 0,
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">ProHub Форум</h1>
            <p className="text-muted-foreground">Сообщество разработчиков и профессионалов</p>
          </div>
          <div className="flex gap-2">
            {user && (
              <>
                <Button onClick={() => navigate("/create-ad")} variant="outline">
                  Создать рекламу
                </Button>
                <Button onClick={() => navigate("/create-topic")} size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Создать тему
                </Button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Загрузка...</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/category/${category.slug}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{category.icon}</span>
                        <div>
                          <CardTitle className="text-xl">{category.name}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MessageSquare className="mr-1 h-4 w-4" />
                          {category.topicCount} тем
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Рекламный сервис</CardTitle>
                  <CardDescription className="text-xs">Создайте и запустите свою рекламу</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={() => navigate("/create-ad")} className="w-full" size="sm">
                    Создать кампанию
                  </Button>
                  <Button onClick={() => navigate("/ads-dashboard")} variant="outline" className="w-full" size="sm">
                    Мои кампании
                  </Button>
                  <Button onClick={() => navigate("/withdraw")} variant="outline" className="w-full" size="sm">
                    Вывод средств
                  </Button>
                </CardContent>
              </Card>
              <AdDisplay location="sidebar" interests={["forum", "programming"]} />
            </div>
          </div>
        )}

        <div className="mt-8">
          <ForumStats />
        </div>
      </main>
    </div>
  );
};

export default Forum;