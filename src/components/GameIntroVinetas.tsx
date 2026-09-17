import { motion } from "framer-motion";
import type { Minigame, MinigameType } from "../utils/gamification";

// Reemplazo del placeholder de video mock. Tres viñetas ilustradas en vez de un
// MP4: pesan 0 KB, cargan al instante y funcionan sin conexión — que es lo que
// promete la app —, además de leerse más rápido que ver 9 segundos de video.
// Estilo warm-neobrutalism: borde 3px, sombra dura, paleta de la plataforma.

interface Vineta {
  emoji: string;
  titulo: string;
  texto: string;
}

const TONOS = ["bg-[#99B4D8]", "bg-[#FFB793]", "bg-[#E26D5C]"] as const;

const VINETAS: Record<MinigameType, [Vineta, Vineta, Vineta]> = {
  FUGAS_DETECT: [
    { emoji: "💧", titulo: "Aparecen fugas", texto: "Grifos, inodoros y mangueras empiezan a botar agua por toda la casa." },
    { emoji: "🔧", titulo: "Arrastra la herramienta", texto: "Llave, teflón o válvula: cada fuga necesita la suya. Elige bien." },
    { emoji: "📊", titulo: "Cuida el medidor", texto: "Si se desborda, perdiste. Cierra todo antes de que llegue al tope." },
  ],
  HUELLA_HIDRICA: [
    { emoji: "🥩", titulo: "Dos productos", texto: "Aparecen cara a cara. Cada uno esconde litros de agua que no se ven." },
    { emoji: "👆", titulo: "Toca el que gasta más", texto: "¿Carne o camiseta? Decide cuál tiene la huella hídrica más grande." },
    { emoji: "🔥", titulo: "Encadena combos", texto: "Aciertos seguidos multiplican tu puntaje. Fallar corta la racha." },
  ],
  COSECHA_LLUVIA: [
    { emoji: "🌧️", titulo: "Llega el aguacero", texto: "El techo empieza a juntar agua y baja por las canaletas." },
    { emoji: "🚰", titulo: "Desvía lo sucio", texto: "Los primeros litros traen polvo y hojas: mándalos al desagüe." },
    { emoji: "🪣", titulo: "Abre al tanque", texto: "Recién entonces deja pasar el agua limpia al filtro y al reservorio." },
  ],
  RIEGO_OPT: [
    { emoji: "🕐", titulo: "Avanza el día", texto: "El reloj corre de la mañana al atardecer sobre tu biohuerto." },
    { emoji: "🌱", titulo: "Elige la técnica", texto: "Goteo con botellas, mulch de hojas o riego nocturno según la hora." },
    { emoji: "☀️", titulo: "Evita el mediodía", texto: "Regar con sol fuerte evapora casi todo. Esa decisión te resta puntos." },
  ],
  FILTROS_LAB: [
    { emoji: "🫙", titulo: "Botella vacía", texto: "Tienes que armar el filtro antes de que caiga el agua turbia." },
    { emoji: "🪨", titulo: "Ordena las capas", texto: "Grava, arenas, carbón y algodón: de abajo hacia arriba, en orden." },
    { emoji: "🧪", titulo: "3 rondas", texto: "Cada ronda suma capas y baja el tiempo. Se pone difícil rápido." },
  ],
  RUTAS_AGUAS: [
    { emoji: "🧺", titulo: "Sale de la lavadora", texto: "El agua gris busca camino por un tablero de tuberías desordenadas." },
    { emoji: "🔀", titulo: "Toca para rotar", texto: "Gira cada tubo hasta armar una ruta continua sin fugas." },
    { emoji: "🌳", titulo: "Llega al biohuerto", texto: "Conecta al huerto o al inodoro — nunca a las tuberías de aguas negras." },
  ],
  SODIS_UV: [
    { emoji: "🧴", titulo: "Botellas contaminadas", texto: "Botellas PET con agua y bacterias multiplicándose adentro." },
    { emoji: "🪞", titulo: "Refleja el sol", texto: "Arrastra el espejo para dirigir los rayos UV a cada botella." },
    { emoji: "⚡", titulo: "Power-up del mediodía", texto: "EcoDrop potencia el sol. Úsalo cuando más botellas haya en riesgo." },
  ],
  GUARDIAN_RIO: [
    { emoji: "🏞️", titulo: "Baja el río Piura", texto: "Por la corriente vienen basura y también fauna del manglar." },
    { emoji: "➡️", titulo: "Desliza la basura", texto: "Plásticos y latas a la derecha, al reciclaje. Rápido." },
    { emoji: "⬅️", titulo: "Deja pasar la vida", texto: "Peces, patos y hojas siguen libres a la izquierda. No te confundas." },
  ],
  DUCHA_MUSICAL: [
    { emoji: "🎵", titulo: "Suena la canción", texto: "Una ducha de 4 minutos marcada al ritmo de la música." },
    { emoji: "🧼", titulo: "Enjabónate", texto: "En los compases marcados toca cerrar la llave mientras te enjabonas." },
    { emoji: "🚿", titulo: "No dejes correr", texto: "Cada segundo con el agua abierta de más te pinta la barra en rojo." },
  ],
  CORTE_AGUA: [
    { emoji: "🛢️", titulo: "1000 litros", texto: "Es todo lo que tiene tu hogar para aguantar 3 días de corte." },
    { emoji: "🃏", titulo: "Tarjetas de decisión", texto: "Cada día aparecen dilemas: cocinar, lavar, bañarse. Elige." },
    { emoji: "🧼", titulo: "Sin perder higiene", texto: "Ahorrar a costa de la salud también es perder. Busca el equilibrio." },
  ],
  ACUIFERO_ALGARROBO: [
    { emoji: "🌳", titulo: "Raíz de algarrobo", texto: "Baja buscando el acuífero secreto bajo el bosque seco de Piura." },
    { emoji: "🪨", titulo: "Esquiva obstáculos", texto: "Usa ⬅️➡️ para evitar rocas y filtraciones contaminadas." },
    { emoji: "💧", titulo: "Recoge acuíferos", texto: "Cada bolsa de agua subterránea suma. 3 rondas cada vez más hondas." },
  ],
  CLORACION_SEGURA: [
    { emoji: "🏺", titulo: "Jarras y bidones", texto: "Cada recipiente necesita su dosis exacta de cloro para ser seguro." },
    { emoji: "💧", titulo: "2 gotas por litro", texto: "Mantén presionado el gotero y suelta en el número exacto." },
    { emoji: "⚠️", titulo: "Ni más ni menos", texto: "Pasarte no desinfecta mejor: arruina el agua igual que quedarse corto." },
  ],
  QUIZ_AGUA: [
    { emoji: "❓", titulo: "10 preguntas", texto: "Sobre agua, Piura y todo lo que enseñan los cursos de la Academia." },
    { emoji: "⏱️", titulo: "Contrarreloj", texto: "Responder rápido suma más. Cuatro opciones, una sola correcta." },
    { emoji: "💡", titulo: "Aprende al fallar", texto: "Después de cada respuesta te explicamos por qué. Ese es el punto." },
  ],
  CONSTRUYE_WASI: [
    { emoji: "👆", titulo: "Toca para construir", texto: "Elige una pieza abajo y tócala en el terreno. Toca otra vez para quitarla." },
    { emoji: "🔗", titulo: "Conecta el camino", texto: "El agua solo pasa entre piezas que se tocan por un lado. Sin diagonales." },
    { emoji: "⚗️", titulo: "Filtra lo que se bebe", texto: "La ducha necesita agua filtrada. El biohuerto acepta agua sin filtrar." },
  ],
  MEMORAMA_AGUA: [
    { emoji: "🧠", titulo: "Empieza fácil, sube de a poco", texto: "4 cartas al principio, +2 por cada nivel que despejás, hasta 30." },
    { emoji: "🔥", titulo: "Encadena combo", texto: "Acertar seguido suma combo. Fallar lo reinicia a cero." },
    { emoji: "💡", titulo: "Aprende al acertar", texto: "Cada pareja encontrada muestra un dato real de ahorro de agua." },
  ],
};

