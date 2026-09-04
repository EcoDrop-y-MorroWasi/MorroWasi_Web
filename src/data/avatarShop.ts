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

// 9 mujeres (modelo "slim") + 2 varones (modelo "default"), cada uno con look propio,
// alineados a las 10 etapas reales del Wasi (src/data/mock.ts WASI_STAGES).
const AVATAR_SEED: AvatarSeed[] = [
  { id: "yamile", name: "Yamile", gender: "f", hair: "#241a14", skin: "#f6d3a8", hairStyle: "coleta", eye: "#8a5a2e", shirtStyle: "vneck" },
  { id: "camila", name: "Camila", gender: "f", hair: "#3b2417", skin: "#e0ad75", hairStyle: "chongo", eye: "#6b4a2b", shirtStyle: "collar" },
  { id: "mateo", name: "Mateo", gender: "m", hair: "#241a14", skin: "#c48952", hairStyle: "corto", eye: "#5c3a22", shirtStyle: "basic" },
  { id: "valentina", name: "Valentina", gender: "f", hair: "#6b3a1f", skin: "#8b5a34", hairStyle: "largo", eye: "#5a3d22", shirtStyle: "vneck" },
  { id: "fiorella", name: "Fiorella", gender: "f", hair: "#241a14", skin: "#f6d3a8", hairStyle: "bob", eye: "#4a2f1c", shirtStyle: "collar", streak: "#3fb0a8" },
  { id: "xiomara", name: "Xiomara", gender: "f", hair: "#241a14", skin: "#5c3a22", hairStyle: "afro", eye: "#8a5a2e", shirtStyle: "vneck" },
  { id: "joaquin", name: "Joaquín", gender: "m", hair: "#3b2417", skin: "#e0ad75", hairStyle: "rapado", eye: "#6b4423", shirtStyle: "tank" },
  { id: "milagros", name: "Milagros", gender: "f", hair: "#6b3a1f", skin: "#c48952", hairStyle: "colitas", eye: "#a67c3d", shirtStyle: "collar" },
  { id: "antonella", name: "Antonella", gender: "f", hair: "#241a14", skin: "#f6d3a8", hairStyle: "colaAlta", eye: "#42301f", shirtStyle: "vneck", streak: "#e07fb0" },
  { id: "rosa", name: "Rosa", gender: "f", hair: "#3b2417", skin: "#8b5a34", hairStyle: "trenza", eye: "#7a4a26", shirtStyle: "dress" },
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
  id: "nayeli",
  name: "Nayeli",
  gender: "f",
  model: "slim",
  tierIndex: 10,
  stage: null,
  special: true,
  skin: "#5c3a22",
  hairColor: "#fff6df",
  hairStyle: "trenzaDorada",
  eyeColor: "#8a6a2e",
  shirt: "#3a2c1c",
  pants: "#2a2015",
  accent: "#FFCB3F",
  shirtStyle: "dress",
  unlockLabel: "Guardiana Dorada — logro secreto",
});

export const SPECIAL_LOOKS: Record<string, { title: string; type: string }> = {
  yamile: { title: "Poncho de la Primera Lluvia", type: "poncho" },
  camila: { title: "Vestido Semilla en Flor", type: "gala" },
  mateo: { title: "Traje Guardián de Duna", type: "explorer" },
  valentina: { title: "Manto Jardín de Duna", type: "garden" },
  fiorella: { title: "Chaqueta Oasis Temprano", type: "aqua" },
  xiomara: { title: "Túnica Refugio Verde", type: "ranger" },
  joaquin: { title: "Uniforme del Chira", type: "ceremonial" },
  milagros: { title: "Falda Bosque Seco", type: "ruffles" },
  antonella: { title: "Capa Santuario Hídrico", type: "sanctuary" },
  rosa: { title: "Vestido Oasis Sagrado", type: "royal" },
  nayeli: { title: "Manto de la Guardiana Dorada", type: "guardian" },
};

// Tipos de skin especial cuya prenda es un manto/capa: además de repintar la
// skin, se les cuelga una capa real (geometría 3D) del skinview3d.
export const SPECIAL_CAPE_TYPES = new Set(["garden", "sanctuary", "guardian"]);

export const HAND_SHAPES = ["regadera", "balde", "libro", "vara"] as const;

const SLOT_POOL_SIZE: Record<Exclude<AccessorySlot, "manos">, number> = {
  cabeza: 3,
  cara: 2,
  pecho: 2,
  espalda: 2,
  piernas: 2,
};

const SLOT_ORDER: AccessorySlot[] = ["cabeza", "cabeza", "cara", "cara", "pecho", "pecho", "espalda", "espalda", "piernas", "piernas", "manos"];
export const SLOT_LABELS: Record<AccessorySlot, string> = { cabeza: "Cabeza", cara: "Cara", pecho: "Pecho", espalda: "Espalda", piernas: "Piernas", manos: "Manos" };
const SLOT_NOTE: Record<string, string> = { "espalda-0": "capa real puesta sobre la espalda del modelo 3D", "manos-x": "se ve como guante de color en ambas manos del modelo 3D" };

const NAME_BASE: Record<AccessorySlot, string[]> = {
  cabeza: ["Sombrero", "Gorro", "Corona", "Vincha", "Chullo", "Capucha", "Tocado"],
  cara: ["Gafas", "Antifaz", "Visera", "Lentes"],
  pecho: ["Chaleco", "Medalla", "Poncho", "Banda", "Insignia"],
  espalda: ["Capa", "Mochila", "Manto", "Alforja"],
  piernas: ["Botas", "Vendas", "Ojotas", "Polainas"],
  manos: ["Regadera", "Balde", "Libro sagrado", "Vara de sauce"],
};
const NAME_DESC = ["de paja", "de algarrobo", "piurano", "de feria", "tejido", "de dunas", "del río Chira", "de sol", "artesanal", "de coral", "de mangle", "de Catacaos", "de Sechura", "del tondero", "de langostino", "dorado", "de sal marina", "de totora"];

function accName(slot: AccessorySlot, seed: number, i: number): string {
  if (slot === "manos") return `${NAME_BASE.manos[i % NAME_BASE.manos.length]} ${NAME_DESC[(seed * 3 + 7) % NAME_DESC.length]}`;
  const base = NAME_BASE[slot];
  const b = base[seed % base.length];
  const d = NAME_DESC[(seed * 3 + 7) % NAME_DESC.length];
  return `${b} ${d}`;
}

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
      name: accName(slot, av.tierIndex * 11 + i, av.tierIndex),
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
