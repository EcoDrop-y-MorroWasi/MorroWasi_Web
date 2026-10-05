-- `get_my_rank()` devuelve columnas llamadas exp/etapa; en PL/pgSQL esos
-- nombres también son variables de salida. La versión anterior las refería sin
-- alias en el SELECT final y PostgreSQL devolvía 42702 (referencia ambigua).
-- Calificar cada columna deja explícita la fuente y recupera la tarjeta
-- privada "Tu posición" sin cambiar el cálculo del ranking.

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
    select 1 from leaderboard_entries e
    where e.profile_id = p_profile_id and e.secret = p_secret
  ) then
    return;
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
    select r.rn::int, r.total::int, r.hydro_points, r.exp, r.etapa
    from ranked r
    where r.profile_id = p_profile_id;
    return;
  end if;

  v_desde := date_trunc(
    case p_periodo when 'dia' then 'day' when 'semana' then 'week' else 'month' end,
    now() at time zone 'America/Lima'
  ) at time zone 'America/Lima';

  return query
  with periodo_sum as (
    select ev.profile_id as pid, sum(ev.exp)::int as hydro_exp, sum(ev.hydro)::int as hydro
    from leaderboard_events ev
    where ev.ocurrido_en >= v_desde
    group by ev.profile_id
  ),
  ranked as (
    select
      p.pid,
      p.hydro,
      p.hydro_exp,
      e.etapa,
      row_number() over (order by p.hydro desc, p.hydro_exp desc, e.updated_at asc) as rn,
      count(*) over () as total
    from periodo_sum p
    join leaderboard_entries e on e.profile_id = p.pid
  )
  select r.rn::int, r.total::int, r.hydro, r.hydro_exp, r.etapa
  from ranked r
  where r.pid = p_profile_id;
end;
$$;

revoke all on function get_my_rank(text, text, text) from public;
grant execute on function get_my_rank(text, text, text) to anon, authenticated;
