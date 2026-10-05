-- Compartir nunca debe castigarse por un volumen alto de actividad. Esta
-- migración conserva las validaciones que prueban que un evento pertenece al
-- catálogo, pero transforma las señales de fraude en alertas revisables.
--
-- Consultar alertas (solo desde el SQL Editor o usando service_role):
-- select e.nombre, f.severity, f.reason, f.observed, f.detected_at
-- from leaderboard_review_flags f join leaderboard_entries e using (profile_id)
-- where f.resolved_at is null order by f.detected_at desc;

create table if not exists leaderboard_review_flags (
  id bigserial primary key,
  profile_id text not null references leaderboard_entries(profile_id) on delete cascade,
  detected_on date not null,
  code text not null,
  severity text not null check (severity in ('warning', 'review', 'high')),
  reason text not null,
  observed jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_note text,
  unique (profile_id, detected_on, code)
);

create index if not exists leaderboard_review_flags_open_idx
  on leaderboard_review_flags (resolved_at, severity, detected_at desc);

alter table leaderboard_review_flags enable row level security;
-- Sin policies: las alertas contienen señales anti-trampa y no se exponen al
-- navegador. El equipo las ve en el SQL Editor o mediante service_role.

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
  v_juegos_solapados int;
  v_cursos_repetidos int;
  v_misiones_repetidas int;
  v_personalizadas_extras int;
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

  insert into leaderboard_entries (profile_id, secret, nombre, avatar, nombre_cambios)
  values (p_profile_id, p_secret, v_nombre, p_avatar, v_cambios)
  on conflict (profile_id) do update set
    nombre = excluded.nombre, avatar = excluded.avatar, nombre_cambios = excluded.nombre_cambios;

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
      when exp_total >= 22000 then 10 when exp_total >= 18000 then 9
      when exp_total >= 14000 then 8 when exp_total >= 12000 then 7
      when exp_total >= 8000 then 6 when exp_total >= 6000 then 5
      when exp_total >= 4000 then 4 when exp_total >= 2000 then 3
      when exp_total >= 1000 then 2 else 1 end,
    updated_at = now()
  where profile_id = p_profile_id;

  nombre_aplicado := v_nombre;
  eventos_nuevos := v_nuevos;
  return next;
end;
$$;
