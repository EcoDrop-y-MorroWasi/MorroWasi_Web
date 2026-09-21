// Borra usuarios anónimos de Supabase Auth que nunca usaron el chat (única
// actividad real atada a auth.uid() — progress_sync/leaderboard usan su
// propio código de sync, no la sesión de Supabase, ver progressSync.ts).
//
// Requiere la service_role key porque borrar de auth.users solo es posible
// vía la Admin API (auth.admin.deleteUser) — nunca desde el cliente, nunca
// con un RPC normal, nunca con un DELETE directo a la tabla. SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase solo en cada Edge Function,
// no hace falta configurarlos a mano.
//
// Disparada por cron (.github/workflows/cleanup-usuarios-huerfanos.yml) con
// un secreto compartido en el header x-cron-secret — sin esto, cualquiera con
// la URL pública de la función podría gatillar el borrado.
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Método no permitido", { status: 405 });
  }

  const secretEsperado = Deno.env.get("CRON_SECRET");
  if (!secretEsperado || req.headers.get("x-cron-secret") !== secretEsperado) {
    return new Response("No autorizado", { status: 401 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: candidatos, error } = await admin.rpc("listar_usuarios_huerfanos", { p_dias: 30 });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let borrados = 0;
  const fallidos: string[] = [];
  for (const u of (candidatos ?? []) as { id: string }[]) {
    const { error: delError } = await admin.auth.admin.deleteUser(u.id);
    if (delError) fallidos.push(u.id);
    else borrados += 1;
  }

  return new Response(
    JSON.stringify({ candidatos: candidatos?.length ?? 0, borrados, fallidos: fallidos.length }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
