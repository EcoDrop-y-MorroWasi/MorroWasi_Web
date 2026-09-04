-- Chat temporal familia-a-familia: código de 6 dígitos generado en servidor
-- (Edge Function create-chat), unión validada en servidor (join_chat_by_code),
-- RLS asegura que solo participantes lean/escriban su sala.

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_by uuid references auth.users not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists chat_participants (
  chat_id uuid references chats(id) on delete cascade,
  user_id uuid references auth.users,
  joined_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  sender_id uuid references auth.users not null,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_id_created_at_idx on messages (chat_id, created_at);

alter table chats enable row level security;
alter table chat_participants enable row level security;
alter table messages enable row level security;

-- chats: solo lo ve quien participa (el creador entra a chat_participants al crearla).
drop policy if exists "participantes leen su chat" on chats;
create policy "participantes leen su chat" on chats for select
  using (auth.uid() in (select user_id from chat_participants where chat_id = id));

-- Solo la Edge Function create-chat inserta (con el JWT del usuario), fijando
-- created_by al usuario autenticado — nunca a nombre de otro.
drop policy if exists "crear chat propio" on chats;
create policy "crear chat propio" on chats for insert
  with check (created_by = auth.uid());

-- chat_participants: cada uno ve solo sus propias filas de participación.
drop policy if exists "ver propia participacion" on chat_participants;
create policy "ver propia participacion" on chat_participants for select
  using (user_id = auth.uid());

-- Insert directo SOLO para que el creador se auto-agregue justo después de crear
-- la sala (lo hace la Edge Function). Cualquier otra unión pasa obligatoriamente
-- por join_chat_by_code() más abajo, que valida código/expiración/cupo.
drop policy if exists "creador se auto-agrega" on chat_participants;
create policy "creador se auto-agrega" on chat_participants for insert
  with check (
    user_id = auth.uid()
    and chat_id in (select id from chats where created_by = auth.uid())
  );

-- messages: solo participantes de esa sala leen y escriben.
drop policy if exists "participantes leen mensajes" on messages;
create policy "participantes leen mensajes" on messages for select
  using (auth.uid() in (select user_id from chat_participants where chat_id = messages.chat_id));

drop policy if exists "participantes escriben mensajes" on messages;
create policy "participantes escriben mensajes" on messages for insert
  with check (
    sender_id = auth.uid()
    and auth.uid() in (select user_id from chat_participants where chat_id = messages.chat_id)
  );

-- Única puerta de entrada a una sala: valida código + expiración + cupo máx. 2,
-- así ningún cliente puede insertar directo en chat_participants adivinando IDs.
create or replace function join_chat_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chat_id uuid;
  v_count int;
begin
  select id into v_chat_id from chats where code = p_code and expires_at > now();
  if v_chat_id is null then
    raise exception 'código inválido o expirado';
  end if;

  select count(*) into v_count from chat_participants where chat_id = v_chat_id;
  if v_count >= 2 and not exists (
    select 1 from chat_participants where chat_id = v_chat_id and user_id = auth.uid()
  ) then
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

-- Limpieza automática: borra salas vencidas cada hora (cascada limpia
-- chat_participants y messages). Requiere la extensión pg_cron (free tier).
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'borrar-chats-vencidos',
  '0 * * * *',
  $$ delete from chats where expires_at < now(); $$
);
