import { PROGRESS_STORAGE_KEYS } from "./progressKeys";

// Marca de tiempo del último cambio real de progreso — la usan progressBackup
// (avisar si un import es más viejo que lo que ya hay) y progressSync (decidir
// quién gana entre local y servidor: "el más reciente gana").
const LAST_MODIFIED_KEY = "morrowasi_last_modified_v1";
export const PROGRESS_TOUCHED_EVENT = "morrowasi-progreso-actualizado";

export function getLastModified(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(LAST_MODIFIED_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

let tracking = false;

/**
 * Parchea localStorage.setItem una sola vez para actualizar LAST_MODIFIED_KEY
 * cada vez que se escribe alguna de PROGRESS_STORAGE_KEYS — así no hace falta
 * tocar cada pantalla/store que guarda progreso (Juegos, Academia, hydroStore,
 * etc.) para que quede registrada la fecha del último cambio.
 */
export function initProgressTracking(): void {
  if (tracking || typeof window === "undefined") return;
  tracking = true;

  const original = window.localStorage.setItem.bind(window.localStorage);
  window.localStorage.setItem = (key: string, value: string) => {
    original(key, value);
    if (key !== LAST_MODIFIED_KEY && (PROGRESS_STORAGE_KEYS as readonly string[]).includes(key)) {
      original(LAST_MODIFIED_KEY, String(Date.now()));
      window.dispatchEvent(new CustomEvent(PROGRESS_TOUCHED_EVENT));
    }
  };
}
