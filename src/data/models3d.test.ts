import { describe, expect, it } from "vitest";
import { AVATARS, AVATAR_ACCESSORIES, SPECIAL_LOOKS, findAccessory } from "./avatarShop";
import { ACCESSORY_MODEL_FILES, AVATAR_MODEL_FILES, AVATAR_THUMB_FILES } from "./models3d.generated";
import { accessoryPlacements, socketsFor } from "./models3d";
import { AVATAR_SOURCE_DIRS, SHAPE_SPECS, shapeKey } from "./models3dSpec";
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

  it("la forma override sigue siendo de la misma zona que el accesorio", () => {
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
    const t = socketsFor("angie", { cabeza: { pos: [0, 2, 0], escala: 1.5 } });
    expect(t.cabeza.pos[1]).toBe(2);
    const [p] = accessoryPlacements(AVATAR_ACCESSORIES.angie[1], t, {});
    expect(p.scale).toEqual([1.5, 1.5, 1.5]);
    expect(t.cara).toEqual(DEFAULT_SOCKETS.cara);
  });
});
