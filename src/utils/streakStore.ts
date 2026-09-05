import { useEffect, useState } from "react";

// Racha real de días consecutivos con actividad. Antes `mockFamily.streakDays`
// era un 0 fijo en toda la app (Dashboard, Perfil, PEW/Wasi, logros) y nada lo
// movía nunca — Juegos.tsx incluso escribía una fecha a `morrowasi_games_activity_v1`
// diciendo "cuenta para tu racha diaria" pero esa key no la leía nadie.
const STORAGE_KEY = "morrowasi_streak_v1";
const EVENT_NAME = "morrowasi-racha-actualizada";

interface StreakState {
  lastActiveDate: string; // YYYY-MM-DD, huso horario Lima
  streakDays: number;
}

function todayLima(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
}

function yesterdayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA");
}

function readState(): StreakState {
  if (typeof window === "undefined") return { lastActiveDate: "", streakDays: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastActiveDate: "", streakDays: 0 };
    const parsed = JSON.parse(raw) as Partial<StreakState>;
    return {
      lastActiveDate: typeof parsed.lastActiveDate === "string" ? parsed.lastActiveDate : "",
      streakDays: Number.isFinite(parsed.streakDays) ? (parsed.streakDays as number) : 0,
    };
  } catch {
    return { lastActiveDate: "", streakDays: 0 };
  }
}

/**
 * Racha vigente a "hoy": si el último día con actividad no fue hoy ni ayer,
 * la racha ya se rompió — se muestra en 0 de inmediato, sin esperar a que el
 * usuario haga algo nuevo para que recién ahí se note.
 */
export function getStreakDays(): number {
  const state = readState();
  if (!state.lastActiveDate) return 0;
  const today = todayLima();
  if (state.lastActiveDate === today || state.lastActiveDate === yesterdayOf(today)) {
    return state.streakDays;
  }
  return 0;
}

/**
 * Marca actividad real de hoy (misión completada, minijuego con récord nuevo,
 * lección de curso terminada, litros de ahorro registrados). Idempotente: no
 * suma dos veces el mismo día aunque se llame varias veces.
 */
export function markActivityToday(): number {
  const state = readState();
  const today = todayLima();
  if (state.lastActiveDate === today) return state.streakDays;

  const next: StreakState =
    state.lastActiveDate === yesterdayOf(today)
      ? { lastActiveDate: today, streakDays: state.streakDays + 1 }
      : { lastActiveDate: today, streakDays: 1 };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* localStorage no disponible */
  }
  return next.streakDays;
}

/** Hook reactivo: se actualiza en vivo en cualquier pantalla cuando se marca actividad. */
export function useStreakDays(): number {
  const [days, setDays] = useState(getStreakDays);

  useEffect(() => {
    const refresh = () => setDays(getStreakDays());
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return days;
}
