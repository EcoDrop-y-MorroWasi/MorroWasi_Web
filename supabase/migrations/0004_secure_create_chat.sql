-- Hallazgo: la policy "crear chat propio" dejaba insertar en `chats` directo desde
-- el cliente (con created_by = auth.uid()), lo que permitía saltarse por completo
-- el generador de código server-side de la Edge Function y meter cualquier código
-- a mano. Se cierra: toda la creación de sala pasa a una función SECURITY DEFINER
-- (mismo patrón que join_chat_by_code), con su propio rate-limit, y se elimina la
-- policy de insert directo — solo esta función puede escribir en `chats`/`chat_participants`
-- en el flujo de creación.

create table if not exists create_attempts (
  user_id uuid references auth.users not null,
  attempted_at timestamptz not null default now()
);

create index if not exists create_attempts_user_id_attempted_at_idx
  on create_attempts (user_id, attempted_at);

alter table create_attempts enable row level security;
-- Sin policies: nadie lee ni escribe esta tabla directo, solo create_chat().

create or replace function create_chat()
returns table (id uuid, code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_code text;
  v_expires_at timestamptz;
  v_intentos_recientes int;
  i int;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  delete from create_attempts where attempted_at < now() - interval '10 minutes';

  select count(*) into v_intentos_recientes
  from create_attempts
  where user_id = auth.uid();

  if v_intentos_recientes >= 5 then
    raise exception 'Demasiadas salas creadas. Esperá unos minutos y volvé a intentar.';
  end if;

  insert into create_attempts (user_id) values (auth.uid());

  v_expires_at := now() + interval '1 day';
  v_id := null;

  for i in 1..5 loop
    v_code := floor(100000 + random() * 900000)::int::text;
    begin
      insert into chats (code, created_by, expires_at)
      values (v_code, auth.uid(), v_expires_at)
      returning chats.id into v_id;
      exit;
    exception when unique_violation then
      v_id := null;
    end;
  end loop;

  if v_id is null then
    raise exception 'No se pudo generar un código único, intentá de nuevo';
  end if;

  insert into chat_participants (chat_id, user_id) values (v_id, auth.uid());

  return query select v_id, v_code, v_expires_at;
end;
$$;

revoke all on function create_chat() from public;
grant execute on function create_chat() to authenticated;

-- Cierra el hueco: ya no se puede insertar en chats/chat_participants directo
-- desde el cliente, solo vía create_chat() y join_chat_by_code() (SECURITY DEFINER).
drop policy if exists "crear chat propio" on chats;
drop policy if exists "creador se auto-agrega" on chat_participants;
