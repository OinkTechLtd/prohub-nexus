// Возвращает публичные конфиги (например, Turnstile site key) — безопасно для клиента.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(
    JSON.stringify({
      turnstileSiteKey: Deno.env.get("CLOUDFLARE_TURNSTILE_SITE_KEY") || null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
