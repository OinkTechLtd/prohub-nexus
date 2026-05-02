// Возвращает публичные конфиги (например, Turnstile site key) — безопасно для клиента.
import { rateLimitGuard, tooManyResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { allowed } = await rateLimitGuard(req, "public-config", { limit: 120, windowSec: 60 });
  if (!allowed) return tooManyResponse(corsHeaders);

  return new Response(
    JSON.stringify({
      turnstileSiteKey: Deno.env.get("CLOUDFLARE_TURNSTILE_SITE_KEY") || null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
