import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import UserLink from "@/components/UserLink";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Pin, Lock, Send, Eye, Flag } from "lucide-react";
import { useInterestTracking } from "@/hooks/useInterestTracking";
import { LikeButton } from "@/components/LikeButton";
import TopicWatchButton from "@/components/TopicWatchButton";
import UserSignature from "@/components/UserSignature";
import ReportDialog from "@/components/ReportDialog";
interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

const TopicView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
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
    loadTopicAndPosts();
    incrementViews();
  }, [id]);

  useEffect(() => {
    if (topic?.categories?.slug) {
      trackInterest(topic.categories.slug);
    }
  }, [topic]);

  const incrementViews = async () => {
    if (!id) return;
    const { data: currentTopic } = await supabase
      .from("topics")
      .select("views")
      .eq("id", id)
      .single();

    if (currentTopic) {
      await supabase
        .from("topics")
        .update({ views: currentTopic.views + 1 })
        .eq("id", id);
    }
  };

  const loadTopicAndPosts = async () => {
    try {
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select(`
          *,
          profiles (
            username,
            avatar_url
          ),
          categories (
            name,
            slug
          )
        `)
        .eq("id", id)
        .single();

      if (topicError) throw topicError;
      setTopic(topicData);

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq("topic_id", id)
        .eq("is_hidden", false)
        .order("created_at", { ascending: true });

      if (postsError) throw postsError;
      setPosts(postsData || []);
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

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newPost.trim()) {
      toast({
        title: "Войдите в систему",
        description: "Для отправки сообщений нужно войти в систему",
        variant: "destructive",
      });
      return;
    }

    setPosting(true);

    try {
      // Server-side moderation check
      const { data: { session } } = await supabase.auth.getSession();
      const { data: moderationResult, error: moderationError } = await supabase.functions.invoke(
        'moderate-content',
        {
          body: { content: newPost, type: 'post' },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (moderationError) throw moderationError;

      if (!moderationResult.approved) {
        toast({
          title: "Неприемлемый контент",
          description: moderationResult.reason || "Контент не прошёл модерацию",
          variant: "destructive",
        });
        setPosting(false);
        return;
      }

      const { error } = await supabase.from("posts").insert({
        topic_id: id,
        user_id: user.id,
        content: newPost.trim(),
      });

      if (error) throw error;

      // Check achievements
      await supabase.rpc("check_and_award_achievements", {
        _user_id: user.id,
      });

      setNewPost("");
      loadTopicAndPosts();
      
      // Check and upgrade user role
      await supabase.rpc('check_and_upgrade_role', { _user_id: user.id });
      
      toast({
        title: "Сообщение отправлено",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка отправки",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8 text-center">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate(`/category/${topic?.categories?.slug}`)}>
            ← Вернуться в {topic?.categories?.name}
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {topic?.profiles?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {topic?.is_pinned && <Pin className="h-4 w-4 text-primary flex-shrink-0" />}
                  {topic?.is_locked && <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  <h1 className="text-xl sm:text-3xl font-bold break-words">{topic?.title}</h1>
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                  от <UserLink username={topic?.profiles?.username} showAvatar={false} /> •{" "}
                  {formatDistanceToNow(new Date(topic?.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </p>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{topic?.content}</p>
                </div>
                <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t flex-wrap">
                  <div className="flex items-center gap-4">
                    <LikeButton 
                      contentType="topic" 
                      contentId={topic?.id} 
                      authorId={topic?.user_id} 
                    />
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {topic?.views} просмотров
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {user && topic?.user_id !== user.id && (
                      <ReportDialog 
                        contentType="topic" 
                        contentId={topic?.id} 
                        contentAuthorId={topic?.user_id}
                      />
                    )}
                    <TopicWatchButton topicId={topic?.id} userId={user?.id} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 mb-6">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarFallback className="bg-secondary text-xs sm:text-sm">
                      {post.profiles?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <UserLink username={post.profiles?.username} avatarUrl={post.profiles?.avatar_url} />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{post.content}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <LikeButton 
                        contentType="post" 
                        contentId={post.id} 
                        authorId={post.user_id}
                        size="sm"
                      />
                      {user && post.user_id !== user.id && (
                        <ReportDialog 
                          contentType="post" 
                          contentId={post.id} 
                          contentAuthorId={post.user_id}
                        />
                      )}
                    </div>
                    <UserSignature userId={post.user_id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {user && !topic?.is_locked && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handlePostSubmit} className="space-y-4">
                <Textarea
                  placeholder="Написать ответ..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  rows={4}
                  required
                />
                <Button type="submit" disabled={posting}>
                  <Send className="mr-2 h-4 w-4" />
                  {posting ? "Отправка..." : "Ответить"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Войдите, чтобы оставить комментарий
              </p>
              <Button onClick={() => navigate("/auth")}>Войти</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default TopicView;