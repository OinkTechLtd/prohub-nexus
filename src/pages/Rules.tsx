import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

const Rules = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Правила форума</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">1. Общие правила</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Уважайте других участников сообщества</li>
              <li>Запрещены оскорбления, угрозы и любая форма дискриминации</li>
              <li>Запрещён спам, флуд и бессмысленные сообщения</li>
              <li>Запрещена реклама без использования рекламного сервиса форума</li>
              <li>Запрещено размещение вредоносного ПО и фишинговых ссылок</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">2. Контент</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Публикуйте контент в соответствующих категориях</li>
              <li>Используйте информативные заголовки для тем</li>
              <li>Запрещён NSFW-контент и контент, нарушающий законодательство РФ</li>
              <li>При публикации чужих ресурсов указывайте автора и источник</li>
              <li>Запрещено создание дублирующих тем</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">3. Безопасность аккаунта</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Двухфакторная аутентификация (2FA) обязательна для всех пользователей</li>
              <li>Запрещена передача аккаунта третьим лицам</li>
              <li>Запрещено создание мультиаккаунтов</li>
              <li>Используйте надёжный пароль</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">4. Система предупреждений</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>5 баллов</strong> — бан на 1 день</li>
              <li><strong>7 баллов</strong> — бан на 7 дней</li>
              <li><strong>10 баллов</strong> — бан на 30 дней</li>
              <li><strong>15 баллов</strong> — перманентный бан</li>
            </ul>
            <p className="mt-2 text-muted-foreground">Баллы предупреждений истекают со временем. Администрация оставляет за собой право выдать бан без предупреждений в особо тяжких случаях.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">5. Модерация</h2>
            <p>Решения модераторов являются окончательными. Если вы не согласны с решением модератора, вы можете обратиться к администрации. Злоупотребление системой жалоб будет наказываться.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">6. Изменения правил</h2>
            <p>Администрация оставляет за собой право изменять правила форума в любое время. Пользователи будут уведомлены об изменениях через объявления.</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Rules;
