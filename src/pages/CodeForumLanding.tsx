import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Code, Users, MessageSquare, ArrowRight, ExternalLink } from "lucide-react";

const CodeForumLanding = () => {
  const [stats, setStats] = useState({ users: 0, topics: 0, posts: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, topicsRes, postsRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("topics").select("*", { count: "exact", head: true })
          .eq("is_hidden", false),
        supabase.from("posts").select("*", { count: "exact", head: true })
          .eq("is_hidden", false),
      ]);
      setStats({
        users: usersRes.count || 0,
        topics: topicsRes.count || 0,
        posts: postsRes.count || 0,
      });
    } catch (e) {
      console.error(e);
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
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={() => navigate("/codeforum/forum")}>
              Форум
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={() => navigate("/forum")}>
              ProHub
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={() => navigate("/auth")}>
              Вход
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/auth")}>
              Регистрация
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Добро пожаловать на{" "}
              <span className="text-emerald-400">CODE FORUM</span>!
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
              На этом форуме вы можете найти полезные ресурсы для вашего проекта,
              поделиться собственным опытом и получить помощь от участников
            </p>
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => navigate("/auth")}
            >
              Зарегистрироваться сейчас!
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-t border-[#16213e]">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Code Forum — Форум о программировании
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-[#16213e] border-[#1a1a3e]">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
                <p className="text-2xl font-bold text-white">{stats.users}</p>
                <p className="text-xs text-gray-400">Пользователей</p>
              </CardContent>
            </Card>
            <Card className="bg-[#16213e] border-[#1a1a3e]">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
                <p className="text-2xl font-bold text-white">{stats.topics}</p>
                <p className="text-xs text-gray-400">Тем</p>
              </CardContent>
            </Card>
            <Card className="bg-[#16213e] border-[#1a1a3e]">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
                <p className="text-2xl font-bold text-white">{stats.posts}</p>
                <p className="text-xs text-gray-400">Сообщений</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => navigate("/codeforum/forum")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Перейти на форум <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Role info */}
      <section className="py-12 px-4 border-t border-[#16213e]">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Система ролей Code Forum</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { name: "Новичок", color: "bg-gray-600", desc: "Начальный уровень" },
              { name: "Профи", color: "bg-green-600", desc: "Активный участник" },
              { name: "Продвинутый", color: "bg-blue-600", desc: "Опытный пользователь" },
              { name: "Редактор", color: "bg-purple-600", desc: "Модерирует контент" },
              { name: "Модератор", color: "bg-red-600", desc: "Управление форумом" },
            ].map((role) => (
              <Card key={role.name} className="bg-[#16213e] border-[#1a1a3e]">
                <CardContent className="p-3 text-center">
                  <Badge className={`${role.color} text-white mb-2`}>{role.name}</Badge>
                  <p className="text-xs text-gray-400">{role.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            Пользователи ProHub получают повышенную роль: Редактор → Продвинутый, Модератор → Редактор, Администратор → Модератор
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#16213e] py-6 px-4 text-center text-sm text-gray-500">
        <p>Code Forum — подфорум платформы <span className="text-emerald-400 cursor-pointer" onClick={() => navigate("/")}>ProHub Nexus</span></p>
        <p className="mt-1">
          ❤️ Made by{" "}
          <a href="https://freesoft.ru/gink-platforms" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
            Oink Platforms
          </a>
        </p>
      </footer>
    </div>
  );
};

export default CodeForumLanding;
