import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import UserLink from "@/components/UserLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInterestTracking } from "@/hooks/useInterestTracking";
import { ResourceFilters } from "@/components/ResourceFilters";
import { StarRating } from "@/components/StarRating";

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  url: string | null;
  file_url: string | null;
  is_hidden: boolean;
  downloads: number;
  rating: number;
  created_at: string;
  profiles: {
    username: string;
  };
}

const Resources = () => {
  const [user, setUser] = useState<any>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackInterest } = useInterestTracking(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select(`
          *,
          profiles (
            username
          )
        `)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      code: "bg-blue-500",
      tutorial: "bg-green-500",
      tool: "bg-purple-500",
      library: "bg-orange-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const handleOpenResource = async (resource: Resource) => {
    // Track interest
    trackInterest(resource.resource_type);

    if (resource.file_url) {
      // Download file
      window.open(resource.file_url, '_blank');
    } else if (resource.url) {
      // Open URL
      window.open(resource.url, '_blank');
    }
    
    // Increment download count
    await supabase
      .from('resources')
      .update({ downloads: resource.downloads + 1 })
      .eq('id', resource.id);
    
    loadResources();
  };

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    let result = [...resources];
    
    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter(r => r.resource_type === typeFilter);
    }
    
    // Sort
    switch (sortBy) {
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "downloads":
        result.sort((a, b) => b.downloads - a.downloads);
        break;
      default: // newest
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    return result;
  }, [resources, typeFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">Ресурсы</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Полезные материалы, библиотеки и инструменты
            </p>
          </div>
          {user && (
            <Button onClick={() => navigate("/create-resource")} size="sm" className="self-start md:self-auto">
              <Plus className="mr-1 md:mr-2 h-4 w-4" />
              Добавить
            </Button>
          )}
        </div>

        <ResourceFilters
          typeFilter={typeFilter}
          sortBy={sortBy}
          onTypeChange={setTypeFilter}
          onSortChange={setSortBy}
        />

        {loading ? (
          <div className="text-center py-12">Загрузка...</div>
        ) : filteredResources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {typeFilter !== "all" ? "Нет ресурсов выбранного типа" : "Пока нет ресурсов. Добавьте первый!"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <Card 
                key={resource.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/resource/${resource.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getTypeColor(resource.resource_type)}>
                      {resource.resource_type}
                    </Badge>
                    <StarRating rating={resource.rating || 0} readonly size="sm" />
                  </div>
                  <CardTitle className="text-xl">{resource.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    от <UserLink username={resource.profiles?.username} showAvatar={false} />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 line-clamp-2">{resource.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Download className="mr-1 h-4 w-4" />
                      {resource.downloads} загрузок
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenResource(resource);
                      }}
                    >
                      {resource.file_url ? (
                        <>
                          <Download className="mr-1 h-4 w-4" />
                          Скачать
                        </>
                      ) : (
                        <>
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Открыть
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Resources;