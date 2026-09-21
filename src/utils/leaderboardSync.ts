// Cliente de la tabla de clasificación pública. Nada sube solo: el usuario tiene
// que dar consentimiento una vez y después tocar "Compartir mi puntaje" cada vez.
import { supabase } from "../lib/supabaseClient";
import { getProfileId } from "./progressBackup";
import { readLedger } from "./leaderboardLedger";

const SECRET_KEY = "morrowasi_leaderboard_secret_v1";
const CONSENT_KEY = "morrowasi_leaderboard_consent_v1";
const ULTIMO_ENVIO_KEY = "morrowasi_leaderboard_ultimo_envio_v1";

export type LeaderboardPeriodo = "dia" | "semana" | "mes" | "global";

export const PERIODOS: { id: LeaderboardPeriodo; label: string }[] = [
  { id: "dia", label: "Hoy" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "global", label: "Histórico" },
];

export interface LeaderboardRow {
  profile_id: string;
  nombre: string;
  avatar: string;
  exp: number;
  hydro_points: number;
  etapa: number;
  updated_at: string;
}

/**
 * Secreto que reclama el profile_id la primera vez que se comparte puntaje. El
 * profile_id es público (sale en el ranking) y el RPC lo puede llamar cualquiera
 * con la anon key, así que sin esto un tercero podría pisar la entrada ajena con
 * datos falsos. Se genera solo, el usuario nunca lo ve ni lo escribe.
 */
function getLeaderboardSecret(): string {
  try {
    let secret = window.localStorage.getItem(SECRET_KEY);
    if (!secret) {
      secret = crypto.randomUUID().replace(/-/g, "");
      window.localStorage.setItem(SECRET_KEY, secret);
    }
    return secret;
  } catch {
    return "";
  }
}

/**
 * Borra la entrada del ranking de esta persona (y en cascada su libro de
 * eventos), parte de "Eliminar cuenta" en Perfil. A diferencia de
 * getLeaderboardSecret(), NO crea un secret si no hay uno guardado — si nunca
 * compartió puntaje, no hay nada que borrar y no vale la pena reclamar un
 * profile_id nuevo solo para esto.
 */
export async function deleteLeaderboardEntry(): Promise<void> {
  let secret: string | null = null;
  try {
    secret = window.localStorage.getItem(SECRET_KEY);
  } catch {
    /* localStorage no disponible */
  }
  if (!secret) return;
  const { error } = await supabase.rpc("delete_leaderboard_entry", {
    p_profile_id: getProfileId(),
    p_secret: secret,
  });
  if (error) throw error;
}

export function tieneConsentimiento(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "true";
  } catch {
    return false;
  }
}

export function darConsentimiento(): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, "true");
  } catch {
    /* localStorage no disponible */
  }
}

export function getUltimoEnvio(): number {
  try {
    const raw = window.localStorage.getItem(ULTIMO_ENVIO_KEY);
    const n = raw !== null ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export interface SubmitResult {
  nombreAplicado: string;
  expTotal: number;
  hydroTotal: number;
  eventosNuevos: number;
}

/**
 * Manda el libro de eventos completo (no el total). El servidor recalcula y
 * valida contra el catálogo de recompensas, así que un total editado a mano en
 * localStorage no sirve de nada. Reenviar el mismo libro es idempotente.
 */
export async function submitScore(nombre: string, avatar: string): Promise<SubmitResult> {
  const { data, error } = await supabase.rpc("submit_leaderboard_score", {
    p_profile_id: getProfileId(),
    p_secret: getLeaderboardSecret(),
    p_nombre: nombre,
    p_avatar: avatar,
    p_eventos: readLedger(),
  });

  if (error) throw new Error(traducirError(error.message));

  const row = (data as Record<string, unknown>[] | null)?.[0];
  try {
    window.localStorage.setItem(ULTIMO_ENVIO_KEY, String(Date.now()));
  } catch {
    /* localStorage no disponible */
  }

  return {
    nombreAplicado: String(row?.nombre_aplicado ?? nombre),
    expTotal: Number(row?.exp_total ?? 0),
    hydroTotal: Number(row?.hydro_total ?? 0),
    eventosNuevos: Number(row?.eventos_nuevos ?? 0),
  };
}

export async function fetchLeaderboard(
  periodo: LeaderboardPeriodo,
  limite = 10,
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_periodo: periodo,
    p_limite: limite,
  });
  if (error) throw new Error(traducirError(error.message));
  return (data ?? []) as LeaderboardRow[];
}

/**
 * Se suscribe a los inserts de leaderboard_events para refrescar el ranking en
 * vivo mientras otras personas comparten su puntaje. Devuelve la función para
 * cortar la suscripción.
 */
export function subscribeLeaderboard(onChange: () => void): () => void {
  const channel = supabase
    .channel("leaderboard")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "leaderboard_events" },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Los mensajes de las funciones SQL ya vienen en español y pensados para el
// usuario; los de PostgREST/Postgres no. Se traducen los casos que puede ver
// alguien sin la migración aplicada o con la red caída.
function traducirError(mensaje: string): string {
  if (/does not exist|schema cache|404/i.test(mensaje)) {
    return "La tabla de clasificación todavía no está disponible. Vuelve a intentarlo más tarde.";
  }
  if (/fetch|network|failed to/i.test(mensaje)) {
    return "Sin conexión con el servidor. Tu progreso sigue guardado en este dispositivo.";
  }
  // Supabase rechaza el token cuando el reloj del dispositivo está adelantado
  // respecto del servidor. El mensaje crudo ("JWT issued at future") no le dice
  // nada al usuario, y la causa se arregla del lado del dispositivo.
  if (/jwt|issued at|clock/i.test(mensaje)) {
    return "La fecha y hora de este dispositivo no coinciden con las del servidor. Ajústalas y vuelve a intentar.";
  }
  return mensaje;
}
