import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarDays, FileText, MessageSquare, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CodeForumHeader from "@/components/CodeForumHeader";
import StyledUsername from "@/components/StyledUsername";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AvatarWithBorder from "@/components/AvatarWithBorder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCodeForumRole } from "@/hooks/useCodeForumRole";
import { sanitizeUsernameCss } from "@/lib/usernameCss";

interface TopicItem {
  id: string;
  title: string;
  created_at: string;
}

interface PostItem {
  id: string;
  topic_id: string | null;
  content: string;
  created_at: string;
  topics?: { title: string } | null;
}

interface ResourceItem {
  id: string;
  title: string;
  resource_type: string;
  created_at: string;
}

const CodeForumProfile = () => {
  const { username: usernameParam } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [bio, setBio] = useState("");
  const [usernameCss, setUsernameCss] = useState("");
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [stats, setStats] = useState({ topics: 0, posts: 0, resources: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { roleLabel, roleColor } = useCodeForumRole(profile?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (usernameParam) {
        loadProfile("username", usernameParam, session?.user?.id);
      } else if (session?.user?.id) {
        loadProfile("id", session.user.id, session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [usernameParam, navigate]);

  const loadProfile = async (mode: "id" | "username", value: string, currentUserId?: string) => {
    setLoading(true);
    try {
      const profileQuery = supabase.from("profiles").select("*");
      const { data: profileData, error } = mode === "id"
        ? await profileQuery.eq("id", value).single()
        : await profileQuery.eq("username", value).single();

      if (error) throw error;

      setProfile(profileData);
      setIsOwnProfile(profileData.id === currentUserId);
      setBio(profileData.bio || "");
      setUsernameCss(profileData.username_css || "");

      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .eq("forum_id", "codeforum");

      const categoryIds = (categories || []).map((item) => item.id);

      if (categoryIds.length === 0) {
        setTopics([]);
        setPosts([]);
        setStats({ topics: 0, posts: 0, resources: 0 });
        return;
      }

      const { data: topicsData } = await supabase
        .from("topics")
        .select("id, title, created_at")
        .eq("user_id", profileData.id)
        .in("category_id", categoryIds)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(8);

      const { data: allCodeForumTopics } = await supabase
        .from("topics")
        .select("id")
        .in("category_id", categoryIds);

      const topicIds = (allCodeForumTopics || []).map((item) => item.id);

      const { data: postsData } = topicIds.length > 0
        ? await supabase
            .from("posts")
            .select("id, topic_id, content, created_at, topics(title)")
            .eq("user_id", profileData.id)
            .in("topic_id", topicIds)
            .eq("is_hidden", false)
            .order("created_at", { ascending: false })
            .limit(8)
        : { data: [] as PostItem[] };

      const { data: resourcesData } = await supabase
        .from("resources")
        .select("id, title, resource_type, created_at")
        .eq("user_id", profileData.id)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(8);

      const [{ count: topicsCount }, { count: postsCount }, { count: resourcesCount }] = await Promise.all([
        supabase
          .from("topics")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profileData.id)
          .in("category_id", categoryIds)
          .eq("is_hidden", false),
        topicIds.length > 0
          ? supabase
              .from("posts")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profileData.id)
              .in("topic_id", topicIds)
              .eq("is_hidden", false)
          : Promise.resolve({ count: 0 } as { count: number | null }),
        supabase
          .from("resources")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profileData.id)
          .eq("is_hidden", false),
      ]);

      setTopics(topicsData || []);
      setPosts((postsData as PostItem[]) || []);
      setResources((resourcesData as ResourceItem[]) || []);
      setStats({
        topics: topicsCount || 0,
        posts: postsCount || 0,
        resources: resourcesCount || 0,
      });
    } catch (error: any) {
      toast({ title: "Профиль не найден", description: error.message, variant: "destructive" });
      navigate("/codeforum/forum");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !isOwnProfile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio: bio || null, username_css: usernameCss || null })
        .eq("id", currentUser.id);

      if (error) throw error;

      setProfile((prev: any) => ({ ...prev, bio: bio || null, username_css: usernameCss || null }));
      toast({ title: "Профиль Code Forum обновлён" });
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
        <CodeForumHeader user={currentUser} />
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">Загрузка профиля...</div>
      </div>
    );
  }

  const preview = sanitizeUsernameCss(usernameCss, "cf-profile-preview");

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <CodeForumHeader user={currentUser} />

      <main className="container mx-auto px-4 py-4 md:py-6 space-y-4">
        <section className="overflow-hidden rounded-xl border border-[#1a1a3e] bg-[#0f0f23]">
          <div
            className="h-24 md:h-32 border-b border-[#1a1a3e] bg-[linear-gradient(135deg,#0f172a_0%,#0f3d36_45%,#0b5d4b_100%)]"
            style={profile?.cover_url ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          />
          <div className="px-4 pb-4 md:px-6 md:pb-6">
            <div className="-mt-10 md:-mt-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <AvatarWithBorder
                  src={profile?.avatar_url}
                  fallback={profile?.username?.[0]?.toUpperCase() || "?"}
                  role={roleLabel === "Администратор" ? "admin" : roleLabel === "Модератор" ? "moderator" : roleLabel === "Редактор" ? "editor" : "newbie"}
                  size="xl"
                  className="h-20 w-20 md:h-24 md:w-24 border-4 border-[#0f0f23]"
                />
                <div className="pb-1">
                  <StyledUsername username={profile?.username || "Пользователь"} usernameCss={usernameCss || profile?.username_css} className="text-xl md:text-3xl" />
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-400">
                    <span className={`rounded px-2 py-1 text-white ${roleColor}`}>{roleLabel}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{profile?.created_at ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: ru }) : "Недавно"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs md:text-sm w-full md:w-auto">
                <div className="rounded-lg border border-[#1a1a3e] bg-[#16213e]/60 px-3 py-2">
                  <div className="text-lg font-semibold text-white">{stats.topics}</div>
                  <div className="text-gray-400">Тем</div>
                </div>
                <div className="rounded-lg border border-[#1a1a3e] bg-[#16213e]/60 px-3 py-2">
                  <div className="text-lg font-semibold text-white">{stats.posts}</div>
                  <div className="text-gray-400">Постов</div>
                </div>
                <div className="rounded-lg border border-[#1a1a3e] bg-[#16213e]/60 px-3 py-2">
                  <div className="text-lg font-semibold text-white">{stats.resources}</div>
                  <div className="text-gray-400">Ресурсов</div>
                </div>
              </div>
            </div>

            {profile?.bio && !isOwnProfile && (
              <p className="mt-4 text-sm leading-6 text-gray-300">{profile.bio}</p>
            )}
          </div>
        </section>

        {isOwnProfile && (
          <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
            <Card className="border-[#1a1a3e] bg-[#0f0f23] text-gray-200">
              <CardHeader>
                <CardTitle>О себе и стиль ника</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Описание</label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="border-[#1a1a3e] bg-[#16213e] text-gray-100" placeholder="Расскажите о себе для Code Forum" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">CSS ника</label>
                  <Textarea
                    value={usernameCss}
                    onChange={(e) => setUsernameCss(e.target.value)}
                    rows={6}
                    className="border-[#1a1a3e] bg-[#16213e] font-mono text-gray-100"
                    placeholder={`@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }\nanimation: blink 1s infinite;\ncolor: #7dd3fc;\ntext-shadow: 0 0 8px rgba(125,211,252,.7);`}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Сохранение..." : "Сохранить"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-[#1a1a3e] bg-[#0f0f23] text-gray-200">
              <CardHeader>
                <CardTitle>Предпросмотр ника</CardTitle>
              </CardHeader>
              <CardContent>
                {preview.keyframes && <style dangerouslySetInnerHTML={{ __html: preview.keyframes }} />}
                <div className="rounded-lg border border-dashed border-[#1a1a3e] bg-[#16213e]/60 px-4 py-6 text-center">
                  <span className="inline-block text-2xl font-bold" style={preview.style}>{profile?.username}</span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="border-[#1a1a3e] bg-[#0f0f23] text-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Темы Code Forum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topics.length === 0 ? (
                <p className="text-sm text-gray-500">Пока нет тем в Code Forum.</p>
              ) : topics.map((topic) => (
                <button key={topic.id} onClick={() => navigate(`/codeforum/topic/${topic.id}`)} className="block w-full rounded-lg border border-[#1a1a3e] bg-[#16213e]/40 px-3 py-3 text-left hover:bg-[#16213e]/70">
                  <div className="font-medium text-white">{topic.title}</div>
                  <div className="mt-1 text-xs text-gray-500">{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: ru })}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#1a1a3e] bg-[#0f0f23] text-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Ресурсы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resources.length === 0 ? (
                <p className="text-sm text-gray-500">Пока нет ресурсов.</p>
              ) : resources.map((resource) => (
                <button key={resource.id} onClick={() => navigate(`/codeforum/resource/${resource.id}`)} className="block w-full rounded-lg border border-[#1a1a3e] bg-[#16213e]/40 px-3 py-3 text-left hover:bg-[#16213e]/70">
                  <div className="font-medium text-white">{resource.title}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-emerald-400">{resource.resource_type}</div>
                  <div className="mt-1 text-xs text-gray-500">{formatDistanceToNow(new Date(resource.created_at), { addSuffix: true, locale: ru })}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#1a1a3e] bg-[#0f0f23] text-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Последние ответы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {posts.length === 0 ? (
                <p className="text-sm text-gray-500">Пока нет сообщений в Code Forum.</p>
              ) : posts.map((post) => (
                <button key={post.id} onClick={() => post.topic_id && navigate(`/codeforum/topic/${post.topic_id}`)} className="block w-full rounded-lg border border-[#1a1a3e] bg-[#16213e]/40 px-3 py-3 text-left hover:bg-[#16213e]/70">
                  <div className="font-medium text-white">{post.topics?.title || "Тема"}</div>
                  <div className="mt-1 line-clamp-2 text-sm text-gray-400">{post.content}</div>
                  <div className="mt-2 text-xs text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ru })}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default CodeForumProfile;