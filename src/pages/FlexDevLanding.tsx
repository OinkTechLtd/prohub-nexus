import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles, Zap, ShieldCheck, Rocket, ArrowRight, Users, MessageSquare, Package } from "lucide-react";
import FlexDevHeader from "@/components/FlexDevHeader";
import usePageBackground from "@/hooks/usePageBackground";

const FEATURES = [
  { icon: Zap,         title: "Молниеносно",     desc: "Оптимизировано для мгновенного отклика на любых устройствах." },
  { icon: ShieldCheck, title: "Безопасно",       desc: "2FA, модерация и защита от вредоносных ссылок из коробки." },
  { icon: Rocket,      title: "Для разработчиков", desc: "Ресурсы, гайды и обсуждения без воды." },
];

const ROLES = [
  { label: "Администратор",     grad: "from-fuchsia-500 to-pink-500" },
  { label: "Ст. администратор", grad: "from-purple-600 to-fuchsia-500" },
  { label: "Куратор",           grad: "from-cyan-500 to-blue-500" },
  { label: "Модератор",         grad: "from-cyan-600 to-cyan-400" },
  { label: "VIP",               grad: "from-amber-400 to-yellow-500" },
  { label: "Новенький",         grad: "from-slate-500 to-slate-400" },
];

const FlexDevLanding = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, topics: 0, resources: 0 });
  usePageBackground("#0a0118");

  useEffect(() => {
    (async () => {
      const [u, t, r] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("topics").select("*", { count: "exact", head: true }).eq("is_hidden", false),
        supabase.from("resources").select("*", { count: "exact", head: true }).eq("is_hidden", false),
      ]);
      setStats({ users: u.count ?? 0, topics: t.count ?? 0, resources: r.count ?? 0 });
    })();
  }, []);

  const enter = () => {
    localStorage.setItem("flexdev_visited", "1");
    navigate("/flexdev/forum");
  };

  return (
    <div className="min-h-screen bg-[#0a0118] text-slate-100 relative overflow-hidden">
      {/* neon backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-600/25 blur-[140px]" />
        <div className="absolute top-40 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-500/25 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[420px] w-[820px] rounded-full bg-purple-700/20 blur-[160px]" />
      </div>

      <FlexDevHeader />

      <section className="relative container mx-auto px-4 pt-14 sm:pt-24 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-200">
            <Sparkles className="h-3.5 w-3.5" /> Новый форум от ProHub
          </span>
          <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-300 to-cyan-400 drop-shadow-[0_0_28px_rgba(217,70,239,0.35)]">
              FlexDev
            </span>
            <br />
            <span className="text-slate-100">форум нового поколения</span>
          </h1>
          <p className="mt-5 mx-auto max-w-2xl text-base sm:text-lg text-slate-400">
            Неоновая тусовка разработчиков. Обсуждай, делись ресурсами и растёшь по ролям — от Новенького до Администратора.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={enter}
              className="bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white shadow-[0_0_32px_rgba(217,70,239,0.45)]"
            >
              Войти на форум <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-fuchsia-500/30 text-slate-200 hover:bg-fuchsia-500/10" onClick={() => navigate("/auth")}>
              Регистрация
            </Button>
          </div>
        </motion.div>

        {/* stats */}
        <div className="mt-12 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          {[
            { icon: Users,          n: stats.users,     l: "Разработчиков" },
            { icon: MessageSquare,  n: stats.topics,    l: "Обсуждений" },
            { icon: Package,        n: stats.resources, l: "Ресурсов" },
          ].map((s) => (
            <Card key={s.l} className="bg-white/5 border-fuchsia-500/20 backdrop-blur-md p-4">
              <s.icon className="mx-auto h-5 w-5 text-fuchsia-300" />
              <div className="mt-2 text-2xl font-bold text-white">{s.n}</div>
              <div className="text-xs text-slate-400">{s.l}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative container mx-auto px-4 py-12 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="bg-white/5 border-white/10 backdrop-blur-md p-6 hover:border-fuchsia-500/40 hover:shadow-[0_0_28px_rgba(217,70,239,0.2)] transition">
              <f.icon className="h-6 w-6 text-cyan-300" />
              <h3 className="mt-3 text-lg font-bold text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative container mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-center text-2xl sm:text-3xl font-black text-white">Префиксы ролей</h2>
        <p className="text-center text-sm text-slate-400 mt-2">Твой уровень заметен сразу — рядом с ником, в темах и профиле.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
          {ROLES.map((r) => (
            <span
              key={r.label}
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r ${r.grad} shadow-[0_0_18px_rgba(168,85,247,0.35)]`}
            >
              {r.label}
            </span>
          ))}
        </div>
      </section>

      <footer className="relative border-t border-white/5 mt-8 py-6 text-center text-xs text-slate-500">
        FlexDev — часть экосистемы ProHub · {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default FlexDevLanding;
