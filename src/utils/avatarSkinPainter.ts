// Motor de pintado de skins de avatar — portado de web/mockups/tienda-avatares-3d.html.
// Dibuja sobre el mapa UV real del formato de skin 64×64 de Minecraft (el mismo que
// usa skinview3d), a resolución HD 256×256 con gradientes para que no se vea "plano".
import { AVATAR_ACCESSORIES, DENIM, GOLD, SPECIAL_LOOKS, darken, type Accessory, type Avatar } from "../data/avatarShop";

export const SKIN_RES = 256;
export const SKIN_SCALE = SKIN_RES / 64;

type Rect = [number, number, number, number];
interface BoxUV {
  top: Rect;
  bottom: Rect;
  right: Rect;
  front: Rect;
  left: Rect;
  back: Rect;
}

function boxUV(u: number, v: number, w: number, h: number, d: number): BoxUV {
  return {
    top: [u + d, v, w, d],
    bottom: [u + d + w, v, w, d],
    right: [u, v + d, d, h],
    front: [u + d, v + d, w, h],
    left: [u + d + w, v + d, d, h],
    back: [u + 2 * d + w, v + d, w, h],
  };
}

function paintBox(ctx: CanvasRenderingContext2D, u: number, v: number, w: number, h: number, d: number, colors: Partial<Record<keyof BoxUV, string>>) {
  const uv = boxUV(u, v, w, h, d);
  (Object.keys(uv) as (keyof BoxUV)[]).forEach((face) => {
    const c = colors[face];
    if (!c) return;
    const r = uv[face];
    ctx.fillStyle = c;
    ctx.fillRect(r[0], r[1], r[2], r[3]);
  });
}

function hdFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, start: string, end?: string, vertical?: boolean) {
  const g = ctx.createLinearGradient(x, y, vertical ? x : x + w, vertical ? y + h : y);
  g.addColorStop(0, start);
  g.addColorStop(1, end || start);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((n >> 16) & 255) + amt);
  const g = Math.min(255, ((n >> 8) & 255) + amt);
  const b = Math.min(255, (n & 255) + amt);
  return `rgb(${r},${g},${b})`;
}

// Cara: ojos simples color natural (marrón/ámbar), sin esclera ni colores raros.
function paintFace(ctx: CanvasRenderingContext2D, av: Avatar) {
  [9, 13].forEach((x) => {
    ctx.fillStyle = av.eyeColor;
    ctx.fillRect(x, 10, 3, 2);
    ctx.fillStyle = "#140d08";
    ctx.fillRect(x + 1, 10, 1, 1);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(x, 10, 1, 1);
  });
  ctx.fillStyle = darken(av.skin, 30);
  ctx.fillRect(10, 14, 4, 1);
  if (av.gender === "f") {
    // Ceja fina y rubor sutil, todo en coordenadas enteras (los píxeles fraccionados
    // se ven borrosos con el suavizado activado y se mezclan con el ojo).
    ctx.fillStyle = darken(av.hairColor, 18);
    ctx.fillRect(9, 9, 3, 1);
    ctx.fillRect(13, 9, 3, 1);
    ctx.fillStyle = "rgba(224,91,104,.4)";
    ctx.fillRect(8, 13, 2, 1);
    ctx.fillRect(14, 13, 2, 1);
  }
}

