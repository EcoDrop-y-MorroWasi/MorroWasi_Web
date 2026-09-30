import { useEffect, useState } from "react";
import { addHydroPoints, getHydroPoints } from "./hydroStore";

// Cursos ya pagados con HydroPuntos. Antes el desbloqueo solo pedía TENER los
// puntos, y como cada curso completado pagaba más de lo que pedía el siguiente,
// los 30 se abrían solos en cadena. Ahora se gastan una sola vez y el curso
// queda abierto para siempre. Mismo patrón que hydroStore.ts (localStorage +
// evento custom); la key está en PROGRESS_STORAGE_KEYS para que viaje con el
// código de sincronización y el respaldo.
export const COURSE_UNLOCK_STORAGE_KEY = "morrowasi_cursos_desbloqueados_v1";
const EVENT_NAME = "morrowasi-cursos-desbloqueados-actualizado";

export function getUnlockedCourseIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COURSE_UNLOCK_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Descuenta `cost` HydroPuntos y marca el curso como desbloqueado. Relee el
 * saldo real en el momento de pagar (no el que tenía la pantalla) y no cobra
 * dos veces el mismo curso. Devuelve false si no alcanza.
 */
export function purchaseCourse(courseId: string, cost: number): boolean {
  const owned = getUnlockedCourseIds();
  if (owned.includes(courseId)) return true;
  if (getHydroPoints() < cost) return false;
  try {
    window.localStorage.setItem(COURSE_UNLOCK_STORAGE_KEY, JSON.stringify([...owned, courseId]));
  } catch {
    return false;
  }
  addHydroPoints(-cost);
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
  return true;
}

/** Hook reactivo con los ids de cursos pagados. */
export function useUnlockedCourseIds(): string[] {
  const [ids, setIds] = useState(getUnlockedCourseIds);

  useEffect(() => {
    const refresh = () => setIds(getUnlockedCourseIds());
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return ids;
}
