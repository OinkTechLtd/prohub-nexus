import CodeForumHeader from "@/components/CodeForumHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CodeForumRules = () => {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <CodeForumHeader user={user} />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-6">Правила Code Forum</h1>
        <div className="bg-[#16213e] border border-[#1a1a3e] rounded-lg p-6 space-y-4 text-sm text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">1. Общие правила</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Форум посвящён программированию и разработке ПО.</li>
              <li>Запрещены оскорбления, флуд, спам, а также распространение вредоносного ПО.</li>
              <li>Все публикации проходят автоматическую и ручную модерацию.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">2. Контент</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Публикуйте только материалы, связанные с IT и программированием.</li>
              <li>Используйте BBCode для форматирования кода.</li>
              <li>Запрещено размещение пиратского контента или ссылок на него.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">3. Аккаунты</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Один пользователь — один аккаунт.</li>
              <li>Запрещены мультиаккаунты и боты (кроме системных).</li>
              <li>Администрация вправе заблокировать аккаунт за нарушения.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">4. Модерация</h2>
            <p>Модераторы имеют право скрывать, редактировать или удалять контент, нарушающий правила. Решения модераторов могут быть обжалованы через обращение к администрации.</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CodeForumRules;
