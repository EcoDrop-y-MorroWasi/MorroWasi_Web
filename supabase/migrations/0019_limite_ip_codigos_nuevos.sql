-- Límite específico para "crear código nuevo" (Login → "Soy nuevo"), separado
-- del límite general de guardado (save_progress_sync, que ya tiene su propio
-- tope de 60/min pero es GLOBAL y no distingue "estoy creando 1000 cuentas
-- vacías" de "estoy guardando mi propio progreso 60 veces"). Este es por IP:
-- una persona real no necesita más de un puñado de códigos por día.
--
-- La IP real del que llama sí es visible en Postgres bajo PostgREST/Supabase:
-- viaja como header y queda en el GUC `request.headers`, aunque el cliente
-- (anon key) no tenga forma de falsificarla desde el navegador.
create table if not exists codigo_creaciones (
  ip text not null,
  creado_en timestamptz not null default now()
);

create index if not exists codigo_creaciones_ip_creado_en_idx
  on codigo_creaciones (ip, creado_en);

alter table codigo_creaciones enable row level security;
-- Sin policies: nadie la toca directo, solo crear_codigo_nuevo() de abajo.

create or replace function ip_de_solicitud() returns text
language sql
stable
as $$
  select coalesce(
    nullif(split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1), ''),
    'desconocida'
  );
$$;

-- Separado de save_progress_sync(): ese hace upsert (crea O actualiza) y lo
-- sigue usando el sync normal de un código ya enlazado. Este SOLO inserta —
-- si el código ya existe (colisión, prácticamente imposible con 10
-- caracteres al azar), falla en vez de pisar la cuenta de otra persona.
create or replace function crear_codigo_nuevo(p_code text, p_data jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text := ip_de_solicitud();
  v_recientes int;
  v_updated_at timestamptz;
begin
  if p_code !~ '^[A-Za-z0-9]{10}$' then
    raise exception 'código inválido';
  end if;
  if pg_column_size(p_data) > 20000 then
    raise exception 'payload demasiado grande';
  end if;

  delete from codigo_creaciones where creado_en < now() - interval '24 hours';

  select count(*) into v_recientes from codigo_creaciones where ip = v_ip;
  if v_recientes >= 5 then
    raise exception 'Demasiados códigos nuevos desde esta conexión. Espera un día y vuelve a intentar.';
  end if;

  insert into progress_sync (code, data, updated_at)
  values (p_code, p_data, now())
  returning progress_sync.updated_at into v_updated_at;

  insert into codigo_creaciones (ip) values (v_ip);

  return v_updated_at;
end;
$$;

revoke all on function crear_codigo_nuevo(text, jsonb) from public;
grant execute on function crear_codigo_nuevo(text, jsonb) to anon, authenticated;
