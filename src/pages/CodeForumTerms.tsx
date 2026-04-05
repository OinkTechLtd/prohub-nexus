import CodeForumHeader from "@/components/CodeForumHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CodeForumTerms = () => {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <CodeForumHeader user={user} />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-6">Условия использования</h1>
        <div className="bg-[#16213e] border border-[#1a1a3e] rounded-lg p-6 space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>Используя Code Forum, вы соглашаетесь с настоящими условиями.</p>
          <section>
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">1. Регистрация</h2>
            <p>При регистрации вы обязуетесь предоставлять достоверную информацию и нести ответственность за безопасность вашего аккаунта.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">2. Контент</h2>
            <p>Вы сохраняете авторские права на свой контент. Публикуя материалы, вы предоставляете форуму неисключительную лицензию на их отображение.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">3. Ответственность</h2>
            <p>Администрация не несёт ответственности за контент, размещённый пользователями. Каждый пользователь несёт персональную ответственность за свои публикации.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-emerald-400 mb-2">4. Прекращение доступа</h2>
            <p>Администрация вправе ограничить или прекратить доступ к форуму при нарушении правил без предварительного уведомления.</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CodeForumTerms;
