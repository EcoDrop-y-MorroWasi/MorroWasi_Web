// Estándar de unidades de los modelos 3D (.glb) de avatares y accesorios —
// única fuente de verdad compartida por el pipeline (scripts/modelos-3d.ts) y el
// visor (src/three/avatarModelScene.ts). Sin imports de runtime a propósito:
// Node lo ejecuta directo con type stripping, igual que gen-catalogo.ts.
//
// Convención (igual a glTF): 1 unidad = 1 metro, Y hacia arriba, el avatar
// mira hacia +Z, su derecha es -X. Todo avatar se normaliza a AVATAR_HEIGHT
// con los pies en y=0 y centrado en x=0.
import type { Accessory, AccessorySlot } from "./avatarShop";

export const AVATAR_HEIGHT = 1.7;

export type Vec3 = [number, number, number];
/** Qué punto de la caja del modelo queda en el origen (el pivote), por eje. */
export type Anchor = "min" | "center" | "max";

/** Puntos de anclaje en el cuerpo del avatar. Las piernas usan dos (se espeja). */
export type SocketName = "cabeza" | "cara" | "pecho" | "espalda" | "pierna_d" | "pierna_i" | "mano_d";

export interface ShapeSpec {
  /** Nombre corto de la forma, pa reportes y el .md de prompts. */
  label: string;
  /** Lado más largo de la caja del accesorio ya procesado, en metros. */
  size: number;
  pivot: { x: Anchor; y: Anchor; z: Anchor };
  /** Corrimiento por defecto desde el socket, en metros (antes del ajuste fino por ítem). */
  offset?: Vec3;
}

const C: Anchor = "center";

// Una forma por (zona, poolIndex) — el mismo poolIndex que ya decide el dibujo
// 2D en avatarSkinPainter.ts, así el .glb generado calza con lo que el jugador
// ya conoce. Tamaños medidos sobre angie/britney normalizados a 1.70 m
// (proporción chibi: cabeza ≈0.40 m de ancho, ojos a ≈1.44 m).
export const SHAPE_SPECS: Record<string, ShapeSpec> = {
  "cabeza:0": { label: "sombrero de ala", size: 0.5, pivot: { x: C, y: "min", z: C } },
  "cabeza:1": { label: "vincha fina", size: 0.44, pivot: { x: C, y: C, z: C } },
  "cabeza:2": { label: "corona con puntas", size: 0.42, pivot: { x: C, y: "min", z: C }, offset: [0, 0.04, 0] },
  "cabeza:3": { label: "vincha ancha", size: 0.44, pivot: { x: C, y: C, z: C }, offset: [0, -0.02, 0] },
  "cabeza:4": { label: "capucha", size: 0.55, pivot: { x: C, y: "max", z: C }, offset: [0, 0.14, -0.02] },
  "cabeza:5": { label: "gorro con adorno lateral", size: 0.46, pivot: { x: C, y: "min", z: C } },
  "cara:0": { label: "lentes redondos", size: 0.36, pivot: { x: C, y: C, z: "max" } },
  "cara:1": { label: "gafas de banda", size: 0.4, pivot: { x: C, y: C, z: "max" } },
  "cara:2": { label: "antifaz", size: 0.36, pivot: { x: C, y: C, z: "max" } },
  "cara:3": { label: "visera angosta", size: 0.42, pivot: { x: C, y: C, z: "max" }, offset: [0, 0.06, 0] },
  "pecho:0": { label: "chaleco", size: 0.48, pivot: { x: C, y: C, z: "max" }, offset: [0, 0, 0.01] },
  "pecho:1": { label: "medallón", size: 0.36, pivot: { x: C, y: C, z: "max" }, offset: [0, 0.02, 0.01] },
  "pecho:2": { label: "banda diagonal", size: 0.5, pivot: { x: C, y: C, z: "max" } },
  "pecho:3": { label: "insignia", size: 0.14, pivot: { x: C, y: C, z: "max" }, offset: [0.08, 0.05, 0.01] },
  "espalda:0": { label: "capa", size: 0.8, pivot: { x: C, y: "max", z: "max" }, offset: [0, 0.02, 0] },
  "espalda:1": { label: "mochila", size: 0.42, pivot: { x: C, y: "max", z: "max" }, offset: [0, -0.02, 0] },
  "espalda:2": { label: "manto liviano", size: 0.55, pivot: { x: C, y: "max", z: "max" } },
  "piernas:0": { label: "bota alta", size: 0.3, pivot: { x: C, y: "min", z: C } },
  "piernas:1": { label: "vendas", size: 0.22, pivot: { x: C, y: "min", z: C }, offset: [0, 0.1, 0] },
  "piernas:2": { label: "ojota", size: 0.24, pivot: { x: C, y: "min", z: C } },
  "piernas:3": { label: "polaina", size: 0.26, pivot: { x: C, y: "min", z: C }, offset: [0, 0.08, 0] },
  "manos:regadera": { label: "regadera", size: 0.3, pivot: { x: C, y: C, z: C } },
  "manos:balde": { label: "balde", size: 0.24, pivot: { x: C, y: C, z: C } },
  "manos:libro": { label: "libro", size: 0.2, pivot: { x: C, y: C, z: C } },
  "manos:vara": { label: "vara", size: 0.9, pivot: { x: C, y: C, z: C } },
};

