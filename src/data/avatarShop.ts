// Datos de la Tienda de Avatares 3D — portado de web/mockups/tienda-avatares-3d.html
// (mockup ya validado visualmente: ojos naturales, falda/jean femenino, skins
// especiales con capa real). 10 avatares (uno por etapa del Wasi) + 1 secreto.

export type Gender = "f" | "m";
export type SkinModel = "slim" | "default";

export interface AvatarSeed {
  id: string;
  name: string;
  gender: Gender;
  hair: string;
  skin: string;
  hairStyle: string;
  eye: string;
  shirtStyle: string;
  streak?: string;
}

export interface Avatar {
  id: string;
  name: string;
  gender: Gender;
  model: SkinModel;
  tierIndex: number;
  stage: number | null;
  special: boolean;
  skin: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  streak?: string;
  shirt: string;
  pants: string;
  accent: string;
  shirtStyle: string;
  unlockLabel: string;
}

export interface Accessory {
  id: string;
  avatarId: string;
  slot: AccessorySlot;
  index: number;
  poolIndex: number;
  handShape: string | null;
  name: string;
  price: number;
  note: string;
}

export type AccessorySlot = "cabeza" | "cara" | "pecho" | "espalda" | "piernas" | "manos";

export const GOLD = "#d9a441";
export const DENIM = "#3d5a80";
export const SWATCHES = ["#e26d5c", "#99b4d8", "#ffb793", "#4f9d69", "#d9a441", "#7c5ba6", "#3fb0a8", "#f6c7d6", "#5b3a29", "#1c1c11"];

export function darken(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 255) - amt);
  const g = Math.max(0, ((n >> 8) & 255) - amt);
  const b = Math.max(0, (n & 255) - amt);
  return `rgb(${r},${g},${b})`;
}

interface StagePalette {
  wall: string;
  trim: string;
  accent: string;
}

const STAGE_PALETTE: StagePalette[] = [
  { wall: "#CBAF86", trim: "#6B4A33", accent: "#D9B9A6" },
  { wall: "#CBAF86", trim: "#654530", accent: "#E0AEB0" },
  { wall: "#D6C199", trim: "#5F3F2C", accent: "#E7A9AE" },
  { wall: "#F0D2C2", trim: "#5B3A29", accent: "#EDA6BC" },
  { wall: "#F0D2C2", trim: "#5B3A29", accent: "#EDA6BC" },
  { wall: "#F3D7C9", trim: "#5B3A29", accent: "#EFA9C0" },
  { wall: "#F3D7C9", trim: "#5B3A29", accent: "#EFA9C0" },
  { wall: "#F6DFD2", trim: "#4A3220", accent: "#F0A6C4" },
  { wall: "#FBE3D6", trim: "#D9A441", accent: "#F3ADCB" },
  { wall: "#FBE3D6", trim: "#FFCB3F", accent: "#F6C7D6" },
];