export default function GameIntroVinetas({
  game,
  onStart,
}: {
  game: Minigame;
  onStart: () => void;
}) {
  const vinetas = VINETAS[game.type];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border-2 border-ink bg-[#E26D5C] px-3 py-1 text-[11px] font-black text-white">
          {game.xpMaxReward} HydroPuntos máx.
        </span>
        <span className="rounded-full border-2 border-ink bg-surface px-3 py-1 text-[11px] font-black">
          ⏱ {game.durationSeconds}s
        </span>
        <span className="rounded-full border-2 border-ink bg-[#FFB793] px-3 py-1 text-[11px] font-black">
          Solo suma si superas tu récord
        </span>
      </div>

      {/* Apiladas en mobile, en fila desde sm — nunca scroll horizontal. */}
      <ol className="grid gap-2.5 sm:grid-cols-3">
        {vinetas.map((v, i) => (
          <motion.li
            key={v.titulo}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.12 }}
            className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border-[3px] border-ink p-3 shadow-[4px_4px_0_#1c1c11] sm:flex-col sm:items-start sm:gap-2 sm:p-4 ${TONOS[i]} ${
              i === 2 ? "text-white" : "text-[#1c1c11]"
            }`}
          >
            {/* Textura diagonal sutil, igual que el hero de Inicio */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-15deg, transparent 0 10px, #1c1c11 10px 11px)",
              }}
            />
            <span
              aria-hidden="true"
              className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-bg-light text-2xl shadow-[2px_2px_0_#1c1c11]"
            >
              {v.emoji}
            </span>
            <div className="relative min-w-0">
              <p className="font-display text-sm font-extrabold leading-tight">
                <span className="opacity-60">{i + 1}.</span> {v.titulo}
              </p>
              <p
                className={`mt-0.5 font-body text-[12px] font-semibold leading-snug ${
                  i === 2 ? "text-white/90" : "text-[#1c1c11]/75"
                }`}
              >
                {v.texto}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>

      <motion.button
        type="button"
        onClick={onStart}
        whileTap={{ scale: 0.98, x: 2, y: 2 }}
        className="min-h-12 rounded-xl border-2 border-ink bg-[#E26D5C] font-display font-bold text-white shadow-[4px_4px_0_#1c1c11] active:shadow-none"
      >
        ▶ Comenzar (empieza el cronómetro)
      </motion.button>
    </div>
  );
}
