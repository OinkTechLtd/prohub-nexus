import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch latest topics with user profiles and category info
    const { data: topics, error } = await supabase
      .from('topics')
      .select(`
        id,
        title,
        content,
        created_at,
        updated_at,
        views,
        profiles!topics_user_id_fkey (username),
        categories!topics_category_id_fkey (name, slug)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }

    // Get base URL from request
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // Generate RSS feed
    const rssItems = topics?.map(topic => {
      const topicUrl = `${baseUrl}/topic/${topic.id}`;
      const pubDate = new Date(topic.created_at).toUTCString();
      const categories = topic.categories as any;
      const profiles = topic.profiles as any;
      const categoryName = (Array.isArray(categories) ? categories[0]?.name : categories?.name) || 'Общее';
      const username = (Array.isArray(profiles) ? profiles[0]?.username : profiles?.username) || 'Аноним';
      
      // Strip HTML and truncate content for description
      const description = topic.content
        .replace(/<[^>]*>/g, '')
        .substring(0, 200) + '...';

      return `
    <item>
      <title><![CDATA[${topic.title}]]></title>
      <link>${topicUrl}</link>
      <guid isPermaLink="true">${topicUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <category><![CDATA[${categoryName}]]></category>
      <author><![CDATA[${username}]]></author>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    }).join('') || '';

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ProHub - Форум разработчиков</title>
    <link>${baseUrl}</link>
    <description>Сообщество разработчиков и профессионалов - последние темы и обсуждения</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

    return new Response(rssFeed, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
