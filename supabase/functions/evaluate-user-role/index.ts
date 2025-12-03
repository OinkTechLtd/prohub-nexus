import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { user_id, action } = await req.json();
    
    if (action === 'evaluate_all') {
      // Evaluate multiple users for role upgrades
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username')
        .limit(50);
      
      if (usersError) throw usersError;
      
      const results = [];
      
      for (const user of users || []) {
        const evaluation = await evaluateUser(supabase, LOVABLE_API_KEY, user.id);
        if (evaluation) results.push(evaluation);
      }
      
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!user_id) {
      throw new Error('user_id is required');
    }

    const evaluation = await evaluateUser(supabase, LOVABLE_API_KEY, user_id);
    
    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in evaluate-user-role:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function evaluateUser(supabase: any, apiKey: string, userId: string) {
  // Get user stats
  const [
    { data: profile },
    { count: topicsCount },
    { count: postsCount },
    { count: resourcesCount },
    { count: videosCount },
    { data: currentRole },
    { data: reputation }
  ] = await Promise.all([
    supabase.from('profiles').select('username, created_at').eq('id', userId).single(),
    supabase.from('topics').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_hidden', false),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_hidden', false),
    supabase.from('resources').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_hidden', false),
    supabase.from('videos').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_hidden', false),
    supabase.rpc('get_user_role', { _user_id: userId }),
    supabase.from('user_reputation').select('*').eq('user_id', userId).single()
  ]);

  if (!profile) return null;

  const daysSinceJoin = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
  
  const userStats = {
    username: profile.username,
    topics: topicsCount || 0,
    posts: postsCount || 0,
    resources: resourcesCount || 0,
    videos: videosCount || 0,
    days_active: daysSinceJoin,
    current_role: currentRole || 'newbie',
    reputation_points: reputation?.reputation_points || 0,
    likes_received: reputation?.likes_received || 0
  };

  // Skip if already admin or moderator
  if (['admin', 'moderator'].includes(userStats.current_role)) {
    return null;
  }

  // Ask AI to evaluate
  const prompt = `Ты - система оценки пользователей форума ProHub Nexus. Проанализируй активность пользователя и определи, заслуживает ли он повышения роли.

Текущая статистика пользователя "${userStats.username}":
- Текущая роль: ${userStats.current_role}
- Создано тем: ${userStats.topics}
- Написано постов: ${userStats.posts}
- Добавлено ресурсов: ${userStats.resources}
- Загружено видео: ${userStats.videos}
- Дней на форуме: ${userStats.days_active}
- Очки репутации: ${userStats.reputation_points}
- Получено лайков: ${userStats.likes_received}

Иерархия ролей (от низшей к высшей):
1. newbie - новичок (начальная роль)
2. pro - профессионал (активный пользователь, минимум 20 постов/тем)
3. editor - редактор (надежный пользователь с качественным контентом, минимум 50 постов + 10 ресурсов)
4. moderator - модератор (очень активный редактор с отличной репутацией, минимум 100 постов + 50 ресурсов + 200 лайков)

Правила:
- Повышение возможно только на одну ступень выше текущей роли
- Учитывай качество (ресурсы и видео важнее простых постов)
- Случайность: иногда можно повысить при чуть меньших показателях (10% шанс)

Ответь в формате JSON:
{
  "should_upgrade": true/false,
  "suggested_role": "newbie/pro/editor/moderator",
  "reason": "краткое объяснение на русском"
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Ты - AI система оценки пользователей. Отвечай только в формате JSON.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return null;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const evaluation = JSON.parse(jsonMatch[0]);
    
    // Save evaluation to database
    await supabase.from('ai_role_evaluations').insert({
      user_id: userId,
      suggested_role: evaluation.suggested_role,
      reason: evaluation.reason,
      was_applied: false
    });

    // Apply role upgrade if suggested
    if (evaluation.should_upgrade && evaluation.suggested_role !== userStats.current_role) {
      const roleHierarchy = ['newbie', 'pro', 'editor', 'moderator'];
      const currentIndex = roleHierarchy.indexOf(userStats.current_role);
      const suggestedIndex = roleHierarchy.indexOf(evaluation.suggested_role);
      
      // Only allow upgrade by one level
      if (suggestedIndex === currentIndex + 1) {
        await supabase.from('user_roles').insert({
          user_id: userId,
          role: evaluation.suggested_role,
          assigned_at: new Date().toISOString()
        }).onConflict('user_id, role').ignore();
        
        // Mark as applied
        await supabase.from('ai_role_evaluations')
          .update({ was_applied: true })
          .eq('user_id', userId)
          .eq('suggested_role', evaluation.suggested_role)
          .order('evaluated_at', { ascending: false })
          .limit(1);
      }
    }

    return {
      user_id: userId,
      username: userStats.username,
      ...evaluation
    };
  } catch (error) {
    console.error('Error evaluating user:', error);
    return null;
  }
}
