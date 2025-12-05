import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ROBOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /googlebot/i, /bingbot/i, /yandex/i,
  /baidu/i, /duckduckbot/i, /slurp/i, /facebookexternalhit/i, /linkedinbot/i,
  /twitterbot/i, /pinterest/i, /semrush/i, /ahrefsbot/i, /mj12bot/i
];

function detectUserType(userAgent: string, userId?: string): string {
  if (userId) return 'user';
  for (const pattern of ROBOT_PATTERNS) {
    if (pattern.test(userAgent)) return 'robot';
  }
  return 'guest';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { session_id, user_id, current_page, user_agent, search_query } = await req.json();
    
    if (!session_id) {
      throw new Error('session_id is required');
    }

    const userType = detectUserType(user_agent || '', user_id);
    const ipHash = btoa(session_id).substring(0, 16);
    
    // Include search query in current_page if searching
    const pageInfo = search_query ? `${current_page}?search=${search_query}` : current_page;
    
    const { error } = await supabase
      .from('online_presence')
      .upsert({
        session_id,
        user_id: user_id || null,
        user_type: userType,
        current_page: pageInfo || '/',
        last_seen_at: new Date().toISOString(),
        user_agent: user_agent || 'Unknown',
        ip_hash: ipHash
      }, { onConflict: 'session_id' });

    if (error) throw error;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await supabase.from('online_presence').delete().lt('last_seen_at', fiveMinutesAgo);

    const { data: presenceData } = await supabase
      .from('online_presence')
      .select('user_type, user_id, current_page')
      .gt('last_seen_at', fiveMinutesAgo);

    const counts = { users: 0, guests: 0, robots: 0, total: 0 };
    const userIds: string[] = [];
    
    for (const p of presenceData || []) {
      if (p.user_type === 'user') { counts.users++; if (p.user_id) userIds.push(p.user_id); }
      else if (p.user_type === 'guest') counts.guests++;
      else if (p.user_type === 'robot') counts.robots++;
      counts.total++;
    }

    let usernames: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);
      for (const p of profiles || []) { usernames[p.id] = p.username; }
    }

    const onlineUsers = (presenceData || []).slice(0, 20).map(p => {
      const page = p.current_page || '/';
      const searchMatch = page.match(/\?search=(.+)$/);
      return {
        user_type: p.user_type,
        username: p.user_id ? usernames[p.user_id] : undefined,
        current_page: searchMatch ? page.replace(searchMatch[0], '') : page,
        search_query: searchMatch ? decodeURIComponent(searchMatch[1]) : undefined
      };
    });

    return new Response(JSON.stringify({ success: true, counts, onlineUsers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in track-presence:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
