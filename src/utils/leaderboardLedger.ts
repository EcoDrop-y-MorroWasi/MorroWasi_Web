// Libro de eventos del progreso. Hasta ahora la app guardaba solo el total
// (morrowasi_exp_v1 = "840"), así que editar ese número a mano en DevTools era
// indetectable: el evento "storage" solo dispara en OTRAS pestañas, nunca en la
// que hace el cambio.
//
// Acá se registra además CADA evento que otorgó puntos (qué lo produjo, cuándo,
// cuánto). Al compartir el puntaje, el servidor recalcula el total desde estos
// eventos y lo contrasta con el catálogo real de recompensas: un total inflado a
// mano ya no cuadra con la suma del libro, y un evento inventado no coincide con
// lo que esa misión/juego/curso paga de verdad.
//
// Costo de red: cero mientras se juega. El libro vive en localStorage igual que
// el resto del progreso y viaja una sola vez, en el submit al ranking.
import { getProfileId } from "./progressBackup";

const STORAGE_KEY = "morrowasi_ledger_v1";
export const LEDGER_EVENT_NAME = "morrowasi-ledger-actualizado";

/** Más allá de esto el ranking mensual ya no lo mira y solo ocupa espacio. */
const RETENTION_DAYS = 95;

export type LedgerEventType = "juego" | "mision" | "curso" | "ahorro";

export interface LedgerEvent {
  /** Marca de tiempo en ms (epoch). */
  t: number;
  tipo: LedgerEventType;
  /** Id del catálogo que lo originó: "jg-1", "diaria-03", "sodis-l2"... */
  ref: string;
  exp: number;
  hydro: number;
}

function readRaw(): LedgerEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLedgerEvent);
  } catch {
    return [];
  }
}

function isLedgerEvent(value: unknown): value is LedgerEvent {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Partial<LedgerEvent>;
  return (
    Number.isFinite(e.t) &&
    typeof e.ref === "string" &&
    (e.tipo === "juego" || e.tipo === "mision" || e.tipo === "curso" || e.tipo === "ahorro") &&
    Number.isFinite(e.exp) &&
    Number.isFinite(e.hydro)
  );
}

function write(events: LedgerEvent[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent(LEDGER_EVENT_NAME));
  } catch {
    /* localStorage no disponible */
  }
}

/** Eventos vigentes, descartando los más viejos que la ventana de retención. */
export function readLedger(): LedgerEvent[] {
  const corte = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return readRaw().filter((e) => e.t >= corte);
}

/**
 * Registra un evento que otorgó puntos. Lo llaman los mismos lugares que ya
 * llamaban addExp()/addHydroPoints() — el libro no otorga nada por su cuenta,
 * solo deja constancia de lo que se otorgó. Devuelve el `t` del evento agregado
 * (o null si no otorgaba puntos), para poder revertirlo con removeLedgerEvent
 * si la misión se borra.
 */
export function recordLedgerEvent(
  tipo: LedgerEventType,
  ref: string,
  puntos: { exp?: number; hydro?: number },
): number | null {
  const exp = Math.max(0, Math.round(puntos.exp ?? 0));
  const hydro = Math.max(0, Math.round(puntos.hydro ?? 0));
  if (exp === 0 && hydro === 0) return null;

  const events = readLedger();
  const t = Date.now();
  events.push({ t, tipo, ref, exp, hydro });
  write(events);
  return t;
}

/** Saca del libro el evento exacto (t + ref) — se usa al borrar una misión personalizada ya completada, para que no siga sumando en el ranking. */
export function removeLedgerEvent(t: number, ref: string): void {
  const events = readRaw().filter((e) => !(e.t === t && e.ref === ref));
  write(events);
}

export interface LedgerTotals {
  exp: number;
  hydro: number;
}

function sum(events: LedgerEvent[]): LedgerTotals {
  return events.reduce<LedgerTotals>(
    (acc, e) => ({ exp: acc.exp + e.exp, hydro: acc.hydro + e.hydro }),
    { exp: 0, hydro: 0 },
  );
}

export function totalsFromLedger(): LedgerTotals {
  return sum(readLedger());
}

/** Inicio del día de hoy en hora de Perú, en ms epoch — el corte de las 00:00 del ranking diario. */
export function startOfTodayLima(): number {
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  // "America/Lima" es UTC-5 todo el año (Perú no aplica horario de verano), así
  // que la medianoche local es siempre las 05:00 UTC de esa misma fecha.
  return Date.parse(`${hoy}T05:00:00.000Z`);
}

export function totalsToday(): LedgerTotals {
  const desde = startOfTodayLima();
  return sum(readLedger().filter((e) => e.t >= desde));
}

/**
 * true si el total guardado en su store no coincide con la suma del libro. Pasa
 * cuando alguien edita localStorage a mano, pero también de forma legítima en
 * cuentas que ya venían jugando antes de que existiera el libro — por eso el
 * cliente solo lo usa para avisar, y la decisión real la toma el servidor.
 */
export function ledgerMatches(totalExp: number, totalHydro: number): boolean {
  const t = totalsFromLedger();
  return t.exp === totalExp && t.hydro === totalHydro;
}

/** Payload que viaja al RPC submit_leaderboard_score. */
export function buildSubmitPayload(): { profileId: string; eventos: LedgerEvent[] } {
  return { profileId: getProfileId(), eventos: readLedger() };
}
