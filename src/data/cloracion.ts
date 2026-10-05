// Datos y lógica pura de "El Gotero Preciso: Cloración Segura".
// Igual que guardianRio.ts, todo lo testeable sin React vive acá: fuentes de
// agua con su ritmo de clorado, envases, turbidez, fases y el puntaje final.
//
// La regla de oro que el juego enseña: el cloro no se dosifica "a ojo", se
// calcula a partir del volumen y de dónde salió el agua. Si el juego te dice
// cuántas gotas hacer, el jugador nunca calcula nada — por eso acá el número de
// gotas NO se muestra: se deduce.

export type WaterSourceId = "red" | "pozo" | "embotellada";

export interface WaterSource {
  id: WaterSourceId;
  nombre: string;
  emoji: string;
  /** Gotas por litro de hipoclorito. `null` = no se clora (se hierve o se usa SODIS). */
  gotasPorLitro: number | null;
  /** Qué hacer cuando no se clora. */
  alternativa: string;
  nota: string;
}

export const WATER_SOURCES: readonly WaterSource[] = [
  {
    id: "red",
    nombre: "Agua de red",
    emoji: "🚰",
    gotasPorLitro: 2,
    alternativa: "",
    nota: "Viene tratada, pero al llegar a la casa hay que reforzar el cloro.",
  },
  {
    id: "pozo",
    nombre: "Agua de pozo",
    emoji: "🕳️",
    gotasPorLitro: 5,
    alternativa: "",
    nota: "No tiene cloro previo: necesita más dosis que el agua de red.",
  },
  {
    id: "embotellada",
    nombre: "Agua embotellada",
    emoji: "🧴",
    gotasPorLitro: null,
    alternativa: "Hervirla o dejarla al sol con SODIS",
    nota: "Si no está expirada, no se clora: el cloro la arruina y no aporta nada.",
  },
];

export const SOURCE_BY_ID: Record<WaterSourceId, WaterSource> = Object.fromEntries(
  WATER_SOURCES.map((s) => [s.id, s]),
) as Record<WaterSourceId, WaterSource>;

// ======================================================================
// Envases — liters es la única medida que el juego revela. El jugador
// multiplica. El tope de 40 gotas del tapón real es lo que acota el bidón.
// ======================================================================

export type ContainerId = "jarra" | "balde" | "bidon";

export interface Container {
  id: ContainerId;
  label: string;
  emoji: string;
  liters: number;
}

// Sin la taza de 0,25 L: la dosis daba 1 gota y el gotero a 260 ms se leía
// como un parpadeo, no como una dosificación. El mínimo es la jarra de 1 L,
// que sí da 2 o 5 gotas — una decisión, no una adivinanza.
export const CONTAINERS: readonly Container[] = [
  { id: "jarra", label: "Jarra", emoji: "🏺", liters: 1 },
  { id: "balde", label: "Balde", emoji: "🥣", liters: 5 },
  { id: "bidon", label: "Bidón azul", emoji: "🛢️", liters: 20 },
];

export const CONTAINER_BY_ID: Record<ContainerId, Container> = Object.fromEntries(
  CONTAINERS.map((c) => [c.id, c]),
) as Record<ContainerId, Container>;

/**
 * El tapón de hipoclorito da hasta 40 gotas por aplicación: una cita, 20 L de
 * agua de red. Referencia real — el juego no lo limitaba, era el dato que
 * justificaba por qué el bidón era el envase más grande del catálogo.
 */
export const TOPE_GOTAS = 40;

// ======================================================================
// Dosis — el corazón del juego. Un agua turbia necesita el doble porque el
// cloro se consume antes de desinfectar (ésta es la razón real del filtrado).
// ======================================================================

/** Cuántas gotas exige un envase. Es lo que el jugador tiene que deducir. */
export function gotasRequeridas(
  litros: number,
  gotasPorLitro: number,
  turbia: boolean,
  filtrada: boolean,
): number {
  const factor = turbia && !filtrada ? 2 : 1;
  return Math.round(litros * gotasPorLitro * factor);
}

/** Verdicto de la dosificación. `0` es dosis exacta. */
export type DosisVeredicto = "perfecta" | "subdosis" | "sobredosis";

export function evaluarDosis(gotas: number, requeridas: number): DosisVeredicto {
  if (gotas === requeridas) return "perfecta";
  return gotas < requeridas ? "subdosis" : "sobredosis";
}