// 8 mujeres (modelo "slim") + 2 varones (modelo "default") en las 10 etapas, más
// 1 varón en el secreto (3 hombres y 8 mujeres en total) — alineados a las 10
// etapas reales del Wasi (src/data/mock.ts WASI_STAGES).
const AVATAR_SEED: AvatarSeed[] = [
  { id: "angie", name: "Angie", gender: "f", hair: "#241a14", skin: "#f6d3a8", hairStyle: "coleta", eye: "#8a5a2e", shirtStyle: "vneck" },
  { id: "britney", name: "Britney", gender: "f", hair: "#3b2417", skin: "#e0ad75", hairStyle: "chongo", eye: "#6b4a2b", shirtStyle: "collar" },
  { id: "francheska", name: "Francheska", gender: "f", hair: "#241a14", skin: "#c48952", hairStyle: "corto", eye: "#5c3a22", shirtStyle: "vneck" },
  { id: "dayra", name: "Dayra", gender: "f", hair: "#6b3a1f", skin: "#8b5a34", hairStyle: "largo", eye: "#5a3d22", shirtStyle: "vneck" },
  { id: "felipe", name: "Felipe", gender: "m", hair: "#241a14", skin: "#f6d3a8", hairStyle: "rapado", eye: "#4a2f1c", shirtStyle: "basic" },
  { id: "milagros", name: "Milagros", gender: "f", hair: "#241a14", skin: "#c48952", hairStyle: "afro", eye: "#8a5a2e", shirtStyle: "vneck" },
  { id: "jimmy", name: "Jimmy", gender: "m", hair: "#3b2417", skin: "#e0ad75", hairStyle: "rapado", eye: "#6b4423", shirtStyle: "tank" },
  { id: "genesis", name: "Genesis", gender: "f", hair: "#6b3a1f", skin: "#c48952", hairStyle: "colitas", eye: "#a67c3d", shirtStyle: "collar" },
  { id: "rihana", name: "Rihana", gender: "f", hair: "#241a14", skin: "#f6d3a8", hairStyle: "colaAlta", eye: "#42301f", shirtStyle: "vneck", streak: "#e07fb0" },
  { id: "flordejesus", name: "Flor De Jesús", gender: "f", hair: "#3b2417", skin: "#8b5a34", hairStyle: "trenza", eye: "#7a4a26", shirtStyle: "dress" },
];

export const AVATARS: Avatar[] = AVATAR_SEED.map((a, i) => {
  const pal = STAGE_PALETTE[i];
  return {
    id: a.id,
    name: a.name,
    gender: a.gender,
    model: a.gender === "f" ? "slim" : "default",
    tierIndex: i,
    stage: i + 1,
    special: false,
    skin: a.skin,
    hairColor: a.hair,
    hairStyle: a.hairStyle,
    eyeColor: a.eye,
    streak: a.streak,
    shirt: a.gender === "f" ? pal.accent : pal.wall,
    pants: a.gender === "f" ? pal.trim : darken(pal.trim, 12),
    accent: a.gender === "f" ? pal.wall : darken(pal.wall, 40),
    shirtStyle: a.shirtStyle,
    unlockLabel: `Etapa ${i + 1} del Wasi`,
  };
});

AVATARS.push({
  id: "claudio",
  name: "Claudio",
  gender: "m",
  model: "default",
  tierIndex: 10,
  stage: null,
  special: true,
  skin: "#c48952", // más claro que el bronceado oscuro original (#5c3a22)
  hairColor: "#fff6df",
  hairStyle: "trenzaDorada",
  eyeColor: "#7a4a26",
  shirt: "#3a2c1c",
  pants: "#2a2015",
  accent: "#FFCB3F",
  shirtStyle: "collar",
  unlockLabel: "Guardián Dorado — logro secreto",
});

export const SPECIAL_LOOKS: Record<string, { title: string; type: string }> = {
  angie: { title: "Poncho de la Primera Lluvia", type: "poncho" },
  britney: { title: "Vestido Semilla en Flor", type: "gala" },
  francheska: { title: "Traje Guardiana de Duna", type: "explorer" },
  dayra: { title: "Manto Jardín de Duna", type: "garden" },
  felipe: { title: "Chaqueta Oasis Temprano", type: "aqua" },
  milagros: { title: "Túnica Refugio Verde", type: "ranger" },
  jimmy: { title: "Uniforme del Chira", type: "ceremonial" },
  genesis: { title: "Falda Bosque Seco", type: "ruffles" },
  rihana: { title: "Capa Santuario Hídrico", type: "sanctuary" },
  flordejesus: { title: "Vestido Oasis Sagrado", type: "royal" },
  claudio: { title: "Manto del Guardián Dorado", type: "guardian" },
};

// Tipos de skin especial cuya prenda es un manto/capa: además de repintar la
// skin, se les cuelga una capa real (geometría 3D) del skinview3d.
export const SPECIAL_CAPE_TYPES = new Set(["garden", "sanctuary", "guardian"]);

