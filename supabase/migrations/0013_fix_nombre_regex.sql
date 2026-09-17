-- Fix: submit_leaderboard_score() validaba p_nombre con '^[\p{L}\p{N} ]{2,40}$',
-- sintaxis Unicode (\p{L}/\p{N}) que Postgres NO soporta en su motor de regex por
-- defecto (operador ~). Cada llamada tronaba con "invalid regular expression:
-- invalid escape \ sequence" antes de validar nada. Se cambia a clases POSIX
-- ([:alpha:]/[:digit:]), que sí son válidas y siguen aceptando acentos y ñ bajo
-- la collation del proyecto.
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
  if p_nombre !~ '^[[:alpha:][:digit:] ]{2,40}$' then
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
