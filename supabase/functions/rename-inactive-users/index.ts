// Cron edge function: переименовывает неактивных пользователей (>14 дней) в user-XXXXXX
// + логирует каждый запуск в inactive_rename_runs (для админ-отчёта).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let triggered_by = "cron";
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("manual") === "1") triggered_by = "manual";
  } catch (_) { /* noop */ }

  try {
    const { data: renamed, error } = await supabase.rpc("rename_inactive_users", { _days: 14 });
    if (error) throw error;

    const duration_ms = Date.now() - startedAt;
    await supabase.from("inactive_rename_runs").insert({
      renamed_count: renamed ?? 0,
      duration_ms,
      triggered_by,
    });

    return new Response(
      JSON.stringify({ ok: true, renamed_count: renamed ?? 0, duration_ms }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const duration_ms = Date.now() - startedAt;
    const msg = (e as Error).message;
    await supabase.from("inactive_rename_runs").insert({
      renamed_count: 0,
      duration_ms,
      triggered_by,
      error: msg,
    });
    console.error("rename-inactive-users error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
