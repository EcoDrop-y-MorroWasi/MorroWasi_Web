import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Link } from "react-router-dom";
import MinigameCard from "../components/MinigameCard";
import MinigamePlay, { type MinigameResult } from "./MinigamePlay";
import { MINIGAMES, calcMinigameScore, calcGameExp, calcGameLiters } from "../utils/gamification";
import { useHydroPoints } from "../utils/hydroStore";
import { useExp } from "../utils/expStore";
import { addLiters } from "../utils/litersStore";
import { markActivityToday } from "../utils/streakStore";
import { recordLedgerEvent } from "../utils/leaderboardLedger";
import { playChime, playMiss } from "../utils/sound";

const GAMES_STORAGE_KEY = "morrowasi_games_v1";

// Fichas de "Sobre los juegos" que muestra el botón ? junto al título.
const JUEGOS_INFO: { emoji: string; titulo: string; texto: string }[] = [
  { emoji: "🔧", titulo: "Caza-Fugas Exprés", texto: "Arrastra llave, teflón o válvula a cada fuga de la casa antes de que se pierda el agua. 60 s." },
  { emoji: "⚖️", titulo: "El Peso Invisible del Agua", texto: "Cara a cara — toca el producto que esconde más agua virtual y encadena combos. 60 s." },
  { emoji: "🌧️", titulo: "Atrapa-Lluvias Piurano", texto: "Desvía las primeras aguas sucias al desagüe, luego abre las canaletas al tanque. 90 s." },
  { emoji: "🌱", titulo: "Maestro del Riego", texto: "Elige goteo, mulch o riego nocturno — evita la manguera al mediodía (80% se evapora). 90 s." },
  { emoji: "🧪", titulo: "Laboratorio de Filtros", texto: "Ordena grava, arenas, carbón y algodón de abajo hacia arriba antes de que caiga el agua turbia. 60 s, 3 rondas." },
  { emoji: "🔀", titulo: "Rutas de Aguas Grises", texto: "Gira las tuberías para conectar la lavadora con el biohuerto o el inodoro sin tocar las aguas negras. 90 s." },
  { emoji: "☀️", titulo: "Desafío SODIS", texto: "Refleja el sol con el espejo hacia las botellas PET antes de que las bacterias se multipliquen. 60 s." },
  { emoji: "🏞️", titulo: "Guardián del Río", texto: "Desliza ➡️ la basura al reciclaje y deja pasar ⬅️ la fauna y naturaleza del río Piura. 60 s." },
  { emoji: "🚿", titulo: "Ducha Musical", texto: "Cierra la llave al ritmo mientras te enjabonas e ignora los botones trampa, sin dejar correr el agua. 60 s." },
  { emoji: "🛢️", titulo: "Corte de Agua", texto: "Administra 1000 L en 3 días de corte con tarjetas de decisión, sin sacrificar la higiene. 90 s." },
  { emoji: "🌳", titulo: "Acuífero del Algarrobo", texto: "Guía la raíz con ⬅️➡️ esquivando rocas y filtraciones, recoge bolsas de acuífero. 60 s, 3 rondas." },
  { emoji: "💧", titulo: "Cloración Segura", texto: "Mantén presionado el gotero y suelta en el número exacto de gotas — 2 por litro. 60 s." },
  { emoji: "❓", titulo: "Sabios del Agua", texto: "10 preguntas al azar sobre agua, Piura y los temas de la Academia. Responde rápido para sumar más. 90 s." },
  { emoji: "🏠", titulo: "Construye tu Wasi", texto: "Arma en 3D isométrico la instalación de agua de tu casa — techo, canaletas, filtro, tanque, biohuerto y ducha. 8 rondas, 300 s." },
  { emoji: "🃏", titulo: "Memorama del Agua", texto: "Progresivo — 4 cartas al empezar, sube de a 2 hasta 30 según avanzás, sin repetir posición. 90 s." },
];

const JUEGOS_NOTA =
  "Todos otorgan 30–100 HydroPuntos y arrancan con viñetas que explican cómo se juega. Ganar con 50 % o más de desempeño entrega HydroPuntos, EXP y actividad de racha; perder o salir no entrega nada. El récord solo muestra tu mejor resultado.";

function loadBestScores(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(GAMES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: Record<string, number> = {};
    // Un valor no-numérico corrupto (edición manual, payload viejo) dejaría
    // ese juego sin poder superar nunca su "récord" — se descarta en vez de
    // arrastrarlo.
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value)) clean[id] = value;
    }
    return clean;
  } catch {
    return {};
  }
}

function saveBestScores(scores: Record<string, number>) {
  try {
    window.localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(scores));
  } catch {
    /* localStorage no disponible */
  }
}

