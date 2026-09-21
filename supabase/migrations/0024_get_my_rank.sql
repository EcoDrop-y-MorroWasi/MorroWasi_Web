-- Devuelve la posición de una persona en el ranking, aunque no esté en el top
-- que ya trae get_leaderboard() — es lo que le falta a Ranking.tsx para poder
-- mostrar "estás en el puesto #47" debajo de la tabla.
--
-- Privado a propósito: solo responde si p_secret coincide con el dueño real
-- del profile_id (mismo control que submit_leaderboard_score / delete_leaderboard_entry).
-- Nadie más puede consultar la posición de otra persona por acá — el número
-- de puesto de alguien fuera del top no es información pública, a diferencia
-- de lo que esa persona ya decidió mostrar al tocar "Compartir mi puntaje".
create or replace function get_my_rank(
  p_profile_id text,
  p_secret text,
  p_periodo text default 'dia'
)
returns table (
  posicion int,
  total_participantes int,
  hydro_points int,
  exp int,
  etapa int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_desde timestamptz;
begin
  if p_periodo not in ('dia', 'semana', 'mes', 'global') then
    raise exception 'periodo inválido';
  end if;

  if not exists (
    select 1 from leaderboard_entries where profile_id = p_profile_id and secret = p_secret
  ) then
    return; -- secret equivocado o nunca compartió puntaje: sin filas, no es un error
  end if;

  if p_periodo = 'global' then
    return query
    with ranked as (
      select
        e.profile_id,
        e.hydro_points,
        e.exp,
        e.etapa,
        row_number() over (order by e.hydro_points desc, e.exp desc, e.updated_at asc) as rn,
        count(*) over () as total
      from leaderboard_entries e
    )
    select rn::int, total::int, hydro_points, exp, etapa
    from ranked
    where profile_id = p_profile_id;
    return;
  end if;

  v_desde := date_trunc(
    case p_periodo when 'dia' then 'day' when 'semana' then 'week' else 'month' end,
    now() at time zone 'America/Lima'
  ) at time zone 'America/Lima';

  return query
  with periodo_sum as (
    select ev.profile_id as pid, sum(ev.exp)::int as exp, sum(ev.hydro)::int as hydro
    from leaderboard_events ev
    where ev.ocurrido_en >= v_desde
    group by ev.profile_id
  ),
  ranked as (
    select
      p.pid,
      p.hydro,
      p.exp,
      e.etapa,
      row_number() over (order by p.hydro desc, p.exp desc, e.updated_at asc) as rn,
      count(*) over () as total
    from periodo_sum p
    join leaderboard_entries e on e.profile_id = p.pid
  )
  select rn::int, total::int, hydro, exp, etapa
  from ranked
  where pid = p_profile_id;
end;
$$;

revoke all on function get_my_rank(text, text, text) from public;
grant execute on function get_my_rank(text, text, text) to anon, authenticated;
