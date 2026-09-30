-- Aviso de fallas del servidor. Cuando una RPC falla con un error técnico
-- (no un `raise exception` pensado para el usuario), la app lo reporta con
-- reportar_error(). Cada hora, .github/workflows/avisar-errores.yml llama a
-- tomar_errores_pendientes() y, si hay algo nuevo, abre un issue en GitHub
-- asignado al dueño del repo — GitHub avisa por correo.
--
-- Caso que motivó esto: 0021 rompió submit_leaderboard_score() con un regex
-- inválido y nadie se enteró hasta que un usuario mandó captura.

create table if not exists errores_servidor (
  id bigserial primary key,
  creado_en timestamptz not null default now(),
  usuario uuid,
  origen text not null,
  codigo text,
  mensaje text not null,
  avisado boolean not null default false
);
create index if not exists errores_servidor_pendientes on errores_servidor (avisado, creado_en);
create index if not exists errores_servidor_usuario on errores_servidor (usuario, creado_en);
alter table errores_servidor enable row level security;
-- Sin policies: solo se toca desde las funciones SECURITY DEFINER de abajo.

create or replace function reportar_error(p_origen text, p_codigo text, p_mensaje text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if p_origen is null or p_mensaje is null then
    return;
  end if;

  -- Límites para que nadie pueda llenar la tabla: 10 por usuario por hora y
  -- 300 en total por hora. Pasado eso se descarta en silencio — para avisar
  -- alcanza con que lleguen los primeros.
  if v_uid is not null and (
    select count(*) from errores_servidor
    where usuario = v_uid and creado_en > now() - interval '1 hour'
  ) >= 10 then
    return;
  end if;
  if (select count(*) from errores_servidor where creado_en > now() - interval '1 hour') >= 300 then
    return;
  end if;

  insert into errores_servidor (usuario, origen, codigo, mensaje)
  values (v_uid, left(p_origen, 60), left(p_codigo, 20), left(p_mensaje, 500));
end;
$$;

revoke all on function reportar_error(text, text, text) from public;
grant execute on function reportar_error(text, text, text) to anon, authenticated;

-- Devuelve los errores todavía no avisados, agrupados por origen+mensaje, y
-- los marca como avisados en la misma llamada (así el workflow no repite el
-- mismo aviso cada hora). Solo service_role: los mensajes pueden traer
-- detalles internos que no tienen por qué ser públicos.
create or replace function tomar_errores_pendientes()
returns table (origen text, codigo text, mensaje text, veces int, usuarios int, primero timestamptz, ultimo timestamptz)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
-- (arriba) Las columnas de salida origen/codigo/mensaje se llaman igual que las
-- de la tabla: sin esa directiva plpgsql puede quejarse de referencia ambigua.
begin
  -- Limpieza de paso: con 30 días de historia alcanza para revisar algo viejo.
  delete from errores_servidor e where e.creado_en < now() - interval '30 days';

  return query
  with tomados as (
    update errores_servidor e set avisado = true
    where e.avisado = false
    returning e.origen, e.codigo, e.mensaje, e.usuario, e.creado_en
  )
  select t.origen, t.codigo, t.mensaje, count(*)::int, count(distinct t.usuario)::int, min(t.creado_en), max(t.creado_en)
  from tomados t
  group by t.origen, t.codigo, t.mensaje
  order by count(*) desc;
end;
$$;

revoke all on function tomar_errores_pendientes() from public, anon, authenticated;
grant execute on function tomar_errores_pendientes() to service_role;
