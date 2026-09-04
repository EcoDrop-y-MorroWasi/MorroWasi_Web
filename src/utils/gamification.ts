// Utilidades de gamificación — AGENTS.md:224
// Fórmulas validadas: se testean con npm run build + lógica unitaria inline

/** Calcula XP para misión personalizada: round(litros/3) acotado 5-40 */
export function calcCustomXp(litros: number): number {
  const raw = Math.round(litros / 3);
  return Math.max(5, Math.min(40, raw));
}

/** Suma con clamp >=0, para revertir sin bajar de 0 */
export function addClamped(current: number, delta: number): number {
  return Math.max(0, current + delta);
}

/** RN-16: XP de minijuego = clamp(round(30 + accuracy × 70), 30, 100).
 * Cada motor entrega accuracy en [0,1]; Juegos.tsx solo acredita el XP si supera bestScore. */
export function calcMinigameScore(accuracy: number): number {
  const safeAccuracy = Math.max(0, Math.min(1, accuracy));
  return Math.round(Math.max(30, Math.min(100, 30 + safeAccuracy * 70)));
}

/** Tipos de misión / juego */
export type TaskCategory = "ducha" | "lavanderia" | "riego" | "cocina" | "fugas" | "otros";
export type MinigameType =
  | "FUGAS_DETECT"
  | "HUELLA_HIDRICA"
  | "COSECHA_LLUVIA"
  | "RIEGO_OPT"
  | "FILTROS_LAB"
  | "RUTAS_AGUAS"
  | "SODIS_UV"
  | "GUARDIAN_RIO"
  | "DUCHA_MUSICAL"
  | "CORTE_AGUA"
  | "ACUIFERO_ALGARROBO"
  | "CLORACION_SEGURA";

export interface Task {
  id: string;
  text: string;
  description?: string;
  litersSaved: number;
  xp: number;
  completed: boolean;
  category: TaskCategory;
  tab: "diaria" | "semanal" | "mensual" | "personalizada";
  /** Misión vinculada al progreso de Academia (cursos/lecciones) — UI_UX_Guide.md:3 */
  linkedToCourses?: boolean;
}

export interface Minigame {
  id: string;
  title: string;
  description: string;
  type: MinigameType;
  xpMaxReward: number; // 30-100
  durationSeconds: number; // 60 o 90 — UI_UX_Guide.md:4.1
  videoIntroUri: string | null;
  played?: boolean;
  bestScore?: number;
}

