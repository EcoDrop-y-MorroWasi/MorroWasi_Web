-- Completa "Eliminar cuenta" (Perfil.tsx): antes solo borraba el respaldo de
-- progress_sync y limpiaba localStorage — el ranking público y los mensajes
-- de chat de esa persona sobrevivían para siempre. Esta migración agrega lo
-- que faltaba, sin tocar datos de terceros:
--   1) RPC para borrar la entrada del ranking (leaderboard_entries), que se
--      lleva en cascada leaderboard_events (FK on delete cascade, ver 0009).
--   2) Policies de DELETE para que cada quien pueda borrar SOLO sus propios
--      mensajes, su propia fila de participación y sus propias advertencias
--      de moderación — nunca la sala entera ni los mensajes de otros.

-- ----------------------------------------------------------------------------
-- 1) Ranking: borrar la propia entrada
-- ----------------------------------------------------------------------------
-- Mismo control de identidad que submit_leaderboard_score(): el secret es lo
-- único que prueba que quien llama es el dueño del profile_id (no hay login
-- real, cualquiera con la anon key puede invocar el RPC con cualquier
-- profile_id). Sin este chequeo, cualquiera podría borrar el ranking de otro.
create or replace function delete_leaderboard_entry(
  p_profile_id text,
  p_secret text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from leaderboard_entries
  where profile_id = p_profile_id and secret = p_secret;
  -- Si no hay fila (nunca compartió puntaje) o el secret no coincide, no pasa
  -- nada — no es un error, "Eliminar cuenta" no debe fallar por esto.
end;
$$;

revoke all on function delete_leaderboard_entry(text, text) from public;
grant execute on function delete_leaderboard_entry(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2) Chat: borrar solo lo propio
-- ----------------------------------------------------------------------------
-- messages: cada quien borra sus propios mensajes. La sala y los mensajes de
-- los demás participantes quedan intactos — solo desaparece lo que esa
-- persona escribió, el resto del hilo sigue legible para quien quede.
drop policy if exists "borrar mensajes propios" on messages;
create policy "borrar mensajes propios" on messages for delete
  using (sender_id = auth.uid());

-- chat_participants: salir de las salas donde participaba. No borra la sala
-- ni afecta al resto — si el creador se borra y era el único participante que
-- quedaba, la sala igual se limpia sola por el cron de "chats vencidos" (0001).
drop policy if exists "salir de la propia participacion" on chat_participants;
create policy "salir de la propia participacion" on chat_participants for delete
  using (user_id = auth.uid());

-- chat_warnings: limpia el propio historial de advertencias de moderación.
drop policy if exists "borrar advertencias propias" on chat_warnings;
create policy "borrar advertencias propias" on chat_warnings for delete
  using (user_id = auth.uid());
