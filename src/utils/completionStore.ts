import { MINIGAMES } from "./gamification";
import { coursesMock } from "../data/courses.mock";

// Lecturas de solo lectura sobre el progreso que ya guardan Juegos.tsx y Academia.tsx
// (mismas claves de localStorage) — usadas por el logro secreto de Avatares.tsx
// ("completar todos los juegos" / "todos los cursos"). Si esas pantallas cambian su
// formato de guardado, actualizar también acá.
const GAMES_STORAGE_KEY = "morrowasi_games_v1";
const COURSES_PROGRESS_STORAGE_KEY = "morrowasi_academia_progress_v1";

export function allGamesCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(GAMES_STORAGE_KEY);
    const bestScores = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return MINIGAMES.every((g) => bestScores[g.id] !== undefined);
  } catch {
    return false;
  }
}

export function allCoursesCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(COURSES_PROGRESS_STORAGE_KEY);
    const progress = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    return coursesMock.every((c) => (progress[c.id]?.length ?? 0) === c.lessons.length);
  } catch {
    return false;
  }
}
