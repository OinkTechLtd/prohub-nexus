import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  Shield, 
  Zap, 
  Globe, 
  Code, 
  Heart,
  ExternalLink,
  ArrowRight
} from "lucide-react";

interface TeamMember {
  id: string;
  username: string;
  avatar_url: string | null;
  role: 'admin' | 'moderator' | 'editor';
}

const Landing = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState({ users: 0, topics: 0, posts: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTeamAndStats();
  }, []);

  const loadTeamAndStats = async () => {
    try {
      // Load team members (admins, moderators, editors)
      const { data: teamData } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          avatar_url,
          user_roles!inner(role)
        `)
        .in("user_roles.role", ["admin", "moderator", "editor"]);

      if (teamData) {
        const uniqueMembers = new Map<string, TeamMember>();
        teamData.forEach((member: any) => {
          if (!uniqueMembers.has(member.id)) {
            uniqueMembers.set(member.id, {
              id: member.id,
              username: member.username,
              avatar_url: member.avatar_url,
              role: member.user_roles[0]?.role || 'editor'
            });
          }
        });
        setTeamMembers(Array.from(uniqueMembers.values()));
      }

      // Load stats
      const [usersCount, topicsCount, postsCount] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("topics").select("*", { count: "exact", head: true }).eq("is_hidden", false),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("is_hidden", false)
      ]);

      setStats({
        users: usersCount.count || 0,
        topics: topicsCount.count || 0,
        posts: postsCount.count || 0
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'moderator': return 'Модератор';
      case 'editor': return 'Редактор';
      default: return 'Участник';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'moderator': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'editor': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleTeamMemberClick = (username: string) => {
    navigate(`/profile/${username}`);
  };

  const goToForum = () => {
    navigate("/forum");
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Активные обсуждения",
      description: "Десятки тем для обсуждения каждый день"
    },
    {
      icon: Shield,
      title: "Безопасность",
      description: "Защита данных и модерация 24/7"
    },
    {
      icon: Zap,
      title: "Быстрая загрузка",
      description: "Современная платформа без лагов"
    },
    {
      icon: Globe,
      title: "Русскоязычное комьюнити",
      description: "Общайся на родном языке"
    },
    {
      icon: Code,
      title: "IT-тематика",
      description: "Программирование, разработка, технологии"
    },
    {
      icon: Heart,
      title: "Дружелюбное сообщество",
      description: "Помощь новичкам и опытным"
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Decorative circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-10 right-10 w-20 h-20 border border-primary/30 rounded-sm" />
        <div className="absolute bottom-20 left-10 w-16 h-16 border border-primary/20 rounded-sm" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Добро пожаловать в сообщество</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-primary">ProHub</span>
            <br />
            <span className="text-foreground">Nexsus</span>
            {" "}
            <span className="text-primary">Forum</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Присоединяйся к лучшему русскоязычному форуму. Общайся, делись знаниями и находи единомышленников.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              onClick={goToForum}
              className="gap-2 px-8"
            >
              Перейти на форум
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Узнать больше
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div className="text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl md:text-3xl font-bold text-primary">{stats.users}+</div>
              <div className="text-sm text-muted-foreground">Участников</div>
            </div>
            <div className="text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl md:text-3xl font-bold text-primary">{stats.topics + stats.posts}+</div>
              <div className="text-sm text-muted-foreground">Сообщений</div>
            </div>
            <div className="text-center">
              <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl md:text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Модерация</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Почему
              <span className="text-primary"> ProHub</span>?
            </h2>
            <p className="text-muted-foreground text-lg">
              Всё что нужно для комфортного общения в одном месте
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
                onClick={goToForum}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-24 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Наша
              <span className="text-primary"> Команда</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Познакомьтесь с людьми, которые делают форум лучше каждый день
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">Загрузка команды...</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {teamMembers.map((member) => (
                <Card 
                  key={member.id}
                  className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => handleTeamMemberClick(member.username)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 mb-4 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                          {member.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg mb-2">{member.username}</h3>
                      <Badge 
                        variant="outline" 
                        className={`${getRoleColor(member.role)}`}
                      >
                        {getRoleName(member.role)}
                      </Badge>
                      <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Открыть профиль</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            О <span className="text-primary">проекте</span>
          </h2>
          
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-8 md:p-12">
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              ProHub Nexsus Forum — это современная платформа для общения IT-специалистов и энтузиастов.
              Мы создали пространство, где каждый может делиться знаниями, получать помощь и находить единомышленников.
              Наш форум отличается быстрой работой, удобным интерфейсом и активным сообществом.
            </p>
            
            <div className="border-t border-border/50 pt-8">
              <p className="text-sm text-muted-foreground mb-2">Создано и поддерживается</p>
              <p className="text-xl font-semibold text-primary">TOO Oink Tech Ltd Co</p>
            </div>
          </div>

          <Button 
            size="lg" 
            onClick={goToForum}
            className="mt-12 gap-2 px-8"
          >
            Присоединиться к форуму
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ProHub Nexsus Forum. Все права защищены.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Разработано TOO Oink Tech Ltd Co
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
