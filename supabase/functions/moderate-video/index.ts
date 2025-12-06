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
            content: `Ты модератор IT-форума ProHub. Твоя задача - определить, подходит ли видео для форума разработчиков.

ДОПУСТИМЫЕ видео (approve = true):
- Туториалы и обучающие материалы по программированию
- Обзоры технологий, инструментов, языков программирования
- Разработка игр, приложений, сайтов
- IT новости и обзоры
- Полезные советы для разработчиков
- Обзоры сервисов и платформ для разработки
- Видео о DevOps, системном администрировании
- Проекты с открытым исходным кодом

НЕДОПУСТИМЫЕ видео (approve = false):
- TikTok репосты без образовательной ценности
- Развлекательный контент без связи с IT
- Спам, реклама без ценности
- Оскорбительный или взрослый контент
- Политика, религия (кроме технических аспектов)
- Бессмысленные названия типа "Кек", "Лол", вопросы типа "согласны?"

Ответь ТОЛЬКО в формате JSON:
{"approve": true/false, "reason": "краткая причина решения"}`
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
