import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import type { Minigame, MinigameType } from "../utils/gamification";
import { MIN_GAME_WIN_ACCURACY } from "../utils/gamification";
import { bumpStat } from "../utils/stats";
import TutorialCard from "../components/TutorialCard";
import GameIntroVinetas from "../components/GameIntroVinetas";
import ConstruyeWasiGame from "../components/ConstruyeWasiGame";
import { sortearPreguntas, barajar, TEMAS_QUIZ, type PreguntaQuiz } from "../data/quiz";
import {
  phaseAt,
  pickLaneX,
  pickSpecies,
  RIVER_PHASES,
  RIVER_SPECIES,
  SPECIES_BY_ID,
  TOTAL_SPECIES,
} from "../data/guardianRio";
import { recordDiscovery, useAlbum } from "../utils/riverAlbumStore";
import {
  phaseAt as cloracionPhaseAt,
  sortearCaso,
  primerCaso,
  gotasRequeridas,
  evaluarDosis,
  dosisApta,
  gotasDeRitmo,
  dropIntervalMs,
  timeoutMs as cloracionTimeoutMs,
  WATER_COLOR,
  RITMOS,
  comboMultiplier,
  calcCloracionScore,
  CLORACION_PHASES,
  type CasoCloracion,
  type DosisVeredicto,
  type RitmoId,
} from "../data/cloracion";
import { playDuranteJuego, playVictoria, playDerrota, detenerAudio, desbloquearAudio } from "../utils/gameAudio";
import { playChime, playMiss } from "../utils/sound";

export interface MinigameResult {
  earned: number;
  liters: number;
  isNewBest: boolean;
  bestScore: number;
}

interface MinigamePlayProps {
  game: Minigame;
  onFinish: (accuracy: number) => MinigameResult;
  onClose: () => void;
}

type Phase = "intro" | "tutorial" | "playing" | "result";

const HARD_SHADOW = "shadow-[4px_4px_0_#1c1c11]";

// Minitutorial por tipo de juego — sin timer, ejemplo simple antes de arrancar el cronómetro real.
const TUTORIALS: Record<MinigameType, { instructions: string; from: string; to: string; label: string; turbidez?: string }> = {
  FUGAS_DETECT: {
    instructions: "Arrastra la herramienta correcta hacia cada fuga antes de que se pierda el agua.",
    from: "🔧",
    to: "🚰",
    label: "Ej.: llave inglesa → unión de tubería floja",
  },
  HUELLA_HIDRICA: {
    instructions: "Toca el producto que esconde más litros de agua virtual.",
    from: "🥩",
    to: "👕",
    label: "Ej.: ¿carne o camiseta? toca el que gasta más agua",
  },
  COSECHA_LLUVIA: {
    instructions: "Arrastra cada gota hasta el tanque antes de que se evapore.",
    from: "💧",
    to: "🚰",
    label: "Ej.: gota de lluvia → tanque",
  },
  RIEGO_OPT: {
    instructions: "Elige la acción correcta según la hora del día para no perder agua.",
    from: "☀️",
    to: "⏳",
    label: "Ej.: es mediodía → elige esperar a la noche",
  },
  FILTROS_LAB: {
    instructions: "Arrastra cada material a su capa correcta, de abajo hacia arriba: grava, arena gruesa, arena fina, carbón activado y algodón.",
    from: "🌑",
    to: "💧",
    label: "Orden: 🌑 grava → 🔶 arena gruesa → 🔸 arena fina → ⚫ carbón → 🧶 algodón",
  },
  RUTAS_AGUAS: {
    instructions: "Toca cada tubería para rotarla y conectar la ruta de agua.",
    from: "🧺",
    to: "🌳",
    label: "Ej.: lavadora → biohuerto, evitando aguas negras",
  },
  SODIS_UV: {
    instructions: "Arrastra el espejo hacia la botella contaminada para desinfectarla.",
    from: "🔆",
    to: "🧴",
    label: "Ej.: espejo → botella con bacterias",
  },
GUARDIAN_RIO: {
    instructions:
      "Desliza la basura hacia la derecha y deja pasar la fauna y los mangles hacia la izquierda. El río cambia de fase: mañana, crecida y sequía.",
    from: "🥤",
    to: "➡️",
    label: "Ej.: botella PET → a la derecha · flamenco 🦩 → a la izquierda",
  },
  DUCHA_MUSICAL: {
    instructions: "Cierra la llave justo en el compás rojo. Ignora los botones falsos: tocarlos desperdicia +8L.",
    from: "🧼",
    to: "🚿",
    label: "Ej.: compás rojo → Cerrar llave. Botón Abrir a full → no tocar",
  },
  CORTE_AGUA: {
    instructions: "Elige la opción que gasta menos agua sin perder higiene en casa.",
    from: "🍳",
    to: "🛢️",
    label: "Ej.: pedir comida fuera ahorra litros del reservorio",
  },
  ACUIFERO_ALGARROBO: {
    instructions: "Guía la raíz con las flechas, esquivando obstáculos y recogiendo acuíferos.",
    from: "🌑",
    to: "💧",
    label: "Ej.: esquiva la roca, recoge la bolsa de agua subterránea",
  },
  CLORACION_SEGURA: {
    instructions:
      "El juego nunca te dice cuántas gotas van: lo calculas. Dosis = litros × gotas por litro. Agua de red 2/L, de pozo 5/L, embotellada NO se clora (hierve o SODIS). Si está turbia, filtra primero: sin filtrar la dosis se duplica.",
    from: "🧴",
    to: "🏺",
    label: "Ej.: bidón 20 L + agua de red → 40 gotas; turbia sin filtrar → 80",
  },
  QUIZ_AGUA: {
    instructions: "Toca la respuesta correcta antes de que se acabe el tiempo. Mientras más rápido, más puntos.",
    from: "❓",
    to: "✅",
    label: "Ej.: ¿cuántas horas de sol necesita SODIS? → 6 horas",
  },
  CONSTRUYE_WASI: {
    instructions: "Toca las celdas para colocar canaletas y armar el camino del agua desde el techo hasta su destino.",
    from: "🏠",
    to: "🌱",
    label: "Ej.: techo → canaleta → canaleta → biohuerto",
  },
  MEMORAMA_AGUA: {
    instructions: "Da vuelta dos cartas por turno. Si son iguales, quedan boca arriba; si no, se voltean de nuevo.",
    from: "🚿",
    to: "🚿",
    label: "Ej.: dos cartas con la ducha → combo",
  },
};

