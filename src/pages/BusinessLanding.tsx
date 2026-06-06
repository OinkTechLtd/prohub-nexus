import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import { Building2, BadgeCheck, Link2, Users, BarChart3, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

const features = [
  { icon: BadgeCheck, title: "Верифицированный бренд", text: "Галочка от админов и защита от подделок." },
  { icon: Link2, title: "Ссылка в профиле", text: "Своя кликабельная ссылка с подписью." },
  { icon: Users, title: "До 20 аккаунтов", text: "Управляй несколькими брендами с одного логина." },
  { icon: BarChart3, title: "Статистика просмотров", text: "Считаем посетителей профиля бренда." },
  { icon: ShieldCheck, title: "Без сброса никнейма", text: "Бренд-аккаунт постоянный — никнейм не сбрасывается." },
  { icon: Sparkles, title: "Кастомизация", text: "Обложка, аватарка, описание — как у личного профиля." },
];

export default function BusinessLanding() {
  return (
    <div className="min-h-screen bg-background">
      <Header user={null} />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-background pointer-events-none" />
          <div className="container mx-auto px-4 py-16 sm:py-24 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                <Building2 className="h-3.5 w-3.5" /> ProHub для бизнеса
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
                Представь свой бренд<br /> на ProHub
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                Создавай официальные аккаунты бренда — как организации на GitHub.
                Публикуй темы, ресурсы и комментарии от имени компании, а не личного аккаунта.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/brands">Создать бренд-аккаунт <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/faq">Узнать больше</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">Возможности бренд-аккаунта</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <Card key={f.title} className="hover:border-primary/60 transition">
                <CardContent className="p-6">
                  <f.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">Готов запустить бренд?</h2>
            <p className="mt-2 text-muted-foreground">Бесплатно. До 20 аккаунтов на одного пользователя.</p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/brands">Перейти к управлению</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
