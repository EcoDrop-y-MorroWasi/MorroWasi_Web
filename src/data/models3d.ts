// Une las tres piezas de los modelos 3D: qué archivos existen
// (models3d.generated.ts, del pipeline), el estándar de formas
// (models3dSpec.ts) y la calibración (models3dSockets.ts). El visor solo
// consume lo que devuelve este módulo.
import type { Accessory } from "./avatarShop";
import { ACCESSORY_MODEL_FILES, AVATAR_MODEL_FILES, AVATAR_THUMB_FILES } from "./models3d.generated";
import { SHAPE_SPECS, SLOT_SOCKETS, shapeKey, type SocketName, type Vec3 } from "./models3dSpec";
import { ACCESSORY_FIT, AVATAR_SOCKETS, DEFAULT_SOCKETS, type AccessoryFit, type Socket } from "./models3dSockets";

const AVATAR_DIR = "/models/avatares/";
const ACCESSORY_DIR = "/models/accesorios/";
const THUMB_DIR = "/models/miniaturas/";

export function avatarModelUrl(avatarId: string, especial: boolean): string | null {
  const files = AVATAR_MODEL_FILES[avatarId];
  const file = especial ? files?.especial : files?.normal;
  return file ? AVATAR_DIR + file : null;
}

/** Foto pre-renderizada del .glb (`pnpm modelos:miniaturas`), o null si todavía no hay. */
export function avatarThumbUrl(avatarId: string, encuadre: "cuerpo" | "busto", especial = false): string | null {
  const file = AVATAR_THUMB_FILES[especial ? `${avatarId}-especial` : avatarId]?.[encuadre];
  return file ? THUMB_DIR + file : null;
}

export function accessoryModelUrl(accId: string): string | null {
  const file = ACCESSORY_MODEL_FILES[accId];
  return file ? ACCESSORY_DIR + file : null;
}

export type SocketTable = Record<SocketName, Socket>;

export function socketsFor(avatarId: string, overrides?: Partial<Record<SocketName, Socket>>): SocketTable {
  return { ...DEFAULT_SOCKETS, ...AVATAR_SOCKETS[avatarId], ...overrides };
}

/** Transformación final de una copia del accesorio (ya en metros y con su pivote). */
export interface Placement {
  socket: SocketName;
  position: Vec3;
  /** Radianes, orden XYZ. */
  rotation: Vec3;
  scale: Vec3;
}

const DEG = Math.PI / 180;

// La pierna izquierda es la derecha espejada en X: se niega el corrimiento
// lateral, la rotación en Y/Z y la escala X (three invierte la cara visible
// solo cuando el determinante es negativo, así que no hace falta tocar materiales).
export function accessoryPlacements(acc: Accessory, sockets: SocketTable, fit: AccessoryFit = ACCESSORY_FIT[acc.id] || {}): Placement[] {
  const spec = SHAPE_SPECS[shapeKey(acc)];
  const base = spec?.offset || [0, 0, 0];
  const extra = fit.offset || [0, 0, 0];
  const rot = fit.rot || [0, 0, 0];
  return SLOT_SOCKETS[acc.slot].map((name) => {
    const s = sockets[name];
    const k = (s.escala ?? 1) * (fit.escala ?? 1);
    const mirror = name === "pierna_i" ? -1 : 1;
    return {
      socket: name,
      position: [s.pos[0] + mirror * (base[0] + extra[0]), s.pos[1] + base[1] + extra[1], s.pos[2] + base[2] + extra[2]],
      rotation: [rot[0] * DEG, mirror * rot[1] * DEG, mirror * rot[2] * DEG],
      scale: [mirror * k, k, k],
    };
  });
}
