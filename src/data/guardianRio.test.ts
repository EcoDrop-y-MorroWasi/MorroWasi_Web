import { describe, expect, it } from "vitest";
import {
  phaseAt,
  pickLaneX,
  pickSpecies,
  RIVER_PHASES,
  RIVER_SPECIES,
  SPECIES_BY_ID,
  TOTAL_SPECIES,
} from "./guardianRio";
import { calcGuardianRioAccuracy } from "../pages/MinigamePlay";

describe("Catálogo del río", () => {
  it("no tiene ids repetidos y todos resuelve en el índice", () => {
    const ids = RIVER_SPECIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of RIVER_SPECIES) expect(SPECIES_BY_ID[s.id]).toBe(s);
    expect(TOTAL_SPECIES).toBe(RIVER_SPECIES.length);
  });

  it("cada especie tiene nombre, emoji y dato educativo", () => {
    for (const s of RIVER_SPECIES) {
      expect(s.nombre.trim().length).toBeGreaterThan(2);
      expect(s.dato.trim().length).toBeGreaterThan(15);
      expect(s.emoji.length).toBeGreaterThan(0);
    }
  });

  it("trae fauna, mangle y basura en cantidades comparables", () => {
    expect(RIVER_SPECIES.filter((s) => s.kind === "trash").length).toBeGreaterThanOrEqual(8);
    expect(RIVER_SPECIES.filter((s) => s.kind === "fauna").length).toBeGreaterThanOrEqual(14);
  });
});

describe("Fases del río", () => {
  it("divide la partida en tercios, no en segundos fijos", () => {
    expect(phaseAt(0, 60).id).toBe("manana");
    expect(phaseAt(19, 60).id).toBe("manana");
    expect(phaseAt(20, 60).id).toBe("crecida");
    expect(phaseAt(39, 60).id).toBe("crecida");
    expect(phaseAt(40, 60).id).toBe("sequia");
    expect(phaseAt(60, 60).id).toBe("sequia");
  });

  it("respeta los tercios también con otra duración", () => {
    expect(phaseAt(29, 90).id).toBe("manana");
    expect(phaseAt(30, 90).id).toBe("crecida");
    expect(phaseAt(60, 90).id).toBe("sequia");
  });

  it("no rompe si la duración es cero o negativa", () => {
    expect(phaseAt(10, 0).id).toBe("manana");
    expect(phaseAt(10, -5).id).toBe("manana");
  });

  it("escala dificultad: la crecida aprieta el ritmo y sube la basura", () => {
    const [manana, crecida, sequia] = RIVER_PHASES;
    expect(crecida.spawnMs).toBeLessThan(manana.spawnMs);
    expect(crecida.lifespanMs).toBeLessThan(manana.lifespanMs);
    expect(crecida.trashChance).toBeGreaterThan(manana.trashChance);
    // La sequía calma el caudal: se ve más fauna que basura.
    expect(sequia.trashChance).toBeLessThan(crecida.trashChance);
    expect(sequia.spawnMs).toBeGreaterThan(crecida.spawnMs);
  });

  it("mantiene el spawn siempre más corto que la vida del objeto", () => {
    for (const p of RIVER_PHASES) expect(p.spawnMs).toBeLessThan(p.lifespanMs);
  });
});

describe("Selección de especies", () => {
  it("respeta trashChance: con random=0 siempre sale basura, con random=0.99 nunca", () => {
    for (const phase of RIVER_PHASES) {
      expect(pickSpecies(phase, () => 0).kind).toBe("trash");
      expect(pickSpecies(phase, () => 0.99).kind).toBe("fauna");
    }
  });

  it("nunca saca un emoji del catálogo, ni con random en los extremos", () => {
    for (const phase of RIVER_PHASES) {
      for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
        const s = pickSpecies(phase, () => r);
        expect(RIVER_SPECIES).toContain(s);
      }
    }
  });

  it("la fase de crecida trae más basura que la de sequía en una muestra grande", () => {
    const trashCount = (phaseId: string) => {
      const phase = RIVER_PHASES.find((p) => p.id === phaseId)!;
      let n = 0;
      for (let i = 0; i < 4000; i += 1) if (pickSpecies(phase).kind === "trash") n += 1;
      return n;
    };
    expect(trashCount("crecida")).toBeGreaterThan(trashCount("sequia"));
  });

  it("mantiene los carriles dentro del tablero", () => {
    for (let i = 0; i < 500; i += 1) {
      const x = pickLaneX();
      expect(x).toBeGreaterThanOrEqual(15);
      expect(x).toBeLessThanOrEqual(85);
    }
    expect(pickLaneX(() => 0)).toBe(15);
    expect(pickLaneX(() => 1)).toBe(85);
  });
});

describe("Accuracy del Guardián", () => {
  it("premia eficiencia y vida restante", () => {
    expect(calcGuardianRioAccuracy(20, 20, 100)).toBe(1);
    expect(calcGuardianRioAccuracy(20, 20, 50)).toBeCloseTo(0.5);
    expect(calcGuardianRioAccuracy(10, 20, 100)).toBeCloseTo(0.5);
  });

  it("nunca sale del rango 0..1 aunque no haya intentos o la vida esté al borde", () => {
    expect(calcGuardianRioAccuracy(0, 0, 100)).toBe(0.5);
    expect(calcGuardianRioAccuracy(0, 20, 0)).toBe(0);
    expect(calcGuardianRioAccuracy(20, 20, 100)).toBe(1);
    expect(calcGuardianRioAccuracy(30, 20, 100)).toBe(1);
  });
});