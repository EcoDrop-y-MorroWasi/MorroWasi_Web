export type CourseUnlock =
  | { type: "free" }
  | { type: "hydroPoints"; value: number }
  | { type: "wasiLevel"; value: number };

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  description: string;
  /** Texto de lectura para la flashcard previa al quiz — sin video, sin timer. */
  contentMarkdown: string;
  videoUrl: string;
  thumbnailUrl: string;
  quiz: QuizQuestion;
}

export interface WaterCourse {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  xpReward: number;
  unlock: CourseUnlock;
  thumbnailUrl: string;
  /** Malla curricular: 3-4 líneas que resumen qué aprenderá el curso completo. */
  curriculum: string[];
  lessons: CourseLesson[];
}

// MVP demo: videos de Academia usan YouTube embebido (temático real, verificado por tema)
// mientras se graban videos propios. Contrato futuro sin cambios: Firebase Storage podrá servir
// `courses/{id}/{lesson}.mp4` bajo el mismo campo `videoUrl`, y VideoPlayerView decide iframe
// YouTube vs <video> local por el contenido de la URL.
const YOUTUBE_EMBED: Record<string, string> = {
  sodis: "https://www.youtube.com/embed/TVDvGUWEkvM", // SODIS - Desinfección solar del agua
  "aguas-grises": "https://www.youtube.com/embed/IaMaBR6CRIU", // Reutilización de aguas grises en casa
  "filtros-caseros": "https://www.youtube.com/embed/QiU9F5sYQVw", // Tutorial: crea tu propio filtro de agua casero
  "riego-goteo": "https://www.youtube.com/embed/gJQsjkJv9cE", // Riego por goteo ecológico con botella reciclada
  "cosecha-lluvia": "https://www.youtube.com/embed/4bv4xPExJsQ", // Sistema de captación de agua de lluvia
  humedales: "https://www.youtube.com/embed/CUVlwH8LP0c", // Humedales artificiales para tratamiento de aguas residuales
};

const media = (courseId: string) => ({
  videoUrl: YOUTUBE_EMBED[courseId] ?? `/media/courses/${courseId}/intro.mp4`,
  // Portada temática local reutilizada como thumbnail de lección: ilustración propia, sin 404 ni red.
  thumbnailUrl: `/media/courses/${courseId}/cover.jpg`,
});

const lesson = (
  courseId: string,
  id: string,
  title: string,
  description: string,
  contentMarkdown: string,
  question: string,
  options: string[],
  correctAnswer: number,
  explanation: string,
): CourseLesson => ({
  id,
  title,
  description,
  contentMarkdown,
  durationMinutes: 6,
  ...media(courseId),
  quiz: { question, options, correctAnswer, explanation },
});

export const coursesMock: WaterCourse[] = [
  {
    id: "sodis",
    title: "SODIS: desinfección solar",
    description: "Aprende a usar la luz del sol para mejorar la seguridad del agua.",
    durationMinutes: 18,
    xpReward: 150,
    unlock: { type: "free" },
    thumbnailUrl: "/media/courses/sodis/cover.jpg",
    curriculum: [
      "Qué es la desinfección solar y por qué funciona con luz UV",
      "Botellas PET adecuadas: transparentes, limpias y sin rayones",
      "Tiempo de exposición: 6 horas de sol directo en Piura (o 2 días nublado)",
      "Cómo verificar que el agua quedó segura para beber",
    ],
    lessons: [
      lesson(
        "sodis",
        "botellas",
        "Botellas y preparación",
        "Reconoce recipientes adecuados y prepara el agua.",
        "El método SODIS usa botellas de plástico PET (las de bebidas comunes) porque dejan pasar la luz ultravioleta del sol. Deben estar transparentes, limpias y sin rayones profundos — un rayón dispersa la luz y reduce la desinfección. Llénalas con agua de baja turbidez: si no puedes leer un texto a través del agua, primero déjala reposar o fíltrala.",
        "¿Qué botella se usa para SODIS?",
        ["Transparente y limpia", "De metal", "Opaca"],
        0,
        "La luz necesita atravesar una botella transparente y limpia.",
      ),
      lesson(
        "sodis",
        "sol",
        "Exposición al sol",
        "Conoce el tiempo de exposición recomendado.",
        "Coloca las botellas llenas y acostadas sobre un techo de calamina u otra superficie soleada, lejos de sombras. Con sol fuerte (como en Piura) bastan 6 horas continuas; si el cielo está nublado, se necesitan 2 días seguidos de exposición. El calor y la radiación UV-A combinados destruyen bacterias, virus y parásitos presentes en el agua.",
        "¿Dónde debe colocarse la botella?",
        ["En un lugar soleado", "Dentro de un armario", "Bajo tierra"],
        0,
        "El método depende de la exposición directa a la luz solar.",
      ),
    ],
  },
  {
    id: "aguas-grises",
    title: "Reuso de aguas grises",
    description: "Da una segunda vida al agua doméstica para usos seguros.",
    durationMinutes: 22,
    xpReward: 200,
    unlock: { type: "free" },
    thumbnailUrl: "/media/courses/aguas-grises/cover.jpg",
    curriculum: [
      "Qué son las aguas grises y de dónde vienen (lavadora, ducha, lavamanos)",
      "Diferencia entre aguas grises y aguas negras — por qué no mezclarlas",
      "Sistema simple de captación: tanque, sedimentación y filtrado",
      "Usos seguros: riego de biohuerto, limpieza de pisos, descarga de inodoro",
    ],
    lessons: [
      lesson(
        "aguas-grises",
        "origen",
        "¿Qué son las aguas grises?",
        "Distingue fuentes aptas para reuso.",
        "Las aguas grises son las que salen de la lavadora, la ducha y el lavamanos: tienen jabón pero no los patógenos concentrados de las aguas negras (inodoro). Por eso se pueden reutilizar con precaución. Nunca mezcles aguas grises con aguas negras — eso las contamina y las inutiliza para el reuso.",
        "¿Cuál es un ejemplo de agua gris?",
        ["Agua del lavado de ropa", "Agua del inodoro", "Agua de lluvia potable"],
        0,
        "El agua de lavandería puede reutilizarse con cuidado para usos no potables.",
      ),
      lesson(
        "aguas-grises",
        "reuso",
        "Reuso responsable",
        "Aplica prácticas seguras en casa.",
        "Un sistema básico capta el agua de la lavadora en un tanque, deja sedimentar el jabón y la pelusa, y la conduce por gravedad al biohuerto o al jardín. Usa jabón biodegradable para no dañar las plantas, y nunca la uses para beber, cocinar o lavar alimentos — solo para riego ornamental o limpieza de exteriores.",
        "¿Para qué uso es apropiada?",
        ["Riego ornamental", "Beber", "Cocinar"],
        0,
        "Se destina a usos no potables, como el riego ornamental.",
      ),
    ],
  },
  {
    id: "filtros-caseros",
    title: "Filtros caseros de arena y carbón",
    description: "Construye un filtro educativo con materiales accesibles.",
    durationMinutes: 28,
    xpReward: 250,
    unlock: { type: "hydroPoints", value: 300 },
    thumbnailUrl: "/media/courses/filtros-caseros/cover.jpg",
    curriculum: [
      "Materiales necesarios: grava, arena gruesa, arena fina, carbón activado y algodón",
      "Orden correcto de las capas, de abajo hacia arriba",
      "Armado paso a paso en una botella cortada",
      "Límites del filtro casero: por qué siempre hervir después de filtrar",
    ],
    lessons: [
      lesson(
        "filtros-caseros",
        "capas",
        "Capas del filtro",
        "Ordena los materiales del filtro.",
        "Un filtro casero se arma en capas dentro de una botella cortada, de abajo hacia arriba: grava (drena y sostiene), arena gruesa, arena fina, carbón activado (retiene olores y algunos químicos) y algodón o gasa arriba (retiene partículas grandes primero). El orden importa: si el carbón queda al fondo, el filtro se tapa y no funciona.",
        "¿Qué material ayuda a retener partículas?",
        ["Arena", "Azúcar", "Papel"],
        0,
        "La arena ayuda a filtrar partículas suspendidas.",
      ),
    ],
  },
  {
    id: "riego-goteo",
    title: "Riego por goteo casero",
    description: "Reduce pérdidas de agua al regar plantas y cultivos.",
    durationMinutes: 20,
    xpReward: 180,
    unlock: { type: "hydroPoints", value: 200 },
    thumbnailUrl: "/media/courses/riego-goteo/cover.jpg",
    curriculum: [
      "Por qué el riego por goteo ahorra agua frente a la manguera",
      "Materiales: botella reciclada, cordón o mecha, tapa perforada",
      "Armado y ubicación junto a la raíz de la planta",
      "Mejor horario de riego: noche o madrugada para reducir evaporación",
    ],
    lessons: [
      lesson(
        "riego-goteo",
        "planifica",
        "Planifica tu riego",
        "Entrega agua cerca de las raíces.",
        "Una botella invertida con un pequeño agujero en la tapa (o un cordón que actúa por capilaridad) entrega agua gota a gota directo a la raíz, sin desperdiciar en el aire ni en las hojas. Entierra la boca de la botella cerca del tallo. Riega de noche o temprano en la madrugada: con el sol de Piura, regar al mediodía hace que el agua se evapore antes de llegar a la raíz.",
        "¿Cuándo conviene regar?",
        ["Por la noche", "Al mediodía", "Con mucho viento"],
        0,
        "El riego nocturno reduce la evaporación.",
      ),
    ],
  },
  {
    id: "cosecha-lluvia",
    title: "Cosecha de lluvia en techos",
    description: "Aprovecha la lluvia para almacenar agua de uso no potable.",
    durationMinutes: 30,
    xpReward: 300,
    unlock: { type: "wasiLevel", value: 2 },
    thumbnailUrl: "/media/courses/cosecha-lluvia/cover.jpg",
    curriculum: [
      "Elementos del sistema: techo, canaletas, bajante y tanque",
      "Regla de las primeras aguas: desviar los primeros minutos de lluvia sucia",
      "Filtro de arena antes del tanque de almacenamiento",
      "Usos del agua de lluvia almacenada: riego, limpieza, descarga",
    ],
    lessons: [
      lesson(
        "cosecha-lluvia",
        "captacion",
        "Captación segura",
        "Identifica los elementos del sistema.",
        "El techo actúa como superficie de captación; una canaleta conduce el agua hacia un bajante y este hacia el tanque. En temporada de El Niño, los primeros minutos de lluvia arrastran polvo y hojas del techo — conviene desviar esa primera agua sucia al desagüe antes de abrir el paso al tanque, para guardar solo agua limpia.",
        "¿Qué superficie capta el agua?",
        ["El techo", "El desagüe", "La pared"],
        0,
        "El techo conduce el agua hacia el sistema de almacenamiento.",
      ),
    ],
  },
  {
    id: "humedales",
    title: "Tratamiento biológico y humedales",
    description: "Explora cómo la naturaleza ayuda a tratar el agua.",
    durationMinutes: 35,
    xpReward: 400,
    unlock: { type: "wasiLevel", value: 3 },
    thumbnailUrl: "/media/courses/humedales/cover.jpg",
    curriculum: [
      "Qué es un humedal artificial y cómo imita a la naturaleza",
      "Componentes: sustrato de grava, plantas y microorganismos",
      "Cómo las raíces y bacterias degradan la materia orgánica",
      "Ventajas frente a plantas de tratamiento convencionales: bajo costo y mantenimiento",
    ],
    lessons: [
      lesson(
        "humedales",
        "ecosistema",
        "El humedal como aliado",
        "Conoce el papel de plantas y microorganismos.",
        "Un humedal artificial reproduce, de forma controlada, lo que hace un humedal natural: el agua pasa lentamente por un sustrato de grava donde viven microorganismos, mientras las raíces de plantas como totoras absorben nutrientes y oxigenan el sistema. Juntos degradan la materia orgánica sin químicos, con bajo costo de operación y mantenimiento.",
        "¿Qué aportan las plantas?",
        ["Ayudan al proceso natural", "Aumentan el desperdicio", "Eliminan toda necesidad de cuidado"],
        0,
        "Las plantas forman parte del proceso natural de tratamiento.",
      ),
    ],
  },
];

export function isCourseUnlocked(course: WaterCourse, hydroPoints: number, wasiLevel: number) {
  if (course.unlock.type === "free") return true;
  return course.unlock.type === "hydroPoints"
    ? hydroPoints >= course.unlock.value
    : wasiLevel >= course.unlock.value;
}

export function unlockLabel(unlock: CourseUnlock) {
  if (unlock.type === "free") return "Disponible ahora";
  return unlock.type === "hydroPoints"
    ? `Requiere ${unlock.value} HydroPuntos`
    : `Requiere Wasi nivel ${unlock.value}`;
}
