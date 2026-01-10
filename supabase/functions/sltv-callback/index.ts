import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

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

    console.log("SLTV Callback - code:", code ? "present" : "missing", "redirectUri:", redirectUri);

    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("SLTV_CLIENT_ID");
    const clientSecret = Deno.env.get("SLTV_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret) {
      console.error("Missing SLTV credentials");
      return new Response(JSON.stringify({ error: "SLTV not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange code for token - updated endpoint
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri || `${supabaseUrl}/functions/v1/sltv-callback`,
      client_id: clientId,
      client_secret: clientSecret,
    });

    console.log("SLTV Token request to:", `${SLTV_API}/oauth/token`);

    const tokenRes = await fetch(`${SLTV_API}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token exchange failed:", tokenRes.status, errText);
      return new Response(JSON.stringify({ error: "Token exchange failed", details: errText }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;
    console.log("SLTV Token received:", accessToken ? "yes" : "no");

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "No access token received" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user info from SLTV - updated endpoint
    const userRes = await fetch(`${SLTV_API}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      console.error("Userinfo failed:", userRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to get user info" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sltvUser = await userRes.json();
    console.log("SLTV User:", JSON.stringify(sltvUser));
    
    const email = sltvUser.email || `${sltvUser.sub || sltvUser.id}@sltv.local`;
    const username = sltvUser.preferred_username || sltvUser.username || sltvUser.name || `sltv_${sltvUser.sub || sltvUser.id}`;

    // Supabase admin client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Check if user exists by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log("Existing user found:", userId);
    } else {
      // Create new user
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { username, provider: "sltv", sltv_id: sltvUser.sub || sltvUser.id },
      });

      if (createError) {
        console.error("Create user error:", createError);
        throw createError;
      }
      
      userId = newUser.user.id;
      console.log("New user created:", userId);

      // Update profile with SLTV info
      await supabase.from("profiles").update({
        username,
        avatar_url: sltvUser.picture || sltvUser.avatar_url || null,
      }).eq("id", userId);
    }

    // Generate magic link for sign-in
    const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: redirectUri || "/" },
    });

    if (signInError) {
      console.error("Generate link error:", signInError);
      throw signInError;
    }

    console.log("Magic link generated, token_hash present:", !!signInData.properties?.hashed_token);

    return new Response(JSON.stringify({ 
      success: true, 
      user_id: userId,
      token_hash: signInData.properties?.hashed_token,
      verification_type: "magiclink",
      redirect_to: redirectUri || "/"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("SLTV Callback error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
