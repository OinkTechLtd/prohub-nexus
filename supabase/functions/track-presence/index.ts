import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common robot user agents
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
    
    const { session_id, user_id, current_page, user_agent } = await req.json();
    
    if (!session_id) {
      throw new Error('session_id is required');
    }

    const userType = detectUserType(user_agent || '', user_id);
    
    // Hash IP for privacy (we don't actually have IP here, so we use session as proxy)
    const ipHash = btoa(session_id).substring(0, 16);
    
    // Upsert presence
    const { error } = await supabase
      .from('online_presence')
      .upsert({
        session_id,
        user_id: user_id || null,
        user_type: userType,
        current_page: current_page || '/',
        last_seen_at: new Date().toISOString(),
        user_agent: user_agent || 'Unknown',
        ip_hash: ipHash
      }, {
        onConflict: 'session_id'
      });

    if (error) throw error;

    // Clean up old sessions (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await supabase
      .from('online_presence')
      .delete()
      .lt('last_seen_at', fiveMinutesAgo);

    // Get current counts
    const { data: presenceData } = await supabase
      .from('online_presence')
      .select('user_type, user_id, current_page')
      .gt('last_seen_at', fiveMinutesAgo);

    const counts = {
      users: 0,
      guests: 0,
      robots: 0,
      total: 0
    };

    const userIds: string[] = [];
    for (const p of presenceData || []) {
      if (p.user_type === 'user') {
        counts.users++;
        if (p.user_id) userIds.push(p.user_id);
      }
      else if (p.user_type === 'guest') counts.guests++;
      else if (p.user_type === 'robot') counts.robots++;
      counts.total++;
    }

    // Get usernames for logged-in users
    let usernames: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
      
      for (const p of profiles || []) {
        usernames[p.id] = p.username;
      }
    }

    // Build online users list
    const onlineUsers = (presenceData || []).slice(0, 20).map(p => ({
      user_type: p.user_type,
      username: p.user_id ? usernames[p.user_id] : undefined,
      current_page: p.current_page
    }));

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
