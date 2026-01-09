import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useInterestTracking } from "@/hooks/useInterestTracking";
import UserLink from "@/components/UserLink";
import { LikeButton } from "@/components/LikeButton";
import { StarRating } from "@/components/StarRating";
import { 
  Download, 
  ExternalLink, 
  MessageSquare, 
  ArrowLeft,
  Send,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  url: string | null;
  file_url: string | null;
  downloads: number;
  rating: number;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

const ResourceView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  
  const { trackInterest } = useInterestTracking(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      loadResource();
      loadComments();
      loadUserRating();
    }
  }, [id]);

  const loadResource = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select(`
          *,
          profiles!resources_user_id_fkey (username, avatar_url)
        `)
        .eq("id", id)
        .eq("is_hidden", false)
        .single();

      if (error) throw error;
      setResource(data);
      
      // Track interest
      if (data) {
        trackInterest(data.resource_type);
      }
    } catch (error) {
      console.error("Error loading resource:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить ресурс",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("resource_comments")
        .select(`
          *,
          profiles!resource_comments_user_id_fkey (username, avatar_url)
        `)
        .eq("resource_id", id)
        .eq("is_hidden", false)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const loadUserRating = async () => {
    if (!user || !id) return;
    try {
      const { data } = await supabase
        .from("resource_ratings")
        .select("rating")
        .eq("resource_id", id)
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setUserRating(data.rating);
      }
    } catch (error) {
      // No rating yet
    }
  };

  const handleRate = async (rating: number) => {
    if (!user || !id || ratingSubmitting) return;
    
    setRatingSubmitting(true);
    try {
      const { error } = await supabase
        .from("resource_ratings")
        .upsert({
          resource_id: id,
          user_id: user.id,
          rating,
        }, { onConflict: "resource_id,user_id" });

      if (error) throw error;
      
      setUserRating(rating);
      loadResource(); // Reload to get updated average rating
      
      toast({
        title: "Оценка сохранена",
        description: `Вы оценили ресурс на ${rating} звёзд`,
      });
    } catch (error) {
      console.error("Error rating resource:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить оценку",
        variant: "destructive",
      });
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleOpenResource = async () => {
    if (!resource) return;
    
    const urlToOpen = resource.file_url || resource.url;
    if (urlToOpen) {
      window.open(urlToOpen, "_blank");
      
      // Increment download count
      await supabase
        .from("resources")
        .update({ downloads: (resource.downloads || 0) + 1 })
        .eq("id", resource.id);
      
      setResource(prev => prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : null);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || !id) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("resource_comments")
        .insert({
          resource_id: id,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;
      
      setNewComment("");
      loadComments();
      
      toast({
        title: "Комментарий добавлен",
        description: "Ваш комментарий успешно опубликован",
      });
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить комментарий",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("resource_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user?.id);

      if (error) throw error;
      
      loadComments();
      
      toast({
        title: "Комментарий удален",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить комментарий",
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tool: "bg-blue-500/20 text-blue-400",
      library: "bg-green-500/20 text-green-400",
      tutorial: "bg-purple-500/20 text-purple-400",
      template: "bg-orange-500/20 text-orange-400",
      other: "bg-muted text-muted-foreground",
    };
    return colors[type] || colors.other;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      tool: "Инструмент",
      library: "Библиотека",
      tutorial: "Туториал",
      template: "Шаблон",
      other: "Другое",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Ресурс не найден</h1>
            <Button onClick={() => navigate("/resources")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              К ресурсам
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/resources")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          К ресурсам
        </Button>

        {/* Resource Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getTypeColor(resource.resource_type)}>
                    {getTypeLabel(resource.resource_type)}
                  </Badge>
                  <StarRating rating={resource.rating || 0} readonly size="sm" />
                  <span className="text-sm text-muted-foreground">
                    ({(resource.rating || 0).toFixed(1)})
                  </span>
                </div>
                <CardTitle className="text-2xl mb-4">{resource.title}</CardTitle>
              </div>
            </div>

            {/* User rating section */}
            {user && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Ваша оценка:</span>
                <StarRating 
                  rating={userRating} 
                  onRate={handleRate}
                  size="md"
                />
                {ratingSubmitting && <span className="text-xs text-muted-foreground">Сохранение...</span>}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={resource.profiles.avatar_url || undefined} />
                <AvatarFallback>
                  {resource.profiles.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <UserLink username={resource.profiles.username} />
                <p className="text-sm text-muted-foreground">
                  {format(new Date(resource.created_at), "d MMMM yyyy", { locale: ru })}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-muted-foreground mb-6 whitespace-pre-wrap">
              {resource.description}
            </p>

            <Separator className="my-6" />

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{resource.downloads || 0} скачиваний</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{comments.length} комментариев</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <LikeButton 
                  contentType="resource" 
                  contentId={resource.id}
                  authorId={resource.user_id}
                />
                <Button onClick={handleOpenResource}>
                  {resource.file_url ? (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Скачать
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Открыть
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Комментарии ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* New Comment Form */}
            {user ? (
              <div className="mb-6">
                <Textarea
                  placeholder="Напишите комментарий..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                  rows={3}
                />
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Отправить
                </Button>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-muted rounded-lg text-center">
                <p className="text-muted-foreground mb-2">
                  Войдите, чтобы оставить комментарий
                </p>
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Войти
                </Button>
              </div>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Пока нет комментариев. Будьте первым!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={comment.profiles.avatar_url || undefined} />
                      <AvatarFallback>
                        {comment.profiles.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <UserLink username={comment.profiles.username} />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
                          </span>
                        </div>
                        {user?.id === comment.user_id && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ResourceView;
