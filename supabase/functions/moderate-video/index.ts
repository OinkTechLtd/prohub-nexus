import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Moderating video: "${title}"`);

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
            content: `Ты СТРОГИЙ модератор IT-форума ProHub. ТОЛЬКО видео о программировании и помощи разработчикам проходят модерацию.

✅ ДОПУСТИМО (approve = true) - ТОЛЬКО ЭТО:
- Туториалы по программированию (Python, JavaScript, Java, C++, и т.д.)
- Гайды по настройке dev-окружения
- Разбор алгоритмов и структур данных
- Обучение фреймворкам (React, Vue, Django, и т.д.)
- Решения задач и баги-фиксы
- Код-ревью и best practices
- DevOps: Docker, Kubernetes, CI/CD
- Разработка игр на движках (Unity, Unreal, Godot)
- Open source проекты с кодом

❌ НЕДОПУСТИМО (approve = false) - ВСЁ ОСТАЛЬНОЕ:
- Любой развлекательный контент
- Мемы, приколы, TikTok, Shorts
- Игровой контент БЕЗ разработки
- Обзоры гаджетов без программирования
- Новости без технической ценности
- Реклама, промо, заработок
- Личные влоги
- Бессмысленные названия: "кек", "лол", "??", "согласны?"
- Любой контент не связанный НАПРЯМУЮ с кодом/разработкой

Будь МАКСИМАЛЬНО строгим. При любом сомнении - отклоняй.

Ответь ТОЛЬКО JSON: {"approve": true/false, "reason": "причина"}`
          },
          {
            role: "user",
            content: `Название видео: "${title}"
Описание: "${description || "Описание отсутствует"}"`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("AI response:", content);

    // Parse AI response
    let result;
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Default to rejection if we can't parse
      result = { approve: false, reason: "Не удалось определить соответствие контента" };
    }

    console.log("Moderation result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in moderate-video function:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
