-- Encuentra usuarios anónimos de Supabase Auth sin ninguna actividad real.
--
-- Importante: NO hay relación entre auth.users y progress_sync/leaderboard_entries
-- — esa identidad vive en un código+secret generado en el dispositivo (ver
-- progressSync.ts), totalmente aparte de la sesión de Supabase. La ÚNICA
-- actividad real atada a auth.uid() es el chat (chats.created_by,
-- chat_participants.user_id, messages.sender_id). Por eso "huérfano" acá
-- significa: nunca fue participante de ningún chat.
--
-- PostgREST no expone el schema `auth`, así que este anti-join tiene que
-- vivir en una función SQL (que sí puede leer auth.users) — no se puede
-- armar desde el cliente ni desde un RPC común. Devuelve ids nomás: borrar
-- de auth.users de verdad requiere la Admin API (ver Edge Function
-- cleanup-orphaned-users), nunca un DELETE directo.
create or replace function listar_usuarios_huerfanos(p_dias int default 30)
returns table (id uuid, creado_en timestamptz)
language sql
security definer
set search_path = public, auth
as $$
  select u.id, u.created_at
  from auth.users u
  where u.is_anonymous = true
    and u.created_at < now() - make_interval(days => p_dias)
    and not exists (select 1 from chat_participants cp where cp.user_id = u.id)
  order by u.created_at
  limit 500; -- tope por corrida: no bloquear la función mucho tiempo de una
$$;

revoke all on function listar_usuarios_huerfanos(int) from public;
-- Solo la Edge Function (con la service_role key) puede llamarla — anon/authenticated
-- no tienen por qué poder enumerar auth.users de nadie, ni de sí mismos por acá.
grant execute on function listar_usuarios_huerfanos(int) to service_role;
