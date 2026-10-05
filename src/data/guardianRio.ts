// Datos y lógica pura del minijuego "Guardián del Río Piura y Manglares".
// Todo lo que se puede testear sin React vive acá: el catálogo de especies, las
// tres fases del río y el selector de qué cae del agua.

export type RiverKind = "trash" | "fauna";

export interface RiverSpecies {
  id: string;
  kind: RiverKind;
  emoji: string;
  nombre: string;
  /** Dato educativo que se revela al clasificar bien, una sola vez. */
  dato: string;
}

/** Especies del humedal del Chira, del río Piura y del manglar de Tumbes/Paita. */
export const RIVER_SPECIES: readonly RiverSpecies[] = [
  // ---- Fauna: se dejan pasar hacia la izquierda ----
  { id: "peces", kind: "fauna", emoji: "🐟", nombre: "Peces del Chira", dato: "El Chira alimenta la acuicultura de la región: trucha, tilapia y paiche." },
{ id: "chiro", kind: "fauna", emoji: "🐠", nombre: "Chiro", dato: "Pez tropical del Chira, se reproduce en los pedregales del cauce." },
  { id: "patos", kind: "fauna", emoji: "🦆", nombre: "Patos", dato: "Anidan en los totorales; sus huevos son parte del alimento local." },
  { id: "garzas", kind: "fauna", emoji: "🕊️", nombre: "Garzas", dato: "Cazan peces someros en la orilla y son indicadoras de agua limpia." },
  { id: "flamenco", kind: "fauna", emoji: "🦩", nombre: "Flamenco", dato: "Vive en las lagunas salobres del norte; su plumaje rosa viene de los crustáceos." },
  { id: "cangrejo", kind: "fauna", emoji: "🦀", nombre: "Cangrejo de mangle", dato: "Entierra hojas en el fango; sus galerías airean el suelo del manglar." },
  { id: "tortugas", kind: "fauna", emoji: "🐢", nombre: "Tortuga", dato: "Puede vivir décadas; necesita zonas de mangle intactas para anidar." },
  { id: "nutria", kind: "fauna", emoji: "🦦", nombre: "Nutria", dato: "Depredador tope del río: si desaparece, el ecosistema se desbalancea." },
  { id: "guacamayo", kind: "fauna", emoji: "🦜", nombre: "Guacamayo", dato: "Es una especie protegida: su captura y venta están prohibidas." },
  { id: "ranas", kind: "fauna", emoji: "🐸", nombre: "Ranas de charca", dato: "Su piel respira por la piel: el agua contaminada las quema primero." },

  // ---- Manglares: raíces filtradoras, también se dejan pasar ----
  { id: "mangle-rojo", kind: "fauna", emoji: "🌳", nombre: "Mangle rojo", dato: "Sus raíces en arco filtran la sal: es el refugio de los peces juveniles." },
  { id: "mangle-negro", kind: "fauna", emoji: "🌲", nombre: "Mangle negro", dato: "Posee raíces aéreas tipo respiradero para tomar oxígeno en marea baja." },
  { id: "lameiche", kind: "fauna", emoji: "🌴", nombre: "Lameiche", dato: "Manglar típico del norte; tolera la sal mejor que el mangle rojo." },
  { id: "totora", kind: "fauna", emoji: "🎋", nombre: "Totora", dato: "Filtra nutrientes y frena el río: puente natural entre el agua y la orilla." },

  // ---- Basura: se reciclan hacia la derecha ----
  { id: "botella-pet", kind: "trash", emoji: "🥤", nombre: "Botella PET", dato: "Es el residuo más abundante del río Piura y tarda siglos en degradarse." },
  { id: "bolsa-plastico", kind: "trash", emoji: "🛍️", nombre: "Bolsa plástica", dato: "Entra por el cloacal y sale al mar: llega hasta los manglares." },
  { id: "lata", kind: "trash", emoji: "🥫", nombre: "Lata", dato: "El aluminio se recicla infinitas veces sin perder calidad." },
  { id: "botella-plastico", kind: "trash", emoji: "🧴", nombre: "Envase de plástico", dato: "Es plástico de un solo uso y casi nunca llega al reciclaje formal." },
  { id: "carton", kind: "trash", emoji: "📦", nombre: "Cartón", dato: "Se degrada con el agua del río y ahoga a los peces." },
  { id: "llanta", kind: "trash", emoji: "🛞", nombre: "Llanta", dato: "Libera zinc y lateinit: contaminan el agua a largo plazo." },
  { id: "pila", kind: "trash", emoji: "🔋", nombre: "Pila", dato: "Una sola pila puede contaminar hasta miles de litros si se tira al río." },
  { id: "esmog", kind: "trash", emoji: "🌫️", nombre: "Humo de tubo", dato: "Llegan por el tubo de escape y acidifican el agua." },
];