// Juegos 30-100XP — 4 mini-juegos realmente jugables (MinigamePlay), bestScore persistido en
// localStorage morrowasi_games_v1, XP en toda partida ganada (el récord solo se muestra, no filtra), intro con viñetas ilustradas.
// Paleta AGENTS.md:145, español, sin BLE. Pulido: toast +XP flotante + confeti canvas-confetti.
export default function Juegos() {
  const [hydro, addHydro] = useHydroPoints();
  const [, addExp] = useExp();
  const [bestScores, setBestScores] = useState<Record<string, number>>(() => loadBestScores());
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [lastGameId, setLastGameId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; sub?: string }[]>([]);

  const fireConfetti = () => {
    confetti({
      particleCount: 110,
      spread: 78,
      origin: { y: 0.62 },
      colors: ["#99B4D8", "#FFB793", "#E26D5C", "#1c1c11"],
    });
    setTimeout(
      () =>
        confetti({
          particleCount: 50,
          spread: 90,
          origin: { y: 0.7 },
          colors: ["#99B4D8", "#FFB793"],
          scalar: 0.9,
        }),
      220,
    );
  };

  const pushToast = (text: string, sub?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, sub }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 1900);
  };

  const activeGame = MINIGAMES.find((g) => g.id === activeGameId) ?? null;

  const closeGame = () => {
    setLastGameId(activeGameId);
    setActiveGameId(null);
  };

  // Al cerrar el modal, volver al punto donde estaba: la tarjeta del juego
  // recién jugado, no al tope de la página.
  useEffect(() => {
    if (activeGameId !== null || lastGameId === null) return;
    const t = setTimeout(() => {
      document.getElementById(`juego-${lastGameId}`)?.scrollIntoView({ block: "center" });
    }, 60);
    return () => clearTimeout(t);
  }, [activeGameId, lastGameId]);

  // Se llama al terminar una partida real (accuracy 0-1). Antes solo otorgaba
  // HydroPuntos/EXP si superabas tu récord guardado (anti-farmeo); ahora toda
  // partida ganada (earned > 0) paga, superes récord o no — el récord se
  // sigue guardando solo para mostrarlo en la tarjeta del juego.
  const handleFinish = (gameId: string, accuracy: number): MinigameResult => {
    const earned = calcMinigameScore(accuracy);
    const prevBest = bestScores[gameId] ?? 0;
    const isNewBest = earned > prevBest;
    const nextBest = Math.max(prevBest, earned);

    if (isNewBest) {
      const next = { ...bestScores, [gameId]: nextBest };
      setBestScores(next);
      saveBestScores(next);
    }

    if (earned > 0) {
      markActivityToday();
      addHydro(earned);
      const exp = calcGameExp(earned);
      const liters = calcGameLiters(exp);
      addExp(exp);
      addLiters(liters);
      recordLedgerEvent("juego", gameId, { hydro: earned, exp });
      pushToast(`+${earned} HP`, isNewBest ? `¡Nuevo récord en ${MINIGAMES.find((g) => g.id === gameId)?.title}!` : "¡Ganaste!");
      fireConfetti();
      playChime();
    } else {
      pushToast("Sin HydroPuntos", "Perdiste — inténtalo de nuevo");
      playMiss();
    }

    return { earned, liters: earned > 0 ? calcGameLiters(calcGameExp(earned)) : 0, isNewBest, bestScore: nextBest };
  };

  return (
    <div className="relative mx-auto max-w-[1000px] p-4" data-tour="pagina-juegos">
      {/* Toast flotante */}
      <div className="pointer-events-none fixed top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: -6, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-xl bg-[#1c1c11] text-white border-2 border-white shadow-[4px_4px_0_#1c1c11] px-4 py-2 text-center min-w-[200px]"
            >
              <div className="text-sm font-black text-[#FFB793]">{t.text}</div>
              {t.sub && <div className="text-[11px] font-semibold opacity-80">{t.sub}</div>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink">
            🎮 Minijuegos
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              aria-label="Ver información sobre los juegos"
              className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-surface text-base font-black shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              ?
            </button>
          </h2>
          <p className="text-sm text-ink/70">Gana con al menos 50 % de desempeño y recibe 30 a 100 HydroPuntos.</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            key={hydro}
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            className="rounded-lg bg-surface keyline px-3 py-2 text-sm font-extrabold shadow-[2px_2px_0_#1c1c11]"
          >
            ⚡ {hydro} HydroPuntos
          </motion.div>
          <Link
            to="/album"
            className="flex min-h-12 items-center gap-1 rounded-lg bg-[#FFB793] border-2 border-ink px-3 text-sm font-extrabold shadow-[2px_2px_0_#1c1c11]"
          >
            🏅 Álbum
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {MINIGAMES.map((g) => (
          <div key={g.id} id={`juego-${g.id}`} className="scroll-mt-24 min-w-0">
          <MinigameCard
            title={g.title}
            description={g.description}
            type={g.type}
            xpMaxReward={g.xpMaxReward}
            durationSeconds={g.durationSeconds}
            bestScore={bestScores[g.id]}
            played={bestScores[g.id] !== undefined}
            onPlay={() => setActiveGameId(g.id)}
          />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {activeGame && (
          <MinigamePlay
            key={activeGame.id}
            game={activeGame}
            onFinish={(accuracy) => handleFinish(activeGame.id, accuracy)}
            onClose={closeGame}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            role="presentation"
            onClick={() => setShowInfo(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c11]/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Sobre los juegos"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-2 border-ink bg-bg-light p-4 shadow-[4px_4px_0_#1c1c11]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-extrabold text-ink">ℹ️ Sobre los juegos</h2>
                <button
                  type="button"
                  onClick={() => setShowInfo(false)}
                  aria-label="Cerrar información"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-surface text-xl font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {JUEGOS_INFO.map((j) => (
                  <div key={j.titulo} className="min-w-0 rounded-xl border-2 border-ink bg-surface p-3 shadow-[2px_2px_0_#1c1c11]">
                    <p className="font-display text-sm font-extrabold text-ink">
                      {j.emoji} {j.titulo}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-ink/70 text-pretty break-words [overflow-wrap:break-word]">
                      {j.texto}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-xl border-2 border-ink bg-[#FFB793] p-3 text-xs font-bold leading-relaxed text-[#1c1c11]">
                {JUEGOS_NOTA}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