function paintHair(ctx: CanvasRenderingContext2D, av: Avatar) {
  const c = av.hairColor;
  const ac = av.accent;
  ctx.fillStyle = c;
  switch (av.hairStyle) {
    case "corto":
    case "rapado": {
      const t = av.hairStyle === "rapado" ? 1 : 2;
      ctx.fillRect(8, 8, 8, t);
      ctx.fillRect(0, 8, 8, t);
      ctx.fillRect(16, 8, 8, t);
      ctx.fillRect(24, 8, 8, t + 1);
      break;
    }
    case "largo":
      ctx.fillRect(8, 8, 8, 2);
      ctx.fillRect(0, 8, 8, 8);
      ctx.fillRect(16, 8, 8, 8);
      ctx.fillRect(24, 8, 8, 8);
      ctx.fillRect(25, 15, 4, 9);
      break;
    case "afro":
      ctx.fillRect(8, 8, 8, 5);
      ctx.fillRect(0, 8, 8, 5);
      ctx.fillRect(16, 8, 8, 5);
      ctx.fillRect(24, 8, 8, 6);
      ctx.fillRect(40, 0, 8, 8);
      ctx.fillRect(32, 8, 8, 8);
      ctx.fillRect(48, 8, 8, 8);
      ctx.fillRect(56, 8, 8, 8);
      break;
    case "bob":
      ctx.fillRect(8, 8, 8, 3);
      ctx.fillRect(0, 8, 8, 8);
      ctx.fillRect(16, 8, 8, 8);
      ctx.fillRect(24, 8, 8, 5);
      ctx.fillRect(26, 14, 3, 5);
      break;
    case "chongo":
      ctx.fillRect(8, 8, 8, 2);
      ctx.fillRect(0, 8, 8, 2);
      ctx.fillRect(16, 8, 8, 2);
      ctx.fillRect(24, 8, 8, 3);
      ctx.fillStyle = ac;
      ctx.fillRect(11, 1, 3, 3);
      break;
    case "colitas":
      ctx.fillRect(8, 8, 8, 2);
      ctx.fillRect(0, 8, 8, 2);
      ctx.fillRect(16, 8, 8, 2);
      ctx.fillRect(24, 8, 8, 3);
      ctx.fillStyle = ac;
      ctx.fillRect(1, 9, 2, 2);
      ctx.fillRect(21, 9, 2, 2);
      break;
    case "coleta":
    case "colaAlta":
      ctx.fillRect(8, 8, 8, 2);
      ctx.fillRect(0, 8, 8, 2);
      ctx.fillRect(16, 8, 8, 2);
      ctx.fillRect(24, 8, 8, 7);
      ctx.fillRect(26, 14, 4, 8);
      ctx.fillStyle = ac;
      ctx.fillRect(26, 12, 3, 1);
      break;
    case "trenza":
    case "trenzaDorada":
      ctx.fillRect(8, 8, 8, 2);
      ctx.fillRect(0, 8, 8, 2);
      ctx.fillRect(16, 8, 8, 2);
      ctx.fillRect(24, 8, 8, 8);
      ctx.fillRect(26, 15, 2, 9);
      ctx.fillStyle = ac;
      ctx.fillRect(26, 10, 2, 1);
      ctx.fillRect(26, 13, 2, 1);
      if (av.hairStyle === "trenzaDorada") {
        ctx.fillStyle = "#fff8e0";
        ctx.fillRect(28, 9, 1, 1);
      }
      break;
    default:
      ctx.fillRect(8, 8, 8, 2);
      ctx.fillRect(0, 8, 8, 2);
      ctx.fillRect(16, 8, 8, 2);
      ctx.fillRect(24, 8, 8, 3);
  }
  if (av.streak) {
    ctx.fillStyle = av.streak;
    ctx.fillRect(11, 0, 2, 8);
  }
}

