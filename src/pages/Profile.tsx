import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { profileSchema } from "@/lib/schemas";
import { Upload, Camera, Edit, MessageCircle, Trophy, BadgeCheck, Settings, Users, Star, AlertTriangle, FileSignature, ImageIcon, Paintbrush } from "lucide-react";
import UserLevelBadge from "@/components/UserLevelBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
import VerificationRequestForm from "@/components/VerificationRequestForm";
import UsernameHistory from "@/components/UsernameHistory";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import { useAchievements } from "@/hooks/useAchievements";
import TrophyShowcase from "@/components/TrophyShowcase";
import ReputationDisplay from "@/components/ReputationDisplay";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import TwoFactorSettings from "@/components/TwoFactorSettings";
import ProfileGuildBadge from "@/components/ProfileGuildBadge";
import { useGuilds } from "@/hooks/useGuilds";
import WarningDialog from "@/components/WarningDialog";
import WarningsList from "@/components/WarningsList";
import { Switch } from "@/components/ui/switch";
import DailyQuestsWidget from "@/components/DailyQuestsWidget";
import { sanitizeUsernameCss } from "@/lib/usernameCss";

interface Topic {
  id: string;
  title: string;
  created_at: string;
  views: number;
  categories: { name: string };
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  topics: { id: string; title: string };
}

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  downloads: number;
  created_at: string;
}

