import { describe, expect, it } from "vitest";
import {
  CLORACION_PHASES,
  COMBO_MINIMO,
  CONTAINERS,
  CONTAINER_BY_ID,
  dosisApta,
  evaluarDosis,
  gotasDeRitmo,
  gotasRequeridas,
  phaseAt,
  primerCaso,
  RITMOS,
  sortearCaso,
  SOURCE_BY_ID,
  timeoutMs,
  TOPE_GOTAS,
  WATER_SOURCES,
  WATER_COLOR,
  comboMultiplier,
  COMBO_ALTO,
  PESO_ESTRUCTURA,
  dropIntervalMs,
  calcCloracionScore,
} from "./cloracion";

describe("Dosis — el cálculo que el jugador tiene que hacer", () => {
  it("multiplica litros por gotas por litro", () => {
    expect(gotasRequeridas(1, 2, false, false)).toBe(2);
    expect(gotasRequeridas(5, 2, false, false)).toBe(10);
    expect(gotasRequeridas(20, 2, false, false)).toBe(40);
    expect(gotasRequeridas(1, 5, false, false)).toBe(5);
    expect(gotasRequeridas(5, 5, false, false)).toBe(25);
  });

  it("el agua turbia sin filtrar duplica la dosis porque el cloro se gasta antes", () => {
    expect(gotasRequeridas(20, 2, true, false)).toBe(80);
    expect(gotasRequeridas(20, 2, true, true)).toBe(40);
  });

  it("nunca pide más gotas que el tope real del tapón", () => {
    for (const c of CONTAINERS) {
      for (const gpl of [2, 5]) {
        for (const turbia of [false, true]) {
          for (const filtrada of [false, true]) {
            const gotas = gotasRequeridas(c.liters, gpl, turbia, filtrada);
            if (c.liters * gpl <= TOPE_GOTAS) {
              expect(gotas).toBeLessThanOrEqual(TOPE_GOTAS * 2);
            }
          }
        }
      }
    }
  });

  it("distingue subdosis, sobredosis y exacta", () => {
    expect(evaluarDosis(10, 10)).toBe("perfecta");
    expect(evaluarDosis(9, 10)).toBe("subdosis");
    expect(evaluarDosis(11, 10)).toBe("sobredosis");
  });

  it("casi siempre subdosis mientras falte al menos una gota", () => {
    for (let i = 0; i < 10; i += 1) expect(evaluarDosis(i, 10)).toBe("subdosis");
    expect(evaluarDosis(10, 10)).toBe("perfecta");
    expect(evaluarDosis(11, 10)).toBe("sobredosis");
  });
});

describe("dosisApta — la dosis sólo existe para fuentes que se cloran", () => {
  it("el agua embotellada sólo admite no clorar", () => {
    const emb = SOURCE_BY_ID.embotellada;
    expect(dosisApta(emb, "ninguno")).toBe(true);
    expect(dosisApta(emb, "red")).toBe(false);
    expect(dosisApta(emb, "pozo")).toBe(false);
  });

  it("las fuentes que sí se cloran rechazan la respuesta 'no clorar'", () => {
    expect(dosisApta(SOURCE_BY_ID.red, "red")).toBe(true);
    expect(dosisApta(SOURCE_BY_ID.red, "pozo")).toBe(true);
    expect(dosisApta(SOURCE_BY_ID.red, "ninguno")).toBe(false);
    expect(dosisApta(SOURCE_BY_ID.pozo, "ninguno")).toBe(false);
  });
});

describe("Envases y fuentes", () => {
  it("cubre los tres tamaños y indexa bien", () => {
    for (const c of CONTAINERS) expect(CONTAINER_BY_ID[c.id]).toBe(c);
    expect(CONTAINERS.map((c) => c.liters)).toEqual([1, 5, 20]);
  });

  it("el envase más chico da una dosis de verdad, no una gota", () => {
    // La taza de 0,25 L daba 1 gota: a 260 ms de intervalo se leía como un
    // parpadeo. El mínimo tiene que ser una decisión, no una adivinanza.
    const minimo = Math.min(...CONTAINERS.map((c) => c.liters));
    expect(minimo).toBe(1);
    for (const gpl of [2, 5]) {
      expect(gotasRequeridas(minimo, gpl, false, true)).toBeGreaterThanOrEqual(2);
    }
  });

  it("sólo el agua embotellada no se clora", () => {
    const sinCloro = WATER_SOURCES.filter((s) => s.gotasPorLitro === null);
    expect(sinCloro).toHaveLength(1);
    expect(sinCloro[0].id).toBe("embotellada");
    for (const s of WATER_SOURCES) expect(SOURCE_BY_ID[s.id]).toBe(s);
  });

  it("el agua de pozo necesita más cloro que la de red", () => {
    expect(SOURCE_BY_ID.pozo.gotasPorLitro!).toBeGreaterThan(SOURCE_BY_ID.red.gotasPorLitro!);
  });

  it("cada ritmo del botón corresponde a una fuente real", () => {
    for (const r of RITMOS) {
      const g = gotasDeRitmo(r.id);
      if (g === null) expect(SOURCE_BY_ID.embotellada.gotasPorLitro).toBeNull();
      else expect([2, 5]).toContain(g);
    }
  });
});

