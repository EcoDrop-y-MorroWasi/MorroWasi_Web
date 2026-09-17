-- Borra automáticamente los respaldos de progreso sin actividad hace más de
-- 90 días. Irreversible a propósito acotado: 90 días cubre vacaciones,
-- cambios de celular y cortes largos sin internet sin arriesgar progreso real
-- de alguien que solo estuvo un tiempo sin abrir la app.
--
-- No se llama sola: la dispara .github/workflows/cleanup-inactivos.yml una
-- vez al día (mismo patrón que keep-alive.yml). anon puede ejecutarla porque
-- no expone nada sensible ni recibe parámetros — solo limpia filas viejas
-- según su propio updated_at, nunca según lo que mande quien la llame.
create or replace function limpiar_cuentas_inactivas() returns void
language sql
security definer
set search_path = public
as $$
  delete from progress_sync where updated_at < now() - interval '90 days';
$$;

revoke all on function limpiar_cuentas_inactivas() from public;
grant execute on function limpiar_cuentas_inactivas() to anon, authenticated;