function paintArmSleeve(ctx: CanvasRenderingContext2D, u: number, v: number, w: number, h: number, d: number, color: string) {
  const uv = boxUV(u, v, w, h, d);
  (["front", "back", "left", "right"] as const).forEach((face) => {
    const r = uv[face];
    ctx.fillStyle = color;
    ctx.fillRect(r[0], r[1], r[2], Math.min(5, r[3]));
  });
}
function paintLegShoes(ctx: CanvasRenderingContext2D, u: number, v: number, w: number, h: number, d: number, color: string) {
  const uv = boxUV(u, v, w, h, d);
  (["front", "back", "left", "right"] as const).forEach((face) => {
    const r = uv[face];
    ctx.fillStyle = color;
    ctx.fillRect(r[0], r[1] + r[3] - 2, r[2], 2);
  });
  const b = uv.bottom;
  ctx.fillStyle = color;
  ctx.fillRect(b[0], b[1], b[2], b[3]);
}
function paintShirtStyle(ctx: CanvasRenderingContext2D, av: Avatar) {
  if (av.shirtStyle === "vneck") {
    ctx.fillStyle = av.skin;
    ctx.fillRect(23, 20, 2, 2);
  } else if (av.shirtStyle === "collar") {
    ctx.fillStyle = av.accent;
    ctx.fillRect(20, 20, 8, 1);
    ctx.fillRect(32, 20, 8, 1);
  }
}

// Accesorios: 6 zonas reales — cabeza, cara, pecho, espalda, piernas, manos.
function paintCabeza(ctx: CanvasRenderingContext2D, poolIndex: number, av: Avatar) {
  const c = av.accent;
  const dk = darken(av.accent, 55);
  const lt = lighten(av.accent, 55);
  if (poolIndex === 0) {
    hdFill(ctx, 40, 0, 8, 8, lt, dk, true);
    hdFill(ctx, 32, 8, 8, 8, c, dk, true);
    hdFill(ctx, 40, 8, 8, 8, c, dk, true);
    hdFill(ctx, 48, 8, 8, 8, c, dk, true);
    hdFill(ctx, 56, 8, 8, 8, c, dk, true);
    ctx.fillStyle = dk;
    ctx.fillRect(40, 7, 8, 1);
    ctx.fillStyle = lt;
    ctx.fillRect(41, 0, 6, 1);
  } else if (poolIndex === 1) {
    ctx.fillStyle = c;
    ctx.fillRect(40, 9, 8, 1);
    ctx.fillRect(32, 9, 8, 1);
    ctx.fillRect(48, 9, 8, 1);
    ctx.fillRect(56, 9, 8, 1);
    ctx.fillStyle = GOLD;
    ctx.fillRect(43, 9, 2, 1);
  } else {
    ctx.fillStyle = dk;
    ctx.fillRect(40, 0, 8, 2);
    ctx.fillRect(32, 0, 8, 2);
    ctx.fillStyle = c;
    ctx.fillRect(41, 0, 1, 2);
    ctx.fillRect(43, 0, 1, 2);
    ctx.fillRect(45, 0, 1, 2);
    ctx.fillStyle = GOLD;
    ctx.fillRect(43, -1, 2, 2);
  }
}
function paintCara(ctx: CanvasRenderingContext2D, poolIndex: number, av: Avatar) {
  const c = av.accent;
  const dk = darken(av.accent, 50);
  if (poolIndex === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(40, 10, 3, 3);
    ctx.fillRect(45, 10, 3, 3);
    ctx.fillStyle = c;
    ctx.fillRect(40, 10, 3, 1);
    ctx.fillRect(40, 12, 3, 1);
    ctx.fillRect(40, 10, 1, 3);
    ctx.fillRect(45, 10, 3, 1);
    ctx.fillRect(45, 12, 3, 1);
    ctx.fillRect(47, 10, 1, 3);
    ctx.fillStyle = dk;
    ctx.fillRect(43, 11, 2, 1);
  } else {
    hdFill(ctx, 40, 10, 8, 3, lighten(c, 24), dk, true);
    ctx.fillStyle = dk;
    ctx.fillRect(40, 12, 8, 1);
  }
}
function paintPecho(ctx: CanvasRenderingContext2D, poolIndex: number, av: Avatar) {
  const c = av.accent;
  const dk = darken(av.accent, 45);
  if (poolIndex === 0) {
    hdFill(ctx, 20, 20, 8, 10, lighten(c, 22), dk, true);
    ctx.fillStyle = dk;
    ctx.fillRect(20, 20, 1, 10);
    ctx.fillRect(27, 20, 1, 10);
    ctx.fillStyle = GOLD;
    ctx.fillRect(23, 22, 1, 1);
    ctx.fillRect(23, 25, 1, 1);
    ctx.fillRect(23, 28, 1, 1);
  } else {
    ctx.fillStyle = c;
    ctx.fillRect(22, 20, 1, 4);
    ctx.fillRect(25, 20, 1, 4);
    ctx.fillStyle = GOLD;
    ctx.fillRect(22, 24, 4, 4);
    ctx.fillStyle = dk;
    ctx.fillRect(23, 25, 2, 2);
  }
}
function paintEspalda(ctx: CanvasRenderingContext2D, poolIndex: number, av: Avatar) {
  const c = av.accent;
  const dk = darken(av.accent, 45);
  if (poolIndex === 1) {
    hdFill(ctx, 32, 20, 8, 12, lighten(c, 22), dk, true);
    ctx.fillStyle = dk;
    ctx.fillRect(32, 20, 8, 2);
    ctx.fillRect(35, 22, 1, 8);
    ctx.fillRect(38, 22, 1, 8);
  }
}
function paintPiernas(ctx: CanvasRenderingContext2D, poolIndex: number, av: Avatar) {
  const c = av.accent;
  const dk = darken(av.accent, 45);
  const rows = poolIndex === 0 ? 4 : 2;
  ([
    [4, 48 - rows],
    [0, 48 - rows],
    [8, 48 - rows],
    [12, 48 - rows],
    [4, 64 - rows],
    [16, 64 - rows],
    [24, 64 - rows],
    [28, 64 - rows],
  ] as const).forEach((p) => hdFill(ctx, p[0], p[1], 4, rows, lighten(c, 18), dk, true));
  ctx.fillStyle = dk;
  ctx.fillRect(4, 48 - 1, 4, 1);
  ctx.fillRect(4, 64 - 1, 4, 1);
}
function paintManos(ctx: CanvasRenderingContext2D, av: Avatar) {
  const c = av.accent;
  const dk = darken(av.accent, 45);
  ([
    [44, 44],
    [52, 44],
    [48, 44],
    [40, 44],
    [52, 60],
    [60, 60],
    [56, 60],
    [48, 60],
  ] as const).forEach((p) => hdFill(ctx, p[0], p[1], 4, 4, lighten(c, 25), dk, true));
  ctx.fillStyle = dk;
  ctx.fillRect(44, 44, 4, 1);
  ctx.fillRect(52, 60, 4, 1);
}

