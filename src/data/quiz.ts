// Banco de preguntas del mini-juego "Sabios del Agua" (jg-13).
//
// Nivel: secundaria básica (1° a 3°). El vocabulario técnico se explica dentro de
// la propia pregunta o en la explicación — nada asume química ni física previas.
// Los temas siguen a los cursos de courses.mock.ts y a los otros 12 mini-juegos,
// con contexto de Morropón y Piura (EPS Grau, algarrobo, El Niño, cortes de agua).
//
// `explicacion` no es decorativa: se muestra después de responder y es donde
// ocurre el aprendizaje real, incluso cuando el jugador acertó de casualidad.

export type QuizTema =
  | "ciclo-agua"
  | "sodis"
  | "aguas-grises"
  | "filtros"
  | "riego"
  | "cosecha-lluvia"
  | "huella-hidrica"
  | "fugas"
  | "cloracion"
  | "rio-piura"
  | "salud"
  | "consumo";

export const TEMAS_QUIZ: Record<QuizTema, { label: string; emoji: string }> = {
  "ciclo-agua": { label: "Ciclo del agua", emoji: "🌍" },
  sodis: { label: "SODIS", emoji: "☀️" },
  "aguas-grises": { label: "Aguas grises", emoji: "🔀" },
  filtros: { label: "Filtros caseros", emoji: "🧪" },
  riego: { label: "Riego", emoji: "🌱" },
  "cosecha-lluvia": { label: "Cosecha de lluvia", emoji: "🌧️" },
  "huella-hidrica": { label: "Huella hídrica", emoji: "⚖️" },
  fugas: { label: "Fugas", emoji: "🔧" },
  cloracion: { label: "Cloración", emoji: "💧" },
  "rio-piura": { label: "Río Piura", emoji: "🏞️" },
  salud: { label: "Agua y salud", emoji: "🏥" },
  consumo: { label: "Consumo en casa", emoji: "🚿" },
};

export interface PreguntaQuiz {
  id: string;
  tema: QuizTema;
  pregunta: string;
  /** Siempre 4 opciones — el motor las baraja en cada partida. */
  opciones: [string, string, string, string];
  /** Índice de la opción correcta dentro de `opciones`, antes de barajar. */
  correcta: 0 | 1 | 2 | 3;
  explicacion: string;
  dificultad: 1 | 2 | 3;
}