// Pool de 28 misiones diarias únicas (contexto Morropón/Piura: chacra, algarrobo,
// tanque/cisterna, animales menores, corte de agua). Se agrupan en 7 bloques de 4
// (uno "por defecto" para cada día de la semana) y rotan semana a semana — ver
// getMisionesDiariasDeHoy(). Con esto un mismo día de la semana nunca repite el
// mismo set de 4 misiones dos semanas seguidas.
export const MISIONES_DIARIAS_POOL: Omit<Task, "completed">[] = [
  // Bloque 0
  { id: "diaria-01", text: "Revisa el caño y las mangueras del patio antes de empezar el día", litersSaved: 15, xp: 5, category: "fugas", tab: "diaria" },
  { id: "diaria-02", text: "Riega el almácigo con agua reusada de la cocina", litersSaved: 25, xp: 8, category: "riego", tab: "diaria" },
  { id: "diaria-03", text: "Lava los platos con el caño cerrado entre enjuagues", litersSaved: 20, xp: 7, category: "cocina", tab: "diaria" },
  { id: "diaria-04", text: "Báñate en 5 minutos aprovechando el agua tibia del tanque", litersSaved: 30, xp: 10, category: "ducha", tab: "diaria" },
  // Bloque 1
  { id: "diaria-05", text: "Junta el agua de enjuagar la ropa para el corral", litersSaved: 35, xp: 12, category: "lavanderia", tab: "diaria" },
  { id: "diaria-06", text: "Dale agua reusada de cocinar a las cabras o gallinas", litersSaved: 18, xp: 6, category: "otros", tab: "diaria" },
  { id: "diaria-07", text: "Revisa el tanque elevado o cisterna antes del reparto", litersSaved: 22, xp: 7, category: "fugas", tab: "diaria" },
  { id: "diaria-08", text: "Cierra bien el caño de la pileta después de lavarte las manos", litersSaved: 10, xp: 5, category: "fugas", tab: "diaria" },
  // Bloque 2
  { id: "diaria-09", text: "Riega las plantas del patio al atardecer, no al mediodía", litersSaved: 20, xp: 7, category: "riego", tab: "diaria" },
  { id: "diaria-10", text: "Lava las verduras en un recipiente, no con el caño abierto", litersSaved: 15, xp: 5, category: "cocina", tab: "diaria" },
  { id: "diaria-11", text: "Usa un balde en vez de manguera para lavar el carro o la moto", litersSaved: 40, xp: 13, category: "otros", tab: "diaria" },
  { id: "diaria-12", text: "Enjabona toda la ropa antes de abrir el caño para enjuagar", litersSaved: 30, xp: 10, category: "lavanderia", tab: "diaria" },
  // Bloque 3
  { id: "diaria-13", text: "Revisa si el bidón o la tinaja de agua tiene alguna fuga", litersSaved: 12, xp: 5, category: "fugas", tab: "diaria" },
  { id: "diaria-14", text: "Recoge el agua fría del inicio de la ducha en un balde para el patio", litersSaved: 15, xp: 5, category: "ducha", tab: "diaria" },
  { id: "diaria-15", text: "Riega el huerto familiar con agua de lluvia guardada, si hay", litersSaved: 35, xp: 12, category: "riego", tab: "diaria" },
  { id: "diaria-16", text: "Apila los trastes de la cocina y enjuágalos todos juntos, no uno por uno", litersSaved: 25, xp: 8, category: "cocina", tab: "diaria" },
  // Bloque 4
  { id: "diaria-17", text: "Comparte con tu familia un truco de ahorro de agua que aprendiste", litersSaved: 10, xp: 5, category: "otros", tab: "diaria" },
  { id: "diaria-18", text: "Revisa las conexiones de la manguera del riego por goteo", litersSaved: 18, xp: 6, category: "fugas", tab: "diaria" },
  { id: "diaria-19", text: "Usa el agua de cocinar los alimentos, ya fría, para regar las plantas", litersSaved: 22, xp: 7, category: "riego", tab: "diaria" },
  { id: "diaria-20", text: "Lávate los dientes con el caño cerrado", litersSaved: 8, xp: 5, category: "otros", tab: "diaria" },
  // Bloque 5
  { id: "diaria-21", text: "Baña a los animales menores con agua reusada, no del caño directo", litersSaved: 28, xp: 9, category: "otros", tab: "diaria" },
  { id: "diaria-22", text: "Reutiliza el agua vieja del bebedero de animales para regar", litersSaved: 20, xp: 7, category: "otros", tab: "diaria" },
  { id: "diaria-23", text: "Revisa el techo o la canaleta para aprovechar el agua de lluvia", litersSaved: 15, xp: 5, category: "otros", tab: "diaria" },
  { id: "diaria-24", text: "Lava toda la ropa de trabajo del campo en una sola tanda, no varias veces", litersSaved: 40, xp: 13, category: "lavanderia", tab: "diaria" },
  // Bloque 6
  { id: "diaria-25", text: "Riega los algarrobos o árboles frutales con agua reusada del hogar", litersSaved: 45, xp: 15, category: "riego", tab: "diaria" },
  { id: "diaria-26", text: "Cocina con la olla tapada para no gastar agua extra al hervir", litersSaved: 12, xp: 5, category: "cocina", tab: "diaria" },
  { id: "diaria-27", text: "Revisa que el flotador del tanque no esté botando agua", litersSaved: 20, xp: 7, category: "fugas", tab: "diaria" },
  { id: "diaria-28", text: "Guarda el agua de lluvia de la noche anterior en baldes para el día siguiente", litersSaved: 30, xp: 10, category: "otros", tab: "diaria" },
];

