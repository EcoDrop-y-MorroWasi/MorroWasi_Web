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

// Cara: ojo clásico estilo Minecraft (esclera blanca marcada + iris con brillo
// y sombra) en vez de un bloque de color liso — probamos un ojo "propio" más
// grande con delineado y se veía roto; esto vuelve a la referencia real del
// juego, que ya se lee bien a este tamaño de píxel.
function paintFace(ctx: CanvasRenderingContext2D, av: Avatar) {
  // outerLeft=true: la esclera (blanco) va en la columna hacia la sien; el
  // iris queda del lado de la nariz — así los dos ojos "miran" al centro.
  [
    { x: 9, outerLeft: true },
    { x: 13, outerLeft: false },
  ].forEach(({ x, outerLeft }) => {
    const scleraCol = outerLeft ? x : x + 2;
    const irisStart = outerLeft ? x + 1 : x;
    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(scleraCol, 10, 1, 2);
    ctx.fillStyle = av.eyeColor;
    ctx.fillRect(irisStart, 10, 2, 2);
    ctx.fillStyle = "#140d08";
    ctx.fillRect(irisStart + (outerLeft ? 1 : 0), 11, 1, 1);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(irisStart + (outerLeft ? 0 : 1), 10, 1, 1);
  });
  ctx.fillStyle = darken(av.skin, 30);
  ctx.fillRect(10, 14, 4, 1);
  if (av.gender === "f") {
    // Ceja fina, una sola barra prolija (nada de arco en dos tramos: se
    // perdía contra el nacimiento del pelo y se veía como puntos sueltos).
    ctx.fillStyle = darken(av.hairColor, 22);
    ctx.fillRect(9, 9, 3, 1);
    ctx.fillRect(13, 9, 3, 1);
    // Rubor sutil.
    ctx.fillStyle = "rgba(224,91,104,.45)";
    ctx.fillRect(8, 12, 2, 2);
    ctx.fillRect(14, 12, 2, 2);
    // Labios: sobrepinta la sombra de piel de la boca con un tinte rosa suave.
    ctx.fillStyle = "#c98a86";
    ctx.fillRect(10, 14, 4, 1);
  }
}

