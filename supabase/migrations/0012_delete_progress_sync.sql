-- "Eliminar cuenta" en Perfil borra el respaldo del servidor asociado a un
-- código de acceso — mismo modelo de confianza que get_progress_sync/
-- save_progress_sync (quien tiene el código puede escribir o borrar su fila).
create or replace function delete_progress_sync(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_code !~ '^[A-Za-z0-9]{10}$' then
    raise exception 'código inválido';
  end if;

  delete from progress_sync where progress_sync.code = p_code;
end;
$$;

revoke all on function delete_progress_sync(text) from public;
grant execute on function delete_progress_sync(text) to anon, authenticated;
