// Supabase Edge Function (Deno) — proxy delgado sobre la función Postgres
// create_chat() (SECURITY DEFINER), que hace el trabajo real: genera el código,
// aplica rate-limit por usuario y crea la sala + participante. La lógica vive en
// la base (no acá) para que sea imposible saltearla insertando directo en `chats`
// desde el cliente — chats/chat_participants no tienen policy de insert directo.
import { createClient } from "npm:@supabase/supabase-js@2";

// El navegador manda un preflight OPTIONS antes del POST real (porque el
// request lleva headers custom como Authorization) — sin responder ese OPTIONS
// con estos headers, el navegador bloquea la respuesta entera con CORS error,
// aunque el POST en sí hubiera funcionado bien.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase.rpc("create_chat").single();
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
