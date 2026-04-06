import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Code, Users, MessageSquare, ArrowRight } from "lucide-react";

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
        supabase.from("topics").select("*", { count: "exact", head: true }).eq("is_hidden", false),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("is_hidden", false),
      ]);
      setStats({ users: usersRes.count || 0, topics: topicsRes.count || 0, posts: postsRes.count || 0 });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <header className="border-b border-[#16213e] bg-[#0f0f23]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/codeforum")}>
            <Code className="h-6 w-6 text-emerald-400" />
            <span className="text-lg font-bold text-white">CF</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white text-xs sm:text-sm px-2 sm:px-3" onClick={() => navigate("/codeforum/forum")}>
              Форум
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white text-xs sm:text-sm px-2 sm:px-3" onClick={() => navigate("/forum")}>
              ProHub
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm px-2 sm:px-3" onClick={() => navigate("/auth")}>
              Вход
            </Button>
          </nav>
        </div>
      </header>

      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-4">
              Добро пожаловать на <span className="text-emerald-400">CODE FORUM</span>!
            </h1>
            <p className="text-sm sm:text-lg text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              На этом форуме вы можете найти полезные ресурсы, поделиться опытом и получить помощь
            </p>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate("/auth")}>
              Зарегистрироваться!
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 border-t border-[#16213e]">
        <div className="container mx-auto">
          <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center sm:text-left">
            Code Forum — Форум о программировании
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            {[
              { icon: Users, count: stats.users, label: "Пользователей" },
              { icon: MessageSquare, count: stats.topics, label: "Тем" },
              { icon: MessageSquare, count: stats.posts, label: "Сообщений" },
            ].map((item) => (
              <Card key={item.label} className="bg-[#16213e] border-[#1a1a3e]">
                <CardContent className="p-3 sm:p-4 text-center">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-emerald-400" />
                  <p className="text-lg sm:text-2xl font-bold text-white">{item.count}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button onClick={() => navigate("/codeforum/forum")} className="bg-emerald-600 hover:bg-emerald-700">
              Перейти на форум <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-4 border-t border-[#16213e]">
        <div className="container mx-auto">
          <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">Система ролей</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            {[
              { name: "Новичок", color: "bg-gray-600", desc: "Начальный уровень" },
              { name: "Профи", color: "bg-green-600", desc: "Активный участник" },
              { name: "Продвинутый", color: "bg-blue-600", desc: "Опытный пользователь" },
              { name: "Редактор", color: "bg-purple-600", desc: "Модерирует контент" },
              { name: "Модератор", color: "bg-red-600", desc: "Управление форумом" },
            ].map((role) => (
              <Card key={role.name} className="bg-[#16213e] border-[#1a1a3e]">
                <CardContent className="p-2 sm:p-3 text-center">
                  <Badge className={`${role.color} text-white mb-1 sm:mb-2 text-[10px] sm:text-xs`}>{role.name}</Badge>
                  <p className="text-[10px] sm:text-xs text-gray-400">{role.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-3 sm:mt-4">
            ProHub: Редактор → Продвинутый, Модератор → Редактор, Администратор → Модератор
          </p>
        </div>
      </section>

      <footer className="border-t border-[#16213e] py-4 sm:py-6 px-4 text-center text-xs sm:text-sm text-gray-500 space-y-2">
        <p>Code Forum — Development Of Forums by <span className="text-emerald-400 cursor-pointer" onClick={() => navigate("/")}>ProHub Nexsus Forum</span></p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={() => navigate("/codeforum/rules")} className="hover:text-emerald-400 transition-colors">Правила</button>
          <span>•</span>
          <button onClick={() => navigate("/codeforum/privacy")} className="hover:text-emerald-400 transition-colors">Конфиденциальность</button>
          <span>•</span>
          <button onClick={() => navigate("/codeforum/terms")} className="hover:text-emerald-400 transition-colors">Условия использования</button>
        </div>
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
