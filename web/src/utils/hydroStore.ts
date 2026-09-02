import { useEffect, useState } from "react";
import { mockFamily } from "../data/mock";

// Fuente única de HydroPuntos para toda la app (localStorage + evento custom).
// Antes cada pantalla (Misiones, Juegos) tenía su propio useState(840) aislado,
// que se reiniciaba al navegar; y otras pantallas (Dashboard, Perfil, Academia,
// Album, Inicio) leían el valor fijo mockFamily.hydroPoints (1240) que nunca
// cambiaba. Con esto todas leen y escriben el mismo número.
const STORAGE_KEY = "morrowasi_hydropuntos_v1";
const EVENT_NAME = "morrowasi-hydropuntos-actualizado";

export function getHydroPoints(): number {
  if (typeof window === "undefined") return mockFamily.hydroPoints;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw !== null ? Number(raw) : mockFamily.hydroPoints;
  } catch {
    return mockFamily.hydroPoints;
  }
}

/** Suma (o resta) HydroPuntos sin bajar de 0, persiste y notifica a toda la app. */
export function addHydroPoints(delta: number): number {
  const next = Math.max(0, getHydroPoints() + delta);
  try {
    window.localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* localStorage no disponible */
  }
  return next;
}

/** Hook reactivo: se mantiene igual en cualquier pestaña/pantalla y se actualiza en vivo. */
export function useHydroPoints(): [number, (delta: number) => void] {
  const [hydro, setHydro] = useState(getHydroPoints);

  useEffect(() => {
    const refresh = () => setHydro(getHydroPoints());
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const add = (delta: number) => setHydro(addHydroPoints(delta));
  return [hydro, add];
}
