import { describe, expect, it } from "vitest";
import { AVATARS, AVATAR_ACCESSORIES, SPECIAL_LOOKS, findAccessory } from "./avatarShop";
import { ACCESSORY_MODEL_FILES, ACCESSORY_POSED_AT, ACCESSORY_THUMB_FILES, AVATAR_MODEL_FILES, AVATAR_THUMB_FILES } from "./models3d.generated";
import { accessoryPlacements, socketsFor } from "./models3d";
import { AVATAR_HEADS, AVATAR_SOURCE_DIRS, SHAPE_SPECS, SIZE_OVERRIDES, shapeKey, targetSize } from "./models3dSpec";
import { ACCESSORY_FIT, AVATAR_SOCKETS, DEFAULT_SOCKETS } from "./models3dSockets";

const ALL = AVATARS.flatMap((a) => AVATAR_ACCESSORIES[a.id]);
const avatarIds = new Set(AVATARS.map((a) => a.id));

describe("modelos 3D", () => {
  it("cada uno de los 121 accesorios tiene una forma con tamaño definido", () => {
    expect(ALL).toHaveLength(121);
    for (const acc of ALL) {
      const spec = SHAPE_SPECS[shapeKey(acc)];
      expect(spec, `${acc.id} → ${shapeKey(acc)}`).toBeDefined();
      expect(spec.size).toBeGreaterThan(0);
    }
  });

  it("la forma sigue al nombre del accesorio", () => {
    const expected: [RegExp, string][] = [[/^Botas/, "piernas:0"], [/^Zapatillas/, "piernas:zapatilla"], [/^Lentes/, "cara:0"], [/^Antifaz/, "cara:2"], [/^Corona/, "cabeza:2"], [/^(Mochila|Alforja)/, "espalda:1"], [/^Vara/, "manos:vara"]];
    const mochila = ["angie-acc6", "angie-acc7", "britney-acc6", "britney-acc7"]; // agregados para su mochila, asignados por id
    for (const acc of ALL) for (const [re, key] of expected) if (re.test(acc.name) && !mochila.includes(acc.id)) expect(shapeKey(acc), acc.id).toBe(key);
    for (const id of Object.keys(SIZE_OVERRIDES)) expect(findAccessory(id), id).toBeDefined();
    // Las ojotas se reemplazaron por zapatillas: todos los avatares usan zapato cerrado y la ojota quedaba escondida.
    expect(ALL.filter((a) => a.name.startsWith("Ojotas"))).toEqual([]);
    expect(ALL.filter((a) => a.name.startsWith("Zapatillas"))).toHaveLength(5);
  });

  it("la forma sigue siendo de la misma zona que el accesorio", () => {
    for (const acc of ALL) expect(shapeKey(acc).split(":")[0]).toBe(acc.slot);
  });

  it("manifiesto, sockets y ajustes solo nombran ids que existen", () => {
    for (const id of Object.keys(AVATAR_MODEL_FILES)) expect(avatarIds.has(id), id).toBe(true);
    for (const id of Object.keys(AVATAR_SOCKETS)) expect(avatarIds.has(id), id).toBe(true);
    for (const id of Object.keys(ACCESSORY_MODEL_FILES)) expect(findAccessory(id), id).toBeDefined();
    for (const id of Object.keys(ACCESSORY_FIT)) expect(findAccessory(id), id).toBeDefined();
    for (const id of avatarIds) expect(AVATAR_SOURCE_DIRS[id], id).toBeDefined();
  });

  it("cada avatar con modelo tiene su skin especial _esp, descripción y miniaturas", () => {
    for (const av of AVATARS) {
      const look = SPECIAL_LOOKS[av.id];
      expect(look?.title, av.id).toBeTruthy();
      expect(look?.description.length, av.id).toBeGreaterThan(20);
      if (!AVATAR_MODEL_FILES[av.id]) continue;
      expect(AVATAR_MODEL_FILES[av.id].especial, `${av.id} sin _esp`).toBeTruthy();
      for (const key of [av.id, `${av.id}-especial`]) {
        expect(AVATAR_THUMB_FILES[key]?.cuerpo, `${key} cuerpo`).toBeTruthy();
        expect(AVATAR_THUMB_FILES[key]?.busto, `${key} busto`).toBeTruthy();
      }
    }
  });

  it("piernas se engancha a las dos piernas, la izquierda espejada", () => {
    const bota = AVATAR_ACCESSORIES.angie[8];
    const [der, izq] = accessoryPlacements(bota, socketsFor("angie"), { offset: [0.02, 0, 0], rot: [0, 10, 0] });
    expect(der.socket).toBe("pierna_d");
    expect(izq.socket).toBe("pierna_i");
    expect(der.scale[0]).toBeGreaterThan(0);
    expect(izq.scale[0]).toBeLessThan(0);
    expect(der.position[0]).toBeCloseTo(DEFAULT_SOCKETS.pierna_d.pos[0] + 0.02);
    expect(izq.position[0]).toBeCloseTo(DEFAULT_SOCKETS.pierna_i.pos[0] - 0.02);
    expect(izq.rotation[1]).toBeCloseTo(-der.rotation[1]);
  });

  it("el socket calibrado de un avatar pisa al de por defecto", () => {
    const t = socketsFor("britney", { cabeza: { pos: [0, 2, 0], escala: 1.5 } });
    expect(t.cabeza.pos[1]).toBe(2);
    // Pieza NO posada (sin posición propia): va al socket y toma su escala.
    const [p] = accessoryPlacements(AVATAR_ACCESSORIES.britney[1], t, {}, undefined);
    expect(p.scale).toEqual([1.5, 1.5, 1.5]);
    // Lo que no se pisó sigue viniendo de la cabeza medida / defaults.
    expect(t.cara.pos[2]).toBe(AVATAR_HEADS.britney.faceZ);
    expect(t.pecho).toEqual(DEFAULT_SOCKETS.pecho);
  });

  it("cabeza y cara se ubican con la cabeza medida de cada avatar", () => {
    for (const av of AVATARS) {
      const h = AVATAR_HEADS[av.id];
      expect(h, av.id).toBeDefined();
      const t = socketsFor(av.id);
      expect(t.cara.pos[2]).toBe(h.faceZ);
      expect(t.cara.pos[1]).toBeGreaterThan(h.bottom);
      expect(t.cara.pos[1]).toBeLessThan(h.top);
    }
  });

  it("lo que rodea la cabeza nunca es más chico que cabeza + pelo", () => {
    for (const acc of ALL) {
      if (acc.slot !== "cabeza" || acc.avatarId === "flordejesus") continue; // ella: sobre el sombrero
      const h = AVATAR_HEADS[acc.avatarId];
      expect(targetSize(acc), acc.id).toBeGreaterThan(Math.max(h.w, h.d));
    }
  });

  it("las piezas de espalda de Angie y Britney son agregados para su mochila", () => {
    for (const id of ["angie", "britney"]) {
      const [manto, colgante] = [AVATAR_ACCESSORIES[id][6], AVATAR_ACCESSORIES[id][7]];
      expect(shapeKey(manto)).not.toBe("espalda:0");
      expect(shapeKey(colgante)).toBe("espalda:colgante");
      expect(socketsFor(id).espalda.pos[2]).toBeLessThan(-0.2); // centro de la mochila, no la espalda
    }
    expect(AVATAR_ACCESSORIES.angie[7].name).toBe("Bolsita de Semillero");
  });

  it("cada accesorio procesado tiene su foto, y los posados son accesorios existentes", () => {
    for (const id of Object.keys(ACCESSORY_MODEL_FILES)) expect(ACCESSORY_THUMB_FILES[id], `${id} sin miniatura`).toBeTruthy();
    for (const id of Object.keys(ACCESSORY_POSED_AT)) expect(ACCESSORY_MODEL_FILES[id], id).toBeTruthy();
  });

  it("un accesorio posado va donde vino, no al socket, y el pie izquierdo es el derecho espejado", () => {
    const bota = AVATAR_ACCESSORIES.angie[8];
    const at: [number, number, number] = [-0.1, 0.15, 0.04];
    const [der, izq] = accessoryPlacements(bota, socketsFor("angie"), { offset: [0, 0.02, 0], escala: 1.1 }, at);
    [-0.1, 0.17, 0.04].forEach((v, i) => expect(der.position[i]).toBeCloseTo(v));
    expect(izq.position[0]).toBeCloseTo(0.1);
    expect(der.scale).toEqual([1.1, 1.1, 1.1]);
    expect(izq.scale[0]).toBeCloseTo(-1.1);
    // Un socket calibrado con escala no afecta a una pieza posada (ya viene a la medida de su avatar).
    const [p] = accessoryPlacements(AVATAR_ACCESSORIES.angie[0], socketsFor("angie", { cabeza: { pos: [0, 9, 0], escala: 3 } }), {}, [0, 1.64, 0]);
    expect(p.position).toEqual([0, 1.64, 0]);
    expect(p.scale).toEqual([1, 1, 1]);
  });
});
