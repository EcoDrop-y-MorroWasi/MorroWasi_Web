-- Rate limit para get_progress_sync()/save_progress_sync(): sin esto, alguien
-- con un script podía probar códigos de 10 caracteres al voleo hasta encontrar
-- uno real y leer o pisar el progreso de otra persona. La app no tiene login
-- (siempre se llama con la anon key, sin auth.uid()), así que el límite es
-- global por ventana de tiempo, no por usuario — mismo problema que resolvió
-- join_attempts en 0003_rate_limit_join.sql, pero sin un user_id disponible.
--
-- get_progress_sync() con un código que no existe es AMBIGUO a propósito (puede
-- ser un intento al voleo, o el primer sync legítimo de un código recién
-- generado — progressSync.ts lo trata como "nada que bajar, sube tu local").
-- Por eso solo se cuentan los misses (código no encontrado) para el límite: un
-- uso real genera como mucho un miss por dispositivo nuevo, mientras que un
-- script de fuerza bruta genera muchísimos en poco tiempo.
create table if not exists progress_sync_attempts (
  kind text not null check (kind in ('get_miss', 'save')),
  attempted_at timestamptz not null default now()
);

create index if not exists progress_sync_attempts_kind_attempted_at_idx
  on progress_sync_attempts (kind, attempted_at);

alter table progress_sync_attempts enable row level security;
-- Sin policies de select/insert/delete: nadie la toca directo, solo las
-- funciones SECURITY DEFINER de abajo.

create or replace function get_progress_sync(p_code text)
returns table (data jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intentos_recientes int;
begin
  if p_code !~ '^[A-Za-z0-9]{10}$' then
    raise exception 'código inválido';
  end if;

  delete from progress_sync_attempts where kind = 'get_miss' and attempted_at < now() - interval '1 minute';

  select count(*) into v_intentos_recientes from progress_sync_attempts where kind = 'get_miss';
  if v_intentos_recientes >= 30 then
    raise exception 'Demasiados intentos de restaurar código. Espera un minuto y vuelve a intentar.';
  end if;

  if not exists (select 1 from progress_sync where progress_sync.code = p_code) then
    insert into progress_sync_attempts (kind) values ('get_miss');
  end if;

  return query
  select progress_sync.data, progress_sync.updated_at
  from progress_sync
  where progress_sync.code = p_code;
end;
$$;

create or replace function save_progress_sync(p_code text, p_data jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_at timestamptz;
  v_intentos_recientes int;
begin
  if p_code !~ '^[A-Za-z0-9]{10}$' then
    raise exception 'código inválido';
  end if;

  if pg_column_size(p_data) > 20000 then
    raise exception 'payload demasiado grande';
  end if;

  delete from progress_sync_attempts where kind = 'save' and attempted_at < now() - interval '1 minute';

  select count(*) into v_intentos_recientes from progress_sync_attempts where kind = 'save';
  if v_intentos_recientes >= 60 then
    raise exception 'Demasiados intentos de guardar progreso. Espera un minuto y vuelve a intentar.';
  end if;

  insert into progress_sync_attempts (kind) values ('save');

  insert into progress_sync (code, data, updated_at)
  values (p_code, p_data, now())
  on conflict (code) do update
    set data = excluded.data,
        updated_at = excluded.updated_at
  returning progress_sync.updated_at into v_updated_at;

  return v_updated_at;
end;
$$;

revoke all on function get_progress_sync(text) from public;
grant execute on function get_progress_sync(text) to anon, authenticated;
revoke all on function save_progress_sync(text, jsonb) from public;
grant execute on function save_progress_sync(text, jsonb) to anon, authenticated;