// Overlay de partida jugable — UI_UX_Guide.md:4.1: intro video mock skippable 10s,
// minitutorial sin timer, mecánica 60-90s (12 juegos oficiales Piura), otorga accuracy 0-1
// al padre (Juegos.tsx), que decide XP/bestScore/localStorage y muestra el resultado devuelto aquí.
export default function MinigamePlay({ game, onFinish, onClose }: MinigamePlayProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [result, setResult] = useState<MinigameResult | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // Cierre del modal por cualquier vía (X, Esc, click afuera, desmontaje
      // del padre): se corta el audio que esté sonando, sea cual sea la fase.
      detenerAudio();
    };
  }, [onClose]);

  // Suena mientras se juega. No hace falta cortarla al salir de "playing": el
  // audio de victoria/derrota ya arranca con un detenerAudio() propio antes de
  // sonar (ver reproducir() en gameAudio.ts) — poner un cleanup acá pisaría esa
  // llamada justo después de empezar, porque el efecto se limpia recién cuando
  // React reacciona al cambio de fase, un tick después de que handleComplete ya
  // puso a sonar el audio nuevo.
  useEffect(() => {
    if (phase !== "playing") return;
    playDuranteJuego();
  }, [phase]);

  const handleComplete = (accuracy: number) => {
    const res = onFinish(accuracy);
    setResult(res);
    setPhase("result");
    // Mismo criterio que el toast/chime de Juegos.tsx: ganaste algo (earned > 0)
    // = victoria, derrota total (accuracy 0) = derrota. Ya no depende de récord.
    if (res.earned > 0) playVictoria();
    else playDerrota();
  };

  const playAgain = () => {
    detenerAudio();
    setResult(null);
    // Rejugar directo: volver a "playing" remonta el motor con tiempo y
    // estado frescos, sin pasar por intro/tutorial otra vez.
    setPhase("playing");
  };

  return (
    <motion.div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c11]/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Jugando ${game.title}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        className={`max-h-[96vh] w-full max-w-xl overflow-y-auto rounded-3xl border-2 border-ink bg-bg-light p-4 ${HARD_SHADOW}`}
      >
        <div className="sticky top-0 z-10 -mx-1 mb-3 flex items-center justify-between gap-2 bg-bg-light px-1 pb-2 pt-1">
          <h2 className="font-display text-lg font-extrabold text-ink">{game.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar juego"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-surface text-xl font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            ×
          </button>
        </div>

        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GameIntroVinetas
                game={game}
                onStart={() => {
                  desbloquearAudio();
                  setPhase("tutorial");
                }}
              />
            </motion.div>
          )}

          {phase === "tutorial" && (
            <motion.div key="tutorial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TutorialCard
                title={game.title}
                instructions={TUTORIALS[game.type].instructions}
                exampleFrom={TUTORIALS[game.type].from}
                exampleTo={TUTORIALS[game.type].to}
exampleLabel={TUTORIALS[game.type].label}
                turbidez={TUTORIALS[game.type].turbidez}
                onStart={() => setPhase("playing")}
              />
            </motion.div>
          )}

          {phase === "playing" && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GameEngine type={game.type} duration={game.durationSeconds} onComplete={handleComplete} />
            </motion.div>
          )}

          {phase === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-6 text-center"
            >
              <span className="text-5xl" aria-hidden="true">
                {result.isNewBest ? "🏆" : result.earned === 0 ? "😕" : "🎮"}
              </span>
              <p className="font-display text-2xl font-extrabold text-ink">
                {result.earned === 0 ? "Perdiste" : `+${result.earned} HydroPuntos`}
              </p>
              {result.liters > 0 && <p className="text-sm font-black text-ink/80">+{result.liters} L ahorrados · proporcional a tu EXP</p>}
              <p className="text-sm font-bold text-ink/80">
                {result.isNewBest
                  ? "¡Nuevo récord! HydroPuntos y EXP otorgados."
                  : result.earned === 0
                    ? "Inténtalo de nuevo la próxima — así se aprende."
                    : `HydroPuntos y EXP otorgados (tu récord sigue en ${result.bestScore} pts).`}
              </p>
              <div className="mt-2 flex w-full gap-3">
                <button
                  type="button"
                  onClick={playAgain}
                  className={`min-h-12 flex-1 rounded-xl border-2 border-ink bg-[#FFB793] font-bold ${HARD_SHADOW} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
                >
                  Jugar de nuevo
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`min-h-12 flex-1 rounded-xl border-2 border-ink bg-[#99B4D8] font-bold ${HARD_SHADOW} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
                >
                  Volver a Juegos
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/**
 * Encuentra el objetivo de un drag-and-drop bajo el punto soltado, buscando
 * `selector` en TODA la pila de elementos superpuestos en ese punto — no solo
 * el de más arriba. `elementFromPoint` solo devuelve el tope, y ahí sigue el
 * propio elemento que se está arrastrando (todavía no se re-renderizó ni se
 * movió), así que buscar solo con `elementFromPoint` puede devolver el
 * material arrastrado en vez del slot debajo, y el drop nunca se registra
 * aunque el usuario haya soltado justo en el lugar correcto.
 */
function objetivoDeDrop(x: number, y: number, selector: string): HTMLElement | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const target = (el as HTMLElement).closest<HTMLElement>(selector);
    if (target) return target;
  }
  return null;
}

// ---------- HUD compartido ----------

function GameHUD({ timeLabel, scoreLabel }: { timeLabel: string; scoreLabel: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="rounded-full border-2 border-ink bg-surface px-3 py-1 text-xs font-black">⏱ {timeLabel}</span>
      <span className="rounded-full border-2 border-ink bg-[#FFB793] px-3 py-1 text-xs font-black">{scoreLabel}</span>
    </div>
  );
}

// ---------- Selector de motor por tipo ----------

function GameEngine({
  type,
  duration,
  onComplete,
}: {
  type: Minigame["type"];
  duration: number;
  onComplete: (accuracy: number) => void;
}) {
  if (type === "FUGAS_DETECT") return <CazaFugasGame duration={duration} onComplete={onComplete} />;
  if (type === "HUELLA_HIDRICA") return <PesoInvisibleGame duration={duration} onComplete={onComplete} />;
  if (type === "COSECHA_LLUVIA") return <AtrapaLluviasGame duration={duration} onComplete={onComplete} />;
  if (type === "RIEGO_OPT") return <MaestroRiegoGame duration={duration} onComplete={onComplete} />;
  if (type === "FILTROS_LAB") return <FiltrosLabGame duration={duration} onComplete={onComplete} />;
  if (type === "RUTAS_AGUAS") return <RutasAguasGame duration={duration} onComplete={onComplete} />;
  if (type === "SODIS_UV") return <SodisUvGame duration={duration} onComplete={onComplete} />;
  if (type === "GUARDIAN_RIO") return <GuardianRioGame duration={duration} onComplete={onComplete} />;
  if (type === "DUCHA_MUSICAL") return <DuchaMusicalGame duration={duration} onComplete={onComplete} />;
  if (type === "CORTE_AGUA") return <CorteAguaGame duration={duration} onComplete={onComplete} />;
  if (type === "ACUIFERO_ALGARROBO") return <AcuiferoAlgarroboGame duration={duration} onComplete={onComplete} />;
  if (type === "QUIZ_AGUA") return <SabiosDelAguaGame duration={duration} onComplete={onComplete} />;
  if (type === "CONSTRUYE_WASI") return <ConstruyeWasiGame duration={duration} onComplete={onComplete} />;
  if (type === "MEMORAMA_AGUA") return <MemoramaAguaGame duration={duration} onComplete={onComplete} />;
  return <CloracionSeguraGame duration={duration} onComplete={onComplete} />;
}

// ======================================================================
// 13. SABIOS DEL AGUA (QUIZ_AGUA, 90s) — 10 preguntas al azar del banco
// (src/data/quiz.ts), una por tema para que no salga la partida entera de
// un solo tema. La explicación tras cada respuesta es el punto del juego:
// se muestra igual cuando aciertas, porque adivinar no es aprender.
// ======================================================================

const QUIZ_PREGUNTAS = 10;
/** Segundos por pregunta a partir de los cuales ya no hay bonus de rapidez. */
const QUIZ_BONUS_SEGUNDOS = 8;

interface PreguntaBarajada {
  fuente: PreguntaQuiz;
  opciones: string[];
  correcta: number;
}

function barajarOpciones(p: PreguntaQuiz): PreguntaBarajada {
  const conIndice = p.opciones.map((texto, i) => ({ texto, original: i }));
  barajar(conIndice);
  return {
    fuente: p,
    opciones: conIndice.map((o) => o.texto),
    correcta: conIndice.findIndex((o) => o.original === p.correcta),
  };
}

function SabiosDelAguaGame({
  duration,
  onComplete,
}: {
  duration: number;
  onComplete: (accuracy: number) => void;
}) {
  const preguntas = useMemo(
    () => sortearPreguntas(QUIZ_PREGUNTAS).map(barajarOpciones),
    [],
  );

  const [indice, setIndice] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const inicioPregunta = useRef(Date.now());

  const actual = preguntas[indice];
  const terminado = indice >= preguntas.length;

  // El puntaje mezcla aciertos con rapidez: responder bien y rápido llega a 1,
  // responder bien pero lento se queda cerca de 0.8 de accuracy.
  const finalizar = (aciertosFinal: number, bonusFinal: number) => {
    const base = aciertosFinal / preguntas.length;
    const rapidez = bonusFinal / preguntas.length;
    onComplete(Math.max(0, Math.min(1, base * 0.8 + rapidez * 0.2)));
  };

  useEffect(() => {
    if (terminado) return;
    if (timeLeft <= 0) {
      finalizar(aciertos, bonus);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, terminado]);

  const responder = (i: number) => {
    if (elegida !== null || !actual) return;
    setElegida(i);
    const acerto = i === actual.correcta;
    const segundos = (Date.now() - inicioPregunta.current) / 1000;
    if (acerto) {
      setAciertos((a) => a + 1);
      if (segundos <= QUIZ_BONUS_SEGUNDOS) setBonus((b) => b + 1);
    }
  };

  const siguiente = () => {
    const esUltima = indice + 1 >= preguntas.length;
    if (esUltima) {
      finalizar(aciertos, bonus);
      setIndice(preguntas.length);
      return;
    }
    setIndice((i) => i + 1);
    setElegida(null);
    inicioPregunta.current = Date.now();
  };

  if (!actual || terminado) {
    return (
      <div className="py-8 text-center font-body text-sm font-bold text-ink/70">Calculando puntaje…</div>
    );
  }

  const tema = TEMAS_QUIZ[actual.fuente.tema];

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`✅ ${aciertos}/${preguntas.length}`} />

      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full border-2 border-ink bg-[#99B4D8] px-3 py-1 text-[11px] font-black">
          {tema.emoji} {tema.label}
        </span>
        <span className="rounded-full border-2 border-ink bg-surface px-3 py-1 text-[11px] font-black">
          {indice + 1} de {preguntas.length}
        </span>
      </div>

      <p className="rounded-2xl border-[3px] border-ink bg-[#FFB793] p-4 font-display text-base font-extrabold leading-snug shadow-[4px_4px_0_#1c1c11]">
        {actual.fuente.pregunta}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {actual.opciones.map((opcion, i) => {
          const esCorrecta = i === actual.correcta;
          const revelado = elegida !== null;
          const tono = !revelado
            ? "bg-bg-light"
            : esCorrecta
              ? "bg-[#8fcf9f]"
              : i === elegida
                ? "bg-[#E26D5C] text-white"
                : "bg-bg-light opacity-60";

          return (
            <button
              key={opcion}
              type="button"
              onClick={() => responder(i)}
              disabled={revelado}
              className={`flex min-h-12 items-center gap-3 rounded-xl border-2 border-ink p-3 text-left font-body text-sm font-semibold shadow-[2px_2px_0_#1c1c11] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${tono}`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-surface font-display text-xs font-black text-ink">
                {revelado ? (esCorrecta ? "✓" : i === elegida ? "✕" : "·") : String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0">{opcion}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {elegida !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3"
          >
            <div className="rounded-2xl border-[3px] border-ink bg-[#99B4D8]/35 p-3">
              <p className="font-display text-sm font-extrabold">
                {elegida === actual.correcta ? "✅ ¡Correcto!" : "💡 La respuesta era otra"}
              </p>
              <p className="mt-1 font-body text-[13px] leading-snug">{actual.fuente.explicacion}</p>
            </div>
            <button
              type="button"
              onClick={siguiente}
              className={`mt-2 min-h-12 w-full rounded-xl border-2 border-ink bg-[#E26D5C] font-display font-bold text-white ${HARD_SHADOW} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
            >
              {indice + 1 >= preguntas.length ? "Ver mi puntaje →" : "Siguiente pregunta →"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ======================================================================
// 1. CAZA-FUGAS EXPRÉS (FUGAS_DETECT, 60s) — arrastra la herramienta
// correcta a cada fuga antes de que se desborde el medidor.
// ======================================================================

type ToolType = "llave" | "teflon" | "valvula";
type LeakKind = "grifo" | "inodoro" | "manguera" | "union";

const LEAK_KINDS: Record<LeakKind, { emoji: string; tool: ToolType; label: string }> = {
  grifo: { emoji: "🚰", tool: "teflon", label: "Grifo con la rosca floja" },
  inodoro: { emoji: "🚽", tool: "valvula", label: "Inodoro que corre agua" },
  manguera: { emoji: "💦", tool: "valvula", label: "Manguera rota" },
  union: { emoji: "🔩", tool: "llave", label: "Unión de tubería floja" },
};

const TOOLS: { type: ToolType; emoji: string; label: string }[] = [
  { type: "llave", emoji: "🔧", label: "Llave inglesa" },
  { type: "teflon", emoji: "⚪", label: "Cinta teflón" },
  { type: "valvula", emoji: "🛑", label: "Válvula de paso" },
];

const LEAK_LITERS = 25;

interface Leak {
  id: number;
  kind: LeakKind;
  x: number;
  y: number;
}

function CazaFugasGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [litersSaved, setLitersSaved] = useState(0);
  const [litersLost, setLitersLost] = useState(0);
  const [flash, setFlash] = useState<{ id: number; ok: boolean } | null>(null);
  const leaksRef = useRef<Leak[]>([]);
  const resolvedIds = useRef(new Set<number>());
  const finishedRef = useRef(false);

  useEffect(() => {
    leaksRef.current = leaks;
  }, [leaks]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        const attempts = litersSaved + litersLost;
        onComplete(attempts > 0 ? Math.min(1, litersSaved / attempts) : 0);
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const resolveLeak = (id: number, saved: boolean) => {
    if (resolvedIds.current.has(id)) return;
    if (!leaksRef.current.some((leak) => leak.id === id)) return;
    resolvedIds.current.add(id);
    const remaining = leaksRef.current.filter((leak) => leak.id !== id);
    leaksRef.current = remaining;
    setLeaks(remaining);
    if (saved) setLitersSaved((s) => s + LEAK_LITERS);
    else setLitersLost((s) => s + LEAK_LITERS);
  };

  useEffect(() => {
    if (timeLeft <= 0) return;
    const kinds = Object.keys(LEAK_KINDS) as LeakKind[];
    const spawn = setInterval(() => {
      if (leaksRef.current.length >= 3) return; // cap de fugas simultáneas
      const id = Date.now() + Math.random();
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const next = [...leaksRef.current, { id, kind, x: Math.random() * 76 + 8, y: Math.random() * 60 + 14 }];
      leaksRef.current = next;
      setLeaks(next);
      setTimeout(() => resolveLeak(id, false), 5000);
    }, 1100);
    return () => clearInterval(spawn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft <= 0]);

  const handleToolDrop = (tool: ToolType, info: PanInfo) => {
    // La herramienta arrastrada queda topmost en el punto de soltado, así que
    // usamos toda la pila de elementos (no solo el primero) para hallar la fuga real.
    const stack = document.elementsFromPoint(info.point.x, info.point.y);
    const leakEl = stack.map((el) => el.closest<HTMLElement>("[data-leak-id]")).find((el): el is HTMLElement => Boolean(el));
    if (!leakEl) return;
    const id = Number(leakEl.dataset.leakId);
    const leak = leaksRef.current.find((l) => l.id === id);
    if (!leak) return;
    const success = LEAK_KINDS[leak.kind].tool === tool;
    if (success) {
      resolveLeak(id, true);
      bumpStat("fugasReparadas");
    }
    setFlash({ id, ok: success });
    setTimeout(() => setFlash((f) => (f?.id === id ? null : f)), 350);
  };

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`💧 ${litersSaved}L salvados · 🚱 ${litersLost}L perdidos`} />
      <div className="relative h-64 overflow-hidden rounded-2xl border-2 border-ink bg-bg-light">
        {/* Corte de casa 2x2: baño / cocina / lavadero / tanque */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="flex items-start justify-start border-b-2 border-r-2 border-ink/20 p-1 text-[10px] font-black text-ink/40">🛁 Baño</div>
          <div className="flex items-start justify-end border-b-2 border-ink/20 p-1 text-[10px] font-black text-ink/40">Cocina 🍳</div>
          <div className="flex items-end justify-start border-r-2 border-ink/20 p-1 text-[10px] font-black text-ink/40">🧺 Lavadero</div>
          <div className="flex items-end justify-end p-1 text-[10px] font-black text-ink/40">Tanque 🛢️</div>
        </div>

        <AnimatePresence>
          {leaks.map((leak) => (
            <motion.div
              key={leak.id}
              data-leak-id={leak.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1, y: [0, -4, 0] }}
              exit={{ scale: 0 }}
              transition={{ y: { repeat: Infinity, duration: 0.8 } }}
              style={{ left: `${leak.x}%`, top: `${leak.y}%` }}
              className={`absolute grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full border-2 border-ink bg-surface text-2xl shadow-[2px_2px_0_#1c1c11] ${
                flash?.id === leak.id ? (flash.ok ? "ring-4 ring-[#28a745]" : "ring-4 ring-[#E26D5C]") : ""
              }`}
              title={LEAK_KINDS[leak.kind].label}
            >
              {LEAK_KINDS[leak.kind].emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex justify-center gap-3">
        {TOOLS.map((tool) => (
          <motion.div
            key={tool.type}
            drag
            dragSnapToOrigin
            dragElastic={0.3}
            onDragEnd={(_event, info) => handleToolDrop(tool.type, info)}
            className="grid h-14 w-14 touch-none cursor-grab place-items-center rounded-full border-2 border-ink bg-[#FFB793] text-2xl shadow-[2px_2px_0_#1c1c11] active:cursor-grabbing"
            aria-label={`Herramienta ${tool.label}, arrástrala a la fuga correcta`}
            role="button"
          >
            {tool.emoji}
          </motion.div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink/70">
        Arrastra 🔧 llave (uniones), ⚪ teflón (grifos) o 🛑 válvula (emergencias) a cada fuga antes de que se desborde el medidor.
      </p>
    </div>
  );
}

// ======================================================================
// 2. EL PESO INVISIBLE DEL AGUA (HUELLA_HIDRICA, 60s) — cara a cara,
// combo de aciertos consecutivos, dato curioso instantáneo.
// ======================================================================

interface WaterItem {
  emoji: string;
  label: string;
  liters: number;
}

// Litros de agua virtual por unidad de producto. Fuente: Mekonnen & Hoekstra
// (2010/2011), Water Footprint Network — promedios globales, los mismos que
// citan WWF y ONU-Agua. Antes la carne de res (2400 L) y el chocolate (1700 L)
// estaban mal por 6x y 10x respectivamente (real: ~15 400 L y ~17 200 L).
const PAIRS: [WaterItem, WaterItem][] = [
  [
    { emoji: "🥩", label: "1 kg de carne de res", liters: 15400 },
    { emoji: "👕", label: "1 camiseta de algodón", liters: 2700 },
  ],
  [
    { emoji: "☕", label: "1 taza de café", liters: 140 },
    { emoji: "🍊", label: "1 vaso de jugo de naranja", liters: 170 },
  ],
  [
    { emoji: "🍔", label: "1 hamburguesa", liters: 2400 },
    { emoji: "🍚", label: "1 kg de arroz", liters: 2500 },
  ],
  [
    { emoji: "👖", label: "1 par de jeans", liters: 8000 },
    { emoji: "👟", label: "1 par de zapatillas", liters: 4400 },
  ],
  [
    { emoji: "🧀", label: "1 kg de queso", liters: 5000 },
    { emoji: "🥛", label: "1 litro de leche", liters: 1000 },
  ],
  [
    { emoji: "🍫", label: "1 kg de chocolate", liters: 17200 },
    { emoji: "🍎", label: "1 kg de manzanas", liters: 700 },
  ],
  [
    { emoji: "🥚", label: "1 huevo", liters: 200 },
    { emoji: "🥛", label: "1 vaso de leche", liters: 250 },
  ],
  [
    { emoji: "📄", label: "1 hoja de papel A4", liters: 10 },
    { emoji: "🥤", label: "1 vaso de agua directa", liters: 1 },
  ],
  [
    { emoji: "🐖", label: "1 kg de carne de cerdo", liters: 6000 },
    { emoji: "🍗", label: "1 kg de pollo", liters: 4300 },
  ],
  [
    { emoji: "🍞", label: "1 kg de pan", liters: 1600 },
    { emoji: "🥔", label: "1 kg de papas", liters: 290 },
  ],
  [
    { emoji: "🍌", label: "1 kg de plátanos", liters: 790 },
    { emoji: "🍊", label: "1 kg de naranjas", liters: 560 },
  ],
  [
    { emoji: "🍷", label: "1 copa de vino", liters: 120 },
    { emoji: "🍺", label: "1 vaso de cerveza", liters: 75 },
  ],
  [
    { emoji: "🍕", label: "1 pizza mediana", liters: 1260 },
    { emoji: "🍝", label: "1 plato de pasta", liters: 590 },
  ],
];

function PesoInvisibleGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [pairIndex, setPairIndex] = useState(() => Math.floor(Math.random() * PAIRS.length));
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const answeredRef = useRef(false);
  const finishedRef = useRef(false);

  const pair = PAIRS[pairIndex];

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onComplete(answered > 0 ? Math.min(1, correct / answered) : 0);
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const pick = (side: 0 | 1) => {
    if (answeredRef.current || timeLeft <= 0) return;
    answeredRef.current = true;
    setPicked(side);
    const wasCorrect = pair[side].liters > pair[1 - side].liters;
    setAnswered((a) => a + 1);
    if (wasCorrect) {
      setCorrect((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setPairIndex(Math.floor(Math.random() * PAIRS.length));
      setPicked(null);
      answeredRef.current = false;
    }, 900);
  };

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`🔥 combo ${streak} · mejor ${bestStreak}`} />
      <p className="mb-2 text-center text-sm font-bold text-ink">¿Cuál esconde más agua virtual?</p>
      <div className="grid grid-cols-2 gap-3">
        {pair.map((item, i) => {
          const isPicked = picked === i;
          const isWinner = picked !== null && item.liters > pair[1 - i].liters;
          return (
            <button
              key={item.label}
              type="button"
              disabled={picked !== null}
              onClick={() => pick(i as 0 | 1)}
              className={`flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-ink p-3 text-center shadow-[2px_2px_0_#1c1c11] ${
                picked === null ? "bg-surface" : isWinner ? "bg-[#28a745]/20 border-[#28a745]" : isPicked ? "bg-[#E26D5C] text-white" : "bg-surface opacity-60"
              }`}
            >
              <span className="text-5xl" aria-hidden="true">
                {item.emoji}
              </span>
              <span className="text-sm font-bold leading-tight">{item.label}</span>
              {picked !== null && <span className="text-xs font-black">{item.liters.toLocaleString("es-PE")} L</span>}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className="mt-2 text-center text-xs font-bold text-ink/80">
          {pair[picked].liters > pair[1 - picked].liters
            ? `¡Correcto! ${pair[pair[0].liters > pair[1].liters ? 0 : 1].label} usa ${Math.max(pair[0].liters, pair[1].liters).toLocaleString("es-PE")} L de agua virtual.`
            : `Casi — ${pair[pair[0].liters > pair[1].liters ? 0 : 1].label} en realidad usa más agua (${Math.max(pair[0].liters, pair[1].liters).toLocaleString("es-PE")} L).`}
        </p>
      )}
    </div>
  );
}

// ======================================================================
// 3. ATRAPA-LLUVIAS PIURANO (COSECHA_LLUVIA, 90s) — conecta canaletas,
// primeras aguas sucias al desagüe, luego abre al tanque.
// ======================================================================

const CANALETAS = 5;
const LITROS_POR_CANALETA_SEG = 3;
/** Cada estado dura entre 6 y 11s, así el clima cambia varias veces por partida y no queda fijo. */
const CLIMA_MIN_SEGUNDOS = 6;
const CLIMA_MAX_SEGUNDOS = 11;

type Clima = "sucia" | "limpia" | "sol";
const CLIMA_INFO: Record<Clima, { texto: string; clase: string }> = {
  sucia: { texto: "🌫️ Primeras aguas sucias — ¡todas las canaletas al desagüe!", clase: "bg-[#E26D5C] text-white" },
  limpia: { texto: "🌧️ Lluvia limpia — abre las canaletas hacia el tanque", clase: "bg-[#99B4D8]/40 text-ink" },
  sol: { texto: "☀️ Día soleado, no llueve — cierra todas las canaletas", clase: "bg-[#FFB793]/50 text-ink" },
};

function randomClimaSegundos(): number {
  return CLIMA_MIN_SEGUNDOS + Math.floor(Math.random() * (CLIMA_MAX_SEGUNDOS - CLIMA_MIN_SEGUNDOS + 1));
}

/** Empieza siempre con aguas sucias (real: toda lluvia arrastra primero lo acumulado en el techo), después alterna sol/lluvia al azar. */
function siguienteClima(actual: Clima): Clima {
  if (actual === "sucia") return "limpia";
  return Math.random() < 0.5 ? "sol" : "limpia";
}

/** Puntúa solo contra la lluvia limpia que realmente hubo en la partida.
 * El sol y las primeras aguas no son oportunidades de recolección, por lo que
 * no deben convertir una buena partida en derrota. */
export function calcAtrapaLluviasAccuracy(cleanLiters: number, cleanOpportunityLiters: number, contamination: number): number {
  if (cleanOpportunityLiters <= 0) return 0;
  const safeLiters = Math.max(0, cleanLiters - contamination * LITROS_POR_CANALETA_SEG);
  return Math.min(1, safeLiters / cleanOpportunityLiters);
}

function AtrapaLluviasGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [open, setOpen] = useState<boolean[]>(Array(CANALETAS).fill(false));
  const [cleanLiters, setCleanLiters] = useState(0);
  const [cleanOpportunityLiters, setCleanOpportunityLiters] = useState(0);
  const [contamination, setContamination] = useState(0);
  const [clima, setClima] = useState<Clima>("sucia");
  const [, setClimaSegundosLeft] = useState(CLIMA_MIN_SEGUNDOS);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onComplete(calcAtrapaLluviasAccuracy(cleanLiters, cleanOpportunityLiters, contamination));
      }
      return;
    }
    const t = setTimeout(() => {
      setOpen((currentOpen) => {
        if (clima === "limpia") setCleanOpportunityLiters((l) => l + CANALETAS * LITROS_POR_CANALETA_SEG);
        currentOpen.forEach((isOpen) => {
          if (!isOpen) return;
          if (clima === "sucia") setContamination((c) => c + 1);
          else if (clima === "limpia") setCleanLiters((l) => l + LITROS_POR_CANALETA_SEG);
          // "sol": canaleta abierta no hace nada, no hay lluvia que recoger.
        });
        return currentOpen;
      });
      setTimeLeft((s) => s - 1);
      setClimaSegundosLeft((s) => {
        if (s > 1) return s - 1;
        setClima((c) => siguienteClima(c));
        return randomClimaSegundos();
      });
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const toggle = (i: number) => setOpen((o) => o.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`💧 ${cleanLiters}L limpios · ☠️ ${contamination} contaminaciones`} />
      <div className={`rounded-2xl border-2 border-ink p-3 text-center text-sm font-black transition-colors ${CLIMA_INFO[clima].clase}`}>
        {CLIMA_INFO[clima].texto}
      </div>

      <div className="mt-3 flex justify-center gap-3">
        {open.map((isOpen, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            aria-pressed={isOpen}
            aria-label={`Canaleta ${i + 1}, ${isOpen ? "dirigida al tanque" : "dirigida al desagüe"}`}
            className={`grid h-16 w-14 place-items-center rounded-xl border-2 border-ink text-2xl font-black shadow-[2px_2px_0_#1c1c11] transition-colors ${
              isOpen ? "bg-[#99B4D8]" : "bg-surface"
            }`}
          >
            {isOpen ? "🚰" : "🚫"}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink/70">
        🚫 = hacia el desagüe (seguro con aguas sucias) · 🚰 = hacia el tanque (solo con lluvia limpia).
      </p>
    </div>
  );
}

// ======================================================================
// 4. MAESTRO DEL RIEGO (RIEGO_OPT, 90s) — reloj Mañana→Mediodía→Noche,
// decide cómo cuidar el biohuerto sin perder 80% por evaporación.
// ======================================================================

type DayPhase = "Madrugada" | "Mañana" | "Mediodía" | "Tarde" | "Atardecer" | "Noche";
const TICK_SECONDS = 10;
const PHASE_ICON: Record<DayPhase, string> = { Madrugada: "🌌", Mañana: "🌅", Mediodía: "☀️", Tarde: "💨", Atardecer: "🌇", Noche: "🌙" };

export interface RiegoOption {
  label: string;
  emoji: string;
  good: boolean;
}

export interface RiegoScenario {
  id: string;
  phase: DayPhase;
  prompt: string;
  options: RiegoOption[];
}

/** Situaciones cortas, locales y variadas. Se sortean sin repetir la misma
 * escena seguida, de modo que la partida no se reduce a tres preguntas fijas. */
export const RIEGO_SCENARIOS: RiegoScenario[] = [
  { id: "madrugada-reserva", phase: "Madrugada", prompt: "La tierra sigue fresca y tienes agua de lluvia almacenada.", options: [{ label: "Riego por goteo suave", emoji: "💧", good: true }, { label: "Abrir la manguera al máximo", emoji: "💦", good: false }, { label: "Revisar humedad primero", emoji: "🌱", good: true }] },
  { id: "manana-fuga", phase: "Mañana", prompt: "Antes de que caliente, una manguera tiene un goteo constante.", options: [{ label: "Reparar la fuga", emoji: "🔧", good: true }, { label: "Taparla con tierra", emoji: "🟤", good: false }, { label: "Dejarla corriendo", emoji: "🚶", good: false }] },
  { id: "manana-mulch", phase: "Mañana", prompt: "El suelo del biohuerto se seca rápido después de regar.", options: [{ label: "Cubrir con mulch", emoji: "🍂", good: true }, { label: "Regar otra vez sin parar", emoji: "🌊", good: false }, { label: "Usar goteo", emoji: "🥤", good: true }] },
  { id: "mediodia-sol", phase: "Mediodía", prompt: "El sol de Piura pega fuerte: la manguera pierde mucha agua por evaporación.", options: [{ label: "Esperar la noche", emoji: "⏳", good: true }, { label: "Regar con manguera", emoji: "💦", good: false }, { label: "Poner mulch", emoji: "🍂", good: true }, { label: "Usar goteo medido", emoji: "💧", good: true }] },
  { id: "mediodia-agua-gris", phase: "Mediodía", prompt: "Terminaste de lavar ropa con jabón biodegradable. El agua es apta solo para plantas ornamentales.", options: [{ label: "Reusar en plantas", emoji: "♻️", good: true }, { label: "Usarla para beber", emoji: "🥤", good: false }, { label: "Echarla al biohuerto comestible", emoji: "🥬", good: false }] },
  { id: "tarde-viento", phase: "Tarde", prompt: "Hay viento fuerte y las gotas de la manguera salen volando.", options: [{ label: "Acercar el goteo al suelo", emoji: "🌱", good: true }, { label: "Apuntar más alto", emoji: "⬆️", good: false }, { label: "Esperar que calme", emoji: "⏳", good: true }] },
  { id: "tarde-tanque", phase: "Tarde", prompt: "El tanque de lluvia está casi vacío y mañana no habrá agua.", options: [{ label: "Regar solo raíces", emoji: "🎯", good: true }, { label: "Lavar el patio", emoji: "🧹", good: false }, { label: "Programar goteo", emoji: "⏲️", good: true }] },
  { id: "atardecer-canaletas", phase: "Atardecer", prompt: "Se anuncian lluvias. Las canaletas tienen hojas acumuladas.", options: [{ label: "Limpiar canaletas", emoji: "🍃", good: true }, { label: "Ignorarlas", emoji: "🙈", good: false }, { label: "Cerrar el tanque", emoji: "🚫", good: false }] },
  { id: "atardecer-medidor", phase: "Atardecer", prompt: "El medidor sigue girando con todas las llaves cerradas.", options: [{ label: "Buscar fuga oculta", emoji: "🔎", good: true }, { label: "Regar para aprovechar", emoji: "💦", good: false }, { label: "Anotar y avisar", emoji: "📝", good: true }] },
  { id: "noche-riego", phase: "Noche", prompt: "Poca evaporación: es un buen momento para hidratar el huerto.", options: [{ label: "Regar las raíces", emoji: "🌊", good: true }, { label: "Regar las hojas", emoji: "🍃", good: false }, { label: "Usar goteo nocturno", emoji: "💧", good: true }] },
  { id: "noche-exceso", phase: "Noche", prompt: "El suelo ya está húmedo por la lluvia de la tarde.", options: [{ label: "Medir humedad y esperar", emoji: "📏", good: true }, { label: "Regar por costumbre", emoji: "💦", good: false }, { label: "Cubrir el suelo", emoji: "🍂", good: true }] },
];

export function pickRiegoScenario(previousId?: string, random = Math.random): RiegoScenario {
  const candidates = RIEGO_SCENARIOS.filter((scenario) => scenario.id !== previousId);
  return candidates[Math.floor(random() * candidates.length)] ?? RIEGO_SCENARIOS[0];
}

function MaestroRiegoGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const totalTicks = Math.max(3, Math.round(duration / TICK_SECONDS));
  const [tick, setTick] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TICK_SECONDS);
  const [health, setHealth] = useState(100);
  const [decisions, setDecisions] = useState(0);
  const [correctDecisions, setCorrectDecisions] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [scenario, setScenario] = useState<RiegoScenario>(() => pickRiegoScenario());
  const answeredRef = useRef(false);
  const finishedRef = useRef(false);
  const scenarioIdRef = useRef(scenario.id);

  const finalize = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const efficiency = decisions > 0 ? correctDecisions / decisions : 0.5;
    onComplete(Math.min(1, Math.max(0, efficiency * (health / 100))));
  };

  const nextTick = () => {
    if (tick + 1 >= totalTicks) {
      finalize();
      return;
    }
    setTick((t) => t + 1);
    const nextScenario = pickRiegoScenario(scenarioIdRef.current);
    scenarioIdRef.current = nextScenario.id;
    setScenario(nextScenario);
    setSecondsLeft(TICK_SECONDS);
    setFeedback(null);
    answeredRef.current = false;
  };

  const choose = (option: RiegoOption) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setDecisions((d) => d + 1);
    if (option.good) {
      setCorrectDecisions((c) => c + 1);
      setHealth((h) => Math.min(100, h + 5));
      setFeedback("ok");
    } else {
      setHealth((h) => Math.max(0, h - 30));
      setFeedback("bad");
    }
    setTimeout(nextTick, 600);
  };

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!answeredRef.current) {
        answeredRef.current = true;
        setDecisions((d) => d + 1);
        setHealth((h) => Math.max(0, h - 30));
        setFeedback("bad");
        setTimeout(nextTick, 500);
        return;
      }
      nextTick();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  return (
    <div>
      <GameHUD timeLabel={`${secondsLeft}s · fase ${tick + 1}/${totalTicks}`} scoreLabel={`🌿 salud ${health}%`} />
      <div className="rounded-2xl border-2 border-ink bg-[#FFB793]/40 p-5 text-center">
        <span className="text-5xl" aria-hidden="true">
          {PHASE_ICON[scenario.phase]}
        </span>
        <p className="mt-1 font-display text-lg font-extrabold">{scenario.phase}</p>
        <p className="mt-1 text-sm font-semibold text-ink/80">{scenario.prompt}</p>
        <div className={`mt-3 grid grid-cols-2 gap-2 ${scenario.options.length > 2 ? "sm:grid-cols-4" : ""}`}>
          {scenario.options.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => choose(option)}
              disabled={answeredRef.current}
              className="min-h-12 rounded-xl border-2 border-ink bg-[#99B4D8] font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {option.emoji} {option.label}
            </button>
          ))}
        </div>
        {feedback && (
          <span
            className={`mt-3 inline-block rounded-full border-2 px-3 py-1 text-xs font-black ${
              feedback === "ok" ? "border-[#28a745] bg-[#28a745]/20 text-ink" : "border-white bg-[#E26D5C] text-white"
            }`}
          >
            {feedback === "ok" ? "✓ Buena decisión" : "✗ Se perdió agua o el huerto sufrió"}
          </span>
        )}
      </div>
    </div>
  );
}

// ======================================================================
// 5. EL LABORATORIO DE FILTROS CASEROS (FILTROS_LAB, 60s, 3 rondas) —
// arrastra los materiales en orden correcto de abajo hacia arriba.
// ======================================================================

type MaterialKind = "algodon" | "carbon" | "arena_fina" | "arena_gruesa" | "grava";

const MATERIALS: { kind: MaterialKind; emoji: string; label: string }[] = [
  { kind: "algodon", emoji: "🧶", label: "Algodón/Gasa" },
  { kind: "carbon", emoji: "⚫", label: "Carbón activado" },
  { kind: "arena_fina", emoji: "🔸", label: "Arena fina" },
  { kind: "arena_gruesa", emoji: "🔶", label: "Arena gruesa" },
  { kind: "grava", emoji: "🌑", label: "Grava" },
];

// Orden real de un filtro casero: de abajo (índice 0, drena) hacia arriba (índice 4, recibe el agua turbia)
const CORRECT_ORDER: MaterialKind[] = ["grava", "arena_gruesa", "arena_fina", "carbon", "algodon"];
const FILTER_ROUNDS = 3;

function shuffleKinds(): MaterialKind[] {
  const arr = MATERIALS.map((m) => m.kind);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function FiltrosLabGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const roundSeconds = Math.max(10, Math.round(duration / FILTER_ROUNDS));
  const [round, setRound] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(roundSeconds);
  const [slots, setSlots] = useState<(MaterialKind | null)[]>(Array(5).fill(null));
  const [shelf, setShelf] = useState<MaterialKind[]>(shuffleKinds);
  const [pouring, setPouring] = useState<"crystal" | "brown" | null>(null);
  const [, setRoundAccuracies] = useState<number[]>([]);
  const slotsRef = useRef(slots);
  const roundResolvedRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  const startRound = (index: number) => {
    setRound(index);
    setSlots(Array(5).fill(null));
    setShelf(shuffleKinds());
    setSecondsLeft(roundSeconds);
    setPouring(null);
    roundResolvedRef.current = false;
  };

  const finalizeRound = () => {
    if (roundResolvedRef.current) return;
    roundResolvedRef.current = true;
    const filled = slotsRef.current;
    let correctCount = 0;
    for (let i = 0; i < 5; i++) if (filled[i] === CORRECT_ORDER[i]) correctCount++;
    const acc = correctCount / 5;
    setPouring(correctCount === 5 ? "crystal" : "brown");
    setTimeout(() => {
      setRoundAccuracies((prev) => {
        const next = [...prev, acc];
        if (round + 1 >= FILTER_ROUNDS) {
          if (!finishedRef.current) {
            finishedRef.current = true;
            onComplete(next.reduce((a, b) => a + b, 0) / next.length);
          }
        } else {
          startRound(round + 1);
        }
        return next;
      });
    }, 900);
  };

  useEffect(() => {
    if (secondsLeft <= 0) {
      finalizeRound();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  useEffect(() => {
    if (slots.every(Boolean)) finalizeRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const handleDrop = (material: MaterialKind, info: PanInfo) => {
    const slotEl = objetivoDeDrop(info.point.x, info.point.y, "[data-slot-index]");
    if (!slotEl) return;
    const idx = Number(slotEl.dataset.slotIndex);
    if (slotsRef.current[idx]) return;
    setSlots((s) => {
      if (s[idx]) return s;
      const next = [...s];
      next[idx] = material;
      return next;
    });
    setShelf((sh) => sh.filter((m) => m !== material));
  };

  const materialMeta = (kind: MaterialKind) => MATERIALS.find((m) => m.kind === kind)!;

  return (
    <div>
      <GameHUD timeLabel={`${secondsLeft}s · ronda ${round + 1}/${FILTER_ROUNDS}`} scoreLabel={`🧪 ${slots.filter(Boolean).length}/5 capas`} />
      <div className="flex items-start justify-center gap-6">
        {/* Botella cortada: 5 slots, flex-col-reverse para que el índice 0 quede abajo */}
        <div className="relative flex h-64 w-20 flex-col-reverse gap-1 rounded-b-2xl rounded-t-lg border-2 border-ink bg-surface p-1">
          {slots.map((filled, i) => (
            <div
              key={i}
              data-slot-index={i}
              className={`flex h-12 flex-1 items-center justify-center rounded-md border-2 border-dashed text-xl ${
                filled ? "border-ink bg-[#99B4D8]/30" : "border-ink/30"
              }`}
              aria-label={`Capa ${i + 1} de 5, ${filled ? materialMeta(filled).label : "vacía"}`}
            >
              {filled ? materialMeta(filled).emoji : ""}
            </div>
          ))}
          {pouring && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`pointer-events-none absolute -mt-6 h-6 w-20 rounded-full ${
                pouring === "crystal" ? "bg-[#99B4D8]" : "bg-[#7a5230]"
              }`}
              aria-hidden="true"
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-ink/70">Materiales:</p>
          <div className="grid grid-cols-2 gap-2">
            {shelf.map((kind) => {
              const meta = materialMeta(kind);
              return (
                <div key={kind} className="flex flex-col items-center gap-1">
                  <motion.div
                    drag
                    dragSnapToOrigin
                    dragElastic={0.3}
                    onDragEnd={(_e, info) => handleDrop(kind, info)}
                    className="grid h-12 w-12 touch-none cursor-grab place-items-center rounded-full border-2 border-ink bg-[#FFB793] text-xl shadow-[2px_2px_0_#1c1c11] active:cursor-grabbing"
                    aria-label={`${meta.label}, arrástralo a la capa correcta`}
                    role="button"
                  >
                    {meta.emoji}
                  </motion.div>
                  <span className="text-center text-[10px] font-bold leading-tight text-ink/70">{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {pouring && (
        <p className="mt-2 text-center text-xs font-bold text-ink/80">
          {pouring === "crystal" ? "💎 ¡Agua cristalina! Orden perfecto." : "🌫️ Agua turbia — el orden no filtró bien."}
        </p>
      )}
    </div>
  );
}

// ======================================================================
// 6. RUTAS DE AGUAS GRISES (RUTAS_AGUAS, 90s) — pipe puzzle: gira las
// tuberías para conectar la lavadora con el biohuerto o el inodoro.
// ======================================================================

type Dir = 0 | 1 | 2 | 3; // N, E, S, W
const OPPOSITE = (d: Dir): Dir => (((d + 2) % 4) as Dir);
const DELTA: [number, number][] = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

type PipeShape = "recta" | "codo";
interface PipeCell {
  shape: PipeShape;
  rotation: number;
}

const BASE_OPENS: Record<PipeShape, Dir[]> = {
  recta: [0, 2],
  codo: [0, 1],
};

function opensFor(shape: PipeShape, rotation: number): Dir[] {
  return BASE_OPENS[shape].map((d) => ((d + rotation) % 4) as Dir);
}

const GRID_ROWS = 3;
const GRID_COLS = 3;
const SOURCE = { r: 2, c: 0 };
interface RouteTarget {
  id: "inodoro" | "biohuerto";
  r: number;
  c: number;
  emoji: string;
  label: string;
}
const ROUTE_TARGETS: RouteTarget[] = [
  { id: "inodoro", r: 0, c: 2, emoji: "🚽", label: "Inodoro" },
  { id: "biohuerto", r: 0, c: 2, emoji: "🌳", label: "Biohuerto" },
];
const HAZARD = { r: 1, c: 1 };
/** Ruta segura única: lavadora → tres tuberías → destino. Las piezas de
 * alrededor son terreno, así que no puede nacer una solución al azar. */
const ROUTE_PIPES: { r: number; c: number; shape: PipeShape; solvedRotation: number }[] = [
  { r: 1, c: 0, shape: "recta", solvedRotation: 0 },
  { r: 0, c: 0, shape: "codo", solvedRotation: 1 },
  { r: 0, c: 1, shape: "recta", solvedRotation: 1 },
];

function cellKey(r: number, c: number) {
  return `${r}-${c}`;
}

function isSameCell(a: { r: number; c: number }, r: number, c: number) {
  return a.r === r && a.c === c;
}

export function computeConnectivity(pipes: Record<string, PipeCell>, target: Pick<RouteTarget, "r" | "c">) {
  const opensAt = (r: number, c: number): Dir[] => {
    if (isSameCell(SOURCE, r, c)) return [0];
    if (isSameCell(target, r, c)) return [3];
    if (isSameCell(HAZARD, r, c)) return [];
    const cell = pipes[cellKey(r, c)];
    return cell ? opensFor(cell.shape, cell.rotation) : [];
  };
  const visited = new Set<string>([cellKey(SOURCE.r, SOURCE.c)]);
  const queue: [number, number][] = [[SOURCE.r, SOURCE.c]];
  let connected = false;
  while (queue.length) {
    const [r, c] = queue.shift()!;
    for (const d of opensAt(r, c)) {
      const [dr, dc] = DELTA[d];
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;
      if (isSameCell(HAZARD, nr, nc)) continue;
      if (!opensAt(nr, nc).includes(OPPOSITE(d))) continue;
      const k = cellKey(nr, nc);
      if (visited.has(k)) continue;
      visited.add(k);
      queue.push([nr, nc]);
      if (isSameCell(target, nr, nc)) connected = true;
    }
  }
  return { connected, reachedCount: visited.size - 1 };
}

export function initialRutasPipes(random = Math.random): Record<string, PipeCell> {
  const init: Record<string, PipeCell> = {};
  ROUTE_PIPES.forEach(({ r, c, shape, solvedRotation }) => {
    // Cada pieza inicia rotada al menos 90°, por lo que nunca hay un tablero
    // resuelto al abrirlo; aun así siempre existe una ruta clara al destino.
    // A horizontal first pipe blocks the source, guaranteeing no route exists
    // until the player rotates a piece. Other pieces remain randomized.
    const rotation = r === 1 && c === 0 ? 1 : (solvedRotation + 1 + Math.floor(random() * 3)) % 4;
    init[cellKey(r, c)] = { shape, rotation };
  });
  return init;
}

function RutasAguasGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [target] = useState<RouteTarget>(() => ROUTE_TARGETS[Math.floor(Math.random() * ROUTE_TARGETS.length)]);
  const [pipes, setPipes] = useState<Record<string, PipeCell>>(initialRutasPipes);
  const [moves, setMoves] = useState(0);
  const finishedRef = useRef(false);

  const { connected, reachedCount } = computeConnectivity(pipes, target);

  // Solo cuenta si de verdad conecta con inodoro o biohuerto — el tiempo agotado
  // sin conectar es una pérdida real, sin crédito parcial por tramos alcanzados.
  const finalize = (success: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onComplete(success ? 1 : 0);
  };

  useEffect(() => {
    if (!connected || moves === 0) return;
    const t = setTimeout(() => finalize(true), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  useEffect(() => {
    if (timeLeft <= 0) {
      finalize(false);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const rotate = (r: number, c: number) => {
    if (connected) return;
    setMoves((count) => count + 1);
    setPipes((p) => {
      const k = cellKey(r, c);
      const cur = p[k];
      if (!cur) return p;
      return { ...p, [k]: { ...cur, rotation: (cur.rotation + 1) % 4 } };
    });
  };

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={connected ? "✅ Conectado" : `🔧 ${reachedCount} tramo${reachedCount === 1 ? "" : "s"} con agua`} />
      <div className="mx-auto grid w-fit grid-cols-3 gap-1 rounded-2xl border-2 border-ink bg-bg-light p-2">
        {Array.from({ length: GRID_ROWS }).flatMap((_, r) =>
          Array.from({ length: GRID_COLS }).map((_, c) => {
            const k = cellKey(r, c);
            if (isSameCell(SOURCE, r, c))
              return (
                <div key={k} className="grid h-14 w-14 place-items-center rounded-lg border-2 border-ink bg-[#99B4D8] text-2xl" aria-label="Lavadora, fuente de agua">
                  🧺
                </div>
              );
            if (isSameCell(target, r, c))
              return (
                <div key={k} className="grid h-14 w-14 place-items-center rounded-lg border-2 border-ink bg-surface text-2xl" aria-label={`${target.label}, destino válido`}>
                  {target.emoji}
                </div>
              );
            if (isSameCell(HAZARD, r, c))
              return (
                <div
                  key={k}
                  className="grid h-14 w-14 place-items-center rounded-lg border-2 border-[#E26D5C] bg-[#E26D5C]/30 text-2xl"
                  aria-label="Aguas negras, evitar conectar aquí"
                >
                  ☠️
                </div>
              );
            const pipe = pipes[k];
            if (!pipe)
              return <div key={k} className="grid h-14 w-14 place-items-center rounded-lg border-2 border-dashed border-ink/30 bg-[#B9C992]/30 text-lg" aria-label="Terreno sin tubería">🌱</div>;
            return (
              <button
                key={k}
                type="button"
                onClick={() => rotate(r, c)}
                aria-label={`Tubería tipo ${pipe.shape}, tocar para rotar`}
                className="grid h-14 w-14 place-items-center rounded-lg border-2 border-ink bg-[#99B4D8]/30 text-3xl transition-transform"
                style={{ transform: `rotate(${pipe.rotation * 90}deg)` }}
              >
                {pipe.shape === "recta" ? "┃" : "┗"}
              </button>
            );
          }),
        )}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink/70">
        Toca las tuberías para girarlas y conectar 🧺 Lavadora con {target.emoji} {target.label} — evita ☠️ aguas negras.
      </p>
    </div>
  );
}

// ======================================================================
// 7. DESAFÍO SODIS: RAYOS UV VS. MICROBIOS (SODIS_UV, 60s) — arrastra
// el espejo hacia cada botella para desinfectar antes de que se multiplique.
// ======================================================================

const SODIS_BOTTLES = 4;
const SODIS_MAX_LEVEL = 3;

function SodisUvGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [levels, setLevels] = useState<number[]>(Array(SODIS_BOTTLES).fill(0));
  const [totalInfections, setTotalInfections] = useState(0);
  const [totalCleared, setTotalCleared] = useState(0);
  const [powerUpVisible, setPowerUpVisible] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onComplete(totalInfections > 0 ? Math.min(1, totalCleared / totalInfections) : 0);
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const spawn = setInterval(() => {
      setLevels((ls) => {
        const idx = Math.floor(Math.random() * SODIS_BOTTLES);
        if (ls[idx] >= SODIS_MAX_LEVEL) return ls;
        const next = [...ls];
        next[idx] += 1;
        return next;
      });
      setTotalInfections((n) => n + 1);
    }, 1400);
    return () => clearInterval(spawn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft <= 0]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const iv = setInterval(() => {
      setPowerUpVisible(true);
      setTimeout(() => setPowerUpVisible(false), 3000);
    }, 15000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft <= 0]);

  const clearBottle = (idx: number) => {
    setLevels((ls) => {
      if (ls[idx] === 0) return ls;
      setTotalCleared((c) => c + ls[idx]);
      const next = [...ls];
      next[idx] = 0;
      return next;
    });
  };

  const usePowerUp = () => {
    setLevels((ls) => {
      const cleared = ls.reduce((a, b) => a + b, 0);
      if (cleared > 0) setTotalCleared((c) => c + cleared);
      return Array(SODIS_BOTTLES).fill(0);
    });
    setPowerUpVisible(false);
  };

  const handleMirrorDrop = (info: PanInfo) => {
    const bottleEl = objetivoDeDrop(info.point.x, info.point.y, "[data-bottle-index]");
    if (!bottleEl) return;
    clearBottle(Number(bottleEl.dataset.bottleIndex));
  };

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`☀️ ${totalCleared}/${totalInfections} desinfectadas`} />
      <div className="grid grid-cols-4 gap-2">
        {levels.map((level, i) => (
          <div
            key={i}
            data-bottle-index={i}
            className={`flex h-28 flex-col items-center justify-end gap-1 rounded-b-full rounded-t-lg border-2 border-ink p-1 text-2xl transition-colors ${
              level === 0 ? "bg-[#99B4D8]/30" : level === 1 ? "bg-[#FFB793]" : level === 2 ? "bg-[#E26D5C]/60" : "bg-[#E26D5C]"
            }`}
            aria-label={`Botella ${i + 1}, contaminación nivel ${level} de ${SODIS_MAX_LEVEL}`}
          >
            🧴
            <span aria-hidden="true">{"🦠".repeat(level)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.3}
          onDragEnd={(_e, info) => handleMirrorDrop(info)}
          className="grid h-16 w-16 touch-none cursor-grab place-items-center rounded-full border-2 border-ink bg-surface text-3xl shadow-[2px_2px_0_#1c1c11] active:cursor-grabbing"
          aria-label="Espejo, arrástralo a una botella para reflejar el sol"
          role="button"
        >
          🔆
        </motion.div>

        {powerUpVisible && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            type="button"
            onClick={usePowerUp}
            className={`min-h-12 rounded-full border-2 border-ink bg-[#FFB793] px-4 text-sm font-black ${HARD_SHADOW}`}
          >
            💧 Mediodía Piurano (EcoDrop)
          </motion.button>
        )}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink/70">
        Arrastra el 🔆 espejo a cada botella para reflejar el sol y matar bacterias 🦠 antes de que se multipliquen.
      </p>
    </div>
  );
}

// ======================================================================
// 8. GUARDIÁN DEL RÍO PIURA Y MANGLARES (GUARDIAN_RIO, 60s) — desliza
// la basura a reciclar, deja pasar libre la fauna y naturaleza.
// ======================================================================

interface RiverItem {
  id: number;
  speciesId: string;
  kind: "trash" | "fauna";
  emoji: string;
  nombre: string;
  x: number;
  /** Milisegundos que le quedan de vida; el cauce baja más rápido en la crecida. */
  lifespanMs: number;
}

/** Fracción final de la accuracy: eficiencia por lo clasificado bien × vida restante. */
export function calcGuardianRioAccuracy(correct: number, attempts: number, life: number): number {
  const efficiency = attempts > 0 ? correct / attempts : 0.5;
  return Math.min(1, Math.max(0, efficiency * (life / 100)));
}

function GuardianRioGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [items, setItems] = useState<RiverItem[]>([]);
  const [life, setLife] = useState(100);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [dato, setDato] = useState<{ nombre: string; texto: string } | null>(null);
  const resolvedIds = useRef(new Set<number>());
  const finishedRef = useRef(false);
  const datoTimer = useRef<number | null>(null);
  const album = useAlbum();

  const elapsed = duration - timeLeft;
  const phase = phaseAt(elapsed, duration);
  const phaseIdRef = useRef(phase.id);
  phaseIdRef.current = phase.id;

  useEffect(() => {
    if (timeLeft <= 0 || life <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        const efficiency = attempts > 0 ? correct / attempts : 0.5;
        onComplete(Math.min(1, Math.max(0, efficiency * (life / 100))));
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, life]);

/** Al acertar una especie se muestra su dato educativo una sola vez por partida. */
  const showDato = useCallback((speciesId: string) => {
    const species = SPECIES_BY_ID[speciesId];
    if (!species) return;
    setDato({ nombre: species.nombre, texto: species.dato });
    if (datoTimer.current) window.clearTimeout(datoTimer.current);
    datoTimer.current = window.setTimeout(() => setDato(null), 2000);
  }, []);

  useEffect(() => () => {
    if (datoTimer.current) window.clearTimeout(datoTimer.current);
  }, []);

  const resolveItem = (id: number, kind: "trash" | "fauna", speciesId: string, swiped: "left" | "right" | null) => {
    if (resolvedIds.current.has(id)) return;
    resolvedIds.current.add(id);
    setItems((its) => its.filter((it) => it.id !== id));
    if (swiped === null) {
      // Se llegó al final del cauce sin decidir: la basura contamina (resta),
      // la fauna y el manglar se salvaron igual (suma) y pasa al álbum.
      if (kind === "trash") {
        setAttempts((a) => a + 1);
        setLife((l) => Math.max(0, l - 8));
      } else {
        setAttempts((a) => a + 1);
        setCorrect((c) => c + 1);
        recordDiscovery(speciesId);
      }
      return;
    }
    const correctDir = kind === "trash" ? "right" : "left";
    setAttempts((a) => a + 1);
    if (swiped === correctDir) {
      setCorrect((c) => c + 1);
      setLife((l) => Math.min(100, l + 2));
      setFeedback("ok");
      recordDiscovery(speciesId);
      showDato(speciesId);
      playChime();
    } else {
      setLife((l) => Math.max(0, l - 15));
      setFeedback("bad");
      playMiss();
    }
    setTimeout(() => setFeedback(null), 700);
  };

  // El spawn se rearma cuando cambia de fase: cada una tiene su propio ritmo,
  // vida de objeto y mezcla basura/fauna.
  useEffect(() => {
    if (timeLeft <= 0) return;
    const spawn = setInterval(() => {
      const current = phaseIdRef.current;
      const conf = RIVER_PHASES.find((p) => p.id === current) ?? RIVER_PHASES[0];
      const species = pickSpecies(conf);
      const id = Date.now() + Math.random();
      setItems((its) => [
        ...its,
        {
          id,
          speciesId: species.id,
          kind: species.kind,
          emoji: species.emoji,
          nombre: species.nombre,
          x: pickLaneX(),
          lifespanMs: conf.lifespanMs,
        },
      ]);
      setTimeout(() => resolveItem(id, species.kind, species.id, null), conf.lifespanMs);
    }, phase.spawnMs);
    return () => clearInterval(spawn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.id, timeLeft <= 0]);

  const handleSwipe = (item: RiverItem, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 60) return;
    resolveItem(item.id, item.kind, item.speciesId, info.offset.x > 0 ? "right" : "left");
  };

  const found = RIVER_SPECIES.filter((s) => (album[s.id] ?? 0) > 0).length;

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`❤️ ${life} · ✅ ${correct}/${attempts}`} />
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full border-2 border-ink bg-surface px-2.5 py-1 text-[11px] font-black">
          {phase.nombre} · {phase.descripcion}
        </span>
        <span
          className="rounded-full border-2 border-ink bg-surface px-2.5 py-1 text-[11px] font-black"
          title={`${found} de ${TOTAL_SPECIES} especies en tu álbum`}
        >
          📖 {found}/{TOTAL_SPECIES}
        </span>
      </div>
      <div className={`relative h-64 overflow-hidden rounded-2xl border-2 border-ink bg-gradient-to-b ${phase.waterHue}`}>
        <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-between px-3 text-[10px] font-black text-ink/50">
          <span>⬅️ Dejar pasar</span>
          <span>Reciclar ➡️</span>
        </div>
        {feedback && (
          <span
            className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-4 py-2 text-lg font-black ${
              feedback === "ok" ? "border-[#28a745] bg-[#28a745]/90 text-white" : "border-white bg-[#E26D5C]/90 text-white"
            }`}
          >
            {feedback === "ok" ? "✓" : "✗"}
          </span>
        )}
        {dato && (
          <div
            role="status"
            className="pointer-events-none absolute inset-x-2 bottom-2 z-10 rounded-xl border-2 border-ink bg-surface/95 px-3 py-1.5 text-center shadow-[2px_2px_0_#1c1c11]"
          >
            <span className="block text-[11px] font-black text-ink">{dato.nombre}</span>
            <span className="block text-[10px] font-semibold text-ink/70">{dato.texto}</span>
          </div>
        )}
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              drag="x"
              dragConstraints={{ left: -80, right: 80 }}
              dragElastic={0.15}
              dragSnapToOrigin
              onDragEnd={(_e, info) => handleSwipe(item, info)}
              initial={{ top: "0%", scale: 0 }}
              animate={{ top: "88%", scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ top: { duration: item.lifespanMs / 1000, ease: "linear" }, scale: { duration: 0.2 } }}
              style={{ left: `${item.x}%` }}
              className="absolute grid h-12 w-12 -translate-x-1/2 touch-none cursor-grab place-items-center rounded-full border-2 border-ink bg-surface text-2xl shadow-[2px_2px_0_#1c1c11] active:cursor-grabbing"
              aria-label={item.kind === "trash" ? `${item.nombre}, basura: desliza a la derecha para reciclar` : `${item.nombre}: desliza a la izquierda para dejar pasar`}
            >
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink/70">
        Desliza ➡️ la basura hacia el reciclaje y ⬅️ la fauna y los mangles. El río cambia de fase: lee el cartel de
        arriba.
      </p>
      <p className="mt-2 text-center text-xs font-bold text-ink">
        Cada especie que clasificas bien se desbloquea en tu álbum 🏅. Ya llevas {found}/{TOTAL_SPECIES} — míralas
        todas en la sección <span className="text-[#1c6b34]">Álbum</span> de la plataforma.
      </p>
    </div>
  );
}

// ======================================================================
// 9. LA DUCHA MUSICAL DE 4 MINUTOS (DUCHA_MUSICAL, 60s) — 3 fases,
// cierra la llave al ritmo durante el enjabonado.
// ======================================================================

const RHYTHM_BEATS = [22, 25, 28, 31, 34, 37];
const RHYTHM_WINDOW = 2;
// Señuelos en huecos sin beat real (beats ocupan 22-23,25-26,28-29,31-32,34-35,37-38)
// + 1 trampa final en Enjuagarse. Si el usuario la toca, pierde; si la ignora, se salva.
const TRAP_BEATS = [24, 30, 36, 50];
const TRAP_WINDOW = 2;
const TRAP_LABELS = ["🧴 Más champú", "🚿 Abrir a full", "💦 Subir presión", "🫧 Dejar correr"];
const TRAP_PENALTY_LITERS = 8;
const MASH_PENALTY_LITERS = 2;

type TrapState = "pending" | "active" | "saved" | "failed";

function DuchaMusicalGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const elapsed = duration - timeLeft;
  const [beatStates, setBeatStates] = useState<("pending" | "active" | "hit" | "miss")[]>(RHYTHM_BEATS.map(() => "pending"));
  const [trapStates, setTrapStates] = useState<TrapState[]>(TRAP_BEATS.map(() => "pending"));
  const [litersLost, setLitersLost] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const beatStatesRef = useRef(beatStates);
  const trapStatesRef = useRef(trapStates);
  const finishedRef = useRef(false);

  useEffect(() => {
    beatStatesRef.current = beatStates;
  }, [beatStates]);
  useEffect(() => {
    trapStatesRef.current = trapStates;
  }, [trapStates]);

  const bumpCombo = () => {
    setCombo((c) => {
      const next = c + 1;
      setBestCombo((b) => Math.max(b, next));
      return next;
    });
  };

  const phase: "Mojarse" | "Enjabonarse" | "Enjuagarse" = elapsed < 8 ? "Mojarse" : elapsed < 42 ? "Enjabonarse" : "Enjuagarse";

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        const hits = beatStatesRef.current.filter((s) => s === "hit").length;
        const saves = trapStatesRef.current.filter((s) => s === "saved").length;
        onComplete(Math.min(1, (hits + saves) / (RHYTHM_BEATS.length + TRAP_BEATS.length)));
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    setBeatStates((states) =>
      states.map((state, i) => {
        const beatTime = RHYTHM_BEATS[i];
        if (state === "pending" && elapsed >= beatTime) return "active";
        if (state === "active" && elapsed >= beatTime + RHYTHM_WINDOW) {
          setLitersLost((l) => l + 5);
          setCombo(0);
          setFeedback("Se te pasó el compás: +5L perdidos.");
          return "miss";
        }
        return state;
      }),
    );
    setTrapStates((states) =>
      states.map((state, i) => {
        const trapTime = TRAP_BEATS[i];
        if (state === "pending" && elapsed >= trapTime) return "active";
        if (state === "active" && elapsed >= trapTime + TRAP_WINDOW) {
          bumpCombo();
          setFeedback("🛡️ ¡Te salvaste! Ignoraste la trampa.");
          return "saved";
        }
        return state;
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  const tapCerrar = () => {
    const idx = beatStates.findIndex((s) => s === "active");
    if (idx === -1) {
      // Anti-mash: tocar sin compás activo también desperdicia agua.
      setLitersLost((l) => l + MASH_PENALTY_LITERS);
      setCombo(0);
      setFeedback("¡Sin ritmo! Espera el botón rojo. +2L.");
      playMiss();
      return;
    }
    setBeatStates((states) => states.map((s, i) => (i === idx ? "hit" : s)));
    bumpCombo();
    setFeedback(null);
    playChime();
  };

  const tapTrap = (trapIdx: number) => {
    setTrapStates((states) => states.map((s, i) => (i === trapIdx && s === "active" ? "failed" : s)));
    setLitersLost((l) => l + TRAP_PENALTY_LITERS);
    setCombo(0);
    setFeedback("🕳️ ¡Caíste! Era trampa: +8L perdidos.");
    playMiss();
  };

  const activeBeat = beatStates.some((s) => s === "active");
  const activeTrapIdx = trapStates.findIndex((s) => s === "active");
  const saves = trapStates.filter((s) => s === "saved").length;

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`🔥 combo ${combo} · 🛡️ ${saves}/${TRAP_BEATS.length} · 🚱 ${litersLost}L`} />
      <div className="rounded-2xl border-2 border-ink bg-[#99B4D8]/30 p-5 text-center">
        <p className="font-display text-lg font-extrabold">{phase}</p>
        <span className="text-5xl" aria-hidden="true">
          {phase === "Mojarse" ? "🚿" : phase === "Enjabonarse" ? "🧼" : "💦"}
        </span>
        {phase === "Enjabonarse" ? (
          <>
            <p className="mt-2 text-sm font-semibold text-ink/80">
              {activeTrapIdx !== -1
                ? "⚠️ ¡Ojo! Hay trampa: solo toca CERRAR en rojo."
                : activeBeat
                  ? "¡Cierra la llave al ritmo!"
                  : "Prepárate para el siguiente compás…"}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <motion.button
                type="button"
                onClick={tapCerrar}
                animate={activeBeat ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ repeat: activeBeat ? Infinity : 0, duration: 0.5 }}
                className={`min-h-12 rounded-xl border-2 border-ink px-6 font-black shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  activeBeat ? "bg-[#E26D5C] text-white" : "bg-surface"
                }`}
              >
                🚿 Cerrar llave
              </motion.button>
              {activeTrapIdx !== -1 && (
                <motion.button
                  key={activeTrapIdx}
                  type="button"
                  initial={{ scale: 0, rotate: -3 }}
                  animate={{ scale: 1, rotate: 0 }}
                  onClick={() => tapTrap(activeTrapIdx)}
                  className="min-h-12 rounded-xl border-2 border-dashed border-ink/60 bg-surface/70 px-4 font-black text-ink/70 shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  aria-label={`Trampa: ${TRAP_LABELS[activeTrapIdx % TRAP_LABELS.length]}. No tocar.`}
                >
                  {TRAP_LABELS[activeTrapIdx % TRAP_LABELS.length]}
                </motion.button>
              )}
            </div>
          </>
        ) : phase === "Enjuagarse" ? (
          <>
            <p className="mt-2 text-sm font-semibold text-ink/70">
              {activeTrapIdx !== -1 ? "⚠️ Trampa final: ¡NO toques Dejar correr!" : "Enjuaga y listo — ¡ducha flash completada!"}
            </p>
            {activeTrapIdx !== -1 && (
              <motion.button
                key={activeTrapIdx}
                type="button"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                onClick={() => tapTrap(activeTrapIdx)}
                className="mt-3 min-h-12 rounded-xl border-2 border-dashed border-ink/60 bg-surface/70 px-4 font-black text-ink/70 shadow-[2px_2px_0_#1c1c11]"
                aria-label="Trampa final: no tocar."
              >
                {TRAP_LABELS[activeTrapIdx % TRAP_LABELS.length]}
              </motion.button>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm font-semibold text-ink/70">
            Mójate rápido, el reto empieza al enjabonarte. Habrá botones falsos.
          </p>
        )}
        {feedback && (
          <p role="status" className="mt-2 text-xs font-bold text-ink/80">
            {feedback}
          </p>
        )}
        <div className="mt-3 flex justify-center gap-1" aria-label={`${RHYTHM_BEATS.length} compases de la canción`}>
          {beatStates.map((s, i) => (
            <span
              key={i}
              className={`h-2 w-6 rounded-full ${
                s === "hit" ? "bg-[#28a745]" : s === "miss" ? "bg-[#E26D5C]" : s === "active" ? "bg-[#FFB793]" : "border border-ink/30 bg-surface"
              }`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-center gap-1" aria-label={`${TRAP_BEATS.length} trampas`}>
          {trapStates.map((s, i) => (
            <span
              key={i}
              title={`Trampa ${i + 1}: ${s}`}
              className={`h-2 w-6 rounded-full border ${
                s === "saved" ? "bg-[#28a745]" : s === "failed" ? "bg-[#E26D5C]" : s === "active" ? "animate-pulse bg-[#FFD23F]" : "border-ink/30 bg-surface"
              }`}
            />
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink/70">Mejor combo: {bestCombo}</p>
    </div>
  );
}

// ======================================================================
// 10. EL DESAFÍO DEL CORTE DE AGUA (CORTE_AGUA, 90s) — 9 tarjetas de
// decisión (3 días × 3), administra el reservorio sin perder higiene.
// ======================================================================

interface DecisionOption {
  label: string;
  liters: number;
  hygiene: number;
}

interface DecisionCard {
  id: string;
  day: number;
  title: string;
  emoji: string;
  optionA: DecisionOption;
  optionB: DecisionOption;
}

const NO_CHOICE_PENALTY = { liters: 120, hygiene: -15 };

function buildDecisionCards(): DecisionCard[] {
  // 9 dilemas únicos (3 por día, dificultad creciente): ya no se repite el
  // mismo trío 3 veces. Día 1 rutina, día 2 presión, día 3 corte aprieta.
  const byDay: Omit<DecisionCard, "id" | "day">[][] = [
    [
      {
        title: "Cocinar el almuerzo",
        emoji: "🍳",
        optionA: { label: "Cocinar en casa", liters: 40, hygiene: 0 },
        optionB: { label: "Pedir comida fuera", liters: 5, hygiene: 0 },
      },
      {
        title: "Bañarse hoy",
        emoji: "🚿",
        optionA: { label: "Balde + ducha de 5 min", liters: 25, hygiene: 5 },
        optionB: { label: "Ducha larga con chorro", liters: 80, hygiene: 5 },
      },
      {
        title: "Lavar los platos",
        emoji: "🍽️",
        optionA: { label: "Tina y reuso a plantas", liters: 15, hygiene: 0 },
        optionB: { label: "Chorro abierto", liters: 45, hygiene: 0 },
      },
    ],
    [
      {
        title: "Lavar la ropa",
        emoji: "👕",
        optionA: { label: "Lavadora llena hoy", liters: 40, hygiene: 5 },
        optionB: { label: "Posponer el lavado", liters: 0, hygiene: -10 },
      },
      {
        title: "Usar el inodoro",
        emoji: "🚽",
        optionA: { label: "Descarga solo necesaria + botella", liters: 10, hygiene: 0 },
        optionB: { label: "Descargar siempre", liters: 40, hygiene: 0 },
      },
      {
        title: "Lavarse las manos",
        emoji: "🧼",
        optionA: { label: "Caño corto + jabón", liters: 5, hygiene: 10 },
        optionB: { label: "Saltárselo", liters: 0, hygiene: -15 },
      },
    ],
    [
      {
        title: "Regar el jardín",
        emoji: "🌱",
        optionA: { label: "Agua potable directa", liters: 30, hygiene: 0 },
        optionB: { label: "Agua gris de enjuague", liters: 5, hygiene: 0 },
      },
      {
        title: "Limpiar el piso",
        emoji: "🧹",
        optionA: { label: "Trapo + balde", liters: 10, hygiene: 0 },
        optionB: { label: "Manguera", liters: 60, hygiene: 0 },
      },
      {
        title: "Fuga del vecino",
        emoji: "🚰",
        optionA: { label: "Reportar y ajustar la llave", liters: 0, hygiene: 5 },
        optionB: { label: "Ignorarla", liters: 30, hygiene: -5 },
      },
    ],
  ];
  const cards: DecisionCard[] = [];
  byDay.forEach((dayTemplates, d) => {
    dayTemplates.forEach((t, i) => cards.push({ id: `d${d + 1}-${i}`, day: d + 1, ...t }));
  });
  return cards;
}

function CorteAguaGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const cards = useMemo(buildDecisionCards, []);
  const totalCards = cards.length;
  const cardSeconds = Math.max(6, Math.round(duration / totalCards));
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(cardSeconds);
  const [reserve, setReserve] = useState(1000);
  const [hygiene, setHygiene] = useState(100);
  const [feedback, setFeedback] = useState<string | null>(null);
  const answeredRef = useRef(false);
  const finishedRef = useRef(false);
  const reserveRef = useRef(reserve);
  const hygieneRef = useRef(hygiene);

  useEffect(() => {
    reserveRef.current = reserve;
  }, [reserve]);
  useEffect(() => {
    hygieneRef.current = hygiene;
  }, [hygiene]);

  const card = cards[index];

  const finalize = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const reserveFactor = Math.min(1, Math.max(0, reserveRef.current / 400));
    const hygieneFactor = Math.min(1, Math.max(0, hygieneRef.current / 100));
    onComplete((reserveFactor + hygieneFactor) / 2);
  };

  const nextCard = () => {
    if (index + 1 >= totalCards || reserveRef.current <= 0) {
      finalize();
      return;
    }
    setIndex((i) => i + 1);
    setSecondsLeft(cardSeconds);
    setFeedback(null);
    answeredRef.current = false;
  };

  const choose = (opt: DecisionOption) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setReserve((r) => Math.max(0, r - opt.liters));
    setHygiene((h) => Math.max(0, Math.min(100, h + opt.hygiene)));
    setFeedback(`-${opt.liters}L${opt.hygiene !== 0 ? ` · ${opt.hygiene > 0 ? "+" : ""}${opt.hygiene} higiene` : ""}`);
    setTimeout(nextCard, 700);
  };

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!answeredRef.current) {
        answeredRef.current = true;
        // No decidir es la peor decisión posible (el reservorio sigue gastándose
        // solo y nadie cuida la higiene) — más caro que cualquiera de las 2
        // opciones, para que no elegir nunca lleve a terminar el día 3 sin perder.
        setReserve((r) => Math.max(0, r - NO_CHOICE_PENALTY.liters));
        setHygiene((h) => Math.max(0, h + NO_CHOICE_PENALTY.hygiene));
        setFeedback(`Sin decisión — se desperdició agua e higiene (-${NO_CHOICE_PENALTY.liters}L · ${NO_CHOICE_PENALTY.hygiene} higiene)`);
        setTimeout(nextCard, 700);
      }
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  useEffect(() => {
    if (reserve <= 0) finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reserve]);

  return (
    <div>
      <GameHUD timeLabel={`${secondsLeft}s · día ${card.day}/3`} scoreLabel={`🛢️ ${reserve}L · 🧼 ${hygiene}%`} />
      <div className="rounded-2xl border-2 border-ink bg-surface p-5 text-center">
        <span className="text-5xl" aria-hidden="true">
          {card.emoji}
        </span>
        <p className="mt-1 font-display text-lg font-extrabold">{card.title}</p>
        <p className="text-xs font-semibold text-ink/60">
          Tarjeta {index + 1}/{totalCards}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => choose(card.optionA)}
            disabled={answeredRef.current}
            className="min-h-12 rounded-xl border-2 border-ink bg-[#99B4D8] px-3 font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {card.optionA.label} (-{card.optionA.liters}L)
          </button>
          <button
            type="button"
            onClick={() => choose(card.optionB)}
            disabled={answeredRef.current}
            className="min-h-12 rounded-xl border-2 border-ink bg-[#FFB793] px-3 font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {card.optionB.label} (-{card.optionB.liters}L)
          </button>
        </div>
        {feedback && <p className="mt-2 text-xs font-bold text-ink/70">{feedback}</p>}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink/70">
        Llega al día 3 con reservorio y buena higiene — evita que el reservorio llegue a 0 L.
      </p>
    </div>
  );
}

// ======================================================================
// 11. EL ACUÍFERO SECRETO: RAÍCES DEL ALGARROBO (ACUIFERO_ALGARROBO, 60s,
// 3 rondas) — guía la raíz con ⬅️➡️ esquivando obstáculos, recoge acuíferos.
// ======================================================================

type AquiferItemKind = "rock" | "contaminated" | "aquifer";
interface AquiferItem {
  id: number;
  kind: AquiferItemKind;
  lane: number;
}

const AQUIFER_LANES = 3;
const AQUIFER_ROUNDS = 3;
const AQUIFER_ITEM_FALL_MS = 2200;
const AQUIFER_ITEM_META: Record<AquiferItemKind, { emoji: string }> = {
  rock: { emoji: "🌑" },
  contaminated: { emoji: "🛢️" },
  aquifer: { emoji: "💧" },
};

function AcuiferoAlgarroboGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const roundSeconds = Math.max(10, Math.round(duration / AQUIFER_ROUNDS));
  const [round, setRound] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(roundSeconds);
  const [lane, setLane] = useState(1);
  const [items, setItems] = useState<AquiferItem[]>([]);
  const [life, setLife] = useState(100);
  const [collected, setCollected] = useState(0);
  const [spawnedAquifers, setSpawnedAquifers] = useState(0);
  const laneRef = useRef(lane);
  const lifeRef = useRef(life);
  const resolvedIds = useRef(new Set<number>());
  const finishedRef = useRef(false);

  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);
  useEffect(() => {
    lifeRef.current = life;
  }, [life]);

  const finalize = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const collectFactor = spawnedAquifers > 0 ? Math.min(1, collected / spawnedAquifers) : 0.5;
    const lifeFactor = Math.max(0, lifeRef.current) / 100;
    onComplete(Math.min(1, Math.max(0, 0.5 * lifeFactor + 0.5 * collectFactor)));
  };

  useEffect(() => {
    if (life <= 0) finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [life]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (round + 1 >= AQUIFER_ROUNDS) {
        finalize();
        return;
      }
      setRound((r) => r + 1);
      setSecondsLeft(roundSeconds);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const resolveItem = (id: number, kind: AquiferItemKind, itemLane: number) => {
    if (resolvedIds.current.has(id)) return;
    resolvedIds.current.add(id);
    setItems((its) => its.filter((it) => it.id !== id));
    if (itemLane !== laneRef.current) return; // esquivado, sin efecto
    if (kind === "rock") setLife((l) => Math.max(0, l - 15));
    else if (kind === "contaminated") setLife((l) => Math.max(0, l - 10));
    else {
      setCollected((c) => c + 1);
      setLife((l) => Math.min(100, l + 2));
    }
  };

  useEffect(() => {
    if (finishedRef.current) return;
    const spawnMs = Math.max(650, 1200 - round * 200); // más rápido cada ronda
    const spawn = setInterval(() => {
      const id = Date.now() + Math.random();
      const roll = Math.random();
      const kind: AquiferItemKind = roll < 0.35 ? "rock" : roll < 0.55 ? "contaminated" : "aquifer";
      const spawnLane = Math.floor(Math.random() * AQUIFER_LANES);
      if (kind === "aquifer") setSpawnedAquifers((n) => n + 1);
      setItems((its) => [...its, { id, kind, lane: spawnLane }]);
      setTimeout(() => resolveItem(id, kind, spawnLane), AQUIFER_ITEM_FALL_MS);
    }, spawnMs);
    return () => clearInterval(spawn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  return (
    <div>
      <GameHUD timeLabel={`${secondsLeft}s · ronda ${round + 1}/${AQUIFER_ROUNDS}`} scoreLabel={`❤️ ${life} · 💧 ${collected}/${spawnedAquifers}`} />
      <div className="relative h-64 overflow-hidden rounded-2xl border-2 border-ink bg-gradient-to-b from-[#fdfae7] to-[#8a5a2e]/30">
        <div className="absolute inset-0 grid grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`border-r-2 border-ink/10 last:border-r-0 ${i === lane ? "bg-[#99B4D8]/10" : ""}`} />
          ))}
        </div>
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ top: "0%" }}
              animate={{ top: "88%" }}
              exit={{ scale: 0 }}
              transition={{ top: { duration: AQUIFER_ITEM_FALL_MS / 1000, ease: "linear" } }}
              style={{ left: `${(item.lane + 0.5) * (100 / AQUIFER_LANES)}%` }}
              className="absolute grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border-2 border-ink bg-surface text-xl shadow-[2px_2px_0_#1c1c11]"
              aria-hidden="true"
            >
              {AQUIFER_ITEM_META[item.kind].emoji}
            </motion.div>
          ))}
        </AnimatePresence>
        <motion.div
          animate={{ left: `${(lane + 0.5) * (100 / AQUIFER_LANES)}%` }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full border-2 border-ink bg-[#99B4D8] text-2xl shadow-[2px_2px_0_#1c1c11]"
          aria-label={`Raíz del algarrobo en el carril ${lane + 1} de ${AQUIFER_LANES}`}
        >
          🌱
        </motion.div>
      </div>

      <div className="mt-4 flex items-center justify-between px-6 sm:justify-center sm:gap-12">
        <button
          type="button"
          onClick={() => setLane((l) => Math.max(0, l - 1))}
          aria-label="Guiar raíz a la izquierda"
          className="grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-surface text-2xl shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          ⬅️
        </button>
        <button
          type="button"
          onClick={() => setLane((l) => Math.min(AQUIFER_LANES - 1, l + 1))}
          aria-label="Guiar raíz a la derecha"
          className="grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-surface text-2xl shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          ➡️
        </button>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink/70">
        Guía la raíz esquivando 🌑 rocas y 🛢️ filtraciones — recoge 💧 bolsas de acuífero antes de llegar a la corriente profunda.
      </p>
    </div>
  );
}

// ======================================================================
// 12. EL GOTERO PRECISO: CLORACIÓN SEGURA (CLORACION_SEGURA, 60s) —
// mantén presionado el gotero y suelta en el número exacto de gotas.
// ======================================================================

type CloracionEtapa = "elegir" | "gotero" | "resultado";

interface CloracionFeedback {
  text: string;
  ok: boolean;
  veredicto: DosisVeredicto | "timeout";
}

function sortearNuevoCaso(phaseId: string): CasoCloracion {
  const phase = CLORACION_PHASES.find((p) => p.id === phaseId) ?? CLORACION_PHASES[0];
  return sortearCaso(phase);
}

function CloracionSeguraGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [caso, setCaso] = useState<CasoCloracion>(() => primerCaso(0));
  const [etapa, setEtapa] = useState<CloracionEtapa>("elegir");
  const [filtrada, setFiltrada] = useState(false);
  const [ritmo, setRitmo] = useState<RitmoId | null>(null);
  const [drops, setDrops] = useState(0);
  const [holding, setHolding] = useState(false);
  const [perfectCount, setPerfectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [feedback, setFeedback] = useState<CloracionFeedback | null>(null);
  const dropsRef = useRef(0);
  const resolvingRef = useRef(false);
  const finishedRef = useRef(false);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const elapsed = duration - timeLeft;
  const phase = cloracionPhaseAt(elapsed, duration);
  const phaseRef = useRef(phase.id);
  phaseRef.current = phase.id;
  const caseIndexRef = useRef(0);

  // Gotas que la dosis elegida exige. `null` mientras el jugador no elige ritmo.
  const gotasPorLitro = ritmo ? gotasDeRitmo(ritmo) : null;
  const objetivo =
    gotasPorLitro === null || gotasPorLitro === undefined || ritmo === null
      ? null
      : gotasRequeridas(caso.container.liters, gotasPorLitro, caso.turbia, filtrada);

  useEffect(() => {
    dropsRef.current = drops;
  }, [drops]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onComplete(calcCloracionScore(perfectCount, attempts, bestCombo));
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const siguienteCaso = () => {
    caseIndexRef.current += 1;
    const i = caseIndexRef.current;
    // Los tres primeros casos recorren 1 L, 5 L y 20 L en ciclo fijo; de ahí en
    // adelante manda el sorteo de la fase que toque.
    setCaso(i < 3 ? primerCaso(i) : sortearNuevoCaso(phaseRef.current));
    setEtapa("elegir");
    setFiltrada(false);
    setRitmo(null);
    setDrops(0);
    dropsRef.current = 0;
    setFeedback(null);
    resolvingRef.current = false;
  };

  const resolveCaso = (gotasFinales: number, timedOut: boolean) => {
    if (resolvingRef.current || objetivo === null) return;
    resolvingRef.current = true;
    if (containerTimeoutRef.current) clearTimeout(containerTimeoutRef.current);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHolding(false);
    setEtapa("resultado");
    setAttempts((a) => a + 1);

    // Si el ritmo no aplica a la fuente (clorar agua embotellada), el conteo
    // de gotas no puede salir "perfecto" por más que cuadre.
    const veredicto: DosisVeredicto = timedOut
      ? "subdosis"
      : !dosisApta(caso.source, ritmo as RitmoId)
        ? "sobredosis"
        : evaluarDosis(gotasFinales, objetivo);
    const ok = !timedOut && veredicto === "perfecta";
    if (ok) {
      setPerfectCount((c) => c + 1);
      setCombo((c) => {
        const next = c + 1;
        setBestCombo((b) => Math.max(b, next));
        return next;
      });
    } else {
      setCombo(0);
    }

    const texto = timedOut
      ? "⏱️ Se acabó el tiempo: el agua quedó sin tratar"
      : veredicto === "perfecta"
          ? "💎 Dosis perfecta — agua segura"
          : veredicto === "sobredosis"
            ? "🤢 Sobredosis: agua amarilla y con sabor a cloro"
            : "🦠 Subdosis: el agua sigue sin desinfectar";

    setFeedback({ text: texto, ok, veredicto: timedOut ? "timeout" : veredicto });
    if (ok) playChime();
    else playMiss();
    setTimeout(() => siguienteCaso(), 1500);
  };

  // Una vez elegido el ritmo arranca la ventana para dosificar. El timeout
  // depende de la dosis: 1 gota y 40 gotas no pueden tener la misma paciencia.
  useEffect(() => {
    if (timeLeft <= 0 || etapa !== "gotero" || objetivo === null) return;
    containerTimeoutRef.current = setTimeout(() => resolveCaso(dropsRef.current, true), cloracionTimeoutMs(objetivo));
    return () => {
      if (containerTimeoutRef.current) clearTimeout(containerTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, caso, ritmo, filtrada]);

  useEffect(
    () => () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    },
    [],
  );

  const confirmarRitmo = (r: RitmoId) => {
    if (etapa !== "elegir" || ritmo !== null) return;
    setRitmo(r);
    const gpl = gotasDeRitmo(r);
    if (gpl === null) {
      // "No clorar" también es una respuesta válida: se resuelve al instante.
      const veredicto = caso.source.gotasPorLitro === null ? "perfecta" : "subdosis";
      setEtapa("resultado");
      setAttempts((a) => a + 1);
      const ok = veredicto === "perfecta";
      if (ok) {
        setPerfectCount((c) => c + 1);
        setCombo((c) => {
          const next = c + 1;
          setBestCombo((b) => Math.max(b, next));
          return next;
        });
      } else {
        setCombo(0);
      }
      setFeedback({
        text: ok ? "💎 Correcto: el agua embotellada no se clora" : "🦠 Subdosis: ese agua sí necesitaba cloro",
        ok,
        veredicto,
      });
      if (ok) playChime();
      else playMiss();
      setTimeout(() => siguienteCaso(), 1500);
      return;
    }
    setEtapa("gotero");
  };

  const startHold = () => {
    if (etapa !== "gotero" || resolvingRef.current || objetivo === null || timeLeft <= 0) return;
    setHolding(true);
    holdIntervalRef.current = setInterval(() => {
      setDrops((d) => {
        const next = d + 1;
        // Pasarse de la dosis ya es un error: corta el goteo solo en vez de
        // dejar el dedo pegado al botón para siempre.
        if (next > objetivo) resolveCaso(next, false);
        return next;
      });
    }, dropIntervalMs(objetivo));
  };

  const endHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (etapa === "gotero") resolveCaso(dropsRef.current, false);
    else setHolding(false);
  };

  const agua = WATER_COLOR[feedback && feedback.veredicto !== "timeout" ? feedback.veredicto : "subdosis"];
  const seVeAgua = feedback !== null && feedback.veredicto !== "timeout";

  return (
    <div>
      <GameHUD
        timeLabel={`${timeLeft}s`}
        scoreLabel={`💎 ${perfectCount}/${attempts} · 🔥 ${combo} (x${comboMultiplier(combo)})`}
      />
      <div className="mb-2">
        <span className="inline-block max-w-full rounded-full border-2 border-ink bg-surface px-2.5 py-1 text-[11px] leading-tight font-black">
          {phase.nombre} · {phase.descripcion}
        </span>
      </div>

      <div className="rounded-2xl border-2 border-ink bg-surface p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl" aria-hidden="true">
            {caso.container.emoji}
          </span>
          <span
            className="h-10 w-10 rounded-full border-2 border-ink transition-colors"
            style={{ background: seVeAgua ? agua.fondo : caso.turbia ? "#A79367" : "#BFE3F0" }}
            aria-label={caso.turbia ? "Agua turbia" : "Agua clara"}
          />
          <span className="text-4xl" aria-hidden="true">
            {caso.source.emoji}
          </span>
        </div>
        <p className="mt-1.5 font-display text-lg font-extrabold">
          {caso.container.label} · {caso.container.liters} L
        </p>
        <p className="text-xs font-semibold text-ink/70">
          {caso.source.nombre}
          {caso.turbia ? " · 🌫️ turbia" : ""}
        </p>

        {etapa === "elegir" ? (
          <div className="mt-3">
            {caso.turbia && (
              <div className="mb-3 rounded-xl border-2 border-ink bg-[#FFB793]/40 p-2">
                <p className="mb-1.5 text-xs font-black">🌫️ El agua está turbia. ¿Qué haces primero?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltrada(true)}
                    disabled={caso.source.gotasPorLitro === null}
                    className={`min-h-11 flex-1 rounded-lg border-2 border-ink text-xs font-black shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 ${
                      filtrada ? "bg-[#28a745] text-white" : "bg-surface"
                    }`}
                  >
                    La filtro primero
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltrada(false)}
                    disabled={caso.source.gotasPorLitro === null}
                    className={`min-h-11 flex-1 rounded-lg border-2 border-ink text-xs font-black shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 ${
                      !filtrada ? "bg-[#E26D5C] text-white" : "bg-surface"
                    }`}
                  >
                    Le echo cloro extra
                  </button>
                </div>
                {caso.source.gotasPorLitro === null && (
                  <p className="mt-1 text-[10px] font-semibold text-ink/60">
                    El agua embotellada no necesita filtrado: se trata con calor o sol.
                  </p>
                )}
              </div>
            )}
            <p className="mb-1.5 text-xs font-black">¿A qué ritmo cloras?</p>
            <div className="flex flex-wrap gap-2">
              {RITMOS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => confirmarRitmo(r.id)}
                  className="min-h-11 flex-1 rounded-lg border-2 border-ink bg-surface px-2 text-xs font-black shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  {r.etiqueta}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] font-semibold text-ink/60">
              {caso.source.gotasPorLitro === null
                ? caso.source.nota
                : `${caso.source.nota} El agua turbia gasta cloro antes de desinfectar.`}
            </p>
          </div>
        ) : (
          <div>
            <p className="mt-3 font-display text-3xl font-black text-ink">{drops} 💧</p>
            {etapa === "gotero" ? (
              <>
                <button
                  type="button"
                  onPointerDown={startHold}
                  onPointerUp={endHold}
                  onPointerLeave={() => holding && endHold()}
                  className={`mt-3 min-h-14 w-full touch-none rounded-xl border-2 border-ink font-black shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    holding ? "bg-[#E26D5C] text-white" : "bg-[#FFB793]"
                  }`}
                  aria-label="Gotero, mantén presionado para gotear y suelta en la dosis exacta"
                >
                  {holding ? "Goteando…" : "Mantén presionado el gotero"}
                </button>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full border-2 border-ink bg-surface">
                  <div
                    className="h-full bg-[#99B4D8] transition-[width] duration-100"
                    style={{ width: `${Math.min(100, objetivo ? (drops / objetivo) * 100 : 0)}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="mt-3 min-h-14 text-sm font-black" aria-live="polite">
                {feedback?.ok ? "💎" : seVeAgua ? agua.etiqueta : ""}
              </p>
            )}
          </div>
        )}

        {feedback && (
          <p
            className={`mt-2 text-sm font-bold ${feedback.ok ? "text-[#1c6b34]" : "text-[#E26D5C]"}`}
            aria-live="polite"
          >
            {feedback.text}
          </p>
        )}
      </div>

      <p className="mt-2 text-center text-xs font-semibold text-ink/70">
        Calcula la dosis: litros × gotas por litro. Si el agua está turbia y no la filtras, el cloro se gasta antes de
        desinfectar. Mejor combo: {bestCombo}
      </p>
    </div>
  );
}

// ======================================================================
// 15. MEMORAMA DEL AGUA (MEMORAMA_AGUA, 90s) — juego de memoria progresivo:
// arranca con 4 cartas (2 parejas) y sube de a 2 cartas por nivel hasta 30
// (15 parejas) según se van completando niveles dentro de la misma partida.
// Cada nivel sortea qué parejas del pool usa y en qué posición, así ninguna
// partida repite el layout de la anterior.
// ======================================================================

interface MemoramaPar {
  emoji: string;
  dato: string;
}

// 16 íconos — todo emoji, nada de fotos: mezclar emoji con imagen hacía que
// unas cartas cargaran al toque y otras tardaran, además de verse desparejo.
// El nivel más alto (30 cartas) necesita 15 parejas; el pool tiene una de
// sobra para variar cuál queda afuera entre partida y partida.
const MEMORAMA_PARES: MemoramaPar[] = [
  { emoji: "🚿", dato: "Ducha de 4 min en vez de 10: ahorras unos 100 L." },
  { emoji: "🦷", dato: "Cerrar el caño al cepillarte ahorra varios litros cada vez." },
  { emoji: "🧺", dato: "Lavadora con carga completa: mismo gasto de agua, más ropa limpia." },
  { emoji: "🚗", dato: "Lavar el carro con balde en vez de manguera ahorra hasta 10 veces más." },
  { emoji: "🌧️", dato: "50 m² de techo con 20 mm de lluvia cosechan 1000 litros." },
  { emoji: "🔧", dato: "Un goteo de 1 gota/segundo desperdicia unos 30 litros al día." },
  { emoji: "🍽️", dato: "Lavar platos con el caño cerrado entre enjuagues ahorra decenas de litros." },
  { emoji: "🌱", dato: "Regar temprano o al atardecer evita perder agua por evaporación." },
  { emoji: "🛢️", dato: "Un flotador mal regulado hace rebalsar el tanque sin que nadie lo note." },
  { emoji: "🧼", dato: "Lavarte las manos con jabón 20 segundos corta la vía fecal-oral." },
  { emoji: "💧", dato: "Menos del 1% del agua del planeta es dulce y accesible." },
  { emoji: "🏠", dato: "Inodoro y ducha concentran la mayor parte del consumo de una casa." },
  { emoji: "☀️", dato: "SODIS desinfecta agua con 6 horas de sol pleno, gratis." },
  { emoji: "🌦️", dato: "Un aguacero fuerte puede llenar el reservorio de una casa entera." },
  { emoji: "🚰", dato: "Un aireador de grifo reduce el caudal sin que se note el chorro." },
  { emoji: "♻️", dato: "El agua de la ducha y la lavadora se puede reusar para regar." },
];

// Cartas totales por nivel — 4, 6, 8 ... hasta 30. El índice del array es el
// nivel (0 = primero); cada valor / 2 es cuántas parejas necesita ese nivel.
const MEMORAMA_NIVELES: number[] = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];

