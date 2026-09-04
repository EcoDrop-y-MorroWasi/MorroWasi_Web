// Contadores mock persistentes para el Álbum de insignias (Album.tsx) — localStorage, sin Firebase/BLE.
// Simplificación MVP: cuentan repeticiones totales, no rachas de días consecutivos reales (no hay fechas persistidas).

const STATS_KEY = "morrowasi_stats_v1";

export interface MorroWasiStats {
  fugasReparadas: number;
  nochesRiego: number;
  duchasFlash: number;
}

const DEFAULT_STATS: MorroWasiStats = { fugasReparadas: 0, nochesRiego: 0, duchasFlash: 0 };

export function getStats(): MorroWasiStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    return raw ? { ...DEFAULT_STATS, ...(JSON.parse(raw) as Partial<MorroWasiStats>) } : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

export function bumpStat(key: keyof MorroWasiStats, amount = 1): MorroWasiStats {
  const current = getStats();
  const next: MorroWasiStats = { ...current, [key]: current[key] + amount };
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(next));
  } catch {
    /* localStorage no disponible */
  }
  return next;
}