// Falda/jean femenina: se pinta en la capa "overlay" de las piernas (la misma capa
// que Minecraft usa para pantalones/faldas que sobresalen), así el modelo 3D
// muestra un volumen real distinto al de los varones, no solo un cambio de color.
function paintFemaleSkirt(ctx: CanvasRenderingContext2D, av: Avatar, isMini: boolean) {
  const legOverlays = [boxUV(0, 32, 4, 12, 4), boxUV(0, 48, 4, 12, 4)];
  if (isMini) {
    const c = av.accent;
    const dk = darken(c, 35);
    legOverlays.forEach((uv) => {
      (["front", "back", "left", "right"] as const).forEach((face) => {
        const r = uv[face];
        hdFill(ctx, r[0], r[1], r[2], 5, lighten(c, 14), dk, true);
      });
    });
    ctx.fillStyle = lighten(c, 30);
    legOverlays.forEach((uv) => {
      const r = uv.front;
      ctx.fillRect(r[0], r[1] + 4, r[2], 1);
    });
  } else {
    const dc = av.shirt;
    const ddk = darken(dc, 35);
    legOverlays.forEach((uv) => {
      (["front", "back", "left", "right"] as const).forEach((face) => {
        const r = uv[face];
        hdFill(ctx, r[0], r[1], r[2], r[3], lighten(dc, 10), ddk, true);
      });
    });
    ctx.fillStyle = lighten(av.accent, 20);
    legOverlays.forEach((uv) => {
      const r = uv.front;
      ctx.fillRect(r[0], r[1] + r[3] - 2, r[2], 1);
    });
  }
}

