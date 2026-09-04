import { beforeEach, describe, expect, it } from "vitest";
import { MINIGAMES } from "./gamification";
import { coursesMock } from "../data/courses.mock";
import { allCoursesCompleted, allGamesCompleted } from "./completionStore";

const GAMES_KEY = "morrowasi_games_v1";
const COURSES_KEY = "morrowasi_academia_progress_v1";

describe("completionStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("allGamesCompleted es false sin progreso guardado", () => {
    expect(allGamesCompleted()).toBe(false);
  });

  it("allGamesCompleted es true cuando todos los minijuegos tienen bestScore", () => {
    const scores: Record<string, number> = {};
    MINIGAMES.forEach((g) => (scores[g.id] = 50));
    window.localStorage.setItem(GAMES_KEY, JSON.stringify(scores));
    expect(allGamesCompleted()).toBe(true);
  });

  it("allGamesCompleted sigue en false si falta un juego", () => {
    const scores: Record<string, number> = {};
    MINIGAMES.slice(1).forEach((g) => (scores[g.id] = 50));
    window.localStorage.setItem(GAMES_KEY, JSON.stringify(scores));
    expect(allGamesCompleted()).toBe(false);
  });

  it("allCoursesCompleted es true solo cuando cada curso tiene todas sus lecciones", () => {
    const full: Record<string, string[]> = {};
    coursesMock.forEach((c) => (full[c.id] = c.lessons.map((l) => l.id)));
    window.localStorage.setItem(COURSES_KEY, JSON.stringify(full));
    expect(allCoursesCompleted()).toBe(true);

    const partial: Record<string, string[]> = { ...full, [coursesMock[0].id]: [] };
    window.localStorage.setItem(COURSES_KEY, JSON.stringify(partial));
    expect(allCoursesCompleted()).toBe(false);
  });

  it("no explota con JSON corrupto en localStorage", () => {
    window.localStorage.setItem(GAMES_KEY, "{no-es-json");
    window.localStorage.setItem(COURSES_KEY, "{no-es-json");
    expect(allGamesCompleted()).toBe(false);
    expect(allCoursesCompleted()).toBe(false);
  });
});