function paintHair(ctx: CanvasRenderingContext2D, av: Avatar) {
  const c = av.hairColor;
  const ac = av.accent;
  const hi = lighten(av.hairColor, 24);
  const sh = darken(av.hairColor, 18);
  const isF = av.gender === "f";
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
      // Nuca con degradé de 3 tonos en vez de color plano — antes seguía con
      // un mechón en y15-24 que caía fuera de la caja de textura de la
      // cabeza (0-16) y nunca se veía en el modelo 3D, solo desperdiciaba
      // píxeles.
      hdFill(ctx, 24, 8, 8, 8, hi, sh, true);
      ctx.fillStyle = sh;
      ctx.fillRect(24, 15, 8, 1);
      break;
    case "afro":
      ctx.fillRect(8, 8, 8, 5);
      ctx.fillRect(0, 8, 8, 5);
      ctx.fillRect(16, 8, 8, 5);
      hdFill(ctx, 24, 8, 8, 6, hi, sh, true);
      ctx.fillRect(40, 0, 8, 8);
      ctx.fillRect(32, 8, 8, 8);
      ctx.fillRect(48, 8, 8, 8);
      ctx.fillRect(56, 8, 8, 8);
      break;
    case "bob":
      ctx.fillRect(8, 8, 8, 3);
      ctx.fillRect(0, 8, 8, 8);
      ctx.fillRect(16, 8, 8, 8);
      // Mismo fix que "largo": antes el mechón caía en y14-19, fuera de la
      // caja de textura visible.
      hdFill(ctx, 24, 8, 8, 8, hi, sh, true);
      ctx.fillStyle = sh;
      ctx.fillRect(24, 15, 8, 1);
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
      ctx.fillRect(8, 8, 8, 3);
      ctx.fillRect(0, 8, 8, 3);
      ctx.fillRect(16, 8, 8, 3);
      // Nuca (cola de caballo) con degradé de 3 tonos — antes seguía con un
      // tramo en y14-22, fuera de la caja de textura visible de la cabeza.
      hdFill(ctx, 24, 8, 8, 8, hi, sh, true);
      ctx.fillStyle = sh;
      ctx.fillRect(24, 15, 8, 1);
      // Liga + moño, sobre la nuca ya pintada (acento del avatar, no cambia
      // el color de pelo).
      ctx.fillStyle = ac;
      ctx.fillRect(25, 12, 6, 1);
      ctx.fillStyle = lighten(ac, 28);
      ctx.fillRect(27, 10, 2, 2);
      ctx.fillStyle = darken(ac, 15);
      ctx.fillRect(27, 11, 2, 1);
      break;
    case "trenza":
    case "trenzaDorada":
      ctx.fillRect(8, 8, 8, 2);
      ctx.fillRect(0, 8, 8, 2);
      ctx.fillRect(16, 8, 8, 2);
      // Trenza con degradé en vez de plano — antes seguía con un tramo en
      // y15-24, fuera de la caja de textura visible de la cabeza.
      hdFill(ctx, 24, 8, 8, 8, hi, sh, true);
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
  // Raya de brillo en el flequillo — solo avatares mujer, acento discreto que
  // no cambia el color de pelo.
  if (isF) {
    ctx.fillStyle = hi;
    ctx.fillRect(11, 8, 2, 1);
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
// 6 formas de sombrero/tocado (antes 3) — cada una deja libre la franja de
// ojos/boca de la capa "hat" para que la cara siga visible.
function paintCabeza(ctx: CanvasRenderingContext2D, poolIndex: number, av: Avatar) {
  const c = av.accent;
  const dk = darken(av.accent, 55);
  const lt = lighten(av.accent, 55);
  if (poolIndex === 0) {
    // Sombrero de ala: corona arriba + ala angosta a la altura del nacimiento
    // del pelo, sin tocar la franja de ojos/boca.
    hdFill(ctx, 40, 0, 8, 8, lt, dk, true);
    ctx.fillStyle = dk;
    ctx.fillRect(40, 7, 8, 1);
    ctx.fillStyle = lt;
    ctx.fillRect(41, 0, 6, 1);
    ctx.fillStyle = c;
    ctx.fillRect(32, 8, 32, 2);
    ctx.fillStyle = dk;
    ctx.fillRect(32, 9, 32, 1);
  } else if (poolIndex === 1) {
    // Vincha fina: una sola línea angosta.
    ctx.fillStyle = c;
    ctx.fillRect(40, 9, 8, 1);
    ctx.fillRect(32, 9, 8, 1);
    ctx.fillRect(48, 9, 8, 1);
    ctx.fillRect(56, 9, 8, 1);
    ctx.fillStyle = GOLD;
    ctx.fillRect(43, 9, 2, 1);
  } else if (poolIndex === 2) {
    // Corona con puntas, solo arriba de la cabeza.
    ctx.fillStyle = dk;
    ctx.fillRect(40, 0, 8, 2);
    ctx.fillRect(32, 0, 8, 2);
    ctx.fillStyle = c;
    ctx.fillRect(41, 0, 1, 2);
    ctx.fillRect(43, 0, 1, 2);
    ctx.fillRect(45, 0, 1, 2);
    ctx.fillStyle = GOLD;
    ctx.fillRect(43, -1, 2, 2);
  } else if (poolIndex === 3) {
    // Vincha ancha: banda gruesa (3px) a la altura de las cejas.
    hdFill(ctx, 32, 8, 32, 3, lt, dk, true);
    ctx.fillStyle = dk;
    ctx.fillRect(32, 10, 32, 1);
  } else if (poolIndex === 4) {
    // Capucha: cubre la coronilla y baja por atrás/costados, frente libre.
    hdFill(ctx, 40, 0, 8, 8, lt, dk, true);
    ctx.fillStyle = dk;
    ctx.fillRect(40, 7, 8, 1);
    ctx.fillStyle = c;
    ctx.fillRect(32, 8, 8, 4); // lado izquierdo
    ctx.fillRect(48, 8, 8, 4); // lado derecho
    ctx.fillRect(56, 8, 8, 5); // atrás, más larga
    ctx.fillStyle = dk;
    ctx.fillRect(32, 11, 8, 1);
    ctx.fillRect(48, 11, 8, 1);
  } else {
    // Tocado con adorno lateral (plumas/flores).
    hdFill(ctx, 40, 0, 8, 8, lt, dk, true);
    ctx.fillStyle = dk;
    ctx.fillRect(40, 7, 8, 1);
    ctx.fillStyle = GOLD;
    ctx.fillRect(48, 8, 2, 4);
    ctx.fillRect(50, 6, 2, 3);
    ctx.fillStyle = c;
    ctx.fillRect(48, 12, 2, 1);
  }
}
// 4 estilos de accesorio de cara (antes 2): lentes redondos, banda continua,
// antifaz tipo máscara, visera angosta.
function paintCara(ctx: CanvasRenderingContext2D, poolIndex: number, av: Avatar) {
  const c = av.accent;
  const dk = darken(av.accent, 50);
  if (poolIndex === 0) {
    // Lentes redondos con brillo.
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
  } else if (poolIndex === 1) {
    // Banda continua (gafas de sol tipo visera ancha).
    hdFill(ctx, 40, 10, 8, 3, lighten(c, 24), dk, true);
    ctx.fillStyle = dk;
    ctx.fillRect(40, 12, 8, 1);
  } else if (poolIndex === 2) {
    // Antifaz tipo máscara: cubre solo la franja de ojos, más angosta y con borde.
    ctx.fillStyle = dk;
    ctx.fillRect(40, 10, 8, 2);
    ctx.fillStyle = c;
    ctx.fillRect(41, 10, 2, 2);
    ctx.fillRect(45, 10, 2, 2);
  } else {
    // Visera angosta arriba de los ojos, sin cubrirlos.
    ctx.fillStyle = c;
    ctx.fillRect(40, 9, 8, 1);
    ctx.fillStyle = dk;
    ctx.fillRect(40, 10, 8, 1);
  }
}
// 4 estilos de pecho (antes 2): chaleco con costuras, medallón, banda diagonal,
// insignia con cuadrícula.
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
  } else if (poolIndex === 1) {
    ctx.fillStyle = c;
    ctx.fillRect(22, 20, 1, 4);
    ctx.fillRect(25, 20, 1, 4);
    ctx.fillStyle = GOLD;
    ctx.fillRect(22, 24, 4, 4);
    ctx.fillStyle = dk;
    ctx.fillRect(23, 25, 2, 2);
  } else if (poolIndex === 2) {
    // Banda diagonal cruzando el pecho.
    ctx.fillStyle = c;
    ctx.fillRect(20, 20, 2, 2);
    ctx.fillRect(22, 22, 2, 2);
    ctx.fillRect(24, 24, 2, 2);
    ctx.fillRect(26, 26, 2, 2);
    ctx.fillStyle = GOLD;
    ctx.fillRect(20, 27, 2, 2);
  } else {
    // Insignia con cuadrícula de placas pequeñas.
    ctx.fillStyle = dk;
    ctx.fillRect(21, 21, 6, 6);
    ctx.fillStyle = c;
    ctx.fillRect(22, 22, 2, 2);
    ctx.fillRect(24, 24, 2, 2);
    ctx.fillStyle = GOLD;
    ctx.fillRect(24, 22, 2, 2);
    ctx.fillRect(22, 24, 2, 2);
  }
}
// 3 variantes de espalda: capa real 3D (poolIndex 0, geometría aparte vía
// buildCapeCanvas), mochila (1) y manto liviano plano (2, nuevo).
function paintEspalda(ctx: CanvasRenderingContext2D, poolIndex: number, av: Avatar) {
  const c = av.accent;
  const dk = darken(av.accent, 45);
  if (poolIndex === 1) {
    hdFill(ctx, 32, 20, 8, 12, lighten(c, 22), dk, true);
    ctx.fillStyle = dk;
    ctx.fillRect(32, 20, 8, 2);
    ctx.fillRect(35, 22, 1, 8);
    ctx.fillRect(38, 22, 1, 8);
  } else if (poolIndex === 2) {
    // Manto liviano: franja angosta centrada, más corta que la mochila.
    hdFill(ctx, 34, 20, 4, 8, lighten(c, 22), dk, true);
    ctx.fillStyle = dk;
    ctx.fillRect(34, 20, 4, 1);
  }
}
// 4 variantes de piernas (antes 2): botas altas, vendas cruzadas, ojotas con
// correa, polainas con textura punteada.
function paintPiernas(ctx: CanvasRenderingContext2D, poolIndex: number, av: Avatar) {
  const c = av.accent;
  const dk = darken(av.accent, 45);
  const rows = poolIndex === 0 ? 4 : poolIndex === 3 ? 3 : 2;
  const spots: readonly (readonly [number, number])[] = [
    [4, 48 - rows],
    [0, 48 - rows],
    [8, 48 - rows],
    [12, 48 - rows],
    [4, 64 - rows],
    [16, 64 - rows],
    [24, 64 - rows],
    [28, 64 - rows],
  ];
  spots.forEach((p) => hdFill(ctx, p[0], p[1], 4, rows, lighten(c, 18), dk, true));
  ctx.fillStyle = dk;
  ctx.fillRect(4, 48 - 1, 4, 1);
  ctx.fillRect(4, 64 - 1, 4, 1);
  if (poolIndex === 2) {
    // Correa cruzada sobre la banda base.
    ctx.fillStyle = GOLD;
    ctx.fillRect(4, 48 - rows, 1, rows);
    ctx.fillRect(16, 64 - rows, 1, rows);
  } else if (poolIndex === 3) {
    // Textura punteada.
    ctx.fillStyle = lighten(c, 40);
    ctx.fillRect(5, 48 - rows, 1, 1);
    ctx.fillRect(17, 64 - rows, 1, 1);
  }
}
// El accesorio de manos ya varía por herramienta (regadera/balde/libro/vara,
// ver HAND_SHAPES) — antes las 4 se dibujaban exactamente igual (un guante
// liso), ahora cada una tiene su propia silueta simple sobre la mano.
function paintManos(ctx: CanvasRenderingContext2D, av: Avatar, handShape: string | null) {
  const c = av.accent;
  const dk = darken(av.accent, 45);
  const hands: readonly (readonly [number, number])[] = [
    [44, 44],
    [52, 44],
    [48, 44],
    [40, 44],
    [52, 60],
    [60, 60],
    [56, 60],
    [48, 60],
  ];
  hands.forEach((p) => hdFill(ctx, p[0], p[1], 4, 4, lighten(c, 25), dk, true));
  ctx.fillStyle = dk;
  ctx.fillRect(44, 44, 4, 1);
  ctx.fillRect(52, 60, 4, 1);
  // Silueta de la herramienta, sobre la mano derecha (44,44) y su espejo (52,60).
  const tool = (x: number, y: number) => {
    if (handShape === "regadera") {
      ctx.fillStyle = GOLD;
      ctx.fillRect(x, y - 1, 4, 1);
      ctx.fillRect(x + 3, y - 2, 1, 1);
    } else if (handShape === "balde") {
      ctx.fillStyle = darken(c, 20);
      ctx.fillRect(x, y - 2, 4, 2);
      ctx.fillStyle = GOLD;
      ctx.fillRect(x, y - 2, 4, 1);
    } else if (handShape === "libro") {
      ctx.fillStyle = "#fff8e0";
      ctx.fillRect(x, y - 2, 4, 2);
      ctx.fillStyle = dk;
      ctx.fillRect(x + 1, y - 2, 1, 2);
    } else if (handShape === "vara") {
      ctx.fillStyle = darken(c, 30);
      ctx.fillRect(x + 1, y - 4, 1, 4);
      ctx.fillStyle = GOLD;
      ctx.fillRect(x + 1, y - 4, 1, 1);
    }
  };
  tool(44, 44);
  tool(52, 60);
}