// Pool de 16 misiones semanales únicas, agrupadas en 4 bloques de 4. Rotan por
// semana del mes — ver getMisionesSemanalesDeEstaSemana() — así el mes completo
// pasa por las 16 sin repetir el mismo bloque dos semanas seguidas.
export const MISIONES_SEMANALES_POOL: Omit<Task, "completed">[] = [
  // Bloque 0
  { id: "semanal-01", text: "Limpia el filtro SODIS o casero de la familia", litersSaved: 40, xp: 13, category: "otros", tab: "semanal" },
  { id: "semanal-02", text: "Revisa el reservorio buscando grietas antes del corte de agua programado", litersSaved: 50, xp: 17, category: "fugas", tab: "semanal" },
  { id: "semanal-03", text: "Riega la chacra o huerto de madrugada o al atardecer", litersSaved: 60, xp: 20, category: "riego", tab: "semanal" },
  { id: "semanal-04", text: "Junta agua de lluvia en baldes o cilindros en temporada de lluvia", litersSaved: 80, xp: 27, category: "otros", tab: "semanal" },
  // Bloque 1
  { id: "semanal-05", text: "Organiza el lavado de ropa familiar en una sola tanda a la semana", litersSaved: 70, xp: 23, category: "lavanderia", tab: "semanal" },
  { id: "semanal-06", text: "Enséñale a un vecino un truco de ahorro de agua", litersSaved: 30, xp: 10, category: "otros", tab: "semanal" },
  { id: "semanal-07", text: "Revisa las tuberías y conexiones de toda la casa buscando fugas ocultas", litersSaved: 55, xp: 18, category: "fugas", tab: "semanal" },
  { id: "semanal-08", text: "Limpia el bebedero y el tanque de los animales sin desperdiciar agua", litersSaved: 45, xp: 15, category: "otros", tab: "semanal" },
  // Bloque 2
  { id: "semanal-09", text: "Prepara una reserva de agua para el día de corte programado en la semana", litersSaved: 90, xp: 30, category: "otros", tab: "semanal" },
  { id: "semanal-10", text: "Poda o limpia el huerto para que el riego rinda más", litersSaved: 40, xp: 13, category: "riego", tab: "semanal" },
  { id: "semanal-11", text: "Revisa el estado del caño principal de la casa y la conexión al reservorio", litersSaved: 35, xp: 12, category: "fugas", tab: "semanal" },
  { id: "semanal-12", text: "Reutiliza el agua de lavar la ropa de toda la semana para el riego del patio", litersSaved: 65, xp: 22, category: "lavanderia", tab: "semanal" },
  // Bloque 3
  { id: "semanal-13", text: "Organiza con la familia un día de cero desperdicio de agua", litersSaved: 50, xp: 17, category: "otros", tab: "semanal" },
  { id: "semanal-14", text: "Revisa el sistema de riego por goteo casero y repara fugas", litersSaved: 55, xp: 18, category: "riego", tab: "semanal" },
  { id: "semanal-15", text: "Enseña a los niños de la casa a cerrar bien los caños", litersSaved: 20, xp: 7, category: "otros", tab: "semanal" },
  { id: "semanal-16", text: "Haz un balance semanal de cuánta agua ahorró la familia", litersSaved: 35, xp: 12, category: "otros", tab: "semanal" },
];

const DAY_MS = 24 * 60 * 60 * 1000
// Lunes de referencia (ancla arbitraria, solo fija el punto cero de la rotación).
const REFERENCE_MONDAY_UTC = Date.UTC(2026, 0, 5)

function startOfWeekMondayUtc(date: Date): number {
  const dayIndex = (date.getDay() + 6) % 7 // 0=lunes ... 6=domingo
  const midnight = new Date(date)
  midnight.setHours(0, 0, 0, 0)
  return midnight.getTime() - dayIndex * DAY_MS
}

/** Número de semana global, incrementa +1 cada lunes; ancla arbitraria sin significado propio. */
function getWeekIndex(date: Date): number {
  return Math.floor((startOfWeekMondayUtc(date) - REFERENCE_MONDAY_UTC) / (7 * DAY_MS))
}

/** 0=lunes ... 6=domingo */
function getDayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

/**
 * 4 misiones diarias del día indicado (hoy por defecto). El bloque mostrado se
 * desplaza cada semana (día + semana, mod 7), así el mismo día de la semana no
 * repite las mismas 4 misiones dos semanas seguidas, tomando bloques "prestados"
 * de otros días del pool de 28.
 */
export function getMisionesDiariasDeHoy(date: Date = new Date()): Omit<Task, "completed">[] {
  const bloque = ((getDayIndex(date) + getWeekIndex(date)) % 7 + 7) % 7
  return MISIONES_DIARIAS_POOL.slice(bloque * 4, bloque * 4 + 4)
}

/**
 * 4 misiones semanales de la semana indicada (actual por defecto). Ciclo de 4
 * bloques: el mes recorre las 16 misiones sin repetir bloque en semanas seguidas.
 */
export function getMisionesSemanalesDeEstaSemana(date: Date = new Date()): Omit<Task, "completed">[] {
  const bloque = (getWeekIndex(date) % 4 + 4) % 4
  return MISIONES_SEMANALES_POOL.slice(bloque * 4, bloque * 4 + 4)
}

/**
 * Identificador único de "hoy"/"esta semana" — el pool de misiones solo tiene
 * 7/4 bloques, así que un mismo bloque (y por lo tanto los mismos ids) vuelve
 * a aparecer semanas después. Sin esto, marcar una misión como completada por
 * id la deja tildada para siempre la próxima vez que rote ese bloque. Estas
 * claves cambian cada día/semana real, para resetear "completado" junto con
 * el bloque mostrado.
 */
