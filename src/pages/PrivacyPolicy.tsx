import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PrivacyPolicy = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Политика конфиденциальности</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Последнее обновление: 1 апреля 2026 г.</p>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">1. Общие положения</h2>
            <p>ProHub Nexus Forum (далее — «Форум», «мы») уважает вашу конфиденциальность и стремится защитить ваши персональные данные. Настоящая Политика описывает, какие данные мы собираем, как их используем и защищаем.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">2. Какие данные мы собираем</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Регистрационные данные:</strong> имя пользователя, адрес электронной почты, пароль (в зашифрованном виде)</li>
              <li><strong>Данные профиля:</strong> аватар, биография, подпись, кастомный заголовок</li>
              <li><strong>Контент:</strong> темы, посты, ресурсы, видео, сообщения в чате</li>
              <li><strong>Технические данные:</strong> IP-адрес (хеш), user-agent, данные о присутствии онлайн</li>
              <li><strong>Данные безопасности:</strong> секреты 2FA (TOTP), история входов</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">3. Как мы используем данные</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Обеспечение работы форума и предоставление функциональности</li>
              <li>Аутентификация и безопасность аккаунта</li>
              <li>Модерация контента и борьба со спамом</li>
              <li>Персонализация рекламы (на основе интересов)</li>
              <li>Начисление репутации и достижений</li>
              <li>Отправка уведомлений о действиях на форуме</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">4. Защита данных</h2>
            <p>Мы применяем следующие меры безопасности:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Обязательная двухфакторная аутентификация (2FA) для всех пользователей</li>
              <li>Шифрование паролей и секретных данных</li>
              <li>Row-Level Security (RLS) на уровне базы данных</li>
              <li>Защита аккаунтов администраторов от несанкционированных изменений</li>
              <li>Автоматическая модерация контента с использованием AI</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">5. Cookies и отслеживание</h2>
            <p>Мы используем необходимые cookies для аутентификации и хранения сессии. Мы не используем сторонние трекеры или аналитические сервисы, собирающие персональные данные.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">6. Передача данных третьим лицам</h2>
            <p>Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением случаев, предусмотренных законодательством.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">7. Ваши права</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Доступ к своим данным через настройки профиля</li>
              <li>Редактирование и удаление личной информации</li>
              <li>Запрос на удаление аккаунта — свяжитесь с администрацией</li>
              <li>Отключение персонализированной рекламы</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-3">8. Контакты</h2>
            <p>По вопросам конфиденциальности обращайтесь к администрации форума через личные сообщения или в нашем <a href="https://vk.com/prohub_forum" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ВК-сообществе</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
