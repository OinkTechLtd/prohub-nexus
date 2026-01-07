import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SLTV_API = "https://sltvid.lovable.app";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const redirectUri = url.searchParams.get("redirect_uri");

    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("SLTV_CLIENT_ID")!;
    const clientSecret = Deno.env.get("SLTV_CLIENT_SECRET")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Exchange code for token
    const tokenRes = await fetch(`${SLTV_API}/api/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri || `${supabaseUrl}/functions/v1/sltv-callback`,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token exchange failed:", errText);
      return new Response(JSON.stringify({ error: "Token exchange failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;

    // Get user info from SLTV
    const userRes = await fetch(`${SLTV_API}/api/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      console.error("Userinfo failed:", errText);
      return new Response(JSON.stringify({ error: "Failed to get user info" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sltvUser = await userRes.json();
    const email = sltvUser.email || `${sltvUser.id}@sltv.id`;
    const username = sltvUser.username || sltvUser.name || `sltv_${sltvUser.id}`;

    // Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;
    let session: any;

    if (existingUser) {
      // Sign in existing user by generating a magic link or using admin API
      const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: redirectUri || "/" },
      });

      if (signInError) throw signInError;
      userId = existingUser.id;
      
      // Return the magic link for frontend to handle
      return new Response(JSON.stringify({ 
        success: true, 
        user_id: userId,
        token_hash: signInData.properties?.hashed_token,
        verification_type: "magiclink",
        redirect_to: redirectUri || "/"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Create new user
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { username, provider: "sltv", sltv_id: sltvUser.id },
      });

      if (createError) throw createError;
      userId = newUser.user.id;

      // Update profile with SLTV info
      await supabase.from("profiles").update({
        username,
        avatar_url: sltvUser.avatar_url || sltvUser.picture || null,
      }).eq("id", userId);

      // Generate magic link for sign-in
      const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: redirectUri || "/" },
      });

      if (signInError) throw signInError;

      return new Response(JSON.stringify({ 
        success: true, 
        user_id: userId,
        token_hash: signInData.properties?.hashed_token,
        verification_type: "magiclink",
        redirect_to: redirectUri || "/"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("SLTV Callback error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