export function getDayPeriodKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function getWeekPeriodKey(date: Date = new Date()): string {
  return String(getWeekIndex(date))
}

// Consejos recordatorio (no otorgan XP/litros) — contexto Morropón/Piura.
const CONSEJOS_DIARIOS = [
  "El agua que usas para lavar arroz o menestras sirve para regar las plantas del patio.",
  "Un goteo constante puede desperdiciar hasta 20 litros al día: revisa tus caños seguido.",
  "Baña a los animales menores con balde, no con manguera abierta.",
  "Riega temprano en la mañana o al atardecer: al mediodía el sol evapora buena parte del agua.",
  "Guarda agua extra antes de un corte de agua programado en tu sector.",
  "Cerrar el caño mientras te enjabonas o te cepillas los dientes ahorra varios litros cada vez.",
  "El agua de lluvia recogida en baldes sirve para el huerto o para limpiar el patio.",
]

const CONSEJOS_SEMANALES = [
  "Revisa el tanque o la cisterna una vez por semana: una grieta pequeña se convierte en una fuga grande.",
  "Organiza el lavado de ropa de toda la familia en un solo día para ahorrar agua y jabón.",
  "Enseña a los más pequeños de la casa a cerrar bien los caños después de usarlos.",
  "Comparte con tus vecinos lo que ahorraste esta semana: la meta del agua se cumple en comunidad.",
]

/** Consejo recordatorio del día, rota igual que el bloque de misiones diarias. */
export function getConsejoDiario(date: Date = new Date()): string {
  const bloque = ((getDayIndex(date) + getWeekIndex(date)) % CONSEJOS_DIARIOS.length + CONSEJOS_DIARIOS.length) % CONSEJOS_DIARIOS.length
  return CONSEJOS_DIARIOS[bloque]
}

/** Consejo recordatorio de la semana, rota igual que el bloque de misiones semanales. */
export function getConsejoSemanal(date: Date = new Date()): string {
  const bloque = (getWeekIndex(date) % CONSEJOS_SEMANALES.length + CONSEJOS_SEMANALES.length) % CONSEJOS_SEMANALES.length
  return CONSEJOS_SEMANALES[bloque]
}

export const MISIONES_MENSUALES: Omit<Task, "completed">[] = [
  {
    id: "men-1",
    text: "Ahorra 1000 L en el mes",
    description: "Acumula 1000 litros ahorrados a lo largo del mes.",
    litersSaved: 1000,
    xp: 150,
    category: "otros",
    tab: "mensual",
  },
  {
    id: "men-2",
    text: "Completa 2 cursos con video",
    description: "Termina 2 cursos completos (todas sus lecciones y quizzes) en la Academia.",
    litersSaved: 0,
    xp: 120,
    category: "otros",
    tab: "mensual",
    linkedToCourses: true,
  },
  {
    id: "men-3",
    text: "Mantén racha de 15 días",
    description: "No dejes pasar ni un día sin al menos una actividad en la app.",
    litersSaved: 0,
    xp: 100,
    category: "otros",
    tab: "mensual",
  },
];

