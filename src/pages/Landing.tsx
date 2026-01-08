import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
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
  bio: string | null;
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
      // Load team members (admins, moderators, editors) with their highest role
      const { data: teamData } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          avatar_url,
          bio,
          user_roles!inner(role)
        `)
        .in("user_roles.role", ["admin", "moderator", "editor"]);

      if (teamData) {
        const memberRolesMap = new Map<string, TeamMember>();
        
        teamData.forEach((member: any) => {
          const roles = member.user_roles as { role: string }[];
          
          // Determine highest role for this member
          let highestRole: 'admin' | 'moderator' | 'editor' = 'editor';
          const roleOrder: Record<string, number> = { admin: 3, moderator: 2, editor: 1 };
          
          for (const r of roles) {
            if (r.role === 'admin' && roleOrder['admin'] > roleOrder[highestRole]) {
              highestRole = 'admin';
            } else if (r.role === 'moderator' && roleOrder['moderator'] > roleOrder[highestRole]) {
              highestRole = 'moderator';
            }
          }
          
          // Only update if not already set or if current role is higher
          const existing = memberRolesMap.get(member.id);
          if (!existing) {
            memberRolesMap.set(member.id, {
              id: member.id,
              username: member.username,
              avatar_url: member.avatar_url,
              bio: member.bio,
              role: highestRole
            });
          } else {
            // Update to higher role if needed
            if (roleOrder[highestRole] > roleOrder[existing.role]) {
              memberRolesMap.set(member.id, { ...existing, role: highestRole });
            }
          }
        });
        
        // Sort by role priority (admin first, then moderator, then editor)
        const sortedMembers = Array.from(memberRolesMap.values()).sort((a, b) => {
          const roleOrder = { admin: 3, moderator: 2, editor: 1 };
          return roleOrder[b.role] - roleOrder[a.role];
        });
        
        setTeamMembers(sortedMembers);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  const scaleVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Decorative circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" 
        />
        <div className="absolute top-10 right-10 w-20 h-20 border border-primary/30 rounded-sm" />
        <div className="absolute bottom-20 left-10 w-16 h-16 border border-primary/20 rounded-sm" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Добро пожаловать в сообщество</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-primary">ProHub</span>
            <br />
            <span className="text-foreground">Nexsus</span>
            {" "}
            <span className="text-primary">Forum</span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Присоединяйся к лучшему русскоязычному форуму. Общайся, делись знаниями и находи единомышленников.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
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
          </motion.div>

          {/* Stats */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-3 gap-8 max-w-md mx-auto"
          >
            <motion.div variants={scaleVariants} className="text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl md:text-3xl font-bold text-primary">{stats.users}+</div>
              <div className="text-sm text-muted-foreground">Участников</div>
            </motion.div>
            <motion.div variants={scaleVariants} className="text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl md:text-3xl font-bold text-primary">{stats.topics + stats.posts}+</div>
              <div className="text-sm text-muted-foreground">Сообщений</div>
            </motion.div>
            <motion.div variants={scaleVariants} className="text-center">
              <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl md:text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Модерация</div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold mb-4">
              Почему
              <span className="text-primary"> ProHub</span>?
            </motion.h2>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg">
              Всё что нужно для комфортного общения в одном месте
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card 
                  className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all cursor-pointer group h-full"
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-24 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold mb-4">
              Наша
              <span className="text-primary"> Команда</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg">
              Познакомьтесь с людьми, которые делают форум лучше каждый день
            </motion.p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">Загрузка команды...</div>
          ) : (
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {teamMembers.map((member, index) => (
                <motion.div key={member.id} variants={itemVariants}>
                  <Card 
                    className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all cursor-pointer group h-full"
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
                          className={`${getRoleColor(member.role)} mb-3`}
                        >
                          {getRoleName(member.role)}
                        </Badge>
                        {member.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {member.bio}
                          </p>
                        )}
                        <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Открыть профиль</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="relative py-24 px-4">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold mb-8">
            О <span className="text-primary">проекте</span>
          </motion.h2>
          
          <motion.div 
            variants={scaleVariants}
            className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-8 md:p-12"
          >
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              ProHub Nexsus Forum — это современная платформа для общения IT-специалистов и энтузиастов.
              Мы создали пространство, где каждый может делиться знаниями, получать помощь и находить единомышленников.
              Наш форум отличается быстрой работой, удобным интерфейсом и активным сообществом.
            </p>
            
            <div className="border-t border-border/50 pt-8">
              <p className="text-sm text-muted-foreground mb-2">Создано и поддерживается</p>
              <p className="text-xl font-semibold text-primary">TOO Oink Tech Ltd Co</p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button 
              size="lg" 
              onClick={goToForum}
              className="mt-12 gap-2 px-8"
            >
              Присоединиться к форуму
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
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
