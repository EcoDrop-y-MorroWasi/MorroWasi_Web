-- Correcciones de seguridad detectadas por el linter de Supabase.
--
-- Problemas resueltos:
--   1) ip_de_solicitud() no tenía search_path fijo. Al ser una función auxiliar
--      sin SECURITY DEFINER y sin acceso directo de clientes, el riesgo real es
--      bajo, pero se fija igual para limpiar el aviso y seguir buenas prácticas.
--
--   2) banned_words_refrescar_grupos() es una función de TRIGGER — solo la puede
--      invocar el motor de Postgres cuando alguien toca `banned_words`, nunca un
--      cliente externo. El linter la reportaba como callable por anon/authenticated
--      porque, técnicamente, cualquiera con el grant heredado de `public` podía
--      llamarla como RPC. Se revoca ese permiso explícitamente.
--
-- Lo que NO se cambia (y por qué):
--   • limpiar_cuentas_inactivas(): el comentario de 0020 lo explica — es llamada
--     por el workflow de GitHub (.github/workflows/cleanup-inactivos.yml) usando
--     la anon key, no la service_role. El acceso anon es intencional.
--   • listar_usuarios_huerfanos(): ya solo tiene grant a service_role (0023).
--     El linter la reportaba incorrectamente; REVOKE redundante no hace daño
--     pero tampoco se agrega para no confundir el historial de migraciones.
--   • Todas las demás funciones ya tienen `set search_path` desde su migración
--     de origen — se verificó archivo por archivo.

-- ---------------------------------------------------------------------------
-- 1) Fijar search_path en ip_de_solicitud()
--    La función lee GUCs de la sesión (request.headers), que son seguros por
--    si mismos, pero sin search_path fijo un atacante con permisos de crear
--    schemas podría hacer shadowing sobre funciones que ella llame en el futuro.
-- ---------------------------------------------------------------------------
create or replace function public.ip_de_solicitud() returns text
language sql
stable
set search_path = public
as $$
  select coalesce(
    nullif(split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1), ''),
    'desconocida'
  );
$$;

-- Sin SECURITY DEFINER: no hay permisos elevados que proteger. Sin grant/revoke:
-- el acceso lo heredan las funciones SECURITY DEFINER que la llaman internamente
-- (crear_codigo_nuevo). No es un RPC público por sí sola.

-- ---------------------------------------------------------------------------
-- 2) Revocar EXECUTE en banned_words_refrescar_grupos() del rol public
--    Es una función de trigger: Postgres la invoca internamente, nunca por un
--    cliente. No debe aparecer como endpoint en /rest/v1/rpc/.
-- ---------------------------------------------------------------------------
revoke all on function public.banned_words_refrescar_grupos() from public, anon, authenticated;
-- El trigger interno sigue funcionando: el motor usa el dueño de la función
-- (postgres / superuser), no el rol del cliente, para ejecutar triggers.
