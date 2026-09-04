-- Sync de progreso local por código de acceso corto — alternativa a pedir
-- email/Google para tener el progreso en más de un dispositivo. El código
-- (8 caracteres, alfabeto de 32 símbolos sin ambiguos) se genera en el
-- cliente: 32^8 (~1.1e12) combinaciones posibles, muy por encima del código
-- numérico de 6 dígitos de chats (900.000) que sí necesitó rate limit contra
-- fuerza bruta — acá alcanza con validar formato y limitar el tamaño del payload.
--
-- La tabla no tiene policies de select/insert/update para anon: solo se toca
-- a través de get_progress_sync()/save_progress_sync() (SECURITY DEFINER),
-- igual que join_chat_by_code() en 0003.

create table if not exists progress_sync (
  code text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table progress_sync enable row level security;

create or replace function get_progress_sync(p_code text)
returns table (data jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_code !~ '^[A-Z0-9]{8}$' then
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
  if p_code !~ '^[A-Z0-9]{8}$' then
    raise exception 'código inválido';
  end if;

  -- Tope generoso (progreso es un puñado de números + listas cortas) para que
  -- nadie use esto como blob storage gratis.
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

revoke all on function get_progress_sync(text) from public;
revoke all on function save_progress_sync(text, jsonb) from public;
grant execute on function get_progress_sync(text) to anon, authenticated;
grant execute on function save_progress_sync(text, jsonb) to anon, authenticated;
