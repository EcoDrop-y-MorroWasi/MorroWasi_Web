-- Avisos de penalización: el cliente muestra una sola vez el aviso cuando el
-- sistema ajustó el puntaje. Privado como get_my_rank: exige el secret del dueño.

create or replace function get_my_penalty_notices(
  p_profile_id text,
  p_secret text
)
returns table (
  id bigint,
  code text,
  severity text,
  reason text,
  observed jsonb,
  detected_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from leaderboard_entries where profile_id = p_profile_id and secret = p_secret
  ) then
    return; -- secret equivocado o nunca compartió puntaje: sin filas, no es error
  end if;

  return query
  select f.id, f.code, f.severity, f.reason, f.observed, f.detected_at
  from leaderboard_review_flags f
  where f.profile_id = p_profile_id
    and f.resolved_at is null
  order by f.detected_at desc;
end;
$$;