// Accesorios cuyo .glb sigue al NOMBRE y no al dibujo 2D (el poolIndex les
// asigna otra forma: "Vara Dorada" se pinta como libro, "Ojotas" como vendas).
// Es lo que describe accesorios-prompts.md, o sea lo que sale del generador.
const SHAPE_OVERRIDES: Record<string, string> = {
  "angie-acc9": "piernas:2",
  "dayra-acc2": "cara:3",
  "genesis-acc2": "cara:0",
  "genesis-acc7": "espalda:0",
  "claudio-acc0": "cabeza:5",
  "claudio-acc1": "cabeza:4",
  "claudio-acc7": "espalda:0",
  "claudio-acc10": "manos:vara",
};

export function shapeKey(acc: Pick<Accessory, "id" | "slot" | "poolIndex" | "handShape">): string {
  return SHAPE_OVERRIDES[acc.id] ?? (acc.slot === "manos" ? `manos:${acc.handShape}` : `${acc.slot}:${acc.poolIndex}`);
}

/** Socket(s) donde se engancha cada zona — piernas va a las dos, la izquierda espejada. */
export const SLOT_SOCKETS: Record<AccessorySlot, SocketName[]> = {
  cabeza: ["cabeza"],
  cara: ["cara"],
  pecho: ["pecho"],
  espalda: ["espalda"],
  piernas: ["pierna_d", "pierna_i"],
  manos: ["mano_d"],
};

// Presupuestos del pipeline. Por encima de *Target se simplifica la malla
// (solo accesorios); por encima de *Max el archivo no se escribe sin --forzar.
export const BUDGET = {
  accesorio: { trisTarget: 5000, kbWarn: 300, kbMax: 1024, texture: 512 },
  avatar: { trisWarn: 40000, kbWarn: 1500, kbMax: 4096, texture: 1024 },
};

// Carpeta de cada avatar dentro de la carpeta de crudos ("avatares 3d/"). El
// .glb suelto en la raíz de la carpeta es el normal; el de su única subcarpeta
// con .glb (skin_esp/, esp/...) el especial.
export const AVATAR_SOURCE_DIRS: Record<string, string> = {
  angie: "angie",
  britney: "britney",
  francheska: "fransheska",
  dayra: "dayra",
  felipe: "felipe",
  milagros: "milagros",
  jimmy: "jimmy",
  genesis: "genesis",
  rihana: "rihana",
  flordejesus: "Flor De Jesús",
  claudio: "Joe",
};