interface MemoramaCarta {
  id: number;
  parId: number;
  volteada: boolean;
  encontrada: boolean;
}

/** Sortea qué `cantidadPares` del pool usa este nivel y en qué orden quedan las cartas — distinto en cada llamada. */
function armarNivel(cantidadPares: number): { cartas: MemoramaCarta[]; paresUsados: number[] } {
  const indicesPool = MEMORAMA_PARES.map((_, i) => i);
  for (let i = indicesPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indicesPool[i], indicesPool[j]] = [indicesPool[j], indicesPool[i]];
  }
  const paresUsados = indicesPool.slice(0, cantidadPares);

  const cartas: MemoramaCarta[] = paresUsados.flatMap((parId, i) => [
    { id: i * 2, parId, volteada: false, encontrada: false },
    { id: i * 2 + 1, parId, volteada: false, encontrada: false },
  ]);
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
  }
  return { cartas, paresUsados };
}

function MemoramaAguaGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [nivel, setNivel] = useState(0);
  const [{ cartas }, setEstadoNivel] = useState(() => armarNivel(MEMORAMA_NIVELES[0] / 2));
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [aciertosNivel, setAciertosNivel] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [dato, setDato] = useState<string | null>(null);
  const bloqueadoRef = useRef(false);
  const finishedRef = useRef(false);
  const nivelRef = useRef(0);
  const aciertosNivelRef = useRef(0);
  // Parejas encontradas en toda la partida: si es 0, no jugó nada y pierde sin premios.
  const aciertosTotalRef = useRef(0);

  const totalPares = MEMORAMA_NIVELES[nivel] / 2;
  const ultimoNivel = nivel === MEMORAMA_NIVELES.length - 1;
  const completo = aciertosNivel === totalPares;

  const finalizar = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // Sin ni una pareja no hay juego: accuracy 0 = "Perdiste" sin EXP ni HP.
    if (aciertosTotalRef.current === 0) {
      onComplete(0);
      return;
    }
    // Progreso real: nivel ya despejado + fracción del nivel actual, sobre el total de niveles.
    // Se mapea a [umbral..1] para que cualquier etapa jugada pague proporcional (30 HP base → 100 HP lleno).
    const progreso = (nivelRef.current + aciertosNivelRef.current / totalPares) / MEMORAMA_NIVELES.length;
    onComplete(Math.min(1, MIN_GAME_WIN_ACCURACY + progreso * (1 - MIN_GAME_WIN_ACCURACY)));
  };

  const siguienteNivel = () => {
    if (ultimoNivel) {
      finalizar();
      return;
    }
    const proximo = nivel + 1;
    nivelRef.current = proximo;
    aciertosNivelRef.current = 0;
    setNivel(proximo);
    setEstadoNivel(armarNivel(MEMORAMA_NIVELES[proximo] / 2));
    setAciertosNivel(0);
    setSeleccion([]);
  };

  useEffect(() => {
    // El tiempo agotado siempre gana, aunque justo en ese mismo instante el
    // nivel también se haya completado — antes se chequeaba "completo"
    // primero, así que agotar el tiempo justo al cerrar un nivel disparaba
    // otro nivel más (con el reloj ya en 0) en vez de terminar la partida, y
    // el audio de victoria/derrota nunca llegaba a sonar.
    if (timeLeft <= 0) {
      finalizar();
      return;
    }
    if (completo) {
      const t = setTimeout(siguienteNivel, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, completo]);

  const voltear = (id: number) => {
    if (bloqueadoRef.current) return;
    const carta = cartas.find((c) => c.id === id);
    if (!carta || carta.volteada || carta.encontrada) return;
    if (seleccion.includes(id)) return;

    const nuevaSeleccion = [...seleccion, id];
    setEstadoNivel((prev) => ({ ...prev, cartas: prev.cartas.map((c) => (c.id === id ? { ...c, volteada: true } : c)) }));
    setSeleccion(nuevaSeleccion);

    if (nuevaSeleccion.length < 2) return;

    bloqueadoRef.current = true;
    const [idA, idB] = nuevaSeleccion;
    const cartaA = cartas.find((c) => c.id === idA)!;
    const cartaB = cartas.find((c) => c.id === idB)!;
    const esPar = cartaA.parId === cartaB.parId;

    setTimeout(
      () => {
        if (esPar) {
          setEstadoNivel((prev) => ({
            ...prev,
            cartas: prev.cartas.map((c) => (c.id === idA || c.id === idB ? { ...c, encontrada: true } : c)),
          }));
          setAciertosNivel((a) => {
            const next = a + 1;
            aciertosNivelRef.current = next;
            aciertosTotalRef.current += 1;
            return next;
          });
          setCombo((c) => {
            const next = c + 1;
            setBestCombo((b) => Math.max(b, next));
            return next;
          });
          setDato(MEMORAMA_PARES[cartaA.parId].dato);
          setTimeout(() => setDato(null), 1800);
        } else {
          setEstadoNivel((prev) => ({
            ...prev,
            cartas: prev.cartas.map((c) => (c.id === idA || c.id === idB ? { ...c, volteada: false } : c)),
          }));
          setCombo(0);
        }
        setSeleccion([]);
        bloqueadoRef.current = false;
      },
      esPar ? 500 : 900,
    );
  };

  const columnas = Math.min(6, Math.max(4, Math.ceil(Math.sqrt(cartas.length))));

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`🧠 Nivel ${nivel + 1}/${MEMORAMA_NIVELES.length} · 🔥 combo ${combo}`} />
      <p className="mb-2 text-center text-xs font-bold text-ink/70">{aciertosNivel}/{totalPares} parejas de este nivel</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
        {cartas.map((carta) => {
          const mostrar = carta.volteada || carta.encontrada;
          const item = MEMORAMA_PARES[carta.parId];
          return (
            <button
              key={carta.id}
              type="button"
              onClick={() => voltear(carta.id)}
              disabled={mostrar}
              aria-label={mostrar ? "Carta descubierta" : "Carta boca abajo"}
              className={`grid aspect-square place-items-center rounded-xl border-2 border-ink text-3xl shadow-[2px_2px_0_#1c1c11] transition-all sm:text-4xl ${
                carta.encontrada
                  ? "bg-[#28a745]/25 border-[#28a745]"
                  : carta.volteada
                    ? "bg-[#99B4D8]"
                    : "bg-[#FFB793] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              }`}
            >
              {mostrar ? item.emoji : "💧"}
            </button>
          );
        })}
      </div>
      {dato ? (
        <p className="mt-2 rounded-xl border-2 border-[#28a745] bg-[#28a745]/10 p-2 text-center text-xs font-bold text-ink">💡 {dato}</p>
      ) : (
        <p className="mt-2 text-center text-xs font-semibold text-ink/70">Mejor combo: {bestCombo}</p>
      )}
    </div>
  );
}