export interface EquippedDisplay {
  cabeza?: Accessory | null;
  cara?: Accessory | null;
  pecho?: Accessory | null;
  espalda?: Accessory | null;
  piernas?: Accessory | null;
  manos?: Accessory | null;
}

export function buildSkinCanvas(av: Avatar, eq: EquippedDisplay): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = SKIN_RES;
  c.height = SKIN_RES;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.scale(SKIN_SCALE, SKIN_SCALE);

  paintBox(ctx, 0, 0, 8, 8, 8, { top: av.hairColor, bottom: av.skin, right: av.skin, front: av.skin, left: av.skin, back: av.skin });
  paintHair(ctx, av);
  paintFace(ctx, av);

  paintBox(ctx, 16, 16, 8, 12, 4, { top: av.shirt, bottom: av.shirt, right: av.shirt, front: av.shirt, left: av.shirt, back: av.shirt });
  ctx.fillStyle = av.accent;
  ctx.fillRect(20, 24, 8, 2);
  paintShirtStyle(ctx, av);

  paintBox(ctx, 40, 16, 4, 12, 4, { top: av.skin, bottom: av.skin, right: av.skin, front: av.skin, left: av.skin, back: av.skin });
  paintBox(ctx, 32, 48, 4, 12, 4, { top: av.skin, bottom: av.skin, right: av.skin, front: av.skin, left: av.skin, back: av.skin });
  if (av.shirtStyle !== "tank") {
    paintArmSleeve(ctx, 40, 16, 4, 12, 4, av.shirt);
    paintArmSleeve(ctx, 32, 48, 4, 12, 4, av.shirt);
  }

  const isSkirtLook = av.gender === "f" && av.shirtStyle !== "dress";
  const legColor = isSkirtLook ? DENIM : av.pants;
  paintBox(ctx, 0, 16, 4, 12, 4, { top: legColor, bottom: legColor, right: legColor, front: legColor, left: legColor, back: legColor });
  paintBox(ctx, 16, 48, 4, 12, 4, { top: legColor, bottom: legColor, right: legColor, front: legColor, left: legColor, back: legColor });
  const shoe = darken(legColor, 45);
  paintLegShoes(ctx, 0, 16, 4, 12, 4, shoe);
  paintLegShoes(ctx, 16, 48, 4, 12, 4, shoe);
  if (av.gender === "f") paintFemaleSkirt(ctx, av, isSkirtLook);

  if (eq.cabeza) paintCabeza(ctx, eq.cabeza.poolIndex, av);
  if (eq.cara) paintCara(ctx, eq.cara.poolIndex, av);
  if (eq.pecho) paintPecho(ctx, eq.pecho.poolIndex, av);
  if (eq.espalda) paintEspalda(ctx, eq.espalda.poolIndex, av);
  if (eq.piernas) paintPiernas(ctx, eq.piernas.poolIndex, av);
  if (eq.manos) paintManos(ctx, av);
  return c;
}

export function buildCapeCanvas(color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = SKIN_RES;
  c.height = SKIN_RES / 2;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.scale(SKIN_SCALE, SKIN_SCALE);
  hdFill(ctx, 0, 0, 64, 32, lighten(color, 22), darken(color, 24), true);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(0, 0, 64, 2);
  ctx.fillStyle = darken(color, 40);
  ctx.fillRect(0, 29, 64, 3);
  ctx.fillStyle = "rgba(255,255,255,.15)";
  for (let x = 3; x < 64; x += 7) ctx.fillRect(x, 4, 1, 23);
  return c;
}

