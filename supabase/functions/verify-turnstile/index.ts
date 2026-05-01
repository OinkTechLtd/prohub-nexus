// Проверка CloudFlare Turnstile токена на сервере
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Missing token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secret = Deno.env.get("CLOUDFLARE_TURNSTILE_SECRET_KEY");
    if (!secret) {
      // Если ключ не настроен — пропускаем (не блокируем продакшен)
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    const remoteIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for");
    if (remoteIp) form.append("remoteip", remoteIp.split(",")[0].trim());

    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body: form,
    });
    const data = await resp.json();

    return new Response(JSON.stringify({ success: !!data.success, data }), {
      status: data.success ? 200 : 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