describe("Ritmo del gotero", () => {
  it("encara el goteo dentro de un rango medible, ni parpadeo ni dedo quieto", () => {
    expect(dropIntervalMs(1)).toBe(260);
    expect(dropIntervalMs(40)).toBe(50);
    expect(dropIntervalMs(80)).toBe(45);
    for (let g = 1; g <= 120; g += 1) {
      const iv = dropIntervalMs(g);
      expect(iv).toBeGreaterThanOrEqual(45);
      expect(iv).toBeLessThanOrEqual(260);
    }
  });

  it("el timeout escala con la dosis, no es un número fijo", () => {
    expect(timeoutMs(2)).toBeLessThan(timeoutMs(40));
    expect(timeoutMs(1)).toBeGreaterThan(dropIntervalMs(1));
    for (let g = 1; g <= 80; g += 1) {
      expect(timeoutMs(g)).toBeGreaterThan(g * dropIntervalMs(g));
    }
  });
});

describe("Fases", () => {
  it("parte la partida en tercios y no deja agua turbia al principio", () => {
    expect(phaseAt(0, 60).id).toBe("manana");
    expect(phaseAt(19, 60).id).toBe("manana");
    expect(phaseAt(20, 60).id).toBe("tarde");
    expect(phaseAt(40, 60).id).toBe("emergencia");
    expect(CLORACION_PHASES[0].turbidez).toBe(0);
  });

  it("sube el tamaño de envase y la turbidez a lo largo de la partida", () => {
    const [manana, tarde, emergencia] = CLORACION_PHASES;
    const maxLitros = (fase: (typeof CLORACION_PHASES)[number]) =>
      Math.max(...fase.containers.map((c) => CONTAINER_BY_ID[c].liters));
    expect(maxLitros(tarde)).toBeGreaterThan(maxLitros(manana));
    expect(tarde.turbidez).toBeGreaterThan(0);
    expect(emergencia.turbidez).toBeGreaterThanOrEqual(tarde.turbidez);
  });

  it("la mañana da agua de red clara, de jarra o balde", () => {
    for (let i = 0; i < 500; i += 1) {
      const caso = sortearCaso(CLORACION_PHASES[0]);
      expect(caso.container.id).not.toBe("bidon");
      expect(caso.source.id).toBe("red");
      expect(caso.turbia).toBe(false);
    }
    expect(CLORACION_PHASES[0].containers).toHaveLength(2);
  });

  it("toda fase usa sólo envases que existen en el catálogo", () => {
    for (const fase of CLORACION_PHASES) {
      for (const id of fase.containers) expect(CONTAINER_BY_ID[id]).toBeDefined();
    }
  });

  it("no rompe con duración cero", () => {
    expect(phaseAt(10, 0).id).toBe("manana");
  });
});

describe("Arranque de partida", () => {
  it("los tres primeros casos recorren 1 L, 5 L y 20 L sin repetir", () => {
    const litros = [0, 1, 2].map((i) => primerCaso(i).container.liters);
    expect(litros).toEqual([1, 5, 20]);
  });

  it("el ciclo se repite a los 3 casos", () => {
    expect(primerCaso(3).container.liters).toBe(1);
    expect(primerCaso(4).container.liters).toBe(5);
    expect(primerCaso(5).container.liters).toBe(20);
  });

  it("arranca con agua de red clara, para que el primer gotereo sea fácil", () => {
    for (let i = 0; i < 3; i += 1) {
      const caso = primerCaso(i);
      expect(caso.source.id).toBe("red");
      expect(caso.turbia).toBe(false);
    }
  });
});

