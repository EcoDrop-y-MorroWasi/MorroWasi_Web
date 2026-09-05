import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Link } from "react-router-dom";
import MinigameCard from "../components/MinigameCard";
import MinigamePlay, { type MinigameResult } from "./MinigamePlay";
import { MINIGAMES, calcMinigameScore } from "../utils/gamification";
import { useHydroPoints } from "../utils/hydroStore";
import { markActivityToday } from "../utils/streakStore";

const GAMES_STORAGE_KEY = "morrowasi_games_v1";

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
// localStorage morrowasi_games_v1, XP solo si supera récord (anti-farmeo), video intro mock skippable.
// Paleta AGENTS.md:145, español, sin BLE. Pulido: toast +XP flotante + confeti canvas-confetti.
export default function Juegos() {
  const [hydro, addHydro] = useHydroPoints();
  const [bestScores, setBestScores] = useState<Record<string, number>>(() => loadBestScores());
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
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

  // Se llama al terminar una partida real (accuracy 0-1). Solo otorga XP si supera el récord guardado.
  const handleFinish = (gameId: string, accuracy: number): MinigameResult => {
    markActivityToday();
    const earned = calcMinigameScore(accuracy);
    const prevBest = bestScores[gameId] ?? 0;
    const isNewBest = earned > prevBest;
    const nextBest = Math.max(prevBest, earned);

    if (isNewBest) {
      const next = { ...bestScores, [gameId]: nextBest };
      setBestScores(next);
      saveBestScores(next);
      addHydro(earned);
      pushToast(`+${earned} XP`, `¡Nuevo récord en ${MINIGAMES.find((g) => g.id === gameId)?.title}!`);
      fireConfetti();
    } else {
      pushToast(`${earned} XP`, `No superaste tu récord (${prevBest} pts) — sin XP extra`);
    }

    return { earned, isNewBest, bestScore: nextBest };
  };

  return (
    <div className="relative mx-auto max-w-[1000px] p-4 pb-24">
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
          <h2 className="text-xl font-extrabold text-ink">🎮 Mini-juegos oficiales de Piura</h2>
          <p className="text-sm text-ink/70">Partidas reales de 60–90 s — gana 30 a 100 HydroPuntos solo con récord nuevo.</p>
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
          <MinigameCard
            key={g.id}
            title={g.title}
            description={g.description}
            type={g.type}
            xpMaxReward={g.xpMaxReward}
            durationSeconds={g.durationSeconds}
            videoIntroUri={g.videoIntroUri}
            bestScore={bestScores[g.id]}
            played={bestScores[g.id] !== undefined}
            onPlay={() => setActiveGameId(g.id)}
          />
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-[#FFB793] border-[3px] border-ink shadow-[6px_6px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-ink">ℹ️ Sobre los juegos</h3>
        <ul className="list-disc pl-5 text-sm text-ink/80 mt-1 space-y-1">
          <li>
            <b>Caza-Fugas Exprés</b>: arrastra 🔧 llave, ⚪ teflón o 🛑 válvula a cada fuga de la casa antes de que se pierda el agua. 60 s.
          </li>
          <li>
            <b>El Peso Invisible del Agua</b>: cara a cara — toca el producto que esconde más agua virtual y encadena combos. 60 s.
          </li>
          <li>
            <b>Atrapa-Lluvias Piurano</b>: desvía las primeras aguas sucias al desagüe, luego abre las canaletas al tanque. 90 s.
          </li>
          <li>
            <b>Maestro del Riego</b>: elige goteo, mulch o riego nocturno — evita la manguera al mediodía (80% se evapora). 90 s.
          </li>
          <li>
            <b>Laboratorio de Filtros</b>: ordena grava, arenas, carbón y algodón de abajo hacia arriba antes de que caiga el agua turbia. 60 s, 3 rondas.
          </li>
          <li>
            <b>Rutas de Aguas Grises</b>: gira las tuberías para conectar la lavadora con el biohuerto o el inodoro sin tocar las aguas negras. 90 s.
          </li>
          <li>
            <b>Desafío SODIS</b>: refleja el sol con el espejo hacia las botellas PET antes de que las bacterias se multipliquen. 60 s.
          </li>
          <li>
            <b>Guardián del Río</b>: desliza ➡️ la basura al reciclaje y deja pasar ⬅️ la fauna y naturaleza del río Piura. 60 s.
          </li>
          <li>
            <b>Ducha Musical</b>: cierra la llave al ritmo de la canción mientras te enjabonas, sin dejar correr el agua. 60 s.
          </li>
          <li>
            <b>Corte de Agua</b>: administra 1000 L en 3 días de corte con tarjetas de decisión, sin sacrificar la higiene. 90 s.
          </li>
          <li>
            <b>Acuífero del Algarrobo</b>: guía la raíz con ⬅️➡️ esquivando 🪨 rocas y 🛢️ filtraciones, recoge 💧 bolsas de acuífero. 60 s, 3 rondas.
          </li>
          <li>
            <b>Cloración Segura</b>: mantén presionado el gotero y suelta en el número exacto de gotas — 2 por litro. 60 s.
          </li>
          <li>Todos otorgan 30–100 XP y muestran video intro mock (saltable a los 10 s). Solo el nuevo récord suma HydroPuntos (anti-farmeo) y cuenta como actividad para tu racha diaria.</li>
        </ul>
      </div>

      <AnimatePresence>
        {activeGame && (
          <MinigamePlay
            key={activeGame.id}
            game={activeGame}
            onFinish={(accuracy) => handleFinish(activeGame.id, accuracy)}
            onClose={() => setActiveGameId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
