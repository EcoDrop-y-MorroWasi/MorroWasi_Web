-- Tabla de clasificación pública (HydroPuntos + EXP) con rankings por día,
-- semana, mes y global.
--
-- Modelo anti-trampa: el cliente no manda "tengo 840 puntos", manda el LIBRO DE
-- EVENTOS que produjo esos puntos (qué misión/juego/curso, cuándo, cuánto). El
-- servidor recalcula el total desde el libro y valida cada evento contra
-- catalogo_recompensas, que es el espejo en SQL de src/utils/gamification.ts.
-- Editar el total en localStorage deja de servir: el número no cuadra con la
-- suma del libro, y un evento inventado no coincide con lo que esa recompensa
-- paga de verdad.
--
-- No elimina la trampa fina (alguien puede fabricar un libro coherente), pero
-- sube el costo de "cambiar un número" a "escribir un script que respete ids,
-- montos, topes diarios y espaciado temporal".

-- ----------------------------------------------------------------------------
-- 1) Moderación reutilizable
-- ----------------------------------------------------------------------------
-- moderar_mensaje() (0005/0008) tenía la censura incrustada dentro del trigger
-- del chat, atada a chat_id/sender_id y al castigo de borrar la sala al 3er
-- strike. El nombre del ranking necesita la misma censura pero nada de ese
-- castigo, así que el núcleo sale acá y el trigger del chat pasa a llamarlo.

