import { describe, expect, it } from "vitest";
import { calcPew, calcWasiStage, WASI_STAGE_THRESHOLDS, WASI_STAGES } from "./mock";

describe("calcPew", () => {
  it("suma EXP + racha, con la racha topada en 1000 (100 días)", () => {
    expect(calcPew(0, 0)).toBe(0);
    expect(calcPew(500, 10)).toBe(600);
    expect(calcPew(0, 200)).toBe(1000); // racha sola nunca pasa de 1000
  });
});

describe("WASI_STAGE_THRESHOLDS", () => {
  it("tiene 10 umbrales, empieza en 0 y crece siempre", () => {
    expect(WASI_STAGE_THRESHOLDS).toHaveLength(10);
    expect(WASI_STAGE_THRESHOLDS[0]).toBe(0);
    for (let i = 1; i < WASI_STAGE_THRESHOLDS.length; i++) {
      expect(WASI_STAGE_THRESHOLDS[i]).toBeGreaterThan(WASI_STAGE_THRESHOLDS[i - 1]);
    }
  });

  it("coincide con la curva rebalanceada (etapa 10 = 22,000 PEW)", () => {
    expect(WASI_STAGE_THRESHOLDS).toEqual([0, 1000, 2000, 4000, 6000, 8000, 12000, 14000, 18000, 22000]);
  });
});

describe("WASI_STAGES", () => {
  it("tiene 10 etapas numeradas 1 a 10, cada una con nombre propio", () => {
    expect(WASI_STAGES).toHaveLength(10);
    WASI_STAGES.forEach((s, i) => expect(s.number).toBe(i + 1));
    const nombres = new Set(WASI_STAGES.map((s) => s.name));
    expect(nombres.size).toBe(10);
  });
});

describe("calcWasiStage", () => {
  it("arranca en etapa 1 con 0 PEW, sin retroceder nunca ni pasar de 10", () => {
    expect(calcWasiStage(0).stage).toBe(1);
    expect(calcWasiStage(999).stage).toBe(1);
    expect(calcWasiStage(22000).stage).toBe(10);
    expect(calcWasiStage(9_999_999).stage).toBe(10); // nunca pasa de la última etapa
  });

  it("sube de etapa justo al cruzar cada umbral, ni un PEW antes", () => {
    for (let i = 1; i < WASI_STAGE_THRESHOLDS.length; i++) {
      expect(calcWasiStage(WASI_STAGE_THRESHOLDS[i] - 1).stage).toBe(i);
      expect(calcWasiStage(WASI_STAGE_THRESHOLDS[i]).stage).toBe(i + 1);
    }
  });

  it("progressInStage + lo ya recorrido de la etapa nunca supera xpParaSiguiente", () => {
    [0, 500, 1500, 5000, 15000, 21999, 22000, 50000].forEach((pew) => {
      const { progressInStage, xpParaSiguiente } = calcWasiStage(pew);
      expect(progressInStage).toBeGreaterThanOrEqual(0);
      expect(progressInStage).toBeLessThanOrEqual(xpParaSiguiente);
    });
  });
});
