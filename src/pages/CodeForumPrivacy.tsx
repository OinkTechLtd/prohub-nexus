import CodeForumHeader from "@/components/CodeForumHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CodeForumPrivacy = () => {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <CodeForumHeader user={user} />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-6">Политика конфиденциальности</h1>
        <div className="bg-[#16213e] border border-[#1a1a3e] rounded-lg p-6 space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>Code Forum (подразделение ProHub Nexus) собирает и обрабатывает персональные данные в соответствии с действующим законодательством.</p>
          <section>
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">Какие данные мы собираем</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email-адрес при регистрации</li>
              <li>Имя пользователя (логин)</li>
              <li>Контент, публикуемый на форуме</li>
              <li>Техническая информация (IP-адрес, user-agent)</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">Как мы используем данные</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Для авторизации и идентификации пользователей</li>
              <li>Для модерации контента</li>
              <li>Для улучшения сервиса</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">Ваши права</h2>
            <p>Вы можете запросить удаление ваших данных, обратившись к администрации форума.</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CodeForumPrivacy;
