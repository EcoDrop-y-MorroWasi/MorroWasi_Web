// Supabase Edge Function (Deno) — proxy delgado sobre la función Postgres
// create_chat() (SECURITY DEFINER), que hace el trabajo real: genera el código,
// aplica rate-limit por usuario y crea la sala + participante. La lógica vive en
// la base (no acá) para que sea imposible saltearla insertando directo en `chats`
// desde el cliente — chats/chat_participants no tienen policy de insert directo.
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
  }

  const { data, error } = await supabase.rpc("create_chat").single();
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
