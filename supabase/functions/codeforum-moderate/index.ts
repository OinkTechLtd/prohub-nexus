import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  action: z.enum(["hide", "show"]),
  contentType: z.enum(["topic", "post"]),
  contentId: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !serviceRoleKey || !authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: authData } = await supabase.auth.getUser(token);
    const user = authData.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, contentType, contentId, reason } = parsed.data;

    const [{ data: cfRoles }, { data: phRoles }] = await Promise.all([
      supabase.from("codeforum_roles").select("role").eq("user_id", user.id),
      supabase.from("user_roles").select("role, can_moderate_topics").eq("user_id", user.id),
    ]);

    const canModerateCodeForum = (cfRoles || []).some((entry) => ["editor", "moderator"].includes(entry.role)) ||
      (phRoles || []).some((entry) => entry.role === "admin" || (entry.role === "moderator" && entry.can_moderate_topics));

    if (!canModerateCodeForum) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hidden = action === "hide";

    if (contentType === "topic") {
      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .select("id, category_id")
        .eq("id", contentId)
        .single();

      if (topicError || !topic) {
        return new Response(JSON.stringify({ error: "Topic not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: category } = await supabase
        .from("categories")
        .select("forum_id")
        .eq("id", topic.category_id)
        .single();

      if (!category || category.forum_id !== "codeforum") {
        return new Response(JSON.stringify({ error: "Content does not belong to Code Forum" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabase.from("topics").update({ is_hidden: hidden }).eq("id", contentId);
      if (updateError) throw updateError;
    }

    if (contentType === "post") {
      const { data: post, error: postError } = await supabase
        .from("posts")
        .select("id, topic_id")
        .eq("id", contentId)
        .single();

      if (postError || !post) {
        return new Response(JSON.stringify({ error: "Post not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: topic } = await supabase
        .from("topics")
        .select("category_id")
        .eq("id", post.topic_id)
        .single();

      const { data: category } = topic
        ? await supabase.from("categories").select("forum_id").eq("id", topic.category_id).single()
        : { data: null };

      if (!category || category.forum_id !== "codeforum") {
        return new Response(JSON.stringify({ error: "Content does not belong to Code Forum" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabase.from("posts").update({ is_hidden: hidden }).eq("id", contentId);
      if (updateError) throw updateError;
    }

    await supabase.from("moderated_content").insert({
      content_type: contentType,
      content_id: contentId,
      moderator_id: user.id,
      reason: reason || (hidden ? "Скрыто модератором Code Forum" : "Восстановлено модератором Code Forum"),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});