export const BANCO_PREGUNTAS: PreguntaQuiz[] = [
  // ---------------------------------------------------------------- ciclo del agua
  {
    id: "ca-01",
    tema: "ciclo-agua",
    pregunta: "¿Qué porcentaje del agua del planeta es agua dulce disponible para beber?",
    opciones: ["Menos del 1%", "Cerca del 25%", "Alrededor del 50%", "Más del 70%"],
    correcta: 0,
    explicacion:
      "El 97% del agua del planeta es salada y casi toda el agua dulce está congelada en glaciares. Queda menos del 1% accesible en ríos, lagos y acuíferos: por eso cuidar cada litro importa tanto.",
    dificultad: 1,
  },
  {
    id: "ca-02",
    tema: "ciclo-agua",
    pregunta: "¿Cómo se llama el paso del ciclo del agua en que el agua líquida se convierte en vapor?",
    opciones: ["Evaporación", "Condensación", "Precipitación", "Infiltración"],
    correcta: 0,
    explicacion:
      "El sol calienta el agua de ríos, mares y suelos y la convierte en vapor. En Piura, con temperaturas altas casi todo el año, la evaporación es muy fuerte: por eso regar al mediodía desperdicia tanta agua.",
    dificultad: 1,
  },
  {
    id: "ca-03",
    tema: "ciclo-agua",
    pregunta: "¿Qué es un acuífero?",
    opciones: [
      "Una capa de roca o arena bajo tierra que guarda agua",
      "Un tipo de nube cargada de lluvia",
      "Una tubería principal de la ciudad",
      "Un reservorio construido de concreto",
    ],
    correcta: 0,
    explicacion:
      "El acuífero es agua almacenada bajo tierra entre granos de arena y grietas de roca. Los algarrobos de Piura llegan a él con raíces de decenas de metros, y los pozos lo aprovechan.",
    dificultad: 2,
  },
  {
    id: "ca-04",
    tema: "ciclo-agua",
    pregunta: "¿Qué ocurre cuando el agua de lluvia cae sobre suelo cubierto de cemento en vez de tierra?",
    opciones: [
      "No se infiltra y corre por la superficie, aumentando el riesgo de inundación",
      "Se infiltra más rápido y recarga mejor el acuífero",
      "Se evapora al instante sin tocar el suelo",
      "Se vuelve automáticamente potable",
    ],
    correcta: 0,
    explicacion:
      "El cemento impide la infiltración. En El Niño esto empeora las inundaciones urbanas: el agua no entra al suelo y corre acumulándose. Los suelos con vegetación absorben y recargan el acuífero.",
    dificultad: 2,
  },
  {
    id: "ca-05",
    tema: "ciclo-agua",
    pregunta: "Durante un Fenómeno de El Niño fuerte en Piura, lo típico es que ocurra:",
    opciones: [
      "Lluvias muy intensas y crecida de ríos",
      "Sequía extrema sin una sola lluvia",
      "Nevadas en la costa",
      "Que el río Piura se congele",
    ],
    correcta: 0,
    explicacion:
      "El Niño calienta el mar frente a la costa peruana y dispara lluvias muy intensas. Piura pasa de la escasez a la inundación en semanas: por eso cosechar lluvia y tener el reservorio listo es tan valioso.",
    dificultad: 1,
  },
  {
    id: "ca-06",
    tema: "ciclo-agua",
    pregunta: "¿Qué significa que una cuenca esté 'estresada hídricamente'?",
    opciones: [
      "Que se usa más agua de la que la cuenca logra reponer",
      "Que el agua está demasiado fría",
      "Que llueve todos los días del año",
      "Que el río cambió de color",
    ],
    correcta: 0,
    explicacion:
      "El estrés hídrico aparece cuando la demanda (casas, agricultura, industria) supera lo que la cuenca recarga naturalmente. Es la situación de buena parte de la costa peruana.",
    dificultad: 3,
  },
  {
    id: "ca-07",
    tema: "ciclo-agua",
    pregunta: "El agua que vuelve a la atmósfera desde las hojas de las plantas se llama:",
    opciones: ["Transpiración", "Precipitación", "Sedimentación", "Filtración"],
    correcta: 0,
    explicacion:
      "Las plantas absorben agua por la raíz y liberan vapor por las hojas. Junto con la evaporación del suelo forma la evapotranspiración, que es lo que un cultivo realmente 'consume'.",
    dificultad: 2,
  },
  {
    id: "ca-08",
    tema: "ciclo-agua",
    pregunta: "¿Por qué el agua de mar no sirve para regar cultivos?",
    opciones: [
      "Su exceso de sal deshidrata las raíces y arruina el suelo",
      "Está demasiado fría para las plantas",
      "No contiene oxígeno",
      "Se evapora antes de llegar a la raíz",
    ],
    correcta: 0,
    explicacion:
      "La sal hace que el agua salga de la raíz en vez de entrar, y se acumula en el suelo volviéndolo estéril. Desalinizar es posible pero caro: gasta mucha energía.",
    dificultad: 2,
  },
  {
    id: "ca-09",
    tema: "ciclo-agua",
    pregunta: "El bosque seco de algarrobo aporta a la cuenca principalmente porque:",
    opciones: [
      "Sus raíces y su sombra ayudan a retener humedad y frenar la erosión",
      "Produce agua nueva dentro del tronco",
      "Impide que llueva sobre el suelo",
      "Convierte el agua salada en dulce",
    ],
    correcta: 0,
    explicacion:
      "El algarrobo sostiene el suelo con sus raíces, reduce la evaporación con su sombra y frena el viento. Talar bosque seco acelera la desertificación de Piura.",
    dificultad: 3,
  },
  {
    id: "ca-10",
    tema: "ciclo-agua",
    pregunta: "¿Qué es la infiltración en el ciclo del agua?",
    opciones: [
      "El paso del agua desde la superficie hacia el interior del suelo",
      "La formación de nubes en el cielo",
      "La caída de lluvia sobre el mar",
      "El bombeo de agua con motor",
    ],
    correcta: 0,
    explicacion:
      "Es como el suelo 'se bebe' la lluvia y recarga el acuífero. Suelos compactados o pavimentados infiltran poco, y esa agua se pierde como escorrentía.",
    dificultad: 1,
  },

  // ---------------------------------------------------------------- SODIS
  {
    id: "so-01",
    tema: "sodis",
    pregunta: "¿Qué significa el método SODIS?",
    opciones: [
      "Desinfección solar del agua",
      "Sistema de drenaje interno",
      "Sodio disuelto en agua",
      "Filtro de doble arena",
    ],
    correcta: 0,
    explicacion:
      "SODIS viene de 'Solar Water Disinfection'. Usa la radiación ultravioleta del sol y el calor para inactivar bacterias y virus del agua. Es gratis y solo necesita botellas y sol.",
    dificultad: 1,
  },
  {
    id: "so-02",
    tema: "sodis",
    pregunta: "¿Cuántas horas de sol pleno necesita el método SODIS para desinfectar el agua?",
    opciones: ["Unas 6 horas", "15 minutos", "3 días seguidos", "No necesita sol"],
    correcta: 0,
    explicacion:
      "Con sol pleno bastan unas 6 horas. Si el día está muy nublado hacen falta 2 días seguidos. Piura tiene sol de sobra casi todo el año, lo que hace a SODIS muy práctico acá.",
    dificultad: 1,
  },
  {
    id: "so-03",
    tema: "sodis",
    pregunta: "¿Qué tipo de botella funciona para SODIS?",
    opciones: [
      "Plástico PET transparente, sin rayaduras",
      "Plástico grueso de color verde",
      "Botella de metal opaca",
      "Cualquier botella, incluso pintada",
    ],
    correcta: 0,
    explicacion:
      "El PET transparente deja pasar los rayos UV; el plástico de color o rayado los bloquea y la desinfección falla. La botella tampoco debe superar los 3 litros para que la luz llegue al centro.",
    dificultad: 2,
  },
  {
    id: "so-04",
    tema: "sodis",
    pregunta: "Antes de exponer el agua al sol con SODIS, ¿qué hay que hacer si el agua está turbia?",
    opciones: [
      "Filtrarla o dejar que decante hasta que quede clara",
      "Agregarle más tierra para que pese",
      "Hervirla durante una hora",
      "Nada, la turbidez no afecta",
    ],
    correcta: 0,
    explicacion:
      "Las partículas en suspensión bloquean los rayos UV y dan sombra a los microbios. SODIS solo funciona con agua clara: primero filtro o decantación, después sol.",
    dificultad: 2,
  },
  {
    id: "so-05",
    tema: "sodis",
    pregunta: "¿Sobre qué superficie conviene colocar las botellas de SODIS?",
    opciones: [
      "Una lámina metálica o calamina, que refleja y calienta más",
      "Sobre pasto húmedo y a la sombra",
      "Dentro de una caja cerrada de madera",
      "Enterradas en la arena",
    ],
    correcta: 0,
    explicacion:
      "Una superficie reflectante suma radiación por debajo y sube la temperatura del agua. Calor y UV juntos hacen que SODIS sea más rápido y seguro.",
    dificultad: 2,
  },
  {
    id: "so-06",
    tema: "sodis",
    pregunta: "SODIS elimina microbios, pero NO sirve para quitar del agua:",
    opciones: [
      "Metales pesados o productos químicos disueltos",
      "Bacterias como la E. coli",
      "Virus intestinales",
      "Parásitos como la giardia",
    ],
    correcta: 0,
    explicacion:
      "El sol inactiva microbios, pero no elimina plomo, arsénico ni pesticidas. Si sospechas contaminación química, SODIS no es la solución: hay que buscar otra fuente de agua.",
    dificultad: 3,
  },
  {
    id: "so-07",
    tema: "sodis",
    pregunta: "¿Por qué conviene agitar la botella con agua a medio llenar antes de exponerla al sol?",
    opciones: [
      "Para oxigenar el agua, lo que ayuda al efecto desinfectante",
      "Para que el plástico se caliente más rápido",
      "Para que el agua cambie de color",
      "Para romper las botellas más débiles",
    ],
    correcta: 0,
    explicacion:
      "Se llena hasta 3/4, se agita 20 segundos para oxigenar y luego se completa. El oxígeno disuelto potencia el daño solar a los microbios.",
    dificultad: 3,
  },
  {
    id: "so-08",
    tema: "sodis",
    pregunta: "¿Qué hacer con el agua tratada con SODIS después de las 6 horas de sol?",
    opciones: [
      "Beberla desde la misma botella o pasarla a un recipiente limpio y tapado",
      "Dejarla destapada toda la noche al sereno",
      "Mezclarla con agua de pozo sin tratar",
      "Volver a exponerla una semana más",
    ],
    correcta: 0,
    explicacion:
      "Pasarla a un recipiente sucio o destapado arruina todo el trabajo: se vuelve a contaminar. Lo ideal es beber de la misma botella tratada.",
    dificultad: 1,
  },

  // ---------------------------------------------------------------- aguas grises
  {
    id: "ag-01",
    tema: "aguas-grises",
    pregunta: "¿Qué son las aguas grises?",
    opciones: [
      "El agua usada de duchas, lavatorios y lavado de ropa",
      "El agua del inodoro",
      "El agua de lluvia recién caída",
      "El agua embotellada vencida",
    ],
    correcta: 0,
    explicacion:
      "Aguas grises son las que salen de ducha, lavamanos y lavadora: tienen jabón pero no materia fecal. Con cuidado se reúsan para riego o para el inodoro.",
    dificultad: 1,
  },
  {
    id: "ag-02",
    tema: "aguas-grises",
    pregunta: "¿Qué son las aguas negras y por qué NO se pueden reusar en casa?",
    opciones: [
      "Las del inodoro: llevan materia fecal y patógenos peligrosos",
      "Las de la lluvia nocturna, por su color oscuro",
      "Las que salen del caño por la noche",
      "Las aguas grises ya filtradas",
    ],
    correcta: 0,
    explicacion:
      "Las aguas negras contienen bacterias y parásitos que causan enfermedades graves. Su tratamiento requiere plantas especializadas, nunca reúso casero.",
    dificultad: 1,
  },
  {
    id: "ag-03",
    tema: "aguas-grises",
    pregunta: "¿Cuánto tiempo se pueden almacenar aguas grises antes de usarlas?",
    opciones: [
      "Menos de 24 horas: después se pudren y huelen mal",
      "Hasta un mes sin problema",
      "Un año si está tapada",
      "Indefinidamente si se agrega azúcar",
    ],
    correcta: 0,
    explicacion:
      "Los restos orgánicos del jabón y la piel fermentan rápido. Pasadas 24 horas el agua gris se vuelve séptica, huele mal y atrae mosquitos. Úsala el mismo día.",
    dificultad: 2,
  },
  {
    id: "ag-04",
    tema: "aguas-grises",
    pregunta: "Si vas a regar plantas con agua de lavado de ropa, ¿qué detergente conviene usar?",
    opciones: [
      "Uno biodegradable y bajo en sodio y boro",
      "El que tenga más blanqueador posible",
      "Uno con mucho perfume",
      "Da igual, la planta filtra todo",
    ],
    correcta: 0,
    explicacion:
      "El sodio y el boro de muchos detergentes se acumulan en el suelo y matan las plantas con el tiempo. Los biodegradables bajos en sales hacen viable el reúso a largo plazo.",
    dificultad: 2,
  },
  {
    id: "ag-05",
    tema: "aguas-grises",
    pregunta: "¿Sobre qué cultivos NO conviene usar aguas grises?",
    opciones: [
      "Verduras de hoja que se comen crudas, como la lechuga",
      "Árboles frutales altos",
      "Plantas ornamentales del patio",
      "El algarrobo del terreno",
    ],
    correcta: 0,
    explicacion:
      "Si el agua toca la parte que se come cruda, hay riesgo sanitario. Las aguas grises van al pie de árboles y ornamentales, o bajo la tierra con riego subsuperficial.",
    dificultad: 2,
  },
  {
    id: "ag-06",
    tema: "aguas-grises",
    pregunta: "La forma más segura de aplicar aguas grises al huerto es:",
    opciones: [
      "Al pie de la planta o bajo tierra, sin mojar hojas ni frutos",
      "Con aspersor, para cubrir más superficie",
      "Rociándola sobre las hojas al mediodía",
      "Mezclada con agua del inodoro",
    ],
    correcta: 0,
    explicacion:
      "Aplicar al pie evita aerosoles que se respiran y mantiene el agua lejos de la parte comestible. Además reduce la evaporación, así que también ahorra más.",
    dificultad: 2,
  },
  {
    id: "ag-07",
    tema: "aguas-grises",
    pregunta: "Una familia de 4 personas puede recuperar de la ducha y la lavadora, aproximadamente:",
    opciones: [
      "Más de 100 litros por día",
      "Menos de 5 litros por día",
      "Exactamente 10 litros por semana",
      "Nada aprovechable",
    ],
    correcta: 0,
    explicacion:
      "Entre duchas y lavados, una familia genera más de 100 litros diarios de agua gris. Reusarla para riego o inodoro puede recortar un tercio del consumo total del hogar.",
    dificultad: 3,
  },

  // ---------------------------------------------------------------- filtros caseros
  {
    id: "fi-01",
    tema: "filtros",
    pregunta: "En un filtro casero de botella, ¿en qué orden van las capas de abajo hacia arriba?",
    opciones: [
      "Grava gruesa, grava fina, arena gruesa, arena fina, carbón, algodón",
      "Algodón, carbón, arena, grava (al revés)",
      "Solo arena, en una única capa",
      "Tierra de chacra y piedras mezcladas",
    ],
    correcta: 0,
    explicacion:
      "El agua entra por arriba y va encontrando capas cada vez más gruesas al bajar. Las capas finas retienen partículas pequeñas y las gruesas sostienen la estructura y dejan salir el agua.",
    dificultad: 2,
  },
  {
    id: "fi-02",
    tema: "filtros",
    pregunta: "¿Para qué sirve la capa de carbón activado en un filtro casero?",
    opciones: [
      "Atrapa olores, sabores y algunos químicos disueltos",
      "Mata todas las bacterias del agua",
      "Le da color al agua",
      "Calienta el agua al pasar",
    ],
    correcta: 0,
    explicacion:
      "El carbón activado tiene una superficie porosa enorme donde se adhieren moléculas de olor y sabor. No desinfecta: un filtro casero clarifica, pero después hay que hervir, clorar o usar SODIS.",
    dificultad: 2,
  },
  {
    id: "fi-03",
    tema: "filtros",
    pregunta: "Después de filtrar agua turbia con un filtro casero, el agua:",
    opciones: [
      "Queda clara pero todavía puede tener microbios",
      "Ya es 100% potable y segura",
      "Se vuelve más peligrosa que antes",
      "Pierde todo su oxígeno",
    ],
    correcta: 0,
    explicacion:
      "Filtrar quita partículas, no microorganismos. Es el paso previo: primero clarificar, después desinfectar con cloro, hervido o SODIS. Saltarse el segundo paso es el error más común.",
    dificultad: 1,
  },
  {
    id: "fi-04",
    tema: "filtros",
    pregunta: "¿Qué indica que un filtro casero ya necesita mantenimiento?",
    opciones: [
      "El agua sale cada vez más lento o turbia",
      "El filtro se siente frío al tacto",
      "Han pasado exactamente 3 días",
      "El agua sale más rápido que antes",
    ],
    correcta: 0,
    explicacion:
      "Las capas se colmatan con la suciedad retenida. Cuando el caudal cae o el agua ya no sale clara, hay que lavar arena y grava y cambiar el carbón y el algodón.",
    dificultad: 2,
  },
  {
    id: "fi-05",
    tema: "filtros",
    pregunta: "Antes de armar el filtro, la arena y la grava deben:",
    opciones: [
      "Lavarse muy bien hasta que el agua de lavado salga clara",
      "Secarse al horno durante una hora",
      "Mezclarse con detergente",
      "Usarse tal como vienen del río",
    ],
    correcta: 0,
    explicacion:
      "La arena sin lavar trae polvo y arcilla que enturbiarán el agua filtrada. Lavar hasta que el agua de enjuague salga limpia es lo que decide si el filtro funciona o no.",
    dificultad: 2,
  },
  {
    id: "fi-06",
    tema: "filtros",
    pregunta: "¿Qué es la turbidez del agua?",
    opciones: [
      "La cantidad de partículas en suspensión que le quitan transparencia",
      "Su temperatura",
      "Su nivel de sal",
      "La velocidad a la que corre",
    ],
    correcta: 0,
    explicacion:
      "La turbidez mide qué tan 'nublada' está el agua por partículas suspendidas. Importa mucho porque esas partículas protegen a los microbios del cloro y de los rayos UV.",
    dificultad: 3,
  },

  // ---------------------------------------------------------------- riego
  {
    id: "ri-01",
    tema: "riego",
    pregunta: "¿Cuál es el mejor momento del día para regar en Piura?",
    opciones: [
      "Muy temprano en la mañana o al atardecer",
      "Al mediodía, con sol fuerte",
      "A las 2 de la tarde",
      "Da lo mismo la hora",
    ],
    correcta: 0,
    explicacion:
      "Al mediodía buena parte del agua se evapora antes de llegar a la raíz. Regar temprano o al atardecer, cuando baja la temperatura y el viento, aprovecha mucho más cada litro.",
    dificultad: 1,
  },
  {
    id: "ri-02",
    tema: "riego",
    pregunta: "¿Qué es el riego por goteo?",
    opciones: [
      "Entregar agua lenta y directamente en la raíz de cada planta",
      "Inundar todo el terreno de una vez",
      "Rociar agua desde arriba como lluvia",
      "Regar solo cuando llueve",
    ],
    correcta: 0,
    explicacion:
      "El goteo lleva el agua justo donde se necesita, gota a gota. Puede ahorrar hasta 50% frente al riego por inundación y se arma casero con botellas recicladas perforadas.",
    dificultad: 1,
  },
  {
    id: "ri-03",
    tema: "riego",
    pregunta: "¿Para qué sirve el mulch (cobertura de hojas secas o paja sobre el suelo)?",
    opciones: [
      "Reduce la evaporación y mantiene la humedad del suelo",
      "Hace que la planta crezca más rápido por su peso",
      "Reemplaza completamente al riego",
      "Espanta a los pájaros",
    ],
    correcta: 0,
    explicacion:
      "El mulch actúa como una manta: baja la temperatura del suelo, frena la evaporación y además impide que crezcan malezas que compiten por el agua.",
    dificultad: 2,
  },
  {
    id: "ri-04",
    tema: "riego",
    pregunta: "Regar poquito todos los días superficialmente, comparado con regar más cada varios días:",
    opciones: [
      "Es peor: genera raíces cortas y débiles cerca de la superficie",
      "Es siempre mejor para la planta",
      "Da exactamente el mismo resultado",
      "Hace que la planta no necesite sol",
    ],
    correcta: 0,
    explicacion:
      "Si el agua solo moja los primeros centímetros, la raíz no tiene razón para bajar. Riegos más espaciados y profundos crean raíces largas, capaces de aguantar un corte de agua.",
    dificultad: 3,
  },
  {
    id: "ri-05",
    tema: "riego",
    pregunta: "¿Cómo saber si el huerto realmente necesita agua?",
    opciones: [
      "Metiendo el dedo unos centímetros: si está seco abajo, toca regar",
      "Regando siempre a la misma hora sin mirar",
      "Solo mirando el color de las hojas desde lejos",
      "Preguntando cuántos días pasaron, sin importar el clima",
    ],
    correcta: 0,
    explicacion:
      "La superficie puede verse seca mientras abajo hay humedad de sobra. La prueba del dedo evita el riego por costumbre, que es de los mayores desperdicios del huerto familiar.",
    dificultad: 2,
  },
  {
    id: "ri-06",
    tema: "riego",
    pregunta: "Regar con manguera abierta a chorro sobre el suelo desnudo provoca que:",
    opciones: [
      "Se compacte el suelo y buena parte del agua escurra sin infiltrarse",
      "El suelo absorba más rápido y mejor",
      "Las plantas crezcan el doble",
      "Se ahorre agua respecto al goteo",
    ],
    correcta: 0,
    explicacion:
      "El chorro fuerte golpea y sella la superficie del suelo. El agua entonces corre por encima en vez de infiltrar: gastas litros y la raíz recibe poco.",
    dificultad: 3,
  },
  {
    id: "ri-07",
    tema: "riego",
    pregunta: "Un sistema de goteo casero con botellas recicladas se hace:",
    opciones: [
      "Perforando agujeros pequeños y enterrando la botella junto a la raíz",
      "Cortando la botella por la mitad y tirándole el agua encima",
      "Llenando la botella y dejándola cerrada al sol",
      "Colgando la botella del techo",
    ],
    correcta: 0,
    explicacion:
      "La botella enterrada con micro-perforaciones libera agua lentamente donde la raíz la toma. Es la versión de costo cero del riego por goteo industrial.",
    dificultad: 1,
  },

  // ---------------------------------------------------------------- cosecha de lluvia
  {
    id: "cl-01",
    tema: "cosecha-lluvia",
    pregunta: "En la cosecha de lluvia, ¿por qué se descartan los primeros litros que caen del techo?",
    opciones: [
      "Porque arrastran polvo, hojas y excrementos de aves del techo",
      "Porque están demasiado fríos",
      "Porque tienen mucha sal",
      "Porque son los más limpios y se guardan aparte",
    ],
    correcta: 0,
    explicacion:
      "Es el 'primer lavado' o first flush. El techo acumula suciedad entre lluvias; desviar esos primeros litros al desagüe mejora muchísimo la calidad de todo lo que guardes después.",
    dificultad: 2,
  },
  {
    id: "cl-02",
    tema: "cosecha-lluvia",
    pregunta: "Con un techo de 50 m² y una lluvia de 20 mm, se pueden cosechar aproximadamente:",
    opciones: ["1000 litros", "10 litros", "50 litros", "100 000 litros"],
    correcta: 0,
    explicacion:
      "La cuenta es simple: metros cuadrados × milímetros de lluvia = litros. 50 × 20 = 1000 litros. Un solo aguacero de El Niño puede llenar un reservorio familiar entero.",
    dificultad: 3,
  },
  {
    id: "cl-03",
    tema: "cosecha-lluvia",
    pregunta: "¿Por qué el tanque de agua de lluvia debe estar tapado?",
    opciones: [
      "Para evitar mosquitos, algas y que caiga suciedad",
      "Para que el agua no se enfríe",
      "Para que pese menos",
      "Para que el agua no se escape por arriba",
    ],
    correcta: 0,
    explicacion:
      "Un tanque destapado se vuelve criadero de zancudos —con riesgo de dengue, serio en Piura— y la luz solar hace crecer algas. Tapa hermética y malla en la entrada.",
    dificultad: 1,
  },
  {
    id: "cl-04",
    tema: "cosecha-lluvia",
    pregunta: "¿Qué techo NO conviene para cosechar agua de lluvia destinada a consumo?",
    opciones: [
      "Uno con pintura con plomo o material de asbesto",
      "Calamina limpia",
      "Techo de concreto sellado",
      "Teja cerámica en buen estado",
    ],
    correcta: 0,
    explicacion:
      "El agua arrastra lo que toca. Plomo y asbesto son tóxicos y no se quitan con filtro casero. Con esos techos el agua cosechada solo sirve para riego o limpieza.",
    dificultad: 3,
  },
  {
    id: "cl-05",
    tema: "cosecha-lluvia",
    pregunta: "El agua de lluvia recién cosechada y guardada, para beberla:",
    opciones: [
      "Debe desinfectarse primero (cloro, hervido o SODIS)",
      "Es potable directamente sin tratamiento",
      "Nunca puede beberse de ninguna forma",
      "Solo sirve si se congela antes",
    ],
    correcta: 0,
    explicacion:
      "La lluvia en sí es bastante limpia, pero se contamina en el techo, la canaleta y el tanque. Desinfectar antes de beber no es opcional.",
    dificultad: 2,
  },
  {
    id: "cl-06",
    tema: "cosecha-lluvia",
    pregunta: "¿Cada cuánto conviene limpiar canaletas y techo si vas a cosechar lluvia?",
    opciones: [
      "Antes de la temporada de lluvias y durante ella",
      "Una sola vez en la vida",
      "Solo cuando el tanque esté lleno",
      "Nunca, se limpian solos con la lluvia",
    ],
    correcta: 0,
    explicacion:
      "Hojas y sedimento tapan canaletas y contaminan lo cosechado. En Piura, revisar antes de la temporada de lluvias es la diferencia entre llenar el tanque o perder el aguacero.",
    dificultad: 1,
  },

  // ---------------------------------------------------------------- huella hídrica
  {
    id: "hh-01",
    tema: "huella-hidrica",
    pregunta: "¿Qué es la 'huella hídrica' de un producto?",
    opciones: [
      "Todo el agua que se usó para producirlo, de principio a fin",
      "El agua que contiene el producto por dentro",
      "Lo que pesa mojado",
      "El agua que se usa al lavarlo en casa",
    ],
    correcta: 0,
    explicacion:
      "Incluye el agua de riego de los cultivos, la de la fábrica y la que se contamina en el proceso. Es 'agua virtual': no la ves, pero se gastó igual.",
    dificultad: 1,
  },
  {
    id: "hh-02",
    tema: "huella-hidrica",
    pregunta: "¿Cuál de estos alimentos tiene la MAYOR huella hídrica por kilo?",
    opciones: ["Carne de res", "Papa", "Arroz", "Tomate"],
    correcta: 0,
    explicacion:
      "Un kilo de carne de res necesita unos 15 000 litros, contando el agua de todo el pasto y forraje que el animal comió durante años. La papa ronda los 290 litros por kilo.",
    dificultad: 1,
  },
  {
    id: "hh-03",
    tema: "huella-hidrica",
    pregunta: "Producir una camiseta de algodón requiere aproximadamente:",
    opciones: ["2700 litros de agua", "27 litros", "10 litros", "270 000 litros"],
    correcta: 0,
    explicacion:
      "Casi todo se va en regar el algodón, un cultivo muy sediento, más el teñido. Equivale a lo que una persona bebe en unos 3 años: por eso alargar la vida de la ropa ahorra tanta agua.",
    dificultad: 2,
  },
  {
    id: "hh-04",
    tema: "huella-hidrica",
    pregunta: "Entre estas acciones, la que más agua ahorra en un año es:",
    opciones: [
      "Reducir el desperdicio de comida en casa",
      "Cerrar el caño al cepillarse",
      "Barrer el patio en vez de mangueriarlo",
      "Usar un vaso más pequeño para beber",
    ],
    correcta: 0,
    explicacion:
      "Tirar comida tira también toda el agua virtual que costó producirla, que es muchísimo más que la del caño. Los hábitos directos suman, pero el desperdicio de alimentos pesa más.",
    dificultad: 3,
  },
  {
    id: "hh-05",
    tema: "huella-hidrica",
    pregunta: "¿Por qué un celular tiene huella hídrica si no se riega ni se cocina?",
    opciones: [
      "Porque se usa agua para extraer minerales y fabricar sus componentes",
      "Porque funciona con agua adentro",
      "Porque se lava antes de venderlo",
      "En realidad no tiene huella hídrica",
    ],
    correcta: 0,
    explicacion:
      "La minería de metales y la fabricación de chips consumen y contaminan grandes volúmenes de agua. Todo producto industrial tiene huella hídrica, aunque nunca la veas.",
    dificultad: 2,
  },
  {
    id: "hh-06",
    tema: "huella-hidrica",
    pregunta: "Se llama 'agua virtual' a:",
    opciones: [
      "El agua usada para producir un bien, que viaja con él al comerciarlo",
      "El agua de las piscinas digitales",
      "El agua de los videojuegos",
      "El vapor de agua de la atmósfera",
    ],
    correcta: 0,
    explicacion:
      "Cuando un país exporta paltas o espárragos, exporta también el agua que se usó para regarlos. Piura, con agricultura de exportación, es un caso muy claro de esto.",
    dificultad: 3,
  },

  // ---------------------------------------------------------------- fugas
  {
    id: "fu-01",
    tema: "fugas",
    pregunta: "Un caño que gotea una vez por segundo desperdicia al día aproximadamente:",
    opciones: ["Unos 30 litros", "Medio litro", "300 litros", "3 litros"],
    correcta: 0,
    explicacion:
      "Parece insignificante, pero un goteo constante supera los 30 litros diarios: más de 10 000 litros al año por un solo caño mal cerrado.",
    dificultad: 2,
  },
  {
    id: "fu-02",
    tema: "fugas",
    pregunta: "¿Cómo detectar una fuga oculta en las tuberías de la casa?",
    opciones: [
      "Cerrar todos los caños y ver si el medidor sigue girando",
      "Escuchar el techo por la noche",
      "Revisar el color del agua",
      "Contar cuántas veces se usa el inodoro",
    ],
    correcta: 0,
    explicacion:
      "Si nadie usa agua y el medidor avanza, hay fuga en algún punto de la instalación. Es la prueba más simple y detecta pérdidas que no se ven.",
    dificultad: 2,
  },
  {
    id: "fu-03",
    tema: "fugas",
    pregunta: "¿Cómo saber si el inodoro tiene una fuga interna?",
    opciones: [
      "Echar unas gotas de colorante al tanque y ver si el agua de la taza se tiñe sin jalar",
      "Pesar el inodoro",
      "Escuchar si hace eco",
      "Mirar si la tapa está floja",
    ],
    correcta: 0,
    explicacion:
      "Si el color aparece en la taza sin haber jalado, el empaque del tanque está filtrando. Un inodoro con fuga silenciosa puede perder cientos de litros al día.",
    dificultad: 2,
  },
  {
    id: "fu-04",
    tema: "fugas",
    pregunta: "El teflón (cinta blanca de plomería) se usa para:",
    opciones: [
      "Sellar la rosca de una unión y evitar que gotee",
      "Pegar tuberías rotas por la mitad",
      "Limpiar el agua sucia",
      "Pintar las tuberías",
    ],
    correcta: 0,
    explicacion:
      "El teflón rellena los micro-espacios entre roscas. Se enrolla en el sentido en que gira la rosca, si no se desenrolla al ajustar y la fuga sigue.",
    dificultad: 1,
  },
  {
    id: "fu-05",
    tema: "fugas",
    pregunta: "Si el flotador del tanque elevado está mal regulado, lo que ocurre es:",
    opciones: [
      "El tanque rebalsa y el agua se pierde por el rebose",
      "El agua sale más caliente",
      "El tanque se llena más rápido y se ahorra",
      "No pasa nada relevante",
    ],
    correcta: 0,
    explicacion:
      "Un flotador mal regulado deja entrar agua sin parar: se pierde por el rebose sin que nadie lo note. Revisarlo es una de las reparaciones más rentables del hogar.",
    dificultad: 2,
  },
  {
    id: "fu-06",
    tema: "fugas",
    pregunta: "Una mancha de humedad permanente en una pared interior suele indicar:",
    opciones: [
      "Una fuga en una tubería empotrada",
      "Que la pared necesita pintura",
      "Que hay mucho calor afuera",
      "Que la casa es muy antigua",
    ],
    correcta: 0,
    explicacion:
      "Las fugas empotradas se delatan por humedad, pintura descascarada u hongos. Cuanto más se demora en repararlas, más agua se pierde y más daño estructural causan.",
    dificultad: 2,
  },

  // ---------------------------------------------------------------- cloración
  {
    id: "cl2-01",
    tema: "cloracion",
    pregunta: "Para desinfectar agua con lejía casera, la dosis habitual es de aproximadamente:",
    opciones: [
      "2 gotas por litro de agua clara",
      "2 cucharadas por litro",
      "Medio vaso por litro",
      "20 gotas por litro",
    ],
    correcta: 0,
    explicacion:
      "Con lejía al 5% sin perfume, 2 gotas por litro bastan para agua clara. Más cloro no desinfecta mejor: solo la vuelve desagradable y potencialmente dañina.",
    dificultad: 2,
  },
  {
    id: "cl2-02",
    tema: "cloracion",
    pregunta: "Después de agregar el cloro al agua, ¿cuánto hay que esperar antes de beberla?",
    opciones: ["Al menos 30 minutos", "5 segundos", "Un día completo", "No hay que esperar"],
    correcta: 0,
    explicacion:
      "El cloro necesita tiempo de contacto para inactivar los microbios. Beber de inmediato es como no haber clorado. Si el agua estaba turbia, mejor esperar más.",
    dificultad: 1,
  },
  {
    id: "cl2-03",
    tema: "cloracion",
    pregunta: "¿Qué tipo de lejía sirve para desinfectar agua de consumo?",
    opciones: [
      "Lejía sin perfume, sin detergente y sin aditivos",
      "Lejía perfumada con aroma a limón",
      "Lejía en gel para inodoros",
      "Cualquier limpiador que diga 'desinfectante'",
    ],
    correcta: 0,
    explicacion:
      "Los perfumes, espesantes y detergentes de las lejías de limpieza son tóxicos si se ingieren. Solo sirve hipoclorito de sodio puro, sin aditivos.",
    dificultad: 2,
  },
  {
    id: "cl2-04",
    tema: "cloracion",
    pregunta: "Si el agua está turbia, clorarla directamente:",
    opciones: [
      "No es efectivo: las partículas protegen a los microbios del cloro",
      "Funciona incluso mejor que con agua clara",
      "Hace que el agua se aclare sola",
      "Da el mismo resultado",
    ],
    correcta: 0,
    explicacion:
      "El cloro se consume reaccionando con la materia orgánica en suspensión y no alcanza a los microbios escondidos. Siempre: primero filtrar o decantar, después clorar.",
    dificultad: 3,
  },
  {
    id: "cl2-05",
    tema: "cloracion",
    pregunta: "Hervir el agua para desinfectarla requiere mantenerla en ebullición durante:",
    opciones: [
      "Al menos 1 minuto (3 minutos en zonas muy altas)",
      "5 segundos",
      "Una hora completa",
      "No hace falta que hierva, basta con entibiarla",
    ],
    correcta: 0,
    explicacion:
      "Un minuto de ebullición plena mata bacterias, virus y parásitos. Hervir más tiempo solo gasta combustible y evapora el agua sin agregar seguridad.",
    dificultad: 1,
  },
  {
    id: "cl2-06",
    tema: "cloracion",
    pregunta: "El leve olor a cloro en el agua de la red pública significa que:",
    opciones: [
      "Tiene cloro residual protegiéndola de contaminación en las tuberías",
      "Está contaminada y no debe beberse",
      "Le falta tratamiento",
      "Se le agregó jabón",
    ],
    correcta: 0,
    explicacion:
      "El cloro residual es intencional: mantiene el agua segura durante todo su recorrido por la red hasta tu casa. Su ausencia total sería la señal preocupante.",
    dificultad: 3,
  },

  // ---------------------------------------------------------------- río Piura
  {
    id: "rp-01",
    tema: "rio-piura",
    pregunta: "¿Cuál es el principal problema de arrojar plásticos al río Piura?",
    opciones: [
      "Contamina el agua, daña la fauna y tapa el cauce agravando inundaciones",
      "Solo afecta el aspecto visual",
      "Hace que el agua sepa distinto",
      "Aumenta el caudal del río",
    ],
    correcta: 0,
    explicacion:
      "La basura obstruye el cauce y los drenajes, lo que en época de lluvias empeora las inundaciones. Además los animales la ingieren y se degrada en microplásticos que entran a la cadena alimentaria.",
    dificultad: 1,
  },
  {
    id: "rp-02",
    tema: "rio-piura",
    pregunta: "Los manglares de la costa de Piura son importantes porque:",
    opciones: [
      "Son criaderos de especies marinas y protegen la costa de la erosión",
      "Producen agua dulce",
      "Impiden que llueva",
      "Sirven solo como adorno turístico",
    ],
    correcta: 0,
    explicacion:
      "Los manglares de San Pedro de Vice y Tumbes son guardería de conchas negras, cangrejos y peces, y sus raíces frenan el oleaje protegiendo la costa de la erosión.",
    dificultad: 2,
  },
  {
    id: "rp-03",
    tema: "rio-piura",
    pregunta: "¿Qué es una cuenca hidrográfica?",
    opciones: [
      "Todo el territorio cuyas aguas drenan hacia un mismo río",
      "El lugar donde nace un río",
      "Un pozo profundo",
      "La parte más honda del mar",
    ],
    correcta: 0,
    explicacion:
      "La cuenca del río Piura abarca desde la sierra de Huancabamba hasta el mar. Lo que se hace en la parte alta —talar, contaminar— afecta directamente a Morropón y a toda la parte baja.",
    dificultad: 2,
  },
  {
    id: "rp-04",
    tema: "rio-piura",
    pregunta: "El reservorio de Poechos, en Piura, sirve principalmente para:",
    opciones: [
      "Almacenar agua para riego y controlar avenidas",
      "Producir agua mineral embotellada",
      "Criar peces ornamentales",
      "Generar lluvia artificial",
    ],
    correcta: 0,
    explicacion:
      "Poechos regula el agua del río Chira para la agricultura del valle y amortigua las crecidas. Su capacidad ha bajado con los años por la acumulación de sedimentos.",
    dificultad: 3,
  },
  {
    id: "rp-05",
    tema: "rio-piura",
    pregunta: "¿Por qué es un problema arrojar aceite usado de cocina al desagüe?",
    opciones: [
      "Un litro puede contaminar miles de litros de agua y tapa las tuberías",
      "Hace que el agua huela rico",
      "No pasa nada, el agua lo disuelve",
      "Solo afecta si es aceite de oliva",
    ],
    correcta: 0,
    explicacion:
      "El aceite forma una película que impide la oxigenación del agua y mata la vida acuática. Lo correcto es juntarlo en un envase cerrado y llevarlo a un punto de acopio.",
    dificultad: 2,
  },
  {
    id: "rp-06",
    tema: "rio-piura",
    pregunta: "El algarrobo es un árbol clave del bosque seco piurano porque:",
    opciones: [
      "Resiste la sequía con raíces muy profundas y fija nitrógeno al suelo",
      "Necesita riego diario abundante",
      "Solo crece en zonas lluviosas",
      "No da ningún fruto aprovechable",
    ],
    correcta: 0,
    explicacion:
      "Sus raíces alcanzan el acuífero a decenas de metros, sobrevive sin lluvia por años, mejora el suelo y da algarroba para alimento y algarrobina. Es el árbol emblema de la región.",
    dificultad: 2,
  },

  // ---------------------------------------------------------------- salud
  {
    id: "sa-01",
    tema: "salud",
    pregunta: "¿Cuál es la enfermedad más común transmitida por agua contaminada?",
    opciones: [
      "Las enfermedades diarreicas agudas",
      "La gripe estacional",
      "La miopía",
      "La anemia por falta de hierro",
    ],
    correcta: 0,
    explicacion:
      "Las diarreas por agua contaminada son una de las principales causas de muerte infantil en el mundo. Agua segura y lavado de manos son las dos medidas que más vidas salvan.",
    dificultad: 1,
  },
  {
    id: "sa-02",
    tema: "salud",
    pregunta: "Los recipientes de agua almacenada y destapados en el patio son peligrosos porque:",
    opciones: [
      "Son criaderos del zancudo que transmite el dengue",
      "Hacen que el agua se evapore más lento",
      "Atraen a las aves",
      "Enfrían demasiado el agua",
    ],
    correcta: 0,
    explicacion:
      "El Aedes aegypti se reproduce en agua limpia y quieta. En Piura, tapar todo recipiente almacenado es medida directa de prevención del dengue, no solo de ahorro.",
    dificultad: 1,
  },
  {
    id: "sa-03",
    tema: "salud",
    pregunta: "¿Cuándo es más importante lavarse las manos con agua y jabón?",
    opciones: [
      "Antes de comer o cocinar y después de ir al baño",
      "Solo cuando se ven sucias",
      "Una vez al día al despertar",
      "Solo si se tocó un animal",
    ],
    correcta: 0,
    explicacion:
      "Esos dos momentos cortan la vía fecal-oral, que es como se transmiten la mayoría de las enfermedades diarreicas. 20 segundos con jabón bastan, y se hace con el caño cerrado.",
    dificultad: 1,
  },
  {
    id: "sa-04",
    tema: "salud",
    pregunta: "Guardar agua tratada en un recipiente sucio y destapado:",
    opciones: [
      "La vuelve a contaminar y anula todo el tratamiento",
      "La mantiene igual de segura",
      "La mejora porque toma aire",
      "Solo cambia su sabor",
    ],
    correcta: 0,
    explicacion:
      "La recontaminación en el almacenamiento es el fallo más frecuente. De nada sirve hervir o clorar si después el agua va a un balde sucio o se saca con un vaso que estuvo en el piso.",
    dificultad: 2,
  },
  {
    id: "sa-05",
    tema: "salud",
    pregunta: "El agua de un pozo que se ve totalmente cristalina:",
    opciones: [
      "Puede estar contaminada igual: los microbios no se ven",
      "Siempre es segura para beber",
      "Nunca necesita tratamiento",
      "Es automáticamente agua mineral",
    ],
    correcta: 0,
    explicacion:
      "Bacterias, virus y arsénico son invisibles. La transparencia dice algo sobre la turbidez, nada sobre la seguridad microbiológica o química.",
    dificultad: 2,
  },
  {
    id: "sa-06",
    tema: "salud",
    pregunta: "¿Cuántos litros de agua segura necesita una persona por día como mínimo, para beber, cocinar e higiene básica?",
    opciones: ["Entre 20 y 50 litros", "2 litros", "200 litros", "500 litros"],
    correcta: 0,
    explicacion:
      "La OMS considera de 20 a 50 litros diarios por persona el mínimo para cubrir bebida, alimentos e higiene. Por debajo de 20 hay riesgo sanitario serio.",
    dificultad: 3,
  },

  // ---------------------------------------------------------------- consumo en casa
  {
    id: "co-01",
    tema: "consumo",
    pregunta: "¿Qué gasta más agua en un hogar típico?",
    opciones: [
      "El inodoro y la ducha",
      "Lavarse los dientes",
      "Beber agua",
      "Lavar un vaso",
    ],
    correcta: 0,
    explicacion:
      "Inodoro y ducha concentran la mayor parte del consumo doméstico. Por eso una ducha más corta o un inodoro sin fugas ahorran mucho más que cualquier otro gesto.",
    dificultad: 1,
  },
  {
    id: "co-02",
    tema: "consumo",
    pregunta: "Una ducha de 10 minutos, comparada con una de 4 minutos:",
    opciones: [
      "Gasta más del doble de agua",
      "Gasta lo mismo",
      "Gasta apenas un poco más",
      "Gasta menos porque se calienta antes",
    ],
    correcta: 0,
    explicacion:
      "La ducha gasta entre 10 y 20 litros por minuto. Pasar de 10 a 4 minutos ahorra unos 100 litros por baño: en una familia de cuatro, 400 litros diarios.",
    dificultad: 1,
  },
  {
    id: "co-03",
    tema: "consumo",
    pregunta: "Lavar los platos con el caño abierto todo el tiempo, frente a usar una batea con agua:",
    opciones: [
      "Gasta varias veces más agua",
      "Gasta lo mismo",
      "Gasta menos porque es más rápido",
      "Es más higiénico y por eso vale la pena",
    ],
    correcta: 0,
    explicacion:
      "El caño abierto puede soltar 12 litros por minuto. Enjabonar todo con el caño cerrado y enjuagar junto ahorra decenas de litros por lavada.",
    dificultad: 1,
  },
  {
    id: "co-04",
    tema: "consumo",
    pregunta: "Lavar el carro o la moto con manguera, frente a hacerlo con balde:",
    opciones: [
      "Puede gastar hasta 10 veces más agua",
      "Gasta lo mismo",
      "Gasta menos agua",
      "No usa agua en absoluto",
    ],
    correcta: 0,
    explicacion:
      "Una manguera abierta 15 minutos supera los 150 litros; con dos baldes bastan unos 20. Lo mismo vale para barrer el patio en vez de mangueriarlo.",
    dificultad: 1,
  },
  {
    id: "co-05",
    tema: "consumo",
    pregunta: "Un aireador en el caño (esa rejilla en la punta) sirve para:",
    opciones: [
      "Mezclar aire con el agua y reducir el caudal sin que se note",
      "Calentar el agua",
      "Filtrar bacterias",
      "Aumentar la presión para gastar más",
    ],
    correcta: 0,
    explicacion:
      "El aireador da sensación de chorro abundante usando bastante menos agua. Es de las mejoras más baratas y efectivas que existen para un hogar.",
    dificultad: 2,
  },
  {
    id: "co-06",
    tema: "consumo",
    pregunta: "Juntar en un balde el agua fría que sale al inicio de la ducha sirve para:",
    opciones: [
      "Aprovecharla en regar, limpiar el patio o el inodoro",
      "Nada, es agua perdida",
      "Beberla directamente sin tratar",
      "Devolverla al tanque de agua potable",
    ],
    correcta: 0,
    explicacion:
      "Esos primeros litros son agua potable perfectamente limpia que normalmente se va por el desagüe. Recuperarla es ahorro puro sin cambiar ningún hábito más.",
    dificultad: 1,
  },
  {
    id: "co-07",
    tema: "consumo",
    pregunta: "Durante un corte de agua programado, lo más importante es:",
    opciones: [
      "Almacenar agua en recipientes limpios y tapados antes del corte",
      "Dejar los caños abiertos para que avise cuando vuelva",
      "Gastar toda el agua del tanque antes",
      "Esperar sin hacer nada",
    ],
    correcta: 0,
    explicacion:
      "Los caños abiertos inundan la casa cuando vuelve el servicio y ensucian la red con aire y sedimento. Lo correcto es cerrarlos y tener reserva tapada lista.",
    dificultad: 2,
  },
  {
    id: "co-08",
    tema: "consumo",
    pregunta: "Usar la lavadora con carga completa en vez de media carga varias veces:",
    opciones: [
      "Ahorra agua y energía por prenda lavada",
      "Gasta más agua en total",
      "Da exactamente lo mismo",
      "Daña la ropa",
    ],
    correcta: 0,
    explicacion:
      "Una lavadora usa casi la misma agua esté llena o a medias. Juntar la ropa de la familia en una sola tanda semanal es de los ahorros más grandes del hogar.",
    dificultad: 1,
  },
  {
    id: "co-09",
    tema: "consumo",
    pregunta: "El agua de cocinar verduras o hervir papas, ya fría:",
    opciones: [
      "Sirve para regar plantas, porque tiene nutrientes",
      "Debe tirarse siempre al desagüe",
      "Es tóxica para las plantas",
      "Solo sirve si se le agrega cloro",
    ],
    correcta: 0,
    explicacion:
      "Tiene minerales que las plantas aprovechan. Solo hay que asegurarse de que no tenga sal, porque el sodio sí daña el suelo y las raíces.",
    dificultad: 2,
  },
  {
    id: "co-10",
    tema: "consumo",
    pregunta: "¿Qué mide el medidor de agua de una casa?",
    opciones: [
      "El volumen de agua que entra, normalmente en metros cúbicos",
      "La presión del agua solamente",
      "La calidad del agua",
      "La temperatura del agua",
    ],
    correcta: 0,
    explicacion:
      "Un metro cúbico son 1000 litros. Leer el medidor cada semana permite notar un consumo raro, que casi siempre significa una fuga escondida.",
    dificultad: 2,
  },
];

/**
 * Saca `cantidad` preguntas al azar intentando no repetir tema, para que una
 * partida no salga toda de cloración. Si se piden más preguntas que temas
 * distintos, vuelve a pasar por los temas ya usados.
 */
export function sortearPreguntas(cantidad: number): PreguntaQuiz[] {
  const porTema = new Map<QuizTema, PreguntaQuiz[]>();
  for (const p of BANCO_PREGUNTAS) {
    const lista = porTema.get(p.tema) ?? [];
    lista.push(p);
    porTema.set(p.tema, lista);
  }

  for (const lista of porTema.values()) barajar(lista);
  const temas = barajar([...porTema.keys()]);

  const elegidas: PreguntaQuiz[] = [];
  let vuelta = 0;
  while (elegidas.length < cantidad && vuelta < 20) {
    for (const tema of temas) {
      const lista = porTema.get(tema);
      const siguiente = lista?.[vuelta];
      if (siguiente) elegidas.push(siguiente);
      if (elegidas.length === cantidad) break;
    }
    vuelta++;
  }

  return barajar(elegidas).slice(0, cantidad);
}

/** Fisher-Yates in place — también lo usa el motor para barajar las 4 opciones. */
export function barajar<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
