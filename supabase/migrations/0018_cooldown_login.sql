-- Cooldown escalonado por usuario (auth.uid) contra fuerza bruta del código de
-- login — reemplaza el freno que vivía en localStorage (Login.tsx): ese se
-- salta con un script que llame al RPC directo, sin pasar por la página. Acá
-- vive en la base, así que no hay forma de saltárselo desde el cliente.
--
-- Regla: cada 3 fallos escala un nivel de espera. La escala no se reinicia
-- sola con el tiempo — solo un código correcto la resetea a cero. Así alguien
-- que ya demostró estar adivinando códigos no vuelve a arrancar "fresco" en
-- cada intento.
--
-- Solo protege el flujo de LOGIN (código nunca antes usado en este dispositivo,
-- "¿es tuyo este código?"). El sync periódico de un código ya enlazado sigue
-- usando get_progress_sync() sin este freno — no es un intento de adivinar,
-- es releer un código que ya se demostró tuyo.
create table if not exists login_intentos (
  uid uuid primary key references auth.users on delete cascade,
  fallos int not null default 0,
  nivel int not null default 0,
  bloqueado_hasta timestamptz
);

alter table login_intentos enable row level security;
-- Sin policies de select/insert/update: nadie la toca directo, solo la función
-- SECURITY DEFINER de abajo, con el auth.uid() de quien llama.

create or replace function intentar_codigo_login(p_code text)
returns table (data jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  -- Minutos: 5, 10, 15, 30, 5h, 1 día, 1 semana, 1 mes, 1.5 meses, 3 meses.
  -- El último nivel es el tope: más fallos después de eso no siguen escalando.
  v_tiers constant int[] := array[5, 10, 15, 30, 300, 1440, 10080, 43200, 64800, 129600];
  v_fallos int;
  v_nivel int;
  v_bloqueado_hasta timestamptz;
  v_encontrado boolean;
begin
  if p_code !~ '^[A-Za-z0-9]{10}$' then
    raise exception 'código inválido';
  end if;
  if v_uid is null then
    raise exception 'sesión inválida';
  end if;

  select fallos, nivel, bloqueado_hasta into v_fallos, v_nivel, v_bloqueado_hasta
  from login_intentos where uid = v_uid;

  if not found then
    v_fallos := 0;
    v_nivel := 0;
    v_bloqueado_hasta := null;
    insert into login_intentos (uid) values (v_uid);
  end if;

  if v_bloqueado_hasta is not null and v_bloqueado_hasta > now() then
    raise exception 'Demasiados intentos. Espera hasta % (hora de Perú).',
      to_char(v_bloqueado_hasta at time zone 'America/Lima', 'DD/MM HH24:MI');
  end if;

  select exists(select 1 from progress_sync where code = p_code) into v_encontrado;

  if not v_encontrado then
    v_fallos := v_fallos + 1;
    if v_fallos >= 3 then
      v_nivel := least(v_nivel + 1, array_length(v_tiers, 1) - 1);
      v_bloqueado_hasta := now() + make_interval(mins => v_tiers[v_nivel + 1]);
      v_fallos := 0;
    end if;
    update login_intentos
      set fallos = v_fallos, nivel = v_nivel, bloqueado_hasta = v_bloqueado_hasta
      where uid = v_uid;
    return;
  end if;

  -- Código correcto: el castigo se resetea, no solo el contador de fallos.
  update login_intentos set fallos = 0, nivel = 0, bloqueado_hasta = null where uid = v_uid;

  return query
  select progress_sync.data, progress_sync.updated_at
  from progress_sync
  where progress_sync.code = p_code;
end;
$$;

revoke all on function intentar_codigo_login(text) from public;
grant execute on function intentar_codigo_login(text) to authenticated;
