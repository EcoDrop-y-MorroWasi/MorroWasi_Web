import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import type { Minigame, MinigameType } from "../utils/gamification";
import { bumpStat } from "../utils/stats";
import TutorialCard from "../components/TutorialCard";

export interface MinigameResult {
  earned: number;
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
const INTRO_SECONDS = 10;

// Minitutorial por tipo de juego — sin timer, ejemplo simple antes de arrancar el cronómetro real.
const TUTORIALS: Record<MinigameType, { instructions: string; from: string; to: string; label: string }> = {
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
    to: "🪣",
    label: "Ej.: gota de lluvia → tanque",
  },
  RIEGO_OPT: {
    instructions: "Elige la acción correcta según la hora del día para no perder agua.",
    from: "☀️",
    to: "⏳",
    label: "Ej.: es mediodía → elige esperar a la noche",
  },
  FILTROS_LAB: {
    instructions: "Arrastra cada material a su capa correcta, de abajo hacia arriba.",
    from: "🪨",
    to: "🧪",
    label: "Ej.: grava → capa inferior de la botella",
  },
  RUTAS_AGUAS: {
    instructions: "Toca cada tubería para rotarla y conectar la ruta de agua.",
    from: "🧺",
    to: "🌳",
    label: "Ej.: lavadora → biohuerto, evitando aguas negras",
  },
  SODIS_UV: {
    instructions: "Arrastra el espejo hacia la botella contaminada para desinfectarla.",
    from: "🪞",
    to: "🧴",
    label: "Ej.: espejo → botella con bacterias",
  },
  GUARDIAN_RIO: {
    instructions: "Desliza la basura hacia la derecha y deja pasar la fauna hacia la izquierda.",
    from: "🥤",
    to: "➡️",
    label: "Ej.: botella de plástico → deslízala a la derecha",
  },
  DUCHA_MUSICAL: {
    instructions: "Cierra la llave justo en el compás activo mientras te enjabonas.",
    from: "🧼",
    to: "🚿",
    label: "Ej.: compás activo → toca Cerrar llave",
  },
  CORTE_AGUA: {
    instructions: "Elige la opción que gasta menos agua sin perder higiene familiar.",
    from: "🍳",
    to: "🛢️",
    label: "Ej.: pedir comida fuera ahorra litros del reservorio",
  },
  ACUIFERO_ALGARROBO: {
    instructions: "Guía la raíz con las flechas, esquivando obstáculos y recogiendo acuíferos.",
    from: "🪨",
    to: "💧",
    label: "Ej.: esquiva la roca, recoge la bolsa de agua subterránea",
  },
  CLORACION_SEGURA: {
    instructions: "Mantén presionado el gotero y suelta justo en el número exacto de gotas.",
    from: "💧",
    to: "🏺",
    label: "Ej.: 2 gotas exactas para la jarra de 1 L",
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
    };
  }, [onClose]);

  const handleComplete = (accuracy: number) => {
    const res = onFinish(accuracy);
    setResult(res);
    setPhase("result");
  };

  const playAgain = () => {
    setResult(null);
    setPhase("intro");
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
        className={`max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border-2 border-[#1c1c11] bg-[#fdfae7] p-4 ${HARD_SHADOW}`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-extrabold text-[#1c1c11]">{game.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar juego"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-[#1c1c11] bg-white text-xl font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            ×
          </button>
        </div>

        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <IntroVideo game={game} onDone={() => setPhase("tutorial")} />
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
                {result.isNewBest ? "🏆" : "🎮"}
              </span>
              <p className="font-display text-2xl font-extrabold text-[#1c1c11]">+{result.earned} XP</p>
              <p className="text-sm font-bold text-[#1c1c11]/80">
                {result.isNewBest
                  ? "¡Nuevo récord! HydroPuntos otorgados."
                  : `No superaste tu récord (${result.bestScore} pts) — sin XP extra, pero cuenta como actividad para tu racha diaria 🔥`}
              </p>
              <div className="mt-2 flex w-full gap-3">
                <button
                  type="button"
                  onClick={playAgain}
                  className={`min-h-12 flex-1 rounded-xl border-2 border-[#1c1c11] bg-[#FFB793] font-bold ${HARD_SHADOW} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
                >
                  Jugar de nuevo
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`min-h-12 flex-1 rounded-xl border-2 border-[#1c1c11] bg-[#99B4D8] font-bold ${HARD_SHADOW} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
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

// ---------- Intro (video mock skippable 10s) ----------

function IntroVideo({ game, onDone }: { game: Minigame; onDone: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(INTRO_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onDone]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-48 items-center justify-center rounded-2xl border-2 border-[#1c1c11] bg-[#99B4D8]">
        <span className="text-6xl" aria-hidden="true">
          ▶
        </span>
        <span className="absolute bottom-2 left-2 rounded-md border-2 border-[#1c1c11] bg-white/90 px-2 py-1 text-[11px] font-extrabold">
          Video intro mock — {game.videoIntroUri ?? "sin video"}
        </span>
        <span
          className="absolute top-2 right-2 grid h-10 w-10 place-items-center rounded-full border-2 border-[#1c1c11] bg-[#fdfae7] text-xs font-black"
          aria-live="polite"
        >
          {secondsLeft}s
        </span>
      </div>
      <p className="text-sm text-[#1c1c11]/70">{game.description}</p>
      <p className="text-xs font-bold text-[#1c1c11]/60">Duración: {game.durationSeconds}s</p>
      <button
        type="button"
        onClick={onDone}
        className={`min-h-12 rounded-xl border-2 border-[#1c1c11] bg-[#E26D5C] font-bold text-white ${HARD_SHADOW} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
      >
        Saltar ▶ y comenzar
      </button>
    </div>
  );
}

// ---------- HUD compartido ----------

function GameHUD({ timeLabel, scoreLabel }: { timeLabel: string; scoreLabel: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="rounded-full border-2 border-[#1c1c11] bg-white px-3 py-1 text-xs font-black">⏱ {timeLabel}</span>
      <span className="rounded-full border-2 border-[#1c1c11] bg-[#FFB793] px-3 py-1 text-xs font-black">{scoreLabel}</span>
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
  return <CloracionSeguraGame duration={duration} onComplete={onComplete} />;
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
      <div className="relative h-64 overflow-hidden rounded-2xl border-2 border-[#1c1c11] bg-[#fdfae7]">
        {/* Corte de casa 2x2: baño / cocina / lavadero / tanque */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="flex items-start justify-start border-b-2 border-r-2 border-[#1c1c11]/20 p-1 text-[10px] font-black text-[#1c1c11]/40">🛁 Baño</div>
          <div className="flex items-start justify-end border-b-2 border-[#1c1c11]/20 p-1 text-[10px] font-black text-[#1c1c11]/40">Cocina 🍳</div>
          <div className="flex items-end justify-start border-r-2 border-[#1c1c11]/20 p-1 text-[10px] font-black text-[#1c1c11]/40">🧺 Lavadero</div>
          <div className="flex items-end justify-end p-1 text-[10px] font-black text-[#1c1c11]/40">Tanque 🛢️</div>
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
              className={`absolute grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full border-2 border-[#1c1c11] bg-white text-2xl shadow-[2px_2px_0_#1c1c11] ${
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
            className="grid h-14 w-14 touch-none cursor-grab place-items-center rounded-full border-2 border-[#1c1c11] bg-[#FFB793] text-2xl shadow-[2px_2px_0_#1c1c11] active:cursor-grabbing"
            aria-label={`Herramienta ${tool.label}, arrástrala a la fuga correcta`}
            role="button"
          >
            {tool.emoji}
          </motion.div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-[#1c1c11]/70">
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

const PAIRS: [WaterItem, WaterItem][] = [
  [
    { emoji: "🥩", label: "1 kg de carne de res", liters: 2400 },
    { emoji: "👕", label: "1 camiseta de algodón", liters: 2700 },
  ],
  [
    { emoji: "☕", label: "1 taza de café", liters: 140 },
    { emoji: "🧃", label: "1 vaso de jugo de naranja", liters: 170 },
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
    { emoji: "🍫", label: "1 kg de chocolate", liters: 1700 },
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
      <p className="mb-2 text-center text-sm font-bold text-[#1c1c11]">¿Cuál esconde más agua virtual?</p>
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
              className={`flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-[#1c1c11] p-3 text-center shadow-[2px_2px_0_#1c1c11] ${
                picked === null ? "bg-white" : isWinner ? "bg-[#d4edda] border-[#28a745]" : isPicked ? "bg-[#E26D5C] text-white" : "bg-white opacity-60"
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
        <p className="mt-2 text-center text-xs font-bold text-[#1c1c11]/80">
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
const AGUAS_SUCIAS_SEGUNDOS = 10;
const LITROS_POR_CANALETA_SEG = 3;

function AtrapaLluviasGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [open, setOpen] = useState<boolean[]>(Array(CANALETAS).fill(false));
  const [cleanLiters, setCleanLiters] = useState(0);
  const [contamination, setContamination] = useState(0);
  const finishedRef = useRef(false);

  const isDirtyPhase = timeLeft > duration - AGUAS_SUCIAS_SEGUNDOS;
  const theoreticalMax = CANALETAS * (duration - AGUAS_SUCIAS_SEGUNDOS) * LITROS_POR_CANALETA_SEG;

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        const net = cleanLiters - contamination * 15;
        onComplete(theoreticalMax > 0 ? Math.min(1, Math.max(0, net / theoreticalMax)) : 0);
      }
      return;
    }
    const t = setTimeout(() => {
      setOpen((currentOpen) => {
        currentOpen.forEach((isOpen) => {
          if (!isOpen) return;
          if (isDirtyPhase) setContamination((c) => c + 1);
          else setCleanLiters((l) => l + LITROS_POR_CANALETA_SEG);
        });
        return currentOpen;
      });
      setTimeLeft((s) => s - 1);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const toggle = (i: number) => setOpen((o) => o.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`💧 ${cleanLiters}L limpios · ☠️ ${contamination} contaminaciones`} />
      <div
        className={`rounded-2xl border-2 border-[#1c1c11] p-3 text-center text-sm font-black transition-colors ${
          isDirtyPhase ? "bg-[#E26D5C] text-white" : "bg-[#99B4D8]/40 text-[#1c1c11]"
        }`}
      >
        {isDirtyPhase ? "🌫️ Primeras aguas sucias — ¡todas las canaletas al desagüe!" : "🌧️ Lluvia limpia — abre las canaletas hacia el tanque"}
      </div>

      <div className="mt-3 flex justify-center gap-3">
        {open.map((isOpen, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            aria-pressed={isOpen}
            aria-label={`Canaleta ${i + 1}, ${isOpen ? "dirigida al tanque" : "dirigida al desagüe"}`}
            className={`grid h-16 w-14 place-items-center rounded-xl border-2 border-[#1c1c11] text-2xl font-black shadow-[2px_2px_0_#1c1c11] transition-colors ${
              isOpen ? "bg-[#99B4D8]" : "bg-white"
            }`}
          >
            {isOpen ? "🪣" : "🚫"}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-[#1c1c11]/70">
        🚫 = hacia el desagüe (seguro con aguas sucias) · 🪣 = hacia el tanque (solo con lluvia limpia).
      </p>
    </div>
  );
}

// ======================================================================
// 4. MAESTRO DEL RIEGO (RIEGO_OPT, 90s) — reloj Mañana→Mediodía→Noche,
// decide cómo cuidar el biohuerto sin perder 80% por evaporación.
// ======================================================================

type DayPhase = "Mañana" | "Mediodía" | "Noche";
const DAY_PHASES: DayPhase[] = ["Mañana", "Mediodía", "Noche"];
const TICK_SECONDS = 10;
const PHASE_ICON: Record<DayPhase, string> = { Mañana: "🌅", Mediodía: "☀️", Noche: "🌙" };

function MaestroRiegoGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const totalTicks = Math.max(3, Math.round(duration / TICK_SECONDS));
  const [tick, setTick] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TICK_SECONDS);
  const [health, setHealth] = useState(100);
  const [decisions, setDecisions] = useState(0);
  const [correctDecisions, setCorrectDecisions] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const answeredRef = useRef(false);
  const finishedRef = useRef(false);

  const phase = DAY_PHASES[tick % 3];
  const isMidday = phase === "Mediodía";

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
    setSecondsLeft(TICK_SECONDS);
    setFeedback(null);
    answeredRef.current = false;
  };

  const choose = (action: "manguera" | "goteo" | "mulch" | "noche") => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setDecisions((d) => d + 1);
    if (action === "manguera") {
      setHealth((h) => Math.max(0, h - 30));
      setFeedback("bad");
    } else {
      setCorrectDecisions((c) => c + 1);
      setHealth((h) => Math.min(100, h + 5));
      setFeedback("ok");
    }
    setTimeout(nextTick, 600);
  };

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (isMidday && !answeredRef.current) {
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

  useEffect(() => {
    if (!isMidday) setHealth((h) => Math.min(100, h + 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return (
    <div>
      <GameHUD timeLabel={`${secondsLeft}s · fase ${tick + 1}/${totalTicks}`} scoreLabel={`🌿 salud ${health}%`} />
      <div className="rounded-2xl border-2 border-[#1c1c11] bg-[#FFB793]/40 p-5 text-center">
        <span className="text-5xl" aria-hidden="true">
          {PHASE_ICON[phase]}
        </span>
        <p className="mt-1 font-display text-lg font-extrabold">{phase}</p>
        {isMidday ? (
          <>
            <p className="mt-1 text-sm font-semibold text-[#1c1c11]/80">
              El sol de Piura pega fuerte — regar con manguera ahora pierde 80% del agua por evaporación.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => choose("manguera")}
                disabled={answeredRef.current}
                className="min-h-12 rounded-xl border-2 border-[#1c1c11] bg-white font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                💦 Manguera
              </button>
              <button
                type="button"
                onClick={() => choose("goteo")}
                disabled={answeredRef.current}
                className="min-h-12 rounded-xl border-2 border-[#1c1c11] bg-[#99B4D8] font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                🥤 Goteo reciclado
              </button>
              <button
                type="button"
                onClick={() => choose("mulch")}
                disabled={answeredRef.current}
                className="min-h-12 rounded-xl border-2 border-[#1c1c11] bg-[#99B4D8] font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                🍂 Mulch
              </button>
              <button
                type="button"
                onClick={() => choose("noche")}
                disabled={answeredRef.current}
                className="min-h-12 rounded-xl border-2 border-[#1c1c11] bg-[#99B4D8] font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                ⏳ Espera la noche
              </button>
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm font-semibold text-[#1c1c11]/70">
            {phase === "Mañana" ? "Buen momento para preparar el riego del día." : "Hora ideal para regar fuerte: poca evaporación."}
          </p>
        )}
        {feedback && (
          <span
            className={`mt-3 inline-block rounded-full border-2 px-3 py-1 text-xs font-black ${
              feedback === "ok" ? "border-[#28a745] bg-[#d4edda] text-[#1c1c11]" : "border-white bg-[#E26D5C] text-white"
            }`}
          >
            {feedback === "ok" ? "✓ Buena decisión" : "✗ Se perdió 80% por evaporación"}
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
  { kind: "arena_fina", emoji: "🟡", label: "Arena fina" },
  { kind: "arena_gruesa", emoji: "🟠", label: "Arena gruesa" },
  { kind: "grava", emoji: "🪨", label: "Grava" },
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
    const el = document.elementFromPoint(info.point.x, info.point.y);
    const slotEl = el?.closest<HTMLElement>("[data-slot-index]");
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
        <div className="relative flex h-64 w-20 flex-col-reverse gap-1 rounded-b-2xl rounded-t-lg border-2 border-[#1c1c11] bg-white p-1">
          {slots.map((filled, i) => (
            <div
              key={i}
              data-slot-index={i}
              className={`flex h-12 flex-1 items-center justify-center rounded-md border-2 border-dashed text-xl ${
                filled ? "border-[#1c1c11] bg-[#99B4D8]/30" : "border-[#1c1c11]/30"
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
          <p className="text-xs font-bold text-[#1c1c11]/70">Materiales:</p>
          <div className="grid grid-cols-2 gap-2">
            {shelf.map((kind) => {
              const meta = materialMeta(kind);
              return (
                <motion.div
                  key={kind}
                  drag
                  dragSnapToOrigin
                  dragElastic={0.3}
                  onDragEnd={(_e, info) => handleDrop(kind, info)}
                  className="grid h-12 w-12 touch-none cursor-grab place-items-center rounded-full border-2 border-[#1c1c11] bg-[#FFB793] text-xl shadow-[2px_2px_0_#1c1c11] active:cursor-grabbing"
                  aria-label={`${meta.label}, arrástralo a la capa correcta`}
                  role="button"
                >
                  {meta.emoji}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      {pouring && (
        <p className="mt-2 text-center text-xs font-bold text-[#1c1c11]/80">
          {pouring === "crystal" ? "💎 ¡Agua cristalina! Orden perfecto." : "🟤 Agua turbia — el orden no filtró bien."}
        </p>
      )}
      <p className="mt-2 text-center text-xs font-semibold text-[#1c1c11]/70">
        De abajo hacia arriba: grava, arena gruesa, arena fina, carbón activado, algodón.
      </p>
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
const TARGET_INODORO = { r: 0, c: 2 };
const TARGET_BIOHUERTO = { r: 2, c: 2 };
const HAZARD = { r: 1, c: 1 };
const PIPE_POSITIONS = [
  { r: 0, c: 0 },
  { r: 0, c: 1 },
  { r: 1, c: 0 },
  { r: 1, c: 2 },
  { r: 2, c: 1 },
];

function cellKey(r: number, c: number) {
  return `${r}-${c}`;
}

function isSameCell(a: { r: number; c: number }, r: number, c: number) {
  return a.r === r && a.c === c;
}

function computeConnectivity(pipes: Record<string, PipeCell>) {
  const opensAt = (r: number, c: number): Dir[] => {
    if (isSameCell(SOURCE, r, c)) return [0, 1];
    if (isSameCell(TARGET_INODORO, r, c)) return [2, 3];
    if (isSameCell(TARGET_BIOHUERTO, r, c)) return [0, 3];
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
      if (isSameCell(TARGET_INODORO, nr, nc) || isSameCell(TARGET_BIOHUERTO, nr, nc)) connected = true;
    }
  }
  return { connected, reachedCount: visited.size - 1 };
}

function initialPipes(): Record<string, PipeCell> {
  const init: Record<string, PipeCell> = {};
  PIPE_POSITIONS.forEach(({ r, c }) => {
    init[cellKey(r, c)] = { shape: Math.random() < 0.5 ? "recta" : "codo", rotation: Math.floor(Math.random() * 4) };
  });
  return init;
}

function RutasAguasGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [pipes, setPipes] = useState<Record<string, PipeCell>>(initialPipes);
  const finishedRef = useRef(false);

  const { connected, reachedCount } = computeConnectivity(pipes);

  const finalize = (success: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onComplete(success ? 1 : Math.min(1, reachedCount / 4));
  };

  useEffect(() => {
    if (!connected) return;
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
    setPipes((p) => {
      const k = cellKey(r, c);
      const cur = p[k];
      if (!cur) return p;
      return { ...p, [k]: { ...cur, rotation: (cur.rotation + 1) % 4 } };
    });
  };

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={connected ? "✅ Conectado" : `🔧 ${reachedCount}/4 tramos`} />
      <div className="mx-auto grid w-fit grid-cols-3 gap-1 rounded-2xl border-2 border-[#1c1c11] bg-[#fdfae7] p-2">
        {Array.from({ length: GRID_ROWS }).flatMap((_, r) =>
          Array.from({ length: GRID_COLS }).map((_, c) => {
            const k = cellKey(r, c);
            if (isSameCell(SOURCE, r, c))
              return (
                <div key={k} className="grid h-14 w-14 place-items-center rounded-lg border-2 border-[#1c1c11] bg-[#99B4D8] text-2xl" aria-label="Lavadora, fuente de agua">
                  🧺
                </div>
              );
            if (isSameCell(TARGET_INODORO, r, c))
              return (
                <div key={k} className="grid h-14 w-14 place-items-center rounded-lg border-2 border-[#1c1c11] bg-white text-2xl" aria-label="Inodoro, destino válido">
                  🚽
                </div>
              );
            if (isSameCell(TARGET_BIOHUERTO, r, c))
              return (
                <div key={k} className="grid h-14 w-14 place-items-center rounded-lg border-2 border-[#1c1c11] bg-white text-2xl" aria-label="Biohuerto, destino válido">
                  🌳
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
            return (
              <button
                key={k}
                type="button"
                onClick={() => rotate(r, c)}
                aria-label={`Tubería tipo ${pipe.shape}, tocar para rotar`}
                className="grid h-14 w-14 place-items-center rounded-lg border-2 border-[#1c1c11] bg-[#99B4D8]/30 text-3xl transition-transform"
                style={{ transform: `rotate(${pipe.rotation * 90}deg)` }}
              >
                {pipe.shape === "recta" ? "┃" : "┗"}
              </button>
            );
          }),
        )}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-[#1c1c11]/70">
        Toca cada tubería para girarla y conectar 🧺 Lavadora con 🚽 Inodoro o 🌳 Biohuerto — evita ☠️ aguas negras.
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
    const el = document.elementFromPoint(info.point.x, info.point.y);
    const bottleEl = el?.closest<HTMLElement>("[data-bottle-index]");
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
            className={`flex h-28 flex-col items-center justify-end gap-1 rounded-b-full rounded-t-lg border-2 border-[#1c1c11] p-1 text-2xl transition-colors ${
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
          className="grid h-16 w-16 touch-none cursor-grab place-items-center rounded-full border-2 border-[#1c1c11] bg-white text-3xl shadow-[2px_2px_0_#1c1c11] active:cursor-grabbing"
          aria-label="Espejo, arrástralo a una botella para reflejar el sol"
          role="button"
        >
          🪞
        </motion.div>

        {powerUpVisible && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            type="button"
            onClick={usePowerUp}
            className={`min-h-12 rounded-full border-2 border-[#1c1c11] bg-[#FFB793] px-4 text-sm font-black ${HARD_SHADOW}`}
          >
            💧 Mediodía Piurano (Mr. Gota)
          </motion.button>
        )}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-[#1c1c11]/70">
        Arrastra el 🪞 espejo a cada botella para reflejar el sol y matar bacterias 🦠 antes de que se multipliquen.
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
  kind: "trash" | "fauna";
  emoji: string;
  x: number;
}

const TRASH_EMOJI = ["🥤", "🛍️", "🥫", "🧴"];
const FAUNA_EMOJI = ["🐟", "🦆", "🍃", "🌿"];
const RIVER_ITEM_LIFESPAN = 4000;

function GuardianRioGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [items, setItems] = useState<RiverItem[]>([]);
  const [life, setLife] = useState(100);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const resolvedIds = useRef(new Set<number>());
  const finishedRef = useRef(false);

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

  const resolveItem = (id: number, kind: "trash" | "fauna", swiped: "left" | "right" | null) => {
    if (resolvedIds.current.has(id)) return;
    resolvedIds.current.add(id);
    setItems((its) => its.filter((it) => it.id !== id));
    if (swiped === null) {
      if (kind === "trash") {
        setAttempts((a) => a + 1);
        setLife((l) => Math.max(0, l - 8));
      } else {
        setAttempts((a) => a + 1);
        setCorrect((c) => c + 1);
      }
      return;
    }
    const correctDir = kind === "trash" ? "right" : "left";
    setAttempts((a) => a + 1);
    if (swiped === correctDir) {
      setCorrect((c) => c + 1);
      setLife((l) => Math.min(100, l + 2));
    } else {
      setLife((l) => Math.max(0, l - 15));
    }
  };

  useEffect(() => {
    if (timeLeft <= 0) return;
    const spawn = setInterval(() => {
      const id = Date.now() + Math.random();
      const isTrash = Math.random() < 0.55;
      const pool = isTrash ? TRASH_EMOJI : FAUNA_EMOJI;
      const emoji = pool[Math.floor(Math.random() * pool.length)];
      const kind: "trash" | "fauna" = isTrash ? "trash" : "fauna";
      setItems((its) => [...its, { id, kind, emoji, x: Math.random() * 70 + 15 }]);
      setTimeout(() => resolveItem(id, kind, null), RIVER_ITEM_LIFESPAN);
    }, 1100);
    return () => clearInterval(spawn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft <= 0]);

  const handleSwipe = (item: RiverItem, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 60) return;
    resolveItem(item.id, item.kind, info.offset.x > 0 ? "right" : "left");
  };

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`❤️ ${life} · ✅ ${correct}/${attempts}`} />
      <div className="relative h-64 overflow-hidden rounded-2xl border-2 border-[#1c1c11] bg-gradient-to-b from-[#99B4D8]/40 to-[#99B4D8]/10">
        <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-between px-3 text-[10px] font-black text-[#1c1c11]/50">
          <span>⬅️ Dejar pasar</span>
          <span>Reciclar ➡️</span>
        </div>
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              drag="x"
              dragSnapToOrigin
              dragElastic={0.4}
              onDragEnd={(_e, info) => handleSwipe(item, info)}
              initial={{ top: "0%", scale: 0 }}
              animate={{ top: "88%", scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ top: { duration: RIVER_ITEM_LIFESPAN / 1000, ease: "linear" }, scale: { duration: 0.2 } }}
              style={{ left: `${item.x}%` }}
              className="absolute grid h-12 w-12 -translate-x-1/2 touch-none cursor-grab place-items-center rounded-full border-2 border-[#1c1c11] bg-white text-2xl shadow-[2px_2px_0_#1c1c11] active:cursor-grabbing"
              aria-label={item.kind === "trash" ? "Basura, desliza a la derecha para reciclar" : "Fauna o naturaleza, desliza a la izquierda para dejar pasar"}
            >
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-[#1c1c11]/70">
        Desliza ➡️ la basura (botellas, bolsas, latas) hacia la red de reciclaje. Desliza ⬅️ o deja pasar peces, patos y hojas.
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

function DuchaMusicalGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const elapsed = duration - timeLeft;
  const [beatStates, setBeatStates] = useState<("pending" | "active" | "hit" | "miss")[]>(RHYTHM_BEATS.map(() => "pending"));
  const [litersLost, setLitersLost] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const beatStatesRef = useRef(beatStates);
  const finishedRef = useRef(false);

  useEffect(() => {
    beatStatesRef.current = beatStates;
  }, [beatStates]);

  const phase: "Mojarse" | "Enjabonarse" | "Enjuagarse" = elapsed < 20 ? "Mojarse" : elapsed < 40 ? "Enjabonarse" : "Enjuagarse";

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        const hits = beatStatesRef.current.filter((s) => s === "hit").length;
        onComplete(Math.min(1, hits / RHYTHM_BEATS.length));
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
          return "miss";
        }
        return state;
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  const tapCerrar = () => {
    const idx = beatStates.findIndex((s) => s === "active");
    if (idx === -1) return;
    setBeatStates((states) => states.map((s, i) => (i === idx ? "hit" : s)));
    setCombo((c) => {
      const next = c + 1;
      setBestCombo((b) => Math.max(b, next));
      return next;
    });
  };

  const activeBeat = beatStates.some((s) => s === "active");

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`🔥 combo ${combo} · 🚱 ${litersLost}L`} />
      <div className="rounded-2xl border-2 border-[#1c1c11] bg-[#99B4D8]/30 p-5 text-center">
        <p className="font-display text-lg font-extrabold">{phase}</p>
        <span className="text-5xl" aria-hidden="true">
          {phase === "Mojarse" ? "🚿" : phase === "Enjabonarse" ? "🧼" : "💦"}
        </span>
        {phase === "Enjabonarse" ? (
          <>
            <p className="mt-2 text-sm font-semibold text-[#1c1c11]/80">
              {activeBeat ? "¡Cierra la llave al ritmo!" : "Prepárate para el siguiente compás…"}
            </p>
            <motion.button
              type="button"
              onClick={tapCerrar}
              animate={activeBeat ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ repeat: activeBeat ? Infinity : 0, duration: 0.5 }}
              className={`mt-3 min-h-12 rounded-xl border-2 border-[#1c1c11] px-6 font-black shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                activeBeat ? "bg-[#E26D5C] text-white" : "bg-white"
              }`}
            >
              🚿 Cerrar llave
            </motion.button>
          </>
        ) : (
          <p className="mt-2 text-sm font-semibold text-[#1c1c11]/70">
            {phase === "Mojarse" ? "Mójate rápido, el reto empieza al enjabonarte." : "Enjuaga y listo — ¡ducha flash completada!"}
          </p>
        )}
        <div className="mt-3 flex justify-center gap-1" aria-label={`${RHYTHM_BEATS.length} compases de la canción`}>
          {beatStates.map((s, i) => (
            <span
              key={i}
              className={`h-2 w-6 rounded-full ${
                s === "hit" ? "bg-[#28a745]" : s === "miss" ? "bg-[#E26D5C]" : s === "active" ? "bg-[#FFB793]" : "border border-[#1c1c11]/30 bg-white"
              }`}
            />
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-[#1c1c11]/70">Mejor combo: {bestCombo}</p>
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

function buildDecisionCards(): DecisionCard[] {
  const templates: Omit<DecisionCard, "id" | "day">[] = [
    {
      title: "Cocinar el almuerzo",
      emoji: "🍳",
      optionA: { label: "Cocinar en casa", liters: 40, hygiene: 0 },
      optionB: { label: "Pedir comida fuera", liters: 5, hygiene: 0 },
    },
    {
      title: "Lavar la ropa",
      emoji: "👕",
      optionA: { label: "Lavadora llena hoy", liters: 40, hygiene: 5 },
      optionB: { label: "Posponer el lavado", liters: 0, hygiene: -10 },
    },
    {
      title: "Regar el jardín",
      emoji: "🌱",
      optionA: { label: "Agua potable directa", liters: 30, hygiene: 0 },
      optionB: { label: "Agua gris de enjuague", liters: 5, hygiene: 0 },
    },
  ];
  const cards: DecisionCard[] = [];
  for (let day = 1; day <= 3; day++) {
    templates.forEach((t, i) => cards.push({ id: `d${day}-${i}`, day, ...t }));
  }
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
        setReserve((r) => Math.max(0, r - card.optionA.liters));
        setFeedback(`Sin decisión — se usó la opción de mayor gasto (-${card.optionA.liters}L)`);
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
      <div className="rounded-2xl border-2 border-[#1c1c11] bg-white p-5 text-center">
        <span className="text-5xl" aria-hidden="true">
          {card.emoji}
        </span>
        <p className="mt-1 font-display text-lg font-extrabold">{card.title}</p>
        <p className="text-xs font-semibold text-[#1c1c11]/60">
          Tarjeta {index + 1}/{totalCards}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => choose(card.optionA)}
            disabled={answeredRef.current}
            className="min-h-12 rounded-xl border-2 border-[#1c1c11] bg-[#99B4D8] px-3 font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {card.optionA.label} (-{card.optionA.liters}L)
          </button>
          <button
            type="button"
            onClick={() => choose(card.optionB)}
            disabled={answeredRef.current}
            className="min-h-12 rounded-xl border-2 border-[#1c1c11] bg-[#FFB793] px-3 font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {card.optionB.label} (-{card.optionB.liters}L)
          </button>
        </div>
        {feedback && <p className="mt-2 text-xs font-bold text-[#1c1c11]/70">{feedback}</p>}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-[#1c1c11]/70">
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
  rock: { emoji: "🪨" },
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
      <div className="relative h-64 overflow-hidden rounded-2xl border-2 border-[#1c1c11] bg-gradient-to-b from-[#fdfae7] to-[#8a5a2e]/30">
        <div className="absolute inset-0 grid grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`border-r-2 border-[#1c1c11]/10 last:border-r-0 ${i === lane ? "bg-[#99B4D8]/10" : ""}`} />
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
              className="absolute grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border-2 border-[#1c1c11] bg-white text-xl shadow-[2px_2px_0_#1c1c11]"
              aria-hidden="true"
            >
              {AQUIFER_ITEM_META[item.kind].emoji}
            </motion.div>
          ))}
        </AnimatePresence>
        <motion.div
          animate={{ left: `${(lane + 0.5) * (100 / AQUIFER_LANES)}%` }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full border-2 border-[#1c1c11] bg-[#99B4D8] text-2xl shadow-[2px_2px_0_#1c1c11]"
          aria-label={`Raíz del algarrobo en el carril ${lane + 1} de ${AQUIFER_LANES}`}
        >
          🌱
        </motion.div>
      </div>

      <div className="mt-3 flex justify-center gap-4">
        <button
          type="button"
          onClick={() => setLane((l) => Math.max(0, l - 1))}
          aria-label="Guiar raíz a la izquierda"
          className="grid h-14 w-14 place-items-center rounded-full border-2 border-[#1c1c11] bg-white text-2xl shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          ⬅️
        </button>
        <button
          type="button"
          onClick={() => setLane((l) => Math.min(AQUIFER_LANES - 1, l + 1))}
          aria-label="Guiar raíz a la derecha"
          className="grid h-14 w-14 place-items-center rounded-full border-2 border-[#1c1c11] bg-white text-2xl shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          ➡️
        </button>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-[#1c1c11]/70">
        Guía la raíz esquivando 🪨 rocas y 🛢️ filtraciones — recoge 💧 bolsas de acuífero antes de llegar a la corriente profunda.
      </p>
    </div>
  );
}

// ======================================================================
// 12. EL GOTERO PRECISO: CLORACIÓN SEGURA (CLORACION_SEGURA, 60s) —
// mantén presionado el gotero y suelta en el número exacto de gotas.
// ======================================================================

type ContainerKind = "jarra" | "balde" | "bidon";

const CLORACION_CONTAINERS: Record<ContainerKind, { label: string; emoji: string; requiredDrops: number; litersLabel: string }> = {
  jarra: { label: "Jarra", emoji: "🏺", requiredDrops: 2, litersLabel: "1 L" },
  balde: { label: "Balde", emoji: "🪣", requiredDrops: 10, litersLabel: "5 L" },
  bidon: { label: "Bidón azul", emoji: "🛢️", requiredDrops: 40, litersLabel: "20 L (1 tapita)" },
};
const CLORACION_ORDER: ContainerKind[] = ["jarra", "balde", "bidon"];
const DROP_INTERVAL_MS = 150;
const CONTAINER_TIMEOUT_MS = 9000;

function CloracionSeguraGame({ duration, onComplete }: { duration: number; onComplete: (accuracy: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [containerIdx, setContainerIdx] = useState(0);
  const [drops, setDrops] = useState(0);
  const [holding, setHolding] = useState(false);
  const [perfectCount, setPerfectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const dropsRef = useRef(0);
  const resolvingRef = useRef(false);
  const finishedRef = useRef(false);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const kind = CLORACION_ORDER[containerIdx % CLORACION_ORDER.length];
  const container = CLORACION_CONTAINERS[kind];

  useEffect(() => {
    dropsRef.current = drops;
  }, [drops]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onComplete(attempts > 0 ? Math.min(1, perfectCount / attempts) : 0);
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const nextContainer = () => {
    setDrops(0);
    setContainerIdx((i) => i + 1);
    resolvingRef.current = false;
  };

  const resolveContainer = (finalDrops: number, timedOut: boolean) => {
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    if (containerTimeoutRef.current) clearTimeout(containerTimeoutRef.current);
    setAttempts((a) => a + 1);
    const diff = finalDrops - container.requiredDrops;
    if (!timedOut && diff === 0) {
      setPerfectCount((c) => c + 1);
      setCombo((c) => {
        const next = c + 1;
        setBestCombo((b) => Math.max(b, next));
        return next;
      });
      setFeedback({ text: "💎 Dosis perfecta — ¡Desinfección Perfecta!", ok: true });
    } else {
      setCombo(0);
      if (timedOut) setFeedback({ text: "⏱️ Sin dosificar a tiempo", ok: false });
      else if (diff > 0) setFeedback({ text: "🤢 Sobredosificado", ok: false });
      else setFeedback({ text: "🦠 Subdosificado", ok: false });
    }
    setTimeout(() => {
      setFeedback(null);
      nextContainer();
    }, 700);
  };

  // Si nunca se presiona el gotero, el contenedor expira solo
  useEffect(() => {
    if (timeLeft <= 0) return;
    containerTimeoutRef.current = setTimeout(() => resolveContainer(dropsRef.current, true), CONTAINER_TIMEOUT_MS);
    return () => {
      if (containerTimeoutRef.current) clearTimeout(containerTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerIdx]);

  useEffect(
    () => () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    },
    [],
  );

  const startHold = () => {
    if (resolvingRef.current || timeLeft <= 0) return;
    setHolding(true);
    holdIntervalRef.current = setInterval(() => {
      setDrops((d) => d + 1);
    }, DROP_INTERVAL_MS);
  };

  const endHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHolding(false);
    resolveContainer(dropsRef.current, false);
  };

  return (
    <div>
      <GameHUD timeLabel={`${timeLeft}s`} scoreLabel={`💎 ${perfectCount}/${attempts} · combo ${combo}`} />
      <div className="rounded-2xl border-2 border-[#1c1c11] bg-white p-5 text-center">
        <span className="text-5xl" aria-hidden="true">
          {container.emoji}
        </span>
        <p className="mt-1 font-display text-lg font-extrabold">
          {container.label} · {container.litersLabel}
        </p>
        <p className="text-xs font-semibold text-[#1c1c11]/60">Necesita {container.requiredDrops} gotas exactas</p>
        <p className="mt-3 font-display text-3xl font-black text-[#1c1c11]">{drops} 💧</p>
        <button
          type="button"
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={() => holding && endHold()}
          className={`mt-3 min-h-14 w-full touch-none rounded-xl border-2 border-[#1c1c11] font-black shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
            holding ? "bg-[#E26D5C] text-white" : "bg-[#FFB793]"
          }`}
          aria-label="Gotero, mantén presionado para dejar caer gotas y suelta en el conteo exacto"
        >
          {holding ? "Soltando gotas…" : "Mantén presionado el gotero"}
        </button>
        {feedback && <p className={`mt-2 text-sm font-bold ${feedback.ok ? "text-[#1c6b34]" : "text-[#E26D5C]"}`}>{feedback.text}</p>}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-[#1c1c11]/70">
        Regla de oro: 2 gotas por litro. Suelta el gotero justo en el número exacto. Mejor combo: {bestCombo}
      </p>
    </div>
  );
}
