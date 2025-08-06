import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

type DestinationCode = {
  destination_url: string;
};

type ShareWithCode = {
  destination_codes: DestinationCode;
};

// @ts-ignore Supabase functions serve deno natively
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "Missing code" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    // @ts-ignore Supabase functions serve deno natively
    Deno.env.get("SUPABASE_URL")!,
    // @ts-ignore Supabase functions serve deno natively
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  // 1. Check public share first
  const { data: publicShare } = await supabase
    .from("destination_code_shares")
    .select("destination_codes!inner(destination_url)")
    .eq("destination_codes.code", code)
    .eq("destination_codes.active", true)
    .eq("is_public", true)
    .eq("active", true)
    .or("expires_at.is.null,expires_at.gt.now()")
    .single();

  if (publicShare) {
    return new Response(
      JSON.stringify({
        redirect: publicShare.destination_codes.destination_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 2. Check auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ requiresAuth: true }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

  if (!user) {
    return new Response(JSON.stringify({ requiresAuth: true }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. Check user's access
  const { data: userShare } = await supabase
    .from("destination_code_shares")
    .select("destination_codes!inner(destination_url)")
    .eq("destination_codes.code", code)
    .eq("destination_codes.active", true)
    .eq("user_id", user.id)
    .eq("active", true)
    .or("expires_at.is.null,expires_at.gt.now()")
    .single();

  if (userShare) {
    return new Response(
      JSON.stringify({ redirect: userShare.destination_codes.destination_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ expired: true }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