export const HAND_SHAPES = ["regadera", "balde", "libro", "vara"] as const;

// Más variantes de dibujo por zona (antes 2-3, compartidas por los 11 avatares
// y solo recoloreadas) — reduce cuántos avatares terminan con la misma forma
// exacta, además de que cada uno ya tiene su propio color (av.accent, único
// por etapa del Wasi — ver STAGE_PALETTE).
const SLOT_POOL_SIZE: Record<Exclude<AccessorySlot, "manos">, number> = {
  cabeza: 6,
  cara: 4,
  pecho: 4,
  espalda: 3,
  piernas: 4,
};

const SLOT_ORDER: AccessorySlot[] = ["cabeza", "cabeza", "cara", "cara", "pecho", "pecho", "espalda", "espalda", "piernas", "piernas", "manos"];
export const SLOT_LABELS: Record<AccessorySlot, string> = { cabeza: "Cabeza", cara: "Cara", pecho: "Pecho", espalda: "Espalda", piernas: "Piernas", manos: "Manos" };
const SLOT_NOTE: Record<string, string> = { "espalda-0": "capa real puesta sobre la espalda del modelo 3D", "manos-x": "se ve como guante de color en ambas manos del modelo 3D" };

// 11 nombres por avatar (mismo orden que SLOT_ORDER: cabeza x2, cara x2, pecho x2,
// espalda x2, piernas x2, manos x1) — curados a mano en vez de generados por fórmula,
// para que cada uno sea único en todo el juego (nada de repetir "Sombrero de paja"
// en dos avatares distintos) y encaje con el género del avatar y el tema visual de
// su etapa del Wasi (src/data/wasiVisuals.ts WASI_VISUALS). El único que se repite
// a propósito es el gratis (price 0, siempre el primero — ver buildAccessories).
const ACCESSORY_NAMES: Record<string, string[]> = {
  // Angie — Etapa 1, Pequeño Brote (maceta de barro, brote tímido)
  angie: [
    "Vincha de Brote Tierno", "Tocado de Barro Fresco",
    "Lentes de Rocío Suave", "Antifaz de Tierra Seca",
    "Chaleco de Primer Brote", "Insignia de Maceta de Barro",
    "Manto de Raíz Nueva", "Mochila de Semillero",
    "Botas de Tierra Seca", "Ojotas de Brote Tierno",
    "Regadera del Primer Brote",
  ],
  // Britney — Etapa 2, Semilla Germinada (hojas verdes, gota de rocío)
  britney: [
    "Corona de Semilla Germinada", "Vincha de Hoja Nueva",
    "Gafas de Gota de Rocío", "Visera de Hoja Verde",
    "Banda de Semilla Brillante", "Chaleco de Germen Verde",
    "Capa de Rocío Matinal", "Alforja de Semillas",
    "Polainas de Hoja Tierna", "Botas de Germinación",
    "Balde de Riego Germinal",
  ],
  // Francheska — Etapa 3, Jardín de Duna (cactus y suculentas sobre arena)
  francheska: [
    "Capucha de Arena Clara", "Tocado de Flor de Cactus",
    "Lentes de Duna Dorada", "Visera de Sol de Arena",
    "Poncho de Suculenta", "Medalla de Flor de Duna",
    "Manto de Arena Clara", "Mochila de Explorador de Dunas",
    "Botas de Arena Fina", "Vendas de Caminante de Duna",
    "Libro de las Suculentas",
  ],
  // Dayra — Etapa 4, Arbusto Resiliente (flores amarillas de algarrobo)
  dayra: [
    "Vincha de Flor de Algarrobo", "Corona de Arbusto Resiliente",
    "Antifaz de Flor Amarilla", "Gafas de Sol de Algarrobo",
    "Chaleco de Ramas Resilientes", "Insignia de Flor Amarilla",
    "Capa de Arbusto Firme", "Alforja de Algarrobo",
    "Ojotas de Raíz Firme", "Polainas de Arbusto",
    "Vara de Algarrobo Florido",
  ],
  // Felipe — Etapa 5, Oasis Temprano (charco cristalino, mariposa)
  felipe: [
    "Sombrero de Oasis Temprano", "Gorro de Mariposa de Agua",
    "Lentes de Charco Cristalino", "Antifaz de Mariposa",
    "Chaleco de Guardián del Oasis", "Banda de Agua Cristalina",
    "Manto de Oasis Naciente", "Mochila de Explorador de Oasis",
    "Botas de Charco Claro", "Vendas de Andador de Oasis",
    "Regadera del Oasis Temprano",
  ],
  // Milagros — Etapa 6, Refugio Verde (tronco firme, sombra, césped)
  milagros: [
    "Tocado de Sombra Verde", "Vincha de Césped Fresco",
    "Visera de Tronco Firme", "Gafas de Refugio Verde",
    "Poncho de Sombra Densa", "Chaleco de Guardiana del Refugio",
    "Capa de Césped Verde", "Manto de Tronco Firme",
    "Botas de Refugio Verde", "Ojotas de Césped Fresco",
    "Balde de Riego del Refugio",
  ],
  // Jimmy — Etapa 7, Flujo del Chira (canalito de agua limpia)
  jimmy: [
    "Gorro del Flujo del Chira", "Chullo de Canal Limpio",
    "Visera de Agua del Chira", "Lentes de Canalito Claro",
    "Chaleco de Guardián del Chira", "Insignia de Río Limpio",
    "Capa de Corriente del Chira", "Alforja de Navegante del Chira",
    "Botas de Ribera del Chira", "Polainas de Canal Limpio",
    "Libro de las Aguas del Chira",
  ],
  // Genesis — Etapa 8, Bosque Seco (chilalos y picaflores)
  genesis: [
    "Corona de Picaflor", "Tocado de Chilalo",
    "Antifaz de Ave del Bosque", "Gafas de Bosque Seco",
    "Chaleco de Guardiana del Bosque Seco", "Banda de Plumas de Chilalo",
    "Manto de Bosque Robusto", "Mochila de Observadora de Aves",
    "Ojotas de Sendero Seco", "Vendas de Caminante del Bosque",
    "Vara de Rama de Bosque Seco",
  ],
  // Rihana — Etapa 9, Santuario Hídrico (fauna y plantas medicinales)
  rihana: [
    "Vincha de Planta Medicinal", "Corona de Santuario Hídrico",
    "Lentes de Fauna del Santuario", "Visera de Bosquecillo Húmedo",
    "Poncho de Guardiana del Santuario", "Insignia de Fauna Protegida",
    "Capa de Santuario Hídrico", "Alforja de Botánica del Santuario",
    "Botas de Bosquecillo Húmedo", "Polainas de Guardiana del Agua",
    "Regadera del Santuario Hídrico",
  ],
  // Flor De Jesús — Etapa 10, Oasis Sagrado (árbol ancestral, flores y frutos)
  flordejesus: [
    "Corona de Oasis Sagrado", "Tocado de Árbol Ancestral",
    "Antifaz de Flor Radiante", "Gafas de Cielo Despejado",
    "Vestido de Frutos Dorados", "Insignia de Árbol Ancestral",
    "Manto de Oasis Sagrado", "Capa de Flores y Frutos",
    "Botas de Cielo Despejado", "Ojotas de Árbol Radiante",
    "Balde del Oasis Sagrado",
  ],
  // Claudio — secreto, Guardián Dorado
  claudio: [
    "Corona Dorada del Guardián", "Casco de Resplandor Dorado",
    "Antifaz Dorado del Guardián", "Lentes de Luz Dorada",
    "Chaleco del Guardián Dorado", "Insignia de Oro del Wasi",
    "Manto del Guardián Dorado", "Capa de Resplandor Sagrado",
    "Botas Doradas del Guardián", "Polainas de Luz Dorada",
    "Vara Dorada del Guardián",
  ],
};