function fillSpecialBox(ctx: CanvasRenderingContext2D, u: number, v: number, w: number, h: number, d: number, a: string) {
  paintBox(ctx, u, v, w, h, d, { top: lighten(a, 18), bottom: darken(a, 28), right: darken(a, 18), front: a, left: lighten(a, 9), back: darken(a, 30) });
  const uv = boxUV(u, v, w, h, d);
  (["front", "back", "left", "right"] as const).forEach((face) => {
    const r = uv[face];
    hdFill(ctx, r[0], r[1], r[2], r[3], lighten(a, 16), darken(a, 18), true);
  });
}

const HAS_GOLD_TYPES = new Set(["ceremonial", "sanctuary", "royal", "guardian"]);

function paintSpecialOutfit(ctx: CanvasRenderingContext2D, av: Avatar, a: string, b: string) {
  const look = SPECIAL_LOOKS[av.id] || SPECIAL_LOOKS.yamile;
  const stripe = lighten(b, 35);
  const dk = darken(b, 35);
  fillSpecialBox(ctx, 16, 16, 8, 12, 4, a);
  fillSpecialBox(ctx, 40, 16, 4, 12, 4, a);
  fillSpecialBox(ctx, 32, 48, 4, 12, 4, a);
  fillSpecialBox(ctx, 0, 16, 4, 12, 4, b);
  fillSpecialBox(ctx, 16, 48, 4, 12, 4, b);
  const torsoUV = boxUV(16, 16, 8, 12, 4);
  const hasGold = HAS_GOLD_TYPES.has(look.type);
  // El patrón se pinta en frente Y espalda: si solo estuviera en el frente, al girar
  // el modelo 3D (auto-rotación) se ve un rato como una remera lisa recoloreada.
  ([torsoUV.front, torsoUV.back] as const).forEach((front) => {
    if (look.type === "poncho") {
      hdFill(ctx, front[0] - 1, front[1] + 1, 10, 9, a, dk, true);
      ctx.fillStyle = b;
      ctx.fillRect(front[0] + 3, front[1] + 1, 2, 8);
      ctx.fillStyle = stripe;
      ctx.fillRect(front[0], front[1] + 8, 8, 1);
      for (let px = 0; px < 8; px += 2) ctx.fillRect(front[0] + px, front[1] + 9, 1, 2);
    } else if (look.type === "gala") {
      ctx.fillStyle = a;
      ctx.fillRect(front[0] + 2, front[1], 4, 5);
      ctx.fillStyle = stripe;
      ctx.fillRect(front[0] + 3, front[1] + 1, 2, 2);
      ctx.fillStyle = b;
      ctx.fillRect(front[0], front[1] + 5, 8, 2);
      ctx.fillRect(front[0] - 1, front[1] + 7, 10, 2);
      ctx.fillRect(front[0], front[1] + 9, 8, 3);
      ctx.fillStyle = stripe;
      ctx.fillRect(front[0], front[1] + 6, 8, 1);
      ctx.fillRect(front[0] + 1, front[1] + 10, 6, 1);
    } else if (look.type === "explorer") {
      ctx.fillStyle = dk;
      ctx.fillRect(front[0] + 3, front[1], 2, 12);
      ctx.fillStyle = b;
      ctx.fillRect(front[0], front[1] + 3, 3, 4);
      ctx.fillRect(front[0] + 5, front[1] + 3, 3, 4);
      ctx.fillStyle = stripe;
      ctx.fillRect(front[0] + 3, front[1] + 2, 2, 1);
      ctx.fillRect(front[0], front[1] + 8, 8, 1);
    } else if (look.type === "garden") {
      hdFill(ctx, front[0], front[1], 8, 12, a, b, true);
      ctx.fillStyle = darken(a, 45);
      ctx.fillRect(front[0] + 3, front[1] + 1, 2, 10);
      ctx.fillStyle = stripe;
      ([[1, 4], [5, 3], [1, 8], [5, 9]] as const).forEach((p) => {
        ctx.fillRect(front[0] + p[0], front[1] + p[1], 2, 1);
        ctx.fillRect(front[0] + p[0] + 0.5, front[1] + p[1] - 0.5, 1, 2);
      });
    } else if (look.type === "aqua") {
      hdFill(ctx, front[0], front[1], 8, 12, a, dk, true);
      ctx.fillStyle = "#fff6df";
      ctx.fillRect(front[0] + 3, front[1], 2, 12);
      ctx.fillStyle = b;
      ctx.fillRect(front[0], front[1] + 3, 3, 2);
      ctx.fillRect(front[0] + 5, front[1] + 6, 3, 2);
      ctx.fillStyle = stripe;
      ctx.fillRect(front[0], front[1] + 10, 8, 1);
    } else if (look.type === "ranger") {
      hdFill(ctx, front[0], front[1], 8, 12, a, b, true);
      ctx.fillStyle = dk;
      ctx.fillRect(front[0] + 2, front[1], 4, 2);
      ctx.fillStyle = b;
      ctx.fillRect(front[0], front[1] + 5, 8, 2);
      ctx.fillStyle = stripe;
      ctx.fillRect(front[0] + 5, front[1] + 2, 1, 3);
      ctx.fillRect(front[0] + 4, front[1] + 3, 3, 1);
    } else if (look.type === "ceremonial") {
      ctx.fillStyle = b;
      for (let y = 0; y < 12; y += 3) ctx.fillRect(front[0], front[1] + y, 8, 1);
      ctx.fillStyle = stripe;
      for (let sy = 0; sy < 9; sy += 2) ctx.fillRect(front[0] + sy / 2, front[1] + sy, 2, 2);
      ctx.fillStyle = GOLD;
      ctx.fillRect(front[0], front[1] + 10, 8, 1);
    } else if (look.type === "ruffles") {
      hdFill(ctx, front[0], front[1], 8, 12, a, b, true);
      ctx.fillStyle = b;
      ctx.fillRect(front[0], front[1] + 5, 8, 2);
      ctx.fillRect(front[0] - 1, front[1] + 7, 10, 2);
      ctx.fillRect(front[0], front[1] + 9, 8, 3);
      ctx.fillStyle = stripe;
      ctx.fillRect(front[0] + 1, front[1] + 5, 6, 1);
      ctx.fillRect(front[0] + 3, front[1] + 1, 2, 2);
    } else if (look.type === "sanctuary") {
      hdFill(ctx, front[0], front[1], 8, 12, a, b, true);
      ctx.fillStyle = stripe;
      ctx.fillRect(front[0], front[1] + 1, 8, 1);
      ctx.fillRect(front[0], front[1] + 7, 3, 1);
      ctx.fillRect(front[0] + 4, front[1] + 8, 4, 1);
      ctx.fillStyle = GOLD;
      ctx.fillRect(front[0] + 3, front[1] + 2, 2, 2);
    } else if (look.type === "royal") {
      ctx.fillStyle = a;
      ctx.fillRect(front[0] + 2, front[1], 4, 5);
      ctx.fillStyle = GOLD;
      ctx.fillRect(front[0] + 1, front[1] + 4, 6, 1);
      ctx.fillStyle = b;
      ctx.fillRect(front[0], front[1] + 5, 8, 7);
      ctx.fillStyle = stripe;
      ctx.fillRect(front[0], front[1] + 6, 8, 1);
      ctx.fillRect(front[0] + 1, front[1] + 10, 6, 1);
    } else if (look.type === "guardian") {
      hdFill(ctx, front[0], front[1], 8, 12, "#fff6df", a, true);
      ctx.fillStyle = b;
      ctx.fillRect(front[0] + 3, front[1], 2, 12);
      ctx.fillStyle = GOLD;
      ctx.fillRect(front[0], front[1] + 5, 8, 1);
      ctx.fillRect(front[0] + 2, front[1] + 2, 4, 1);
    }
    if (!hasGold) {
      ctx.fillStyle = GOLD;
      ctx.fillRect(front[0] + 3, front[1], 2, 1);
    }
  });
  // Botas y bordados diferentes al pantalón normal.
  [boxUV(0, 16, 4, 12, 4), boxUV(16, 48, 4, 12, 4)].forEach((uv) => {
    (["front", "back"] as const).forEach((face) => {
      const r = uv[face];
      ctx.fillStyle = dk;
      ctx.fillRect(r[0], r[1] + 9, r[2], 3);
      ctx.fillStyle = stripe;
      ctx.fillRect(r[0], r[1] + 8, r[2], 1);
    });
  });
}

