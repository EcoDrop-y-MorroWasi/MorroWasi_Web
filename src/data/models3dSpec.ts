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
  // Agregados para la mochila que Angie y Britney ya traen en su modelo: el
  // socket "espalda" de ellas está calibrado al centro de esa mochila.
  "espalda:enrollado": { label: "manto enrollado sobre la mochila", size: 0.36, pivot: { x: C, y: "min", z: C }, offset: [0, 0.18, 0] },
  "espalda:funda": { label: "funda para la mochila", size: 0.4, pivot: { x: C, y: C, z: C }, offset: [0, 0, -0.02] },
  "espalda:colgante": { label: "colgante al costado de la mochila", size: 0.16, pivot: { x: C, y: C, z: C }, offset: [-0.2, -0.06, 0] },
  "piernas:0": { label: "bota alta", size: 0.3, pivot: { x: C, y: "min", z: C } },
  "piernas:1": { label: "vendas", size: 0.22, pivot: { x: C, y: "min", z: C }, offset: [0, 0.1, 0] },
  "piernas:2": { label: "ojota", size: 0.24, pivot: { x: C, y: "min", z: C } },
  "piernas:3": { label: "polaina", size: 0.26, pivot: { x: C, y: "min", z: C }, offset: [0, 0.08, 0] },
  // Reemplaza a las ojotas: todos los avatares usan zapato cerrado y una ojota
  // plana quedaba escondida adentro. La zapatilla envuelve el calzado entero.
  "piernas:zapatilla": { label: "zapatilla", size: 0.3, pivot: { x: C, y: "min", z: C } },
  "manos:regadera": { label: "regadera", size: 0.3, pivot: { x: C, y: C, z: C } },
  "manos:balde": { label: "balde", size: 0.24, pivot: { x: C, y: C, z: C } },
  "manos:libro": { label: "libro", size: 0.2, pivot: { x: C, y: C, z: C } },
  "manos:vara": { label: "vara", size: 0.9, pivot: { x: C, y: C, z: C } },
};

// En 3D la forma sigue al NOMBRE del accesorio: el chico lee "Botas" y tiene
// que ver botas. El poolIndex (la forma del dibujo 2D) solo decide cuando el
// nombre admite más de una — "Vincha" puede ser fina o ancha, "Manto" capa o
// manto liviano. Antes 76 de 121 no coincidían ("Vincha de Brote Tierno" era
// un sombrero). scripts/gen-prompts-accesorios.ts arma el .md de prompts con
// esta misma función, así pipeline y prompts nunca se desalinean.
type NameRule = [RegExp, string | ((painter: string) => string)];
const NAME_SHAPES: NameRule[] = [
  [/^Sombrero/, "cabeza:0"],
  [/^Corona/, "cabeza:2"],
  [/^Capucha/, "cabeza:4"],
  [/^(Gorro|Chullo|Casco)/, "cabeza:5"],
  [/^Vincha/, (p) => (p === "cabeza:1" || p === "cabeza:3" ? p : "cabeza:1")],
  [/^Tocado/, (p) => (p === "cabeza:1" || p === "cabeza:3" || p === "cabeza:5" ? p : "cabeza:5")],
  [/^Lentes/, "cara:0"],
  [/^Gafas/, "cara:1"],
  [/^Antifaz/, "cara:2"],
  [/^Visera/, "cara:3"],
  [/^(Chaleco|Poncho|Vestido)/, "pecho:0"],
  [/^Medalla/, "pecho:1"],
  [/^Banda/, "pecho:2"],
  [/^Insignia/, "pecho:3"],
  [/^(Capa|Manto)/, (p) => (p === "espalda:2" ? p : "espalda:0")],
  [/^(Mochila|Alforja)/, "espalda:1"],
  [/^Botas/, "piernas:0"],
  [/^Vendas/, "piernas:1"],
  [/^Ojotas/, "piernas:2"],
  [/^Zapatillas/, "piernas:zapatilla"],
  [/^Polainas/, "piernas:3"],
  [/^Regadera/, "manos:regadera"],
  [/^Balde/, "manos:balde"],
  [/^Libro/, "manos:libro"],
  [/^Vara/, "manos:vara"],
];

// Piezas cuya forma no sale del nombre: las de espalda de Angie y Britney son
// agregados para la mochila que ya traen puesta (una capa o una segunda mochila
// chocaban con ella).
const SHAPE_BY_ID: Record<string, string> = {
  "angie-acc6": "espalda:enrollado", // Manto de Raíz Nueva → enrollado arriba de la mochila
  "angie-acc7": "espalda:colgante", // Bolsita de Semillero
  "britney-acc6": "espalda:funda", // Capa de Rocío Matinal → funda impermeable
  "britney-acc7": "espalda:colgante", // Alforja de Semillas, chica, al costado
};

export function shapeKey(acc: Pick<Accessory, "id" | "name" | "slot" | "poolIndex" | "handShape">): string {
  if (SHAPE_BY_ID[acc.id]) return SHAPE_BY_ID[acc.id];
  const painter = acc.slot === "manos" ? `manos:${acc.handShape}` : `${acc.slot}:${acc.poolIndex}`;
  const rule = NAME_SHAPES.find(([re]) => re.test(acc.name));
  if (!rule) return painter;
  return typeof rule[1] === "string" ? rule[1] : rule[1](painter);
}