const Profile = () => {
  const { username: usernameParam } = useParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [signature, setSignature] = useState("");
  const [signatureEnabled, setSignatureEnabled] = useState(true);
  const [bannerUrl, setBannerUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customTitleColor, setCustomTitleColor] = useState("#ef4444");
  const [usernameCss, setUsernameCss] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [userRole, setUserRole] = useState<string>("newbie");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState({ topics: 0, posts: 0, resources: 0 });
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    achievementsWithProgress, 
    totalPoints, 
    earnedCount, 
    totalCount,
    checkAchievements,
    isLoading: isLoadingAchievements 
  } = useAchievements(profile?.id);

  const { useUserGuilds } = useGuilds();
  const { data: userGuilds = [] } = useUserGuilds(profile?.id);
  
  // Check if current user can moderate (moderator or admin)
  const [canModerate, setCanModerate] = useState(false);
  
  useEffect(() => {
    const checkModeratorStatus = async () => {
      if (!currentUser?.id) {
        setCanModerate(false);
        return;
      }
      const { data } = await supabase.rpc("get_user_role", { _user_id: currentUser.id });
      setCanModerate(data === "moderator" || data === "admin");
    };
    checkModeratorStatus();
  }, [currentUser?.id]);

  // Calculate user stats for achievements progress
  const userStats = {
    posts_count: stats.posts,
    topics_count: stats.topics,
    resources_count: stats.resources,
    videos_count: 0,
    days_registered: profile?.created_at 
      ? differenceInDays(new Date(), new Date(profile.created_at))
      : 0,
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (usernameParam) {
        loadProfileByUsername(usernameParam, session?.user?.id);
      } else if (session?.user) {
        loadProfileByUserId(session.user.id, session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [usernameParam, navigate]);

  const loadProfileByUsername = async (username: string, currentUserId?: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error) throw error;
      
      setProfile(profileData);
      setUsername(profileData.username);
      setBio(profileData.bio || "");
      setSignature(profileData.signature || "");
      setSignatureEnabled(profileData.signature_enabled ?? true);
      setBannerUrl(profileData.banner_url || "");
      setCustomTitle(profileData.custom_title || "");
      setCustomTitleColor(profileData.custom_title_color || "#ef4444");
      setUsernameCss((profileData as any).username_css || "");
      setIsOwnProfile(currentUserId === profileData.id);
      
      await loadUserData(profileData.id);
      
      // Check achievements after loading profile
      if (profileData.id) {
        checkAchievements(profileData.id);
      }
      
      // Check achievements after loading profile
      if (profileData.id) {
        checkAchievements(profileData.id);
      }
    } catch (error: any) {
      toast({
        title: "Пользователь не найден",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const loadProfileByUserId = async (userId: string, currentUserId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      
      setProfile(profileData);
      setUsername(profileData.username);
      setBio(profileData.bio || "");
      setSignature(profileData.signature || "");
      setSignatureEnabled(profileData.signature_enabled ?? true);
      setBannerUrl(profileData.banner_url || "");
      setCustomTitle(profileData.custom_title || "");
      setCustomTitleColor(profileData.custom_title_color || "#ef4444");
      setUsernameCss((profileData as any).username_css || "");
      setIsOwnProfile(userId === currentUserId);
      
      await loadUserData(userId);
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки профиля",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      // Get role
      const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: userId });
      setUserRole(roleData || "newbie");

      // Get topics
      const { data: topicsData } = await supabase
        .from("topics")
        .select("id, title, created_at, views, categories(name)")
        .eq("user_id", userId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(10);

      setTopics(topicsData || []);

      // Get posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("id, content, created_at, topics(id, title)")
        .eq("user_id", userId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(10);

      setPosts(postsData || []);

      // Get resources
      const { data: resourcesData } = await supabase
        .from("resources")
        .select("id, title, description, resource_type, downloads, created_at")
        .eq("user_id", userId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(10);

      setResources(resourcesData || []);

      // Get stats
      const { count: topicsCount } = await supabase
        .from("topics")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_hidden", false);

      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_hidden", false);

      const { count: resourcesCount } = await supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_hidden", false);

      setStats({
        topics: topicsCount || 0,
        posts: postsCount || 0,
        resources: resourcesCount || 0,
      });
    } catch (error: any) {
      console.error("Error loading user data:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !isOwnProfile || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}/avatar-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('profile-covers')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-covers')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast({ title: "Аватар обновлён" });
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !isOwnProfile || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}/cover-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('profile-covers')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-covers')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, cover_url: publicUrl });
      toast({ title: "Обложка обновлена" });
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !isOwnProfile || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}/banner-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('profile-covers')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-covers')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ banner_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, banner_url: publicUrl });
      setBannerUrl(publicUrl);
      toast({ title: "Баннер обновлён" });
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignatureUpdate = async () => {
    if (!currentUser || !isOwnProfile) return;
    
    // Limit signature length
    if (signature.length > 200) {
      toast({
        title: "Ошибка",
        description: "Подпись не может быть длиннее 200 символов",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ signature, signature_enabled: signatureEnabled })
        .eq("id", currentUser.id);

      if (error) throw error;
      toast({ title: "Подпись обновлена" });
    } catch (error: any) {
      toast({
        title: "Ошибка обновления",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isOwnProfile) return;

    const validation = profileSchema.safeParse({ username, bio });
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast({
        title: "Ошибка валидации",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username, bio })
        .eq("id", currentUser.id);

      if (error) throw error;

      toast({ title: "Профиль обновлен" });
      setEditMode(false);
    } catch (error: any) {
      toast({
        title: "Ошибка обновления",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!currentUser || !profile) return;

    try {
      // Use the new RPC function to safely create or find chat
      const { data: chatId, error: chatError } = await supabase.rpc(
        "create_private_chat",
        {
          _user1: currentUser.id,
          _user2: profile.id,
        }
      );

      if (chatError) throw chatError;

      navigate(`/chat/${chatId}`);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500",
      moderator: "bg-purple-500",
      editor: "bg-blue-500",
      pro: "bg-green-500",
      newbie: "bg-gray-500",
    };
    return colors[role] || "bg-gray-500";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Администратор",
      moderator: "Модератор",
      editor: "Редактор",
      pro: "Профи",
      newbie: "Новичок",
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={currentUser} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Cover Image */}
        <div className="relative w-full h-48 md:h-64 bg-gradient-to-r from-primary to-primary/60 rounded-t-lg overflow-hidden">
          {profile?.cover_url && (
            <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
          )}
          {isOwnProfile && (
            <label className="absolute top-4 right-4 cursor-pointer">
              <Button size="sm" variant="secondary" asChild>
                <span>
                  <Camera className="h-4 w-4 mr-2" />
                  Изменить обложку
                </span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleCoverUpload}
              />
            </label>
          )}
        </div>

        {/* Profile Header */}
        <Card className="rounded-t-none -mt-16 relative">
          <CardContent className="pt-20 pb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative -mt-20">
                <Avatar className="h-32 w-32 border-4 border-background">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={username} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                      {username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 cursor-pointer">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                      </span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      if (!(profile as any)?.username_css) {
                        return <h1 className="text-3xl font-bold">{username}</h1>;
                      }
                      const parsed = sanitizeUsernameCss((profile as any).username_css, "profile-header");
                      return (
                        <>
                          {parsed.keyframes && <style dangerouslySetInnerHTML={{ __html: parsed.keyframes }} />}
                          <h1 className="text-3xl font-bold inline-block" style={parsed.style}>{username}</h1>
                        </>
                      );
                    })()}
                    {profile?.is_verified && <VerifiedBadge className="h-6 w-6" />}
                  </div>
                  {profile?.custom_title ? (
                    <Badge style={{ backgroundColor: profile.custom_title_color || undefined }} className="text-white">
                      {profile.custom_title}
                    </Badge>
                  ) : (
                    <Badge className={getRoleBadgeColor(userRole)}>
                      {getRoleLabel(userRole)}
                    </Badge>
                  )}
                  {isOwnProfile && !editMode && (
                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                  )}
                  {isOwnProfile && !profile?.is_verified && (
                    <Button variant="outline" size="sm" onClick={() => setShowVerificationForm(true)}>
                      <BadgeCheck className="h-4 w-4 mr-2" />
                      Получить галочку
                    </Button>
                  )}
                  {!isOwnProfile && (
                    <Button variant="default" size="sm" onClick={handleStartChat}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Написать сообщение
                    </Button>
                  )}
                  {isOwnProfile && currentUser && (
                    <PushNotificationToggle userId={currentUser.id} />
                  )}
                </div>
                
                {/* Username History Button */}
                {profile && (
                  <div className="mb-2">
                    <UsernameHistory userId={profile.id} currentUsername={username} />
                  </div>
                )}
                
                {!editMode ? (
                  <p className="text-muted-foreground mb-4">{bio || "Нет описания"}</p>
                ) : (
                  <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Имя пользователя</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">О себе</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Расскажите о себе..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        Сохранить
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditMode(false)}
                      >
                        Отмена
                      </Button>
                    </div>
                  </form>
                )}
                
                {/* Stats */}
                <div className="flex flex-wrap gap-4 md:gap-6 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.topics}</div>
                    <div className="text-sm text-muted-foreground">Тем</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.posts}</div>
                    <div className="text-sm text-muted-foreground">Постов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.resources}</div>
                    <div className="text-sm text-muted-foreground">Ресурсов</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-2xl font-bold">{earnedCount}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Трофеев</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalPoints}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Очков</div>
                  </div>
                </div>
                
                {/* User Level */}
                <div className="mt-3 max-w-xs">
                  <UserLevelBadge postCount={stats.posts + stats.topics} reputation={totalPoints} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reputation & Trophies Sidebar */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <ReputationDisplay 
            userId={profile?.id} 
            isOwnProfile={isOwnProfile} 
            currentUserId={currentUser?.id}
          />
          <TrophyShowcase
            achievements={achievementsWithProgress}
            totalPoints={totalPoints}
            earnedCount={earnedCount}
            totalCount={totalCount}
            compact={true}
          />
        </div>

        {/* Tabs with Content */}
        <Tabs defaultValue="topics" className="mt-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="topics">Темы</TabsTrigger>
            <TabsTrigger value="posts">Сообщения</TabsTrigger>
            <TabsTrigger value="resources">Ресурсы</TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="h-4 w-4 mr-2" />
              Трофеи
            </TabsTrigger>
            <TabsTrigger value="quests">
              🎯 Задания
            </TabsTrigger>
            <TabsTrigger value="warnings">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Предупреждения
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="topics" className="space-y-4 mt-4">
            {topics.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Нет тем
                </CardContent>
              </Card>
            ) : (
              topics.map((topic) => (
                <Card
                  key={topic.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/topic/${topic.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{topic.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(topic.categories as any)?.name} •{" "}
                          {formatDistanceToNow(new Date(topic.created_at), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </p>
                      </div>
                      <Badge variant="outline">{topic.views} просмотров</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-4 mt-4">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Нет сообщений
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card
                  key={post.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/topic/${(post.topics as any)?.id}`)}
                >
                  <CardHeader>
                    <p className="text-sm text-muted-foreground mb-2">
                      В теме: {(post.topics as any)?.title}
                    </p>
                    <p className="text-sm line-clamp-3">{post.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-4 mt-4">
            {resources.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Нет ресурсов
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {resources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge>{resource.resource_type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {resource.downloads} загрузок
                        </span>
                      </div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(resource.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4 mt-4">
            {isLoadingAchievements ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Загрузка трофеев...
                </CardContent>
              </Card>
            ) : achievementsWithProgress.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Трофеев пока нет
                </CardContent>
              </Card>
            ) : (
              <TrophyShowcase
                achievements={achievementsWithProgress}
                totalPoints={totalPoints}
                earnedCount={earnedCount}
                totalCount={totalCount}
              />
            )}
          </TabsContent>

          {/* Quests Tab */}
          <TabsContent value="quests" className="mt-4">
            {isOwnProfile ? (
              <DailyQuestsWidget userId={currentUser?.id} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Задания доступны только на вашем собственном профиле
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Warnings Tab */}
          <TabsContent value="warnings" className="space-y-4 mt-4">
            {/* Moderator actions */}
            {canModerate && !isOwnProfile && profile?.id && currentUser?.id && (
              <div className="flex justify-end mb-4">
                <WarningDialog
                  targetUserId={profile.id}
                  targetUsername={profile.username}
                  moderatorId={currentUser.id}
                />
              </div>
            )}
            
            {/* Warnings list - visible to own user or moderators */}
            {(isOwnProfile || canModerate) && profile?.id ? (
              <WarningsList userId={profile.id} showNotes={canModerate} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Предупреждения доступны только владельцу профиля и модераторам
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab - Only for own profile */}
          {isOwnProfile && currentUser && (
            <TabsContent value="settings" className="space-y-6 mt-4">
              <TwoFactorSettings userId={currentUser.id} />
              
              {/* Custom Title Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Кастомный префикс роли
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Вы можете задать свой собственный префикс вместо стандартного названия роли.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="custom-title">Текст префикса</Label>
                    <Input
                      id="custom-title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Например: Основатель, Эксперт..."
                      maxLength={30}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-title-color">Цвет префикса</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        id="custom-title-color"
                        value={customTitleColor}
                        onChange={(e) => setCustomTitleColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border"
                      />
                      <Input
                        value={customTitleColor}
                        onChange={(e) => setCustomTitleColor(e.target.value)}
                        className="w-32"
                      />
                      {customTitle && (
                        <Badge style={{ backgroundColor: customTitleColor }} className="text-white">
                          {customTitle}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from("profiles")
                            .update({
                              custom_title: customTitle || null,
                              custom_title_color: customTitleColor || null,
                            })
                            .eq("id", currentUser.id);
                          if (error) throw error;
                          setProfile({ ...profile, custom_title: customTitle || null, custom_title_color: customTitleColor || null });
                          toast({ title: "Префикс обновлён" });
                        } catch (error: any) {
                          toast({ title: "Ошибка", description: error.message, variant: "destructive" });
                        }
                      }}
                    >
                      Сохранить
                    </Button>
                    {customTitle && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from("profiles")
                              .update({ custom_title: null, custom_title_color: null })
                              .eq("id", currentUser.id);
                            if (error) throw error;
                            setCustomTitle("");
                            setProfile({ ...profile, custom_title: null, custom_title_color: null });
                            toast({ title: "Префикс сброшен" });
                          } catch (error: any) {
                            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
                          }
                        }}
                      >
                        Сбросить
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Username CSS Decoration (XenForo-style) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paintbrush className="h-5 w-5" />
                    Украшение никнейма (CSS)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Украсьте свой никнейм с помощью CSS! Ваш стилизованный ник будет отображаться везде на форуме: в темах, постах, ресурсах и профиле.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="username-css">CSS код для никнейма</Label>
                    <Textarea
                      id="username-css"
                      value={usernameCss}
                      onChange={(e) => setUsernameCss(e.target.value)}
                      placeholder={`Примеры:\ncolor: #ff6b6b;\ntext-shadow: 0 0 10px #ff0000;\n\nГрадиент:\nbackground: linear-gradient(90deg, #ff6b6b, #ffd93d);\n-webkit-background-clip: text;\n-webkit-text-fill-color: transparent;`}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  {usernameCss && (
                    (() => {
                      const preview = sanitizeUsernameCss(usernameCss, "profile-preview");
                      return (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Предпросмотр:</p>
                          {preview.keyframes && <style dangerouslySetInnerHTML={{ __html: preview.keyframes }} />}
                          <span className="text-lg font-bold inline-block" style={preview.style}>
                            {username}
                          </span>
                        </div>
                      );
                    })()
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from("profiles")
                            .update({ username_css: usernameCss || null } as any)
                            .eq("id", currentUser.id);
                          if (error) throw error;
                          setProfile({ ...profile, username_css: usernameCss || null });
                          toast({ title: "Стиль никнейма сохранён!" });
                        } catch (error: any) {
                          toast({ title: "Ошибка", description: error.message, variant: "destructive" });
                        }
                      }}
                    >
                      Сохранить стиль
                    </Button>
                    {usernameCss && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from("profiles")
                              .update({ username_css: null } as any)
                              .eq("id", currentUser.id);
                            if (error) throw error;
                            setUsernameCss("");
                            setProfile({ ...profile, username_css: null });
                            toast({ title: "Стиль никнейма сброшен" });
                          } catch (error: any) {
                            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
                          }
                        }}
                      >
                        Сбросить
                      </Button>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground space-y-1">
                    <p className="font-medium">💡 Примеры популярных стилей:</p>
                    <p><code>color: #e74c3c; text-shadow: 0 0 5px rgba(231,76,60,0.5);</code> — красное свечение</p>
                    <p><code>background: linear-gradient(90deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;</code> — градиент</p>
                    <p><code>color: gold; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);</code> — золотой</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Гильдии
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userGuilds.length === 0 ? (
                    <p className="text-muted-foreground">Вы не состоите ни в одной гильдии</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userGuilds.map((membership) => membership.guilds && (
                        <ProfileGuildBadge
                          key={membership.id}
                          guild={membership.guilds}
                          role={membership.role}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Push-уведомления</CardTitle>
                </CardHeader>
                <CardContent>
                  <PushNotificationToggle userId={currentUser.id} />
                </CardContent>
              </Card>

              {/* Signature Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSignature className="h-5 w-5" />
                    Подпись (XenForo-стиль)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signature-enabled">Показывать подпись под постами</Label>
                    <Switch
                      id="signature-enabled"
                      checked={signatureEnabled}
                      onCheckedChange={setSignatureEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signature">Текст подписи (до 200 символов)</Label>
                    <Textarea
                      id="signature"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Ваша подпись под постами..."
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {signature.length}/200
                    </p>
                  </div>
                  <Button onClick={handleSignatureUpdate} size="sm">
                    Сохранить подпись
                  </Button>
                  
                  {signature && signatureEnabled && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Предпросмотр:</p>
                      <div className="pt-2 border-t border-dashed text-sm text-muted-foreground italic">
                        {signature}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Banner Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Баннер профиля
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Баннер отображается в вашем профиле под обложкой
                  </p>
                  
                  {bannerUrl && (
                    <div className="rounded-lg overflow-hidden border">
                      <img src={bannerUrl} alt="Profile banner" className="w-full h-24 object-cover" />
                    </div>
                  )}
                  
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {bannerUrl ? "Изменить баннер" : "Загрузить баннер"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleBannerUpload}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Рекомендуемый размер: 728x90 пикселей (формат баннера)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
        
        {/* Guild Badges under profile header */}
        {userGuilds.length > 0 && !isOwnProfile && (
          <Card className="mt-4">
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-2">
                {userGuilds.map((membership) => membership.guilds && (
                  <ProfileGuildBadge
                    key={membership.id}
                    guild={membership.guilds}
                    role={membership.role}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Verification Request Form */}
        {isOwnProfile && currentUser && (
          <VerificationRequestForm
            open={showVerificationForm}
            onOpenChange={setShowVerificationForm}
            userId={currentUser.id}
          />
        )}
      </main>
    </div>
  );
};

export default Profile;