export function buildSpecialSkin(av: Avatar, colorA: string, colorB: string): HTMLCanvasElement {
  const av2: Avatar = { ...av, shirt: colorA, pants: colorB, accent: colorB };
  const c = buildSkinCanvas(av2, {});
  const ctx = c.getContext("2d")!;
  // buildSkinCanvas ya deja el contexto escalado SKIN_SCALE — no reescalar de nuevo acá.
  ctx.clearRect(0, 32, 16, 32); // saca la falda/jean de la base: la prenda especial es otra, no un recoloreo
  paintSpecialOutfit(ctx, av, colorA, colorB);
  return c;
}

export function accessoriesFor(avatarId: string): Accessory[] {
  return AVATAR_ACCESSORIES[avatarId] || [];
}

// Miniatura 2D liviana para la fila de avatares: recorta cara + torso de frente
// de la textura de la skin ya pintada, en vez de montar un SkinViewer 3D (WebGL)
// por cada uno de los 11 avatares — más liviano en celulares de gama baja.
export function buildAvatarThumbnail(skinCanvas: HTMLCanvasElement): string {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  // Miniatura de cuerpo completo (cara + torso + brazos + piernas, todo de frente,
  // estática — sin animación ni rotación 3D) recortada de la misma textura de piel
  // que usa el visor 3D real, así que coincide con el avatar de verdad.
  // Cabeza: boxUV(0,0,8,8,8).front = [8,8,8,8] lógico → físico ×4 = [32,32,32,32]
  ctx.drawImage(skinCanvas, 32, 32, 32, 32, 16, 0, 32, 32);
  // Torso: boxUV(16,16,8,12,4).front = [20,20,8,12] lógico → físico ×4 = [80,80,32,48]
  ctx.drawImage(skinCanvas, 80, 80, 32, 48, 16, 32, 32, 48);
  // Brazo derecho: boxUV(40,16,4,12,4).front = [44,20,4,12] lógico → físico ×4 = [176,80,16,48]
  ctx.drawImage(skinCanvas, 176, 80, 16, 48, 48, 32, 16, 48);
  // Brazo izquierdo: boxUV(32,48,4,12,4).front = [36,52,4,12] lógico → físico ×4 = [144,208,16,48]
  ctx.drawImage(skinCanvas, 144, 208, 16, 48, 0, 32, 16, 48);
  // Pierna derecha: boxUV(0,16,4,12,4).front = [4,20,4,12] lógico → físico ×4 = [16,80,16,48]
  ctx.drawImage(skinCanvas, 16, 80, 16, 48, 16, 80, 16, 48);
  // Pierna izquierda: boxUV(16,48,4,12,4).front = [20,52,4,12] lógico → físico ×4 = [80,208,16,48]
  ctx.drawImage(skinCanvas, 80, 208, 16, 48, 32, 80, 16, 48);
  return c.toDataURL();
}

const thumbnailCache = new Map<string, string>();
/** Miniatura cacheada por avatar (look base, sin accesorios) — se computa una sola vez. */
export function getAvatarThumbnail(av: Avatar): string {
  const cached = thumbnailCache.get(av.id);
  if (cached) return cached;
  const url = buildAvatarThumbnail(buildSkinCanvas(av, {}));
  thumbnailCache.set(av.id, url);
  return url;
}