// Tamaño propio (lado más largo, m) de los accesorios que tienen que calzar
// POR ENCIMA de algo que el avatar ya trae puesto — el de la forma no alcanza.
export const SIZE_OVERRIDES: Record<string, number> = {
  // Calzado que envuelve el zapato del avatar: su largo (medido en el .glb) + margen.
  "angie-acc8": 0.33, // bota sobre sus zapatillas voluminosas (0.26 m de largo)
  "angie-acc9": 0.3,
  "dayra-acc8": 0.3,
  "milagros-acc9": 0.32,
  "genesis-acc8": 0.29,
  "flordejesus-acc9": 0.29,
  "dayra-acc4": 0.6, // chaleco por encima del poncho
  "flordejesus-acc0": 0.38, // corona alrededor de la copa (0.32 m) del sombrero de paja
  "flordejesus-acc1": 0.24, // adorno prendido al costado del sombrero, no un gorro
  "genesis-acc2": 0.42, // antifaces con aberturas grandes, por encima de los anteojos
  "flordejesus-acc2": 0.42,
  "claudio-acc2": 0.42,
};

/**
 * Cabeza + pelo de cada avatar normal (ya en 1.70 m), medida en el .glb
 * procesado por cortes horizontales. w/d = ancho/profundidad de la caja a la
 * altura del nacimiento del pelo; bottom/top = de dónde a dónde va la cabeza;
 * faceZ = frente de la cara. Flor de Jesús: la cabeza termina en 1.46 m y
 * arriba está su sombrero (ala 0.54 m, copa 0.32 m hasta 1.72 m).
 */
export interface HeadBox {
  w: number;
  d: number;
  bottom: number;
  top: number;
  faceZ: number;
  /** Altura de los ojos medida mirando el modelo; sin medir se estima al 45 % de la cabeza. */
  eyeY?: number;
}
export const AVATAR_HEADS: Record<string, HeadBox> = {
  angie: { w: 0.51, d: 0.5, bottom: 1.3, top: 1.68, faceZ: 0.26, eyeY: 1.42 },
  britney: { w: 0.39, d: 0.35, bottom: 1.3, top: 1.7, faceZ: 0.16 },
  francheska: { w: 0.48, d: 0.38, bottom: 1.22, top: 1.7, faceZ: 0.19 },
  dayra: { w: 0.5, d: 0.41, bottom: 1.3, top: 1.7, faceZ: 0.18 },
  felipe: { w: 0.47, d: 0.47, bottom: 1.22, top: 1.68, faceZ: 0.22 },
  milagros: { w: 0.43, d: 0.4, bottom: 1.26, top: 1.7, faceZ: 0.2 },
  jimmy: { w: 0.47, d: 0.45, bottom: 1.22, top: 1.68, faceZ: 0.22 },
  genesis: { w: 0.48, d: 0.47, bottom: 1.22, top: 1.68, faceZ: 0.23 },
  rihana: { w: 0.47, d: 0.38, bottom: 1.3, top: 1.7, faceZ: 0.16 },
  flordejesus: { w: 0.4, d: 0.34, bottom: 1.18, top: 1.46, faceZ: 0.15 },
  claudio: { w: 0.47, d: 0.46, bottom: 1.26, top: 1.66, faceZ: 0.22 },
};
/** Ancho de cabeza + pelo para el que están pensados los tamaños de SHAPE_SPECS. */
export const HEAD_REF_W = 0.47;

// Lo que envuelve la cabeza mide por fuera cabeza + pelo + esto (grosor del
// aro a ambos lados, ala del sombrero, caída de la capucha).
const HEAD_WRAP_MARGIN: Record<string, number> = { "cabeza:0": 0.14, "cabeza:1": 0.05, "cabeza:2": 0.06, "cabeza:3": 0.05, "cabeza:4": 0.1, "cabeza:5": 0.05 };

/**
 * Lado más largo final: el de la forma, escalado a la cabeza del avatar en
 * cabeza y cara; lo que rodea la cabeza nunca queda más chico que ella.
 */
export function targetSize(acc: Pick<Accessory, "id" | "avatarId" | "name" | "slot" | "poolIndex" | "handShape">): number {
  if (SIZE_OVERRIDES[acc.id]) return SIZE_OVERRIDES[acc.id];
  const key = shapeKey(acc);
  const size = SHAPE_SPECS[key].size;
  const head = AVATAR_HEADS[acc.avatarId];
  if (!head || (acc.slot !== "cabeza" && acc.slot !== "cara")) return size;
  const scaled = (size * head.w) / HEAD_REF_W;
  const wrap = HEAD_WRAP_MARGIN[key] != null ? Math.max(head.w, head.d) + HEAD_WRAP_MARGIN[key] : 0;
  return Math.round(Math.max(scaled, wrap) * 100) / 100;
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