// Mismo criterio que ACCESSORY_NAMES: un ícono por accesorio (121 en total,
// mismo orden), único por accesorio pago — el gratis (el primero) puede
// repetir, igual que su nombre. Verificado sin duplicados en avatarShop.test.ts.
export const ACCESSORY_ICONS: Record<string, string[]> = {
  angie: ["🌿", "🏺", "💧", "🏜️", "🌱", "🪴", "🍃", "🎒", "🥾", "🩴", "🚿"],
  britney: ["👑", "🍀", "💦", "🌾", "🌼", "🧺", "🌦️", "🎽", "🩰", "🥿", "🪣"],
  francheska: ["🧕", "🌸", "🕶️", "☀️", "🌵", "🏵️", "🏖️", "👝", "👡", "🦶", "📖"],
  dayra: ["🎗️", "🌻", "🟡", "🐝", "🧥", "🥻", "🍂", "🧳", "🩱", "🥌", "🪄"],
  felipe: ["🤠", "🧢", "🥸", "🦋", "🦺", "💠", "🧣", "🛶", "🥊", "🥋", "🐬"],
  milagros: ["🌳", "🎀", "🥽", "🌴", "🥼", "🛡️", "🎋", "🧵", "🩳", "🧦", "🛁"],
  jimmy: ["⛑️", "🪖", "🥷", "🌊", "🎖️", "🏅", "🚤", "🧭", "🩲", "🧤", "📘"],
  genesis: ["🪶", "🦚", "🦜", "🍁", "🦉", "🐦", "🌲", "🏹", "👣", "🩹", "🎯"],
  rihana: ["🌺", "🦢", "🦎", "🌫️", "🩸", "🐍", "🍄", "🧪", "🐾", "🫧", "🧴"],
  flordejesus: ["👑", "🌟", "🌷", "🌤️", "👗", "🪵", "🕊️", "🪭", "☁️", "🌰", "🍯"],
  claudio: ["🏆", "⚜️", "🎭", "💛", "🪙", "🥇", "👘", "✨", "👢", "💫", "🔱"],
};

