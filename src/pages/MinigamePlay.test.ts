import { describe, expect, it } from "vitest";
import { calcAtrapaLluviasAccuracy, computeConnectivity, initialRutasPipes, pickRiegoScenario } from "./MinigamePlay";

describe("Atrapa-Lluvias Piurano", () => {
  it("mide los litros limpios contra la lluvia limpia disponible, no contra 90 segundos completos", () => {
    expect(calcAtrapaLluviasAccuracy(231, 240, 0)).toBeCloseTo(0.9625);
    expect(calcAtrapaLluviasAccuracy(231, 240, 0)).toBeGreaterThanOrEqual(0.5);
  });

  it("penaliza contaminar el tanque sin borrar el rendimiento de la lluvia limpia", () => {
    expect(calcAtrapaLluviasAccuracy(240, 240, 2)).toBeCloseTo(0.975);
  });
});

describe("Maestro del Riego", () => {
  it("no repite el escenario anterior", () => {
    const first = pickRiegoScenario(undefined, () => 0);
    const next = pickRiegoScenario(first.id, () => 0);
    expect(next.id).not.toBe(first.id);
  });
});

describe("Rutas de Aguas Grises", () => {
  const target = { r: 0, c: 2 };

  it("nunca empieza conectado, aunque el azar siempre elija el mismo giro", () => {
    for (const random of [() => 0, () => 0.5, () => 0.99]) {
      expect(computeConnectivity(initialRutasPipes(random), target).connected).toBe(false);
    }
  });

  it("mantiene bloqueada la salida de la lavadora para cualquier giro aleatorio inicial", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(computeConnectivity(initialRutasPipes(Math.random), target).connected).toBe(false);
    }
  });

  it("conserva una solución válida tras las rotaciones del jugador", () => {
    const pipes = initialRutasPipes(() => 0);
    pipes["1-0"].rotation = 0;
    pipes["0-0"].rotation = 1;
    pipes["0-1"].rotation = 1;
    expect(computeConnectivity(pipes, target).connected).toBe(true);
  });
});