// Catálogo oficial 4 juegos Piura — 30-100 XP, 60-90s, offline-first (UI_UX_Guide.md:4.1)
export const MINIGAMES: Minigame[] = [
  {
    id: "jg-1",
    title: "Caza-Fugas Exprés",
    description:
      "Eres el fontanero guardián de una casa piurana: arrastra la herramienta correcta — 🔧 llave, ⚪ teflón o 🛑 válvula — a cada fuga antes de que se desborde el medidor.",
    type: "FUGAS_DETECT",
    xpMaxReward: 100,
    durationSeconds: 60,
    videoIntroUri: "/videos/mock-fugas.mp4",
  },
  {
    id: "jg-2",
    title: "El Peso Invisible del Agua",
    description:
      "Cara a cara: toca el producto que esconde más litros de agua virtual y encadena combos de aciertos en 60 segundos.",
    type: "HUELLA_HIDRICA",
    xpMaxReward: 100,
    durationSeconds: 60,
    videoIntroUri: "/videos/mock-huella.mp4",
  },
  {
    id: "jg-3",
    title: "Atrapa-Lluvias Piurano",
    description:
      "Conecta las canaletas del techo: desvía las primeras aguas sucias al desagüe y luego abre el paso al filtro y al tanque durante el aguacero de El Niño.",
    type: "COSECHA_LLUVIA",
    xpMaxReward: 100,
    durationSeconds: 90,
    videoIntroUri: "/videos/mock-cosecha.mp4",
  },
  {
    id: "jg-4",
    title: "Maestro del Riego",
    description:
      "Cuida tu biohuerto durante todo el día: elige goteo con botellas recicladas, mulch de hojas o riego nocturno según el reloj para no perder agua al mediodía.",
    type: "RIEGO_OPT",
    xpMaxReward: 100,
    durationSeconds: 90,
    videoIntroUri: "/videos/mock-riego.mp4",
  },
  {
    id: "jg-5",
    title: "El Laboratorio de Filtros Caseros",
    description:
      "Arrastra grava, arenas, carbón y algodón en el orden correcto de abajo hacia arriba antes de que caiga el agua turbia. 3 rondas de dificultad creciente.",
    type: "FILTROS_LAB",
    xpMaxReward: 100,
    durationSeconds: 60,
    videoIntroUri: "/videos/mock-filtros.mp4",
  },
  {
    id: "jg-6",
    title: "Rutas de Aguas Grises",
    description:
      "Gira las tuberías tocándolas para llevar el agua de la lavadora hasta el biohuerto o el inodoro, sin tocar las tuberías de aguas negras.",
    type: "RUTAS_AGUAS",
    xpMaxReward: 100,
    durationSeconds: 90,
    videoIntroUri: "/videos/mock-rutas.mp4",
  },
  {
    id: "jg-7",
    title: "Desafío SODIS: Rayos UV vs. Microbios",
    description:
      "Arrastra el espejo hacia cada botella PET para reflejar el sol y desinfectar el agua antes de que las bacterias se multipliquen. Usa el power-up de Mr. Gota al mediodía.",
    type: "SODIS_UV",
    xpMaxReward: 100,
    durationSeconds: 60,
    videoIntroUri: "/videos/mock-sodis.mp4",
  },
  {
    id: "jg-8",
    title: "Guardián del Río Piura y Manglares",
    description:
      "El río baja con basura y fauna: desliza a la derecha los plásticos y latas hacia el reciclaje, y deja pasar libres a peces, patos y hojas.",
    type: "GUARDIAN_RIO",
    xpMaxReward: 100,
    durationSeconds: 60,
    videoIntroUri: "/videos/mock-guardian-rio.mp4",
  },
  {
    id: "jg-9",
    title: "La Ducha Musical de 4 Minutos",
    description:
      "Sigue el ritmo de la canción: cierra la llave a tiempo mientras te enjabonas para no desperdiciar agua en rojo.",
    type: "DUCHA_MUSICAL",
    xpMaxReward: 100,
    durationSeconds: 60,
    videoIntroUri: "/videos/mock-ducha.mp4",
  },
  {
    id: "jg-10",
    title: "El Desafío del Corte de Agua",
    description:
      "Administra 1000 L de reservorio para una familia de 4 durante un corte de 3 días con tarjetas de decisión diaria, sin sacrificar la higiene del hogar.",
    type: "CORTE_AGUA",
    xpMaxReward: 100,
    durationSeconds: 90,
    videoIntroUri: "/videos/mock-corte.mp4",
  },
  {
    id: "jg-11",
    title: "El Acuífero Secreto: Raíces del Algarrobo",
    description:
      "Guía la raíz del algarrobo con ⬅️➡️ esquivando rocas y filtraciones contaminadas, y recoge bolsas de agua subterránea antes de alcanzar la corriente profunda. 3 rondas.",
    type: "ACUIFERO_ALGARROBO",
    xpMaxReward: 100,
    durationSeconds: 60,
    videoIntroUri: "/videos/mock-acuifero.mp4",
  },
  {
    id: "jg-12",
    title: "El Gotero Preciso: Cloración Segura",
    description:
      "Mantén presionado el gotero y suelta en el número exacto de gotas — 2 por litro — para desinfectar jarras, baldes y bidones sin sobredosificar.",
    type: "CLORACION_SEGURA",
    xpMaxReward: 100,
    durationSeconds: 60,
    videoIntroUri: "/videos/mock-cloracion.mp4",
  },
];

// Botones rápidos Ahorro AGENTS.md:224
export const QUICK_SAVE = [
  { label: "Ducha", emoji: "🚿", liters: 20 },
  { label: "Cepillado", emoji: "🪥", liters: 10 },
  { label: "Lavadora", emoji: "👕", liters: 40 },
  { label: "Riego nocturno", emoji: "🌙", liters: 15 },
] as const;

// Calculadora soles: tarifa S/ 0.67 por litro (referencia EPS Grau, operador real de agua en Piura)
export const TARIFA_SOLES_POR_LITRO = 0.67;
export function calcCostoSoles(litros: number): number {
  return Number((litros * TARIFA_SOLES_POR_LITRO).toFixed(2));
}