const PRICE_STEPS = [0, 120, 200, 280, 360, 460, 560, 680, 810, 950, 1100];

function buildAccessories(av: Avatar): Accessory[] {
  const mult = av.special ? 2.2 : 1 + av.tierIndex * 0.1;
  return SLOT_ORDER.map((slot, i) => {
    const poolIdx = slot === "manos" ? 0 : (i + av.tierIndex) % SLOT_POOL_SIZE[slot as Exclude<AccessorySlot, "manos">];
    let price = Math.round((PRICE_STEPS[i] * mult) / 10) * 10;
    if (i === 0) price = 0;
    const handShape = slot === "manos" ? HAND_SHAPES[av.tierIndex % HAND_SHAPES.length] : null;
    return {
      id: `${av.id}-acc${i}`,
      avatarId: av.id,
      slot,
      index: i,
      poolIndex: poolIdx,
      handShape,
      name: ACCESSORY_NAMES[av.id][i],
      price,
      note: slot === "manos" ? SLOT_NOTE["manos-x"] : SLOT_NOTE[`${slot}-${poolIdx}`] || "",
    };
  });
}

export const AVATAR_ACCESSORIES: Record<string, Accessory[]> = {};
AVATARS.forEach((av) => {
  AVATAR_ACCESSORIES[av.id] = buildAccessories(av);
});

export function findAvatar(id: string): Avatar | undefined {
  return AVATARS.find((a) => a.id === id);
}
export function findAccessory(id: string): Accessory | undefined {
  for (const av of AVATARS) {
    const acc = AVATAR_ACCESSORIES[av.id].find((a) => a.id === id);
    if (acc) return acc;
  }
  return undefined;
}
export function prevAvatar(av: Avatar): Avatar | undefined {
  if (av.special || av.tierIndex === 0) return undefined;
  return AVATARS[av.tierIndex - 1];
}
