-- El cliente decidía "quién gana" en un sync comparando el lastModified de
-- cada dispositivo (Date.now() local, guardado dentro del jsonb de p_data).
-- Un reloj de dispositivo mal puesto puede pisar progreso más nuevo sin pasar
-- por el camino de "conflicto". get_progress_sync() ya devolvía updated_at
-- (puesto por el propio Postgres con now(), no por el cliente), pero
-- save_progress_sync() no lo devolvía, así que el cliente no tenía forma de
-- anotar "mi progreso quedó sincronizado con ESTE now() del servidor" tras un
-- push. Con eso, progressSync.ts puede dejar de comparar relojes de
-- dispositivos entre sí y comparar en cambio contra el now() del servidor.

drop function if exists save_progress_sync(text, jsonb);

create function save_progress_sync(p_code text, p_data jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_at timestamptz;
begin
  if p_code !~ '^[A-Za-z0-9]{10}$' then
    raise exception 'código inválido';
  end if;

  if pg_column_size(p_data) > 20000 then
    raise exception 'payload demasiado grande';
  end if;

  insert into progress_sync (code, data, updated_at)
  values (p_code, p_data, now())
  on conflict (code) do update
    set data = excluded.data,
        updated_at = excluded.updated_at
  returning progress_sync.updated_at into v_updated_at;

  return v_updated_at;
end;
$$;

revoke all on function save_progress_sync(text, jsonb) from public;
grant execute on function save_progress_sync(text, jsonb) to anon, authenticated;