create or replace function moderar_texto(
  p_texto text,
  out texto text,
  out encontro boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_normalizado text;
  v_patron text;
  r record;
begin
  texto := p_texto;
  encontro := false;
  if p_texto is null then
    return;
  end if;

  v_normalizado := lower(unaccent(p_texto));

  for r in
    select b.word, b.lang
    from banned_words b
    where
      case
        -- Chino y japonés no separan palabras con espacios: exigirles límite de
        -- palabra rompería la detección real (ver 0008).
        when b.lang in ('zh', 'ja') then position(b.word in v_normalizado) > 0
        else v_normalizado ~* ('\y' || regexp_replace(b.word, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\y')
      end
  loop
    encontro := true;
    v_patron := regexp_replace(r.word, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g');
    if r.lang not in ('zh', 'ja') then
      v_patron := '\y' || v_patron || '\y';
    end if;
    texto := regexp_replace(texto, v_patron, repeat('*', length(r.word)), 'gi');
  end loop;
end;
$$;

-- El trigger del chat conserva exactamente el comportamiento de 0008 (censura +
-- advertencias + borrar sala al 3er strike); solo delega la censura.
create or replace function moderar_mensaje()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_mod record;
  v_count int;
begin
  select * into v_mod from moderar_texto(NEW.text);
  NEW.text := v_mod.texto;

  if not v_mod.encontro then
    return NEW;
  end if;

  insert into chat_warnings (chat_id, user_id, count)
  values (NEW.chat_id, NEW.sender_id, 1)
  on conflict (chat_id, user_id) do update set count = chat_warnings.count + 1
  returning count into v_count;

  if v_count >= 3 then
    delete from chats where id = NEW.chat_id;
    return null; -- cancela este insert — la sala ya no existe
  end if;

  return NEW;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2) Catálogo de recompensas — espejo de src/utils/gamification.ts
-- ----------------------------------------------------------------------------
-- Sin esto el servidor no tiene forma de saber que "diaria-03" paga 7 EXP y no
-- 9999. Se regenera con `pnpm gen:catalogo` (scripts/gen-catalogo.ts) para que
-- no haya que mantener los dos lados a mano.

create table if not exists catalogo_recompensas (
  ref text primary key,
  tipo text not null check (tipo in ('juego', 'mision', 'curso', 'ahorro')),
  exp_min int not null default 0,
  exp_max int not null default 0,
  hydro_min int not null default 0,
  hydro_max int not null default 0,
  -- Segundos mínimos que toma ganar esta recompensa. Para juegos es su duración
  -- real: sirve para rechazar 12 partidas de 60 s completadas en 30 segundos.
  segundos_min int not null default 0
);

alter table catalogo_recompensas enable row level security;
-- Sin policies: solo lo leen las funciones SECURITY DEFINER de abajo.

-- ----------------------------------------------------------------------------
-- 3) Tablas del ranking
-- ----------------------------------------------------------------------------

create table if not exists leaderboard_entries (
  profile_id text primary key,
  -- Secreto que reclama el profile_id en el primer submit. Sin esto cualquiera
  -- podría pisar la entrada de otro: el profile_id es público (sale en el
  -- ranking) y el RPC lo puede llamar cualquier cliente con la anon key.
  -- get_leaderboard() nunca lo devuelve.
  secret text not null,
  nombre text not null,
  avatar text not null,
  exp int not null default 0,
  hydro_points int not null default 0,
  etapa int not null default 1,
  -- Marcas de tiempo de cada cambio de nombre: tope de 3 por semana móvil.
  nombre_cambios timestamptz[] not null default '{}',
  -- Si mañana cambia la fórmula de puntos, los totales viejos quedan en otra
  -- escala; el ranking puede filtrar por versión en vez de comparar peras con
  -- manzanas.
  schema_version int not null default 1,
  creado_en timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table leaderboard_entries enable row level security;
-- Sin policies a propósito: la columna secret jamás debe salir por PostgREST.
-- Todo acceso pasa por submit_leaderboard_score() / get_leaderboard().

create table if not exists leaderboard_events (
  id bigserial primary key,
  profile_id text not null references leaderboard_entries(profile_id) on delete cascade,
  ocurrido_en timestamptz not null,
  tipo text not null,
  ref text not null,
  exp int not null,
  hydro int not null,
  -- Reenviar el mismo libro no duplica puntos: el submit es idempotente.
  unique (profile_id, ocurrido_en, ref)
);

create index if not exists leaderboard_events_periodo_idx
  on leaderboard_events (ocurrido_en desc, profile_id);

alter table leaderboard_events enable row level security;

-- Esta tabla SÍ lleva policy de lectura, a diferencia del resto del proyecto, y
-- es deliberado: Supabase Realtime respeta RLS, así que sin policy el ranking
-- en vivo nunca recibiría eventos. Es seguro porque acá no hay nada privado —
-- son exactamente los mismos datos que get_leaderboard() ya publica. El secreto
-- vive en leaderboard_entries, que sigue cerrada.
drop policy if exists "lectura publica de eventos" on leaderboard_events;
create policy "lectura publica de eventos"
  on leaderboard_events for select
  to anon, authenticated
  using (true);

-- Una tabla solo emite por Realtime si pertenece a la publicación
-- supabase_realtime (mismo motivo que 0002 para el chat). "add table" da error si
-- ya es miembro, así que se ignora ese caso puntual para que la migración se
-- pueda volver a correr entera sin fallar.
do $$
begin
  alter publication supabase_realtime add table leaderboard_events;
exception
  when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- 4) Enviar puntaje
-- ----------------------------------------------------------------------------

create or replace function submit_leaderboard_score(
  p_profile_id text,
  p_secret text,
  p_nombre text,
  p_avatar text,
  p_eventos jsonb
)
returns table (nombre_aplicado text, exp_total int, hydro_total int, eventos_nuevos int)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_entry leaderboard_entries%rowtype;
  v_mod record;
  v_nombre text;
  v_cambios timestamptz[];
  v_cambios_recientes int;
  v_evento jsonb;
  v_cat catalogo_recompensas%rowtype;
  v_t timestamptz;
  v_exp int;
  v_hydro int;
  v_tipo text;
  v_ref text;
  v_nuevos int := 0;
  v_dia date;
  v_exp_dia int;
  v_hydro_dia int;
  v_ultimo_juego timestamptz;
begin
  -- Formato de getProfileId() en src/utils/progressBackup.ts: wasi-<8 hex>.
  if p_profile_id !~ '^wasi-[0-9a-f]{8}$' then
    raise exception 'perfil inválido';
  end if;

  if p_secret is null or length(p_secret) < 16 or length(p_secret) > 64 then
    raise exception 'credencial inválida';
  end if;

  -- Solo letras (con acentos y ñ), números y espacios: cierra la puerta a HTML,
  -- markup y símbolos raros en un campo que se muestra a todo el mundo.
  if p_nombre !~ '^[\p{L}\p{N} ]{2,40}$' then
    raise exception 'El nombre solo puede tener letras, números y espacios (2 a 40 caracteres).';
  end if;

  if p_avatar is null or length(p_avatar) > 60 then
    raise exception 'avatar inválido';
  end if;

  if jsonb_typeof(p_eventos) <> 'array' then
    raise exception 'libro de eventos inválido';
  end if;

  if jsonb_array_length(p_eventos) > 3000 then
    raise exception 'libro de eventos demasiado grande';
  end if;

  select * into v_entry from leaderboard_entries where profile_id = p_profile_id;

  if found and v_entry.secret <> p_secret then
    raise exception 'Este perfil ya fue reclamado desde otro dispositivo.';
  end if;

  -- Cooldown: frena el spam de submits del mismo perfil sin molestar al uso real.
  if found and v_entry.updated_at > now() - interval '10 seconds' then
    raise exception 'Espera unos segundos antes de volver a compartir tu puntaje.';
  end if;

  select * into v_mod from moderar_texto(p_nombre);
  v_nombre := v_mod.texto;

  -- Tope de 3 cambios de nombre por semana móvil. El primer nombre no cuenta
  -- como cambio; solo se registra cuando el nombre realmente cambia.
  if found and v_entry.nombre <> v_nombre then
    select count(*)::int into v_cambios_recientes
    from unnest(v_entry.nombre_cambios) as c
    where c > now() - interval '7 days';

    if v_cambios_recientes >= 3 then
      raise exception 'Solo puedes cambiar tu nombre 3 veces por semana. Intenta de nuevo más adelante.';
    end if;

    select array_agg(c) into v_cambios
    from unnest(v_entry.nombre_cambios) as c
    where c > now() - interval '30 days';
    v_cambios := coalesce(v_cambios, '{}') || now();
  else
    v_cambios := coalesce(v_entry.nombre_cambios, '{}');
  end if;

  insert into leaderboard_entries (profile_id, secret, nombre, avatar, nombre_cambios)
  values (p_profile_id, p_secret, v_nombre, p_avatar, v_cambios)
  on conflict (profile_id) do update
    set nombre = excluded.nombre,
        avatar = excluded.avatar,
        nombre_cambios = excluded.nombre_cambios;

  -- Validación evento por evento contra el catálogo real.
  for v_evento in select * from jsonb_array_elements(p_eventos)
  loop
    v_t := to_timestamp((v_evento->>'t')::bigint / 1000.0);
    v_tipo := v_evento->>'tipo';
    v_ref := v_evento->>'ref';
    v_exp := coalesce((v_evento->>'exp')::int, 0);
    v_hydro := coalesce((v_evento->>'hydro')::int, 0);

    if v_t is null or v_ref is null or v_tipo is null then
      raise exception 'evento incompleto en el libro';
    end if;

    -- Un evento del futuro es imposible; uno muy viejo ya no entra a ningún ranking.
    if v_t > now() + interval '5 minutes' then
      raise exception 'evento con fecha futura';
    end if;
    if v_t < now() - interval '95 days' then
      continue;
    end if;

    select * into v_cat from catalogo_recompensas where ref = v_ref and tipo = v_tipo;
    if not found then
      raise exception 'recompensa desconocida: %', v_ref;
    end if;

    if v_exp < v_cat.exp_min or v_exp > v_cat.exp_max then
      raise exception 'EXP fuera de rango para %', v_ref;
    end if;
    if v_hydro < v_cat.hydro_min or v_hydro > v_cat.hydro_max then
      raise exception 'HydroPuntos fuera de rango para %', v_ref;
    end if;

    insert into leaderboard_events (profile_id, ocurrido_en, tipo, ref, exp, hydro)
    values (p_profile_id, v_t, v_tipo, v_ref, v_exp, v_hydro)
    on conflict (profile_id, ocurrido_en, ref) do nothing;

    if FOUND then
      v_nuevos := v_nuevos + 1;
    end if;
  end loop;

  -- Tope diario de plausibilidad: 12 juegos x 100 HydroPuntos + margen, y las
  -- misiones diarias/semanales no llegan ni cerca de 500 EXP en un día.
  for v_dia, v_exp_dia, v_hydro_dia in
    select (ocurrido_en at time zone 'America/Lima')::date, sum(exp)::int, sum(hydro)::int
    from leaderboard_events
    where profile_id = p_profile_id
    group by 1
  loop
    if v_hydro_dia > 2000 or v_exp_dia > 500 then
      raise exception 'Progreso imposible detectado el % — revisa tu dispositivo.', v_dia;
    end if;
  end loop;

  -- Espaciado temporal de los juegos: dos partidas no pueden solaparse.
  select max(ocurrido_en) into v_ultimo_juego
  from (
    select ocurrido_en,
           lag(ocurrido_en) over (order by ocurrido_en) as anterior,
           ref
    from leaderboard_events
    where profile_id = p_profile_id and tipo = 'juego'
  ) t
  join catalogo_recompensas c on c.ref = t.ref
  where t.anterior is not null
    and t.ocurrido_en - t.anterior < make_interval(secs => c.segundos_min * 0.5);

  if v_ultimo_juego is not null then
    raise exception 'Partidas demasiado seguidas para ser reales.';
  end if;

  select coalesce(sum(exp), 0)::int, coalesce(sum(hydro), 0)::int
    into exp_total, hydro_total
  from leaderboard_events
  where profile_id = p_profile_id;

  update leaderboard_entries
  set exp = exp_total,
      hydro_points = hydro_total,
      -- Misma curva que calcWasiStage() en src/data/mock.ts.
      etapa = case
        when exp_total >= 1000000 then 10
        when exp_total >= 400000 then 9
        when exp_total >= 150000 then 8
        when exp_total >= 60000 then 7
        when exp_total >= 30000 then 6
        when exp_total >= 15000 then 5
        when exp_total >= 7000 then 4
        when exp_total >= 3000 then 3
        when exp_total >= 1000 then 2
        else 1
      end,
      updated_at = now()
  where profile_id = p_profile_id;

  nombre_aplicado := v_nombre;
  eventos_nuevos := v_nuevos;
  return next;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5) Leer el ranking
-- ----------------------------------------------------------------------------
-- 'dia' / 'semana' / 'mes' suman el libro de eventos dentro del periodo vigente
-- en hora de Perú (America/Lima, UTC-5 todo el año). El corte es continuo: a las
-- 00:00 de Lima el periodo 'dia' arranca vacío solo, sin tarea programada.

create or replace function get_leaderboard(
  p_periodo text default 'dia',
  p_limite int default 10
)
returns table (
  profile_id text,
  nombre text,
  avatar text,
  exp int,
  hydro_points int,
  etapa int,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_desde timestamptz;
  v_limite int := least(greatest(coalesce(p_limite, 10), 1), 100);
begin
  if p_periodo not in ('dia', 'semana', 'mes', 'global') then
    raise exception 'periodo inválido';
  end if;

  if p_periodo = 'global' then
    return query
    select e.profile_id, e.nombre, e.avatar, e.exp, e.hydro_points, e.etapa, e.updated_at
    from leaderboard_entries e
    order by e.hydro_points desc, e.exp desc, e.updated_at asc
    limit v_limite;
    return;
  end if;

  v_desde := date_trunc(
    case p_periodo when 'dia' then 'day' when 'semana' then 'week' else 'month' end,
    now() at time zone 'America/Lima'
  ) at time zone 'America/Lima';

  return query
  select
    e.profile_id,
    e.nombre,
    e.avatar,
    coalesce(p.exp, 0)::int,
    coalesce(p.hydro, 0)::int,
    e.etapa,
    e.updated_at
  from (
    select ev.profile_id as pid, sum(ev.exp)::int as exp, sum(ev.hydro)::int as hydro
    from leaderboard_events ev
    where ev.ocurrido_en >= v_desde
    group by ev.profile_id
  ) p
  join leaderboard_entries e on e.profile_id = p.pid
  order by p.hydro desc, p.exp desc, e.updated_at asc
  limit v_limite;
end;
$$;

revoke all on function moderar_texto(text) from public;
revoke all on function submit_leaderboard_score(text, text, text, text, jsonb) from public;
revoke all on function get_leaderboard(text, int) from public;
grant execute on function submit_leaderboard_score(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function get_leaderboard(text, int) to anon, authenticated;
