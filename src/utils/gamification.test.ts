import { describe, expect, it } from "vitest";
import {
  calcCustomXp,
  calcMinigameScore,
  MINIGAMES,
  MISIONES_DIARIAS_POOL,
  MISIONES_SEMANALES_POOL,
  getMisionesDiariasDeHoy,
  getMisionesSemanalesDeEstaSemana,
  calcCostoSoles,
} from "./gamification";
import { calcCourseExp } from "./gamification";
import { calcGameExp } from "./gamification";

describe("calcCustomXp", () => {
  it("acota entre 5 y 40, redondeando litros/3", () => {
    expect(calcCustomXp(0)).toBe(5); // piso
    expect(calcCustomXp(30)).toBe(10);
    expect(calcCustomXp(1000)).toBe(40); // techo
  });
});

describe("calcMinigameScore", () => {
  it("una derrota total (accuracy 0) no da nada — antes regalaba el piso de 30", () => {
    expect(calcMinigameScore(0)).toBe(0);
  });

  it("acota entre 30 y 100 para cualquier accuracy > 0", () => {
    expect(calcMinigameScore(0.01)).toBeGreaterThanOrEqual(30);
    expect(calcMinigameScore(1)).toBe(100);
    expect(calcMinigameScore(2)).toBe(100); // clamp por si llega >1
  });
});

describe("calcCourseExp / calcGameExp", () => {
  it("EXP siempre es una fracción (1/5) del HydroPuntos, con piso propio", () => {
    expect(calcCourseExp(150)).toBe(30);
    expect(calcCourseExp(10)).toBe(5); // piso de calcCourseExp
    expect(calcGameExp(100)).toBe(20);
    expect(calcGameExp(10)).toBe(3); // piso de calcGameExp
  });
});

describe("MINIGAMES", () => {
  it("son 15 minijuegos con tipo e id únicos", () => {
    expect(MINIGAMES).toHaveLength(15);
    expect(new Set(MINIGAMES.map((g) => g.id)).size).toBe(15);
    expect(new Set(MINIGAMES.map((g) => g.type)).size).toBe(15);
  });
});

describe("pools de misiones", () => {
  it("28 diarias en 7 bloques de 4, 12 semanales en 3 bloques de 4", () => {
    expect(MISIONES_DIARIAS_POOL).toHaveLength(28);
    expect(MISIONES_SEMANALES_POOL).toHaveLength(12);
  });

  it("getMisionesDiariasDeHoy/Semanales siempre devuelven un bloque de 4, cualquier fecha", () => {
    const fechas = [new Date(2026, 0, 1), new Date(2026, 5, 15), new Date(2030, 11, 31)];
    fechas.forEach((f) => {
      expect(getMisionesDiariasDeHoy(f)).toHaveLength(4);
      expect(getMisionesSemanalesDeEstaSemana(f)).toHaveLength(4);
    });
  });
});

describe("calcCostoSoles", () => {
  it("usa la tarifa real EPS Grau (S/ 0.000804 por litro), no la vieja x1000", () => {
    expect(calcCostoSoles(1000)).toBeCloseTo(0.8, 2);
  });
});
