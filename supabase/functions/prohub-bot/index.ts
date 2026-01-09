import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROHUB_BOT_ID = "b7a8e202-40a2-467d-a4de-c416eff4a488";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data } = await req.json();

    switch (action) {
      case "notify_hidden_content": {
        // Отправить ЛС пользователю о скрытии контента
        const { userId, contentType, contentId, reason, moderatorId } = data;
        
        // Получить ник модератора
        const { data: moderator } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", moderatorId)
          .single();

        // Получить название контента
        let contentTitle = "";
        let contentTable = contentType === "topic" ? "topics" : 
                          contentType === "post" ? "posts" : 
                          contentType === "resource" ? "resources" : "videos";
        
        const { data: content } = await supabase
          .from(contentTable)
          .select("title, content")
          .eq("id", contentId)
          .single();
        
        contentTitle = content?.title || content?.content?.substring(0, 50) || "Контент";

        const message = `⚠️ Ваш контент был скрыт модерацией.

📌 Тип: ${contentType === "topic" ? "Тема" : contentType === "post" ? "Пост" : contentType === "resource" ? "Ресурс" : "Видео"}
📝 Название: ${contentTitle}
❌ Причина: ${reason}
👤 Модератор: ${moderator?.username || "Система"}

Если вы считаете это ошибкой, обратитесь к администрации.`;

        // Создать или найти чат с пользователем
        const { data: chatId } = await supabase.rpc("create_private_chat", {
          _user1: PROHUB_BOT_ID,
          _user2: userId,
        });

        // Отправить сообщение
        await supabase.from("messages").insert({
          chat_id: chatId,
          user_id: PROHUB_BOT_ID,
          content: message,
        });

        // Записать в лог бота
        await supabase.from("bot_messages").insert({
          target_user_id: userId,
          message_type: "content_hidden",
          content: message,
          related_content_type: contentType,
          related_content_id: contentId,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "award_pro_status": {
        // Выдать статус Профи и поздравить
        const { userId } = data;

        // Проверить, что у пользователя ещё нет роли pro
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "pro")
          .single();

        if (existingRole) {
          return new Response(JSON.stringify({ success: false, reason: "already_pro" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Выдать роль pro
        await supabase.from("user_roles").insert({
          user_id: userId,
          role: "pro",
        });

        // Получить имя пользователя
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .single();

        const message = `🎉 Поздравляем, ${profile?.username}!

Вам присвоен статус «Профи» за высокую репутацию и вклад в сообщество.

Теперь вы можете:
• Получить больше доверия от других пользователей
• Ваши ответы будут приоритетнее в обсуждениях
• Претендовать на роль редактора или модератора

Спасибо за ваш вклад! 🚀`;

        // Создать чат и отправить сообщение
        const { data: chatId } = await supabase.rpc("create_private_chat", {
          _user1: PROHUB_BOT_ID,
          _user2: userId,
        });

        await supabase.from("messages").insert({
          chat_id: chatId,
          user_id: PROHUB_BOT_ID,
          content: message,
        });

        await supabase.from("bot_messages").insert({
          target_user_id: userId,
          message_type: "pro_awarded",
          content: message,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "analyze_mod_application": {
        // Проанализировать заявку на модератора
        const { applicationId, experience, onlineTime, contribution, userId } = data;

        if (!LOVABLE_API_KEY) {
          throw new Error("LOVABLE_API_KEY not configured");
        }

        // Получить статистику пользователя
        const { data: reputation } = await supabase
          .from("user_reputation")
          .select("*")
          .eq("user_id", userId)
          .single();

        const { count: topicsCount } = await supabase
          .from("topics")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_hidden", false);

        const { count: postsCount } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_hidden", false);

        const { count: resourcesCount } = await supabase
          .from("resources")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_hidden", false);

        const { data: profile } = await supabase
          .from("profiles")
          .select("created_at, username")
          .eq("id", userId)
          .single();

        const daysOnForum = profile?.created_at 
          ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `Ты помощник администрации IT-форума ProHub. Анализируй заявки на модератора/редактора.

Критерии оценки:
- Минимум 30 дней на форуме
- Активность: темы, посты, ресурсы
- Репутация и лайки
- Качество заявки (опыт, мотивация, вклад)

Возможные решения:
- "Рекомендую на модератора" - если опыт и активность высокие
- "Рекомендую на редактора" - если активность средняя, но потенциал есть
- "Пока рано" - если мало активности или времени на форуме
- "Отклонить" - если заявка некачественная или подозрительная

Отвечай кратко: решение + 1-2 предложения обоснования.`
              },
              {
                role: "user",
                content: `Заявка от ${profile?.username}:

📊 Статистика:
- Дней на форуме: ${daysOnForum}
- Тем создано: ${topicsCount || 0}
- Постов: ${postsCount || 0}
- Ресурсов: ${resourcesCount || 0}
- Репутация: ${reputation?.reputation_points || 0}
- Лайков получено: ${reputation?.likes_received || 0}

📝 Заявка:
Опыт: ${experience || "Не указан"}
Время онлайн: ${onlineTime || "Не указано"}
Вклад: ${contribution || "Не указан"}`
              }
            ],
          }),
        });

        const aiData = await response.json();
        const recommendation = aiData.choices?.[0]?.message?.content || "Не удалось проанализировать";

        // Обновить заявку
        await supabase
          .from("moderator_applications")
          .update({
            ai_recommendation: recommendation,
            ai_analyzed_at: new Date().toISOString(),
          })
          .eq("id", applicationId);

        return new Response(JSON.stringify({ success: true, recommendation }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "check_pro_eligibility": {
        // Проверить пользователей на соответствие статусу Pro
        const { data: users } = await supabase
          .from("user_reputation")
          .select("user_id, reputation_points, likes_received")
          .gte("reputation_points", 100)
          .gte("likes_received", 10);

        const awarded: string[] = [];

        for (const user of users || []) {
          // Проверить, нет ли уже роли pro
          const { data: existingPro } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", user.user_id)
            .in("role", ["pro", "editor", "moderator", "admin"])
            .limit(1);

          if (!existingPro || existingPro.length === 0) {
            // Вызвать award_pro_status
            await supabase.functions.invoke("prohub-bot", {
              body: { action: "award_pro_status", data: { userId: user.user_id } },
            });
            awarded.push(user.user_id);
          }
        }

        return new Response(JSON.stringify({ success: true, awarded }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("ProHub bot error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
