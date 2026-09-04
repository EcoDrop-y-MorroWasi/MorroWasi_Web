-- Rate limit para join_chat_by_code(): sin esto, un usuario autenticado podía
-- escribir un script probando los 900.000 códigos posibles (6 dígitos) hasta
-- encontrar una sala recién creada y colarse antes que la familia real.
-- Tope: 10 intentos fallidos por usuario cada 10 minutos, con backoff simple.

create table if not exists join_attempts (
  user_id uuid references auth.users not null,
  attempted_at timestamptz not null default now()
);

create index if not exists join_attempts_user_id_attempted_at_idx
  on join_attempts (user_id, attempted_at);

alter table join_attempts enable row level security;
-- Sin policies de select/insert/delete para authenticated: nadie lee ni escribe
-- esta tabla directamente, solo la toca join_chat_by_code() (SECURITY DEFINER).

create or replace function join_chat_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chat_id uuid;
  v_count int;
  v_intentos_recientes int;
begin
  -- Limpieza + conteo de intentos fallidos en la ventana de 10 minutos.
  delete from join_attempts where attempted_at < now() - interval '10 minutes';

  select count(*) into v_intentos_recientes
  from join_attempts
  where user_id = auth.uid();

  if v_intentos_recientes >= 10 then
    raise exception 'Demasiados intentos. Esperá unos minutos y volvé a intentar.';
  end if;

  select id into v_chat_id from chats where code = p_code and expires_at > now();

  if v_chat_id is null then
    insert into join_attempts (user_id) values (auth.uid());
    raise exception 'código inválido o expirado';
  end if;

  select count(*) into v_count from chat_participants where chat_id = v_chat_id;
  if v_count >= 2 and not exists (
    select 1 from chat_participants where chat_id = v_chat_id and user_id = auth.uid()
  ) then
    insert into join_attempts (user_id) values (auth.uid());
    raise exception 'sala llena';
  end if;

  insert into chat_participants (chat_id, user_id)
  values (v_chat_id, auth.uid())
  on conflict do nothing;

  return v_chat_id;
end;
$$;

revoke all on function join_chat_by_code(text) from public;
grant execute on function join_chat_by_code(text) to authenticated;
