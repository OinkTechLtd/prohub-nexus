// Shared rate-limit helper for edge functions.
// Использует Postgres-функцию check_rate_limit. Возвращает true если запрос разрешён.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function rateLimitGuard(
  req: Request,
  endpoint: string,
  opts: { limit?: number; windowSec?: number } = {}
): Promise<{ allowed: boolean; ipHash: string }> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
          || req.headers.get("cf-connecting-ip")
          || "unknown";
  const ipHash = await sha256Hex(ip + ":" + (Deno.env.get("SUPABASE_URL") ?? ""));

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await sb.rpc("check_rate_limit", {
      _ip_hash: ipHash,
      _endpoint: endpoint,
      _limit: opts.limit ?? 60,
      _window_seconds: opts.windowSec ?? 60,
    });
    if (error) {
      console.error("rate_limit error", error);
      return { allowed: true, ipHash }; // fail-open чтобы не сломать прод
    }
    return { allowed: !!data, ipHash };
  } catch (e) {
    console.error("rate_limit exception", e);
    return { allowed: true, ipHash };
  }
}

export function tooManyResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ ok: false, error: "Слишком много запросов. Попробуйте через несколько минут." }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "300" } }
  );
}
