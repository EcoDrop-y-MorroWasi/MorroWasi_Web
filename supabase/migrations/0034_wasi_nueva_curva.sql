-- Nueva curva Wasi 2026-10: etapa 1→2 pide 3,000 PEW, brechas crecientes
-- (3k→11k) hasta 63,000 en etapa 10. Espeja WASI_STAGE_THRESHOLDS de
-- src/data/mock.ts y recalcula la etapa de todos los perfiles existentes
-- (algunos bajan de etapa: conservan lo comprado, solo se frena lo nuevo).

alter table leaderboard_entries
  add column if not exists avatar_shop text not null default '',
  add column if not exists accesorios_avatar int not null default 0;

drop function if exists submit_leaderboard_score(text, text, text, text, jsonb, int);

create or replace function submit_leaderboard_score(
  p_profile_id text,
  p_secret text,
  p_nombre text,
  p_avatar text,
  p_eventos jsonb,
  p_accesorios int default 0,
  p_avatar_shop text default '',
  p_accesorios_avatar int default 0
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
  v_juegos_solapados int;
  v_cursos_repetidos int;
  v_misiones_repetidas int;
  v_personalizadas_extras int;
  v_accesorios int;
  v_avatar_shop text;
  v_accesorios_avatar int;
begin
  if p_profile_id !~ '^wasi-[0-9a-f]{8}$' then
    raise exception 'perfil inválido';
  end if;
  if p_secret is null or length(p_secret) < 16 or length(p_secret) > 64 then
    raise exception 'credencial inválida';
  end if;
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
  v_accesorios := coalesce(p_accesorios, 0);
  if v_accesorios < 0 or v_accesorios > 200 then
    raise exception 'conteo de accesorios inválido';
  end if;
  v_avatar_shop := coalesce(p_avatar_shop, '');
  if length(v_avatar_shop) > 40 then
    raise exception 'avatar de tienda inválido';
  end if;
  v_accesorios_avatar := coalesce(p_accesorios_avatar, 0);
  if v_accesorios_avatar < 0 or v_accesorios_avatar > 11 then
    raise exception 'conteo de accesorios del avatar inválido';
  end if;

  select * into v_entry from leaderboard_entries where profile_id = p_profile_id;
  if found and v_entry.secret <> p_secret then
    raise exception 'Este perfil ya fue reclamado desde otro dispositivo.';
  end if;
  if found and v_entry.updated_at > now() - interval '10 seconds' then
    raise exception 'Espera unos segundos antes de volver a compartir tu puntaje.';
  end if;

  select * into v_mod from moderar_texto(p_nombre);
  v_nombre := v_mod.texto;
  if found and v_entry.nombre <> v_nombre then
    select count(*)::int into v_cambios_recientes
    from unnest(v_entry.nombre_cambios) as c where c > now() - interval '7 days';
    if v_cambios_recientes >= 3 then
      raise exception 'Solo puedes cambiar tu nombre 3 veces por semana. Intenta de nuevo más adelante.';
    end if;
    select array_agg(c) into v_cambios
    from unnest(v_entry.nombre_cambios) as c where c > now() - interval '30 days';
    v_cambios := coalesce(v_cambios, '{}') || now();
  else
    v_cambios := coalesce(v_entry.nombre_cambios, '{}');
  end if;

  insert into leaderboard_entries (profile_id, secret, nombre, avatar, nombre_cambios, accesorios, avatar_shop, accesorios_avatar)
  values (p_profile_id, p_secret, v_nombre, p_avatar, v_cambios, v_accesorios, v_avatar_shop, v_accesorios_avatar)
  on conflict (profile_id) do update set
    nombre = excluded.nombre, avatar = excluded.avatar, nombre_cambios = excluded.nombre_cambios,
    accesorios = greatest(leaderboard_entries.accesorios, excluded.accesorios),
    avatar_shop = excluded.avatar_shop, accesorios_avatar = excluded.accesorios_avatar;

  -- Eventos inválidos sí se rechazan: no corresponden a actividad posible.
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
    if found then v_nuevos := v_nuevos + 1; end if;
  end loop;

  -- Volumen alto: se registra y se comparte; no bloquea al usuario.
  for v_dia, v_exp_dia, v_hydro_dia in
    select (ocurrido_en at time zone 'America/Lima')::date, sum(exp)::int, sum(hydro)::int
    from leaderboard_events where profile_id = p_profile_id group by 1
  loop
    if v_hydro_dia > 2000 or v_exp_dia > 500 then
      insert into leaderboard_review_flags (profile_id, detected_on, code, severity, reason, observed)
      values (
        p_profile_id, v_dia, 'volumen_diario',
        case when v_hydro_dia > 10000 or v_exp_dia > 2500 then 'high' else 'review' end,
        'Volumen diario fuera del rango habitual; el puntaje fue publicado y requiere revisión.',
        jsonb_build_object('hydro_puntos', v_hydro_dia, 'exp', v_exp_dia, 'umbral_hydro', 2000, 'umbral_exp', 500)
      )
      on conflict (profile_id, detected_on, code) do update set
        severity = excluded.severity, reason = excluded.reason, observed = excluded.observed,
        detected_at = now(), resolved_at = null, resolution_note = null;
    end if;
  end loop;

  -- Señales independientes del volumen: solapamiento de juegos y recompensas
  -- que normalmente solo pueden obtenerse una vez.
  select count(*)::int into v_juegos_solapados
  from (
    select ocurrido_en, ref, lag(ocurrido_en) over (order by ocurrido_en) as anterior
    from leaderboard_events where profile_id = p_profile_id and tipo = 'juego'
  ) j join catalogo_recompensas c on c.ref = j.ref and c.tipo = 'juego'
  where j.anterior is not null and j.ocurrido_en - j.anterior < make_interval(secs => c.segundos_min * 0.5);
  if v_juegos_solapados > 0 then
    insert into leaderboard_review_flags (profile_id, detected_on, code, severity, reason, observed)
    values (p_profile_id, (now() at time zone 'America/Lima')::date, 'juegos_solapados', 'high',
      'Se detectaron partidas que se solapan en el tiempo.', jsonb_build_object('partidas', v_juegos_solapados))
    on conflict (profile_id, detected_on, code) do update set observed = excluded.observed, detected_at = now(), resolved_at = null, resolution_note = null;
  end if;

  select count(*)::int into v_cursos_repetidos from (
    select ref from leaderboard_events where profile_id = p_profile_id and tipo = 'curso' group by ref having count(*) > 1
  ) repetidos;
  if v_cursos_repetidos > 0 then
    insert into leaderboard_review_flags (profile_id, detected_on, code, severity, reason, observed)
    values (p_profile_id, (now() at time zone 'America/Lima')::date, 'cursos_repetidos', 'high',
      'Un curso fue acreditado más de una vez.', jsonb_build_object('cursos', v_cursos_repetidos))
    on conflict (profile_id, detected_on, code) do update set observed = excluded.observed, detected_at = now(), resolved_at = null, resolution_note = null;
  end if;

  select count(*)::int into v_misiones_repetidas from (
    select (ocurrido_en at time zone 'America/Lima')::date, ref
    from leaderboard_events
    where profile_id = p_profile_id and tipo = 'mision' and ref <> 'personalizada'
    group by 1, 2 having count(*) > 1
  ) repetidas;
  if v_misiones_repetidas > 0 then
    insert into leaderboard_review_flags (profile_id, detected_on, code, severity, reason, observed)
    values (p_profile_id, (now() at time zone 'America/Lima')::date, 'misiones_repetidas', 'review',
      'Una misión del catálogo fue acreditada más de una vez el mismo día.', jsonb_build_object('casos', v_misiones_repetidas))
    on conflict (profile_id, detected_on, code) do update set observed = excluded.observed, detected_at = now(), resolved_at = null, resolution_note = null;
  end if;

  select greatest(count(*) - 4, 0)::int into v_personalizadas_extras
  from leaderboard_events
  where profile_id = p_profile_id and tipo = 'mision' and ref = 'personalizada'
    and (ocurrido_en at time zone 'America/Lima')::date = (now() at time zone 'America/Lima')::date;
  if v_personalizadas_extras > 0 then
    insert into leaderboard_review_flags (profile_id, detected_on, code, severity, reason, observed)
    values (p_profile_id, (now() at time zone 'America/Lima')::date, 'personalizadas_excedidas', 'review',
      'Se superó el límite diario de cuatro misiones personalizadas.', jsonb_build_object('exceso', v_personalizadas_extras))
    on conflict (profile_id, detected_on, code) do update set observed = excluded.observed, detected_at = now(), resolved_at = null, resolution_note = null;
  end if;

  select coalesce(sum(exp), 0)::int, coalesce(sum(hydro), 0)::int into exp_total, hydro_total
  from leaderboard_events where profile_id = p_profile_id;

  update leaderboard_entries set
    exp = exp_total, hydro_points = hydro_total,
    etapa = case
      when exp_total >= 63000 then 10 when exp_total >= 52000 then 9
      when exp_total >= 42000 then 8 when exp_total >= 33000 then 7
      when exp_total >= 25000 then 6 when exp_total >= 18000 then 5
      when exp_total >= 12000 then 4 when exp_total >= 7000 then 3
      when exp_total >= 3000 then 2 else 1 end,
    updated_at = now()
  where profile_id = p_profile_id;

  nombre_aplicado := v_nombre;
  eventos_nuevos := v_nuevos;
  return next;
end;
$$;

drop function if exists get_leaderboard(text, int);

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
  accesorios int,
  avatar_shop text,
  accesorios_avatar int,
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
    select e.profile_id, e.nombre, e.avatar, e.exp, e.hydro_points, e.etapa, e.accesorios, e.avatar_shop, e.accesorios_avatar, e.updated_at
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
    e.accesorios,
    e.avatar_shop,
    e.accesorios_avatar,
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

revoke all on function submit_leaderboard_score(text, text, text, text, jsonb, int, text, int) from public;
grant execute on function submit_leaderboard_score(text, text, text, text, jsonb, int, text, int) to anon, authenticated;
revoke all on function get_leaderboard(text, int) from public;
grant execute on function get_leaderboard(text, int) to anon, authenticated;

-- Recalcula la etapa de todos los perfiles con la nueva curva (la etapa se
-- deriva del EXP: nadie pierde puntos ni compras, solo puede bajar de etapa).
update leaderboard_entries set
  etapa = case
    when exp >= 63000 then 10 when exp >= 52000 then 9
    when exp >= 42000 then 8 when exp >= 33000 then 7
    when exp >= 25000 then 6 when exp >= 18000 then 5
    when exp >= 12000 then 4 when exp >= 7000 then 3
    when exp >= 3000 then 2 else 1 end;