export const SPECIES_BY_ID: Record<string, RiverSpecies> = Object.fromEntries(
  RIVER_SPECIES.map((s) => [s.id, s]),
);

export const TOTAL_SPECIES = RIVER_SPECIES.length;

// ======================================================================
// Fases — la curva de dificultad del río. Cada fase es una ventana de
// tiempo (ratio del elapsed sobre la duración total) con su propio ritmo de
// spawn, vida de cada objeto y mezcla basura/fauna.
// ======================================================================

export type RiverPhaseId = "manana" | "crecida" | "sequia";

export interface RiverPhase {
  id: RiverPhaseId;
  nombre: string;
  /** Texto corto de lo que está pasando, se muestra arriba del río. */
  descripcion: string;
  /** Milisegundos entre aparición de cada objeto. */
  spawnMs: number;
  /** Milisegundos que tarda un objeto en llegar al final del cauce. */
  lifespanMs: number;
  /** Probabilidad de que caiga basura (el resto, fauna o manglar). */
  trashChance: number;
  /** Velocidad del agua de fondo, para que el cambio de fase se note. */
  waterHue: string;
}

export const RIVER_PHASES: readonly RiverPhase[] = [
  {
    id: "manana",
    nombre: "Mañana",
    descripcion: "Río tranquilo, poca basura",
    spawnMs: 1500,
    lifespanMs: 5200,
    trashChance: 0.5,
    waterHue: "from-[#99B4D8]/40 to-[#99B4D8]/10",
  },
  {
    id: "crecida",
    nombre: "Crecida",
    descripcion: "Sube el caudal: llega más rápido",
    spawnMs: 1050,
    lifespanMs: 4400,
    trashChance: 0.68,
    waterHue: "from-[#6E93C4]/50 to-[#6E93C4]/15",
  },
  {
    id: "sequia",
    nombre: "Sequía",
    descripcion: "Poco agua: se ve la vida que se esconde",
    spawnMs: 1250,
    lifespanMs: 4800,
    trashChance: 0.4,
    waterHue: "from-[#C4A67E]/45 to-[#C4A67E]/15",
  },
];

/**
 * Devuelve la fase según cuánto de la partida ya pasó. Ratio, no segundos
 * fijos: así el mismo código sirve si `duration` cambia de 60 a 90 segundos.
 */
export function phaseAt(elapsed: number, duration: number): RiverPhase {
  const ratio = duration > 0 ? elapsed / duration : 0;
  if (ratio < 1 / 3) return RIVER_PHASES[0];
  if (ratio < 2 / 3) return RIVER_PHASES[1];
  return RIVER_PHASES[2];
}

/** Elige el siguiente objeto del cauce según la mezcla de la fase. */
export function pickSpecies(phase: RiverPhase, random: () => number = Math.random): RiverSpecies {
  const wantTrash = random() < phase.trashChance;
  const pool = RIVER_SPECIES.filter((s) => s.kind === (wantTrash ? "trash" : "fauna"));
  return pool[Math.floor(random() * pool.length)];
}

/** Probabilidad de aparecer en pantalla, para el spawn del cauce. */
export function pickLaneX(random: () => number = Math.random): number {
  return random() * 70 + 15;
}