// ======================================================================
// Ritmo del gotero — un bidón de 20 L no puede ser 6 segundos de dedo
// quieto ni la jarra un parpadeo. El intervalo se deriva de cuántas gotas
// hay que poner para que todos los envases duren ~2 s de sostenida, con
// piso y techo para que siga siendo medible.
// ======================================================================

export const HOLD_TARGET_MS = 2000;
export const MIN_DROP_INTERVAL_MS = 45;
export const MAX_DROP_INTERVAL_MS = 260;

/** Milisegundos entre gota y gota para una dosis de N gotas. */
export function dropIntervalMs(gotas: number): number {
  if (gotas <= 0) return MAX_DROP_INTERVAL_MS;
  const raw = HOLD_TARGET_MS / gotas;
  return Math.round(Math.min(MAX_DROP_INTERVAL_MS, Math.max(MIN_DROP_INTERVAL_MS, raw)));
}

/**
 * Ventana para resolver el envase: lo que tarda la dosis completa más un
 * margen. Sin esto el bidón (40 gotas a 45 ms = 1.8 s) y la jarra (2 gotas a
 * 260 ms) con el mismo timeout fijo serían justo o imposible según el caso.
 */
export function timeoutMs(gotasRequeridasCount: number): number {
  const goteo = gotasRequeridasCount * dropIntervalMs(gotasRequeridasCount);
  return goteo + 2500;
}

// ======================================================================
// Color del agua — lo que el jugador ve al final. Es la única forma de
// saber si le salió bien sin leer el número.
// ======================================================================

export const WATER_COLOR: Record<DosisVeredicto, { fondo: string; etiqueta: string; texto: string }> = {
  perfecta: { fondo: "#BFE3F0", etiqueta: "Agua limpia", texto: "text-ink" },
  subdosis: { fondo: "#8FA36B", etiqueta: "Turbia — sin desinfectar", texto: "text-ink" },
  sobredosis: { fondo: "#C9D96B", etiqueta: "Amarilla y con sabor", texto: "text-ink" },
};

// ======================================================================
// Fases — la curva de dificultad. La turbidez aparece desde la segunda
// fase a propósito: juntarla con la decisión de dosis desde el segundo 0
// es demasiada carga cognitiva.
// ======================================================================

export type CloracionPhaseId = "manana" | "tarde" | "emergencia";

export interface CloracionPhase {
  id: CloracionPhaseId;
  nombre: string;
  descripcion: string;
  /** Qué envases pueden salir en esta fase. */
  containers: readonly ContainerId[];
  sources: readonly WaterSourceId[];
  /** Probabilidad de que el agua venga turbia. */
  turbidez: number;
}

export const CLORACION_PHASES: readonly CloracionPhase[] = [
  {
    id: "manana",
    nombre: "Mañana",
    descripcion: "Jarra o balde de red, siempre clara",
    containers: ["jarra", "balde"],
    sources: ["red"],
    turbidez: 0,
  },
  {
    id: "tarde",
    nombre: "Tarde",
    descripcion: "Entran bidones y agua turbia",
    containers: ["jarra", "balde", "bidon"],
    sources: ["red", "pozo"],
    turbidez: 0.45,
  },
  {
    id: "emergencia",
    nombre: "Emergencia",
    descripcion: "Se complica: más turbidez y agua embotellada",
    containers: ["balde", "bidon"],
    sources: ["pozo", "embotellada"],
    turbidez: 0.55,
  },
];

export function phaseAt(elapsed: number, duration: number): CloracionPhase {
  const ratio = duration > 0 ? elapsed / duration : 0;
  if (ratio < 1 / 3) return CLORACION_PHASES[0];
  if (ratio < 2 / 3) return CLORACION_PHASES[1];
  return CLORACION_PHASES[2];
}

// ======================================================================
// Sorteo de un caso — siempre cae un envase y una fuente, y la turbidez
// se sortea por la probabilidad de la fase.
// ======================================================================

export interface CasoCloracion {
  container: Container;
  source: WaterSource;
  turbia: boolean;
}

