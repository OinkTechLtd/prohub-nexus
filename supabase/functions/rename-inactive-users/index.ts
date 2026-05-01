// Cron edge function: переименовывает неактивных пользователей (>14 дней) в user-XXXXXX
// Должен вызываться через pg_cron + pg_net на ежедневной основе.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Получаем кандидатов через RPC (RPC внутри уже исключает защищённых)
    const { data: renamed, error } = await supabase.rpc("rename_inactive_users", { _days: 14 });
    if (error) throw error;

    // 2) Записываем историю смены ника — RPC сам этого не делает, но триггер log_username_change
    //    срабатывает на UPDATE profiles, поэтому история уже залогирована.

    return new Response(
      JSON.stringify({ ok: true, renamed_count: renamed ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("rename-inactive-users error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