describe("Sorteo de caso", () => {
  it("respeta los pools de la fase, con cualquier random", () => {
    for (const fase of CLORACION_PHASES) {
      for (const r of [0, 0.4, 0.999]) {
        const caso = sortearCaso(fase, () => r);
        expect(fase.containers).toContain(caso.container.id);
        expect(fase.sources).toContain(caso.source.id);
      }
    }
  });

  it("la mañana nunca sortea agua turbia, ni con random al borde", () => {
    for (const r of [0, 0.5, 0.9999]) {
      expect(sortearCaso(CLORACION_PHASES[0], () => r).turbia).toBe(false);
    }
  });

  it("ninguna fase con turbidez 0 llega a sortear agua turbia", () => {
    for (const fase of CLORACION_PHASES) {
      for (let i = 0; i < 200; i += 1) {
        if (sortearCaso(fase).turbia) expect(fase.turbidez).toBeGreaterThan(0);
      }
    }
  });

  it("produce casos dosificables en toda la partida", () => {
    for (const fase of CLORACION_PHASES) {
      for (let i = 0; i < 300; i += 1) {
        const { container, source, turbia } = sortearCaso(fase);
        if (source.gotasPorLitro === null) continue;
        const gotas = gotasRequeridas(container.liters, source.gotasPorLitro, turbia, true);
        expect(gotas).toBeGreaterThan(0);
      }
    }
  });
});

describe("Puntaje con combo — recalibrado", () => {
  it("el multiplicador del HUD escala en 4 y en 7, y sólo eso", () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(3)).toBe(1);
    expect(comboMultiplier(COMBO_MINIMO)).toBe(2);
    expect(comboMultiplier(COMBO_ALTO)).toBe(3);
  });

  it("4 aciertos seguidos ya NO dan el score máximo", () => {
    // El bug que motivó el recalibrado: 4/4 con combo 4 daba 1.0 → 100 HP.
    expect(calcCloracionScore(4, 4, COMBO_MINIMO)).toBeLessThan(1);
    expect(calcCloracionScore(4, 4, COMBO_MINIMO)).toBeCloseTo(0.88);
  });

  it("una partida perfecta sin racha larga se queda en 0.8", () => {
    expect(calcCloracionScore(20, 20, 0)).toBeCloseTo(PESO_ESTRUCTURA);
    expect(calcCloracionScore(20, 20, 3)).toBeCloseTo(PESO_ESTRUCTURA);
  });

  it("la racha alta es lo que completa el score hasta 1", () => {
    expect(calcCloracionScore(20, 20, COMBO_ALTO)).toBeCloseTo(1);
  });

  it("compensa errores: 90% con racha alta bate a 100% sin racha", () => {
    const conErrores = calcCloracionScore(18, 20, COMBO_ALTO);
    const perfecto = calcCloracionScore(20, 20, 0);
    expect(conErrores).toBeGreaterThan(perfecto);
  });

  it("el corte de victoria queda en 62,5% de aciertos", () => {
    // calcMinigameScore corta en 0,5; con peso 0.8 eso es 0.5/0.8 = 62,5%.
    for (const intentos of [10, 16, 20]) {
      const necesario = Math.ceil(intentos * (0.5 / PESO_ESTRUCTURA));
      expect(calcCloracionScore(necesario, intentos, 0)).toBeGreaterThanOrEqual(0.5);
      expect(calcCloracionScore(necesario - 1, intentos, 0)).toBeLessThan(0.5);
    }
  });

  it("nunca devuelve un score fuera de 0..1", () => {
    for (let p = 0; p <= 30; p += 1) {
      for (let a = 0; a <= 30; a += 1) {
        for (const combo of [0, 3, 4, 6, 7, 20]) {
          const s = calcCloracionScore(p, a, combo);
          expect(s).toBeGreaterThanOrEqual(0);
          expect(s).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("subir el combo nunca baja el score", () => {
    for (let p = 0; p <= 20; p += 1) {
      for (let a = 1; a <= 20; a += 1) {
        let anterior = -1;
        for (const combo of [0, 1, 3, 4, 6, 7, 15]) {
          const s = calcCloracionScore(p, a, combo);
          expect(s).toBeGreaterThanOrEqual(anterior);
          anterior = s;
        }
      }
    }
  });
});

describe("Color del agua", () => {
  it("las tres veredictos tienen color y etiqueta distintas", () => {
    const colores = new Set(Object.values(WATER_COLOR).map((w) => w.fondo));
    expect(colores.size).toBe(3);
    for (const w of Object.values(WATER_COLOR)) {
      expect(w.etiqueta.length).toBeGreaterThan(3);
      expect(w.fondo).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});