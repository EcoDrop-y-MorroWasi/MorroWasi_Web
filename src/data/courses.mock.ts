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
        "por-que-funciona",
        "Por qué funciona la desinfección solar",
        "Entiende la ciencia detrás del método SODIS.",
        "El método SODIS (Solar Water Disinfection) combina dos efectos del sol: la radiación ultravioleta A (UV-A) daña el material genético de bacterias, virus y parásitos, mientras el calor acelera ese daño y, con agua por encima de 50°C, lo refuerza aún más. Es un método recomendado por la OMS para zonas rurales sin acceso a cloro o hervido, siempre que se respeten los tiempos de exposición.",
        "¿Qué hace la luz UV-A al agua contaminada?",
        ["Daña a los microorganismos dañinos", "Le agrega cloro natural", "La enfría"],
        0,
        "La radiación UV-A daña el material genético de los microorganismos, inactivándolos.",
      ),
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
      lesson(
        "sodis",
        "verificacion",
        "Cómo verificar que el agua es segura",
        "Confirma que el proceso funcionó antes de beber.",
        "Después de las 6 horas de sol (o 2 días nublado), el agua debería verse igual de clara que al inicio — SODIS no cambia el color ni el sabor. Si el agua tenía turbidez visible antes de empezar, el método no garantiza una desinfección completa: fíltrala primero. Ante cualquier duda sobre el origen del agua (por ejemplo tras una inundación), es más seguro hervirla en vez de confiar solo en SODIS.",
        "¿Qué hacer si el agua está turbia antes de exponerla al sol?",
        ["Filtrarla primero", "Usarla igual", "Agregarle tierra"],
        0,
        "El agua turbia bloquea la luz UV y reduce la eficacia del método — hay que filtrarla antes.",
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
        "diferencia",
        "Aguas grises vs. aguas negras",
        "No todas las aguas usadas son iguales.",
        "Las aguas negras vienen del inodoro y contienen alta carga de patógenos — nunca deben reutilizarse sin tratamiento especializado. Las aguas grises (lavadora, ducha, lavamanos) tienen jabón y algo de grasa, pero mucha menos carga de bacterias peligrosas. Mezclar ambas en la misma tubería de reuso contamina el agua gris y elimina cualquier posibilidad de reutilizarla de forma segura — deben mantenerse en circuitos completamente separados.",
        "¿Por qué no se debe mezclar agua gris con agua negra?",
        ["Porque contamina el agua gris y la inutiliza", "Porque cambia de color", "No hay problema en mezclarlas"],
        0,
        "Mezclarlas contamina el agua gris con los patógenos del agua negra, eliminando la posibilidad de reuso seguro.",
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
      lesson(
        "aguas-grises",
        "usos-seguros",
        "Dónde sí y dónde no usar el agua gris",
        "Conoce los límites del reuso doméstico.",
        "El agua gris tratada de forma simple sirve para riego de plantas ornamentales, limpieza de pisos y patios, y descarga del inodoro. Nunca debe usarse para regar hortalizas que se comen crudas (como lechuga), lavar ropa de bebés, ni para cualquier contacto con alimentos o agua potable. Si notas mal olor o el agua se ve muy sucia, descártala en vez de reutilizarla.",
        "¿Para qué uso NO es seguro el agua gris?",
        ["Regar hortalizas que se comen crudas", "Limpiar el patio", "Descargar el inodoro"],
        0,
        "El agua gris puede tener bacterias que contaminan alimentos que se comen sin cocinar.",
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
        "Materiales necesarios",
        "Reúne lo que necesitas antes de armar el filtro.",
        "Para armar un filtro casero necesitas: grava (piedras pequeñas), arena gruesa, arena fina, carbón activado (se puede hacer carbonizando cáscaras o comprarlo) y algodón o gasa. Cada material cumple una función distinta: la grava drena el agua, las arenas atrapan partículas de distinto tamaño, el carbón retiene olores y algunos químicos, y el algodón atrapa las partículas más grandes primero, en la entrada del filtro.",
        "¿Qué material retiene olores y químicos disueltos?",
        ["Carbón activado", "Grava", "Algodón"],
        0,
        "El carbón activado retiene olores y ciertos compuestos químicos disueltos.",
      ),
      lesson(
        "filtros-caseros",
        "orden",
        "El orden correcto de las capas",
        "Un filtro mal armado no funciona.",
        "Las capas van de abajo hacia arriba: primero grava (para que el agua drene y no se tape la salida), luego arena gruesa, después arena fina, y arriba de todo el carbón activado cubierto con algodón o gasa. Si el carbón queda al fondo, se compacta con el peso del resto de materiales y el filtro se tapa rápido, dejando de funcionar.",
        "¿Qué pasa si el carbón activado queda al fondo del filtro?",
        ["Se compacta y el filtro se tapa", "Filtra mejor", "No cambia nada"],
        0,
        "El peso de las demás capas compacta el carbón al fondo, tapando el filtro.",
      ),
      lesson(
        "filtros-caseros",
        "armado",
        "Armado paso a paso",
        "Construye el filtro en una botella cortada.",
        "Corta una botella de plástico por la mitad y usa la parte de arriba (con la tapa, boca hacia abajo) como embudo. Haz unos agujeros pequeños en la tapa o quítala y pon algodón como primer filtro. Agrega las capas en el orden correcto, apisonando suavemente cada una antes de poner la siguiente. Coloca la parte de abajo de la botella (o un recipiente) debajo para recibir el agua filtrada.",
        "¿Qué parte de la botella se usa como embudo?",
        ["La parte de arriba, con la tapa hacia abajo", "El fondo de la botella", "La etiqueta"],
        0,
        "La boca de la botella funciona como salida del agua ya filtrada, boca hacia abajo.",
      ),
      lesson(
        "filtros-caseros",
        "limites",
        "Lo que el filtro casero no hace",
        "Por qué siempre hervir después de filtrar.",
        "Un filtro casero de arena y carbón retira partículas y mejora el sabor y el olor, pero NO elimina de forma confiable bacterias y virus microscópicos. Por eso el agua filtrada siempre debe hervirse (o pasar por SODIS) antes de beberla. El filtro es un buen primer paso para agua turbia, no un tratamiento completo por sí solo.",
        "¿Qué hay que hacer con el agua después de filtrarla?",
        ["Hervirla o desinfectarla igual", "Beberla directo", "Guardarla sin tapar"],
        0,
        "El filtro casero no elimina microorganismos de forma confiable; siempre hay que desinfectar después.",
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
        "por-que-ahorra",
        "Por qué el goteo ahorra agua",
        "Compara con el riego tradicional.",
        "Regar con manguera abierta moja hojas, caminos y aire — gran parte del agua se evapora o escurre sin llegar a las raíces. El riego por goteo entrega el agua gota a gota, justo donde la planta la absorbe, reduciendo el desperdicio hasta en un 70% comparado con el riego tradicional. Además, al mojar menos las hojas, también reduce el riesgo de hongos.",
        "¿Por qué el riego por goteo desperdicia menos agua?",
        ["Entrega el agua directo a la raíz", "Usa agua más fría", "Riega más rápido"],
        0,
        "Al entregar el agua justo donde la planta la necesita, se evita la evaporación y el escurrimiento.",
      ),
      lesson(
        "riego-goteo",
        "materiales",
        "Materiales para tu sistema de goteo",
        "Con lo que ya tienes en casa.",
        "Necesitas una botella de plástico limpia (1 o 2 litros), una tapa, y un clavo o punzón fino para hacer 1 o 2 agujeros pequeños en la tapa. Si quieres un goteo más lento y parejo, puedes meter un pedazo de cordón de algodón por el agujero: el agua sube por capilaridad y gotea más despacio que un simple hueco.",
        "¿Qué material ayuda a que el goteo sea más lento y parejo?",
        ["Un cordón de algodón", "Una piedra grande", "Papel periódico"],
        0,
        "El cordón conduce el agua por capilaridad, goteando más lento que un agujero simple.",
      ),
      lesson(
        "riego-goteo",
        "planifica",
        "Ubicación y armado",
        "Entrega agua cerca de las raíces.",
        "Entierra la botella invertida (boca hacia abajo) cerca del tallo de la planta, sin tocarlo directamente, y llénala de agua. El agujero de la tapa (o el cordón) deja salir el agua gota a gota directo a la zona de las raíces, sin mojar el resto del suelo ni el follaje. Revisa cada 1-2 días para volver a llenarla.",
        "¿Dónde se entierra la botella de goteo?",
        ["Cerca del tallo, sin tocarlo", "Lejos de la planta", "Sobre las hojas"],
        0,
        "Cerca de la raíz, para que el agua llegue directo donde la planta la necesita.",
      ),
      lesson(
        "riego-goteo",
        "horario",
        "El mejor horario para regar",
        "Reduce la evaporación con el momento correcto.",
        "En Piura, el sol del mediodía evapora buena parte del agua antes de que llegue a la raíz. Regar de noche o muy temprano en la madrugada aprovecha las temperaturas más frescas y la menor evaporación, dejando más tiempo para que el agua penetre el suelo. Es el mismo principio que se aplica al riego por goteo: mejor de noche que a pleno sol.",
        "¿Cuándo se evapora más agua al regar?",
        ["Al mediodía con sol fuerte", "De madrugada", "De noche"],
        0,
        "El calor y la luz solar del mediodía aceleran la evaporación del agua de riego.",
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
        "El techo actúa como superficie de captación: cuando llueve, el agua escurre hacia una canaleta instalada en el borde, que la conduce hacia un bajante (tubo vertical) y este hacia el tanque de almacenamiento. Es importante que el techo esté relativamente limpio y sin materiales tóxicos, porque el agua arrastra todo lo que encuentra en el camino.",
        "¿Qué superficie capta el agua?",
        ["El techo", "El desagüe", "La pared"],
        0,
        "El techo conduce el agua hacia el sistema de almacenamiento.",
      ),
      lesson(
        "cosecha-lluvia",
        "primeras-aguas",
        "La regla de las primeras aguas",
        "Desvía la primera agua sucia.",
        "Los primeros minutos de lluvia arrastran polvo, hojas y excremento de aves acumulados en el techo. Un sistema simple usa una válvula o tubo desviador para mandar esa primera agua sucia al desagüe, y recién después de unos minutos (cuando el techo ya se lavó) dejar que el agua entre al tanque. Sin este paso, el tanque acumula sedimento y se ensucia rápido.",
        "¿Por qué se desvía la primera agua de lluvia?",
        ["Porque arrastra la suciedad acumulada en el techo", "Porque es más fría", "Porque tiene más presión"],
        0,
        "Los primeros minutos de lluvia lavan el techo y arrastran suciedad que no debe entrar al tanque.",
      ),
      lesson(
        "cosecha-lluvia",
        "filtro-arena",
        "Filtro antes del tanque",
        "Un paso extra de limpieza.",
        "Antes de que el agua entre al tanque de almacenamiento, conviene pasarla por un filtro simple de malla o arena que retenga hojas, ramitas y partículas grandes. Esto evita que el tanque se llene de sedimento y facilita el mantenimiento — un tanque con menos sedimento necesita limpiarse con menos frecuencia y el agua se mantiene en mejor estado para los usos no potables.",
        "¿Qué evita un filtro antes del tanque?",
        ["Que se acumule sedimento", "Que llueva menos", "Que el tanque se oxide"],
        0,
        "El filtro retiene partículas grandes antes de que entren y se acumulen en el tanque.",
      ),
      lesson(
        "cosecha-lluvia",
        "usos",
        "Usos del agua de lluvia almacenada",
        "Aprovecha cada litro correctamente.",
        "El agua de lluvia cosechada de esta forma es ideal para riego de plantas, limpieza de patios y pisos, lavado de ropa de trabajo, y descarga del inodoro. No se recomienda beberla directamente sin tratamiento adicional (hervido o SODIS), porque el techo y las tuberías pueden aportar contaminantes que un simple filtro de sedimento no elimina.",
        "¿Se puede beber el agua de lluvia cosechada sin tratamiento?",
        ["No, necesita tratamiento adicional", "Sí, siempre es potable", "Solo si llovió mucho"],
        0,
        "El agua de lluvia captada del techo puede tener contaminantes que requieren hervido o SODIS antes de beberla.",
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
        "Conoce qué es un humedal artificial.",
        "Un humedal artificial es un sistema construido que imita el trabajo de limpieza que hacen los pantanos y humedales naturales. En vez de químicos o electricidad, usa procesos biológicos y físicos para tratar el agua: la hace pasar lentamente por un sustrato donde viven microorganismos y raíces de plantas acuáticas, que juntos degradan la contaminación orgánica antes de que el agua salga del sistema.",
        "¿Qué aportan las plantas?",
        ["Ayudan al proceso natural", "Aumentan el desperdicio", "Eliminan toda necesidad de cuidado"],
        0,
        "Las plantas forman parte del proceso natural de tratamiento.",
      ),
      lesson(
        "humedales",
        "componentes",
        "Las piezas del humedal artificial",
        "Sustrato, plantas y microorganismos trabajando juntos.",
        "Un humedal artificial tiene tres componentes principales: el sustrato (grava de distintos tamaños) que sostiene físicamente el sistema y da espacio para que se formen colonias de microorganismos; las plantas acuáticas (como la totora) cuyas raíces oxigenan el agua y absorben nutrientes; y los microorganismos que viven pegados a las raíces y a la grava, encargados de descomponer la materia orgánica.",
        "¿Qué función cumple la grava en el humedal?",
        ["Sostiene el sistema y aloja microorganismos", "Filtra virus por completo", "Le da color al agua"],
        0,
        "La grava es el soporte físico donde se instalan los microorganismos que hacen el trabajo de depuración.",
      ),
      lesson(
        "humedales",
        "degradacion",
        "Cómo se degrada la materia orgánica",
        "El trabajo invisible de raíces y bacterias.",
        "Cuando el agua contaminada pasa por el humedal, las bacterias que viven junto a las raíces de las plantas consumen la materia orgánica como alimento, transformándola en compuestos más simples y menos dañinos. Las raíces, a su vez, liberan oxígeno hacia el sustrato, lo que ayuda a que estas bacterias trabajen mejor. Es el mismo principio que ocurre en un pantano natural, pero en un espacio controlado y más pequeño.",
        "¿Qué liberan las raíces de las plantas hacia el sustrato?",
        ["Oxígeno", "Cloro", "Sal"],
        0,
        "Las raíces oxigenan el sustrato, favoreciendo el trabajo de las bacterias descomponedoras.",
      ),
      lesson(
        "humedales",
        "ventajas",
        "Ventajas frente al tratamiento convencional",
        "Bajo costo, bajo mantenimiento.",
        "A diferencia de una planta de tratamiento convencional, un humedal artificial no necesita electricidad ni químicos para funcionar, lo que lo hace ideal para zonas rurales sin esos recursos. Su mantenimiento se limita a podar las plantas de vez en cuando y revisar que no se tape el flujo de agua. La desventaja es que necesita más espacio de terreno que un sistema mecánico compacto.",
        "¿Qué necesita un humedal artificial para funcionar, a diferencia de una planta convencional?",
        ["Solo espacio de terreno, sin electricidad ni químicos", "Electricidad constante", "Químicos desinfectantes"],
        0,
        "El humedal funciona con procesos naturales, sin depender de electricidad ni químicos.",
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