export function sortearCaso(phase: CloracionPhase, random: () => number = Math.random): CasoCloracion {
  const container = CONTAINER_BY_ID[phase.containers[Math.floor(random() * phase.containers.length)]];
  const source = SOURCE_BY_ID[phase.sources[Math.floor(random() * phase.sources.length)]];
  const turbia = random() < phase.turbidez;
  return { container, source, turbia };
}

/**
 * Arranque de la partida: los tres primeros casos van en ciclo, uno de cada
 * tamaño (1 L, 5 L, 20 L), ignorando el sorteo y la fase.
 *
 * Antes el juego arrancaba con la fase "manana", que sólo sorteaba jarras de
 * 1 L durante los primeros 20 s. Un jugador que tarda 8-10 s en resolver cada
 * caso veía 1 L, 1 L y 1 L y cerraba la partida creyendo que el juego era de
 * un solo envase. Con el ciclo los tres tamaños aparecen en los primeros 15 s.
 */
export function primerCaso(index: number): CasoCloracion {
  const orden: readonly ContainerId[] = ["jarra", "balde", "bidon"];
  const container = CONTAINER_BY_ID[orden[index % orden.length]];
  const source = SOURCE_BY_ID.red;
  return { container, source, turbia: false };
}

// ======================================================================
// Decisiones del jugador. Son las dos pantallas que agregarón la
// dificultad real: el ritmo y el filtrado previo.
// ======================================================================

export type RitmoId = "red" | "pozo" | "ninguno";

export const RITMOS: readonly { id: RitmoId; etiqueta: string }[] = [
  { id: "red", etiqueta: "2 gotas por litro" },
  { id: "pozo", etiqueta: "5 gotas por litro" },
  { id: "ninguno", etiqueta: "No clorar" },
];

export function gotasDeRitmo(ritmo: RitmoId): number | null {
  if (ritmo === "red") return 2;
  if (ritmo === "pozo") return 5;
  return null;
}

/**
 * ¿Tiene sentido clorar esta fuente con este ritmo? El agua embotellada ya
 * viene tratada: cualquier dosis de cloro la arruina, así que la única
 * respuesta correcta es "no clorar". Sin esta comprobación, dosificar el
 * bidón embotellado "en perfecto" premiaría el error.
 */
export function dosisApta(source: WaterSource, ritmo: RitmoId): boolean {
  if (source.gotasPorLitro === null) return ritmo === "ninguno";
  return ritmo !== "ninguno";
}

// ======================================================================
// Puntaje — RECALIBRADO.
//
// La primera versión hacía `eficiencia × multiplicador`, y eso estaba roto:
// 4 aciertos seguidos daban 1.0 × 2 = 2 → recortado a 1, o sea 100
// HydroPuntos con 4 aciertos de una partida de 60s. El multiplicador no
// escalaba nada, sólo aceleraba el tope.
//
// Ahora la eficiencia se queda en 80% del score y el combo aporta el 20%
// restante. Consecuencia: una partida perfecta sin racha larga (0.8) NO
// llega al tope, y una partida con algún error pero racha de 7+ la alcanza
// o la pasa. El combo tiene que valer algo sin ser atajo.
// ======================================================================

export const COMBO_MINIMO = 4;
export const COMBO_ALTO = 7;

/** Techo de la eficiencia dentro del score: el resto lo gana el combo. */
export const PESO_ESTRUCTURA = 0.8;

/** Multiplicador mostrable en el HUD. Ya no altera el score por sí solo. */
export function comboMultiplier(combo: number): number {
  if (combo >= COMBO_ALTO) return 3;
  if (combo >= COMBO_MINIMO) return 2;
  return 1;
}

/** Fracción del score que aporta la racha: 0 / 0.08 / 0.2. */
export function comboShare(combo: number): number {
  if (combo >= COMBO_ALTO) return 0.2;
  if (combo >= COMBO_MINIMO) return 0.08;
  return 0;
}

/**
 * Score final: eficiencia (hasta 80%) + racha (hasta 20%), recortado a 1.
 * Para ganar hay que pasar 62,5% de aciertos (0.5 / 0.8), porque
 * calcMinigameScore corta en 0,5.
 */
export function calcCloracionScore(perfect: number, attempts: number, bestCombo: number): number {
  const eficiencia = attempts > 0 ? perfect / attempts : 0;
  const bruto = eficiencia * PESO_ESTRUCTURA + comboShare(bestCombo);
  return Math.min(1, Math.max(0, bruto));
}