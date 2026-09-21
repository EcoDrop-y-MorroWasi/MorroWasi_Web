// Detecta cuándo el Wasi sube de etapa para mostrar la celebración una sola
// vez por etapa (WasiLevelUpModal) — nunca se repite, ni volviendo a visitar
// esa etapa en WasiModal ni recargando la página.
const KEY = "morrowasi_wasi_celebrado_v1";

/** Última etapa ya celebrada en este dispositivo. 0 = todavía no corrió nunca. */
export function getCelebratedStage(): number {
  try {
    const raw = window.localStorage.getItem(KEY);
    const n = raw !== null ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function setCelebratedStage(stage: number): void {
  try {
    window.localStorage.setItem(KEY, String(stage));
  } catch {
    /* localStorage no disponible */
  }
}
