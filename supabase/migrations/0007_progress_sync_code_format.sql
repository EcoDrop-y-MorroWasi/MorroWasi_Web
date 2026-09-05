-- El código de sync pasa de 8 a 10 caracteres y ahora incluye minúsculas
-- (más variedad visual) — el cliente ya no genera solo mayúsculas+dígitos.
-- Sube el espacio de combinaciones y hace el código sensible a mayúsculas/
-- minúsculas: get_progress_sync/save_progress_sync deben aceptar el nuevo
-- formato en vez del `^[A-Z0-9]{8}$` de 0006.

create or replace function get_progress_sync(p_code text)
returns table (data jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_code !~ '^[A-Za-z0-9]{10}$' then
    raise exception 'código inválido';
  end if;

  return query
  select progress_sync.data, progress_sync.updated_at
  from progress_sync
  where progress_sync.code = p_code;
end;
$$;

create or replace function save_progress_sync(p_code text, p_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
        updated_at = excluded.updated_at;
end;
$$;