// Falda/jean femenina: se pinta en la capa "overlay" de las piernas (la misma capa
// que Minecraft usa para pantalones/faldas que sobresalen), así el modelo 3D
// muestra un volumen real distinto al de los varones, no solo un cambio de color.
// Pliegues de falda: rayas verticales alternadas más oscuras, en vez de un
// color plano — es lo que realmente se nota a este tamaño de píxel. La falda
// no puede "volar" hacia afuera del cuerpo sin geometría 3D real (como la
// capa de espalda); esto trabaja dentro de esa caja fija.
function paintSkirtPleats(ctx: CanvasRenderingContext2D, r: readonly [number, number, number, number], baseColor: string) {
  ctx.fillStyle = darken(baseColor, 22);
  for (let x = r[0] + 1; x < r[0] + r[2]; x += 2) ctx.fillRect(x, r[1], 1, r[3]);
}

function paintFemaleSkirt(ctx: CanvasRenderingContext2D, av: Avatar, isMini: boolean) {
  const legOverlays = [boxUV(0, 32, 4, 12, 4), boxUV(0, 48, 4, 12, 4)];
  if (isMini) {
    const c = av.accent;
    const dk = darken(c, 35);
    legOverlays.forEach((uv) => {
      (["front", "back", "left", "right"] as const).forEach((face) => {
        const r = uv[face];
        hdFill(ctx, r[0], r[1], r[2], 5, lighten(c, 14), dk, true);
        paintSkirtPleats(ctx, [r[0], r[1], r[2], 5], c);
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
        paintSkirtPleats(ctx, r, dc);
      });
    });
    // Cinta a la cintura, remata el look sin tapar los pliegues.
    ctx.fillStyle = av.accent;
    legOverlays.forEach((uv) => {
      const r = uv.front;
      ctx.fillRect(r[0], r[1], r[2], 1);
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
  if (eq.manos) paintManos(ctx, av, eq.manos.handShape);
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
  const look = SPECIAL_LOOKS[av.id] || SPECIAL_LOOKS.angie;
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
