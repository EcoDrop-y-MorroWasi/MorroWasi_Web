import { useEffect, useState } from "react";

// Fuente única de EXP para toda la app — separada de HydroPuntos (hydroStore.ts).
// EXP la ganan las Misiones (hábitos diarios/semanales/personalizados) y es lo que
// hace crecer al Wasi (calcPew). HydroPuntos las ganan los Juegos y los Cursos
// completados, y son la moneda para desbloqueos/tienda — no mueven al Wasi.
const STORAGE_KEY = "morrowasi_exp_v1";
const EVENT_NAME = "morrowasi-exp-actualizado";

export function getExp(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw !== null ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

/** Suma (o resta) EXP sin bajar de 0, persiste y notifica a toda la app. */
export function addExp(delta: number): number {
  const next = Math.max(0, getExp() + delta);
  try {
    window.localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* localStorage no disponible */
  }
  return next;
}

/** Hook reactivo: se mantiene igual en cualquier pestaña/pantalla y se actualiza en vivo. */
export function useExp(): [number, (delta: number) => void] {
  const [exp, setExp] = useState(getExp);

  useEffect(() => {
    const refresh = () => setExp(getExp());
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const add = (delta: number) => setExp(addExp(delta));
  return [exp, add];
}
