import { Link } from "react-router-dom";
import { coursesMock } from "../data/courses.mock";
import { calcPew, calcWasiStage, mockFamily, mockReservoir } from "../data/mock";
import { getStats } from "../utils/stats";
import { useExp } from "../utils/expStore";
import { getReservoir } from "../utils/litersStore";

const ACADEMIA_PROGRESS_KEY = "morrowasi_academia_progress_v1";

// Lee el progreso real de Academia (misma clave que Academia.tsx/Misiones.tsx) — solo lectura.
function readAcademiaProgress(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACADEMIA_PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  progressLabel: string;
}

// Álbum de insignias (Morrowasi_web.md:186-192) — estilo pegatina: borde blanco grueso + trazo negro 2px neo.
// Datos reales donde existen (cursos vía localStorage compartido, Wasi vía fórmula oficial); contadores de
// juego/racha son mock persistente en utils/stats.ts (repeticiones totales, no días consecutivos reales).
export default function Album() {
  const stats = getStats();
  const progress = readAcademiaProgress();
  const coursesCompleted = coursesMock.filter((c) => (progress[c.id]?.length ?? 0) === c.lessons.length).length;

  const [exp] = useExp();
  const pew = calcPew(exp, mockFamily.streakDays);
  const { stage } = calcWasiStage(pew);
  const reservoir = getReservoir();
  const reservoirPct = reservoir.capacityLiters > 0 ? reservoir.currentLiters / reservoir.capacityLiters : 0;
  const reservoirGuardian = mockReservoir.daysOfWaterCut > 0 && reservoirPct >= 0.5;

  const badges: Badge[] = [
    {
      id: "ojo-halcon",
      emoji: "🔍",
      title: "Ojo de Halcón",
      description: "Repara 5 fugas en Caza-Fugas Exprés.",
      unlocked: stats.fugasReparadas >= 5,
      progressLabel: `${Math.min(stats.fugasReparadas, 5)}/5 fugas`,
    },
    {
      id: "guardian-nocturno",
      emoji: "🌙",
      title: "Guardián Nocturno",
      description: "Completa la misión de riego nocturno 7 veces.",
      unlocked: stats.nochesRiego >= 7,
      progressLabel: `${Math.min(stats.nochesRiego, 7)}/7 noches`,
    },
    {
      id: "ducha-relampago",
      emoji: "⚡",
      title: "Ducha Relámpago",
      description: "Completa Ducha Flash (menos de 4 min) 10 veces.",
      unlocked: stats.duchasFlash >= 10,
      progressLabel: `${Math.min(stats.duchasFlash, 10)}/10 duchas`,
    },
    {
      id: "erudito",
      emoji: "📚",
      title: "Erudito del Agua",
      description: "Completa los 6 cursos multimedia de la Academia.",
      unlocked: coursesCompleted >= 6,
      progressLabel: `${coursesCompleted}/6 cursos`,
    },
    {
      id: "guardian-reservorio",
      emoji: "🛡️",
      title: "Guardián del Reservorio",
      description: "Mantén el reservorio sobre el 50% durante un corte programado.",
      unlocked: reservoirGuardian,
      progressLabel: reservoirGuardian ? "Reservorio protegido" : `${Math.round(reservoirPct * 100)}% durante corte`,
    },
    {
      id: "lider-chira",
      emoji: "🏆",
      title: "Líder del Chira",
      description: "Alcanza la etapa 10, Oasis Sagrado.",
      unlocked: stage >= 10,
      progressLabel: `Etapa ${stage}/10`,
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <Link
        to="/juegos"
        className="mb-4 inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-ink bg-surface px-4 text-sm font-extrabold text-ink shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <span aria-hidden>←</span> Volver a Juegos
      </Link>
      <header className="mb-4 rounded-2xl border-2 border-ink bg-[#FFB793] p-5 shadow-[4px_4px_0_#1c1c11]">
        <p className="text-sm font-bold text-ink/70">Álbum de insignias</p>
        <h1 className="font-display text-2xl font-extrabold text-ink">🏅 Colección MorroWasi</h1>
        <p className="mt-1 text-sm font-bold text-ink">{unlockedCount}/6 insignias desbloqueadas</p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" role="list" aria-label="Insignias coleccionables">
        {badges.map((b) => (
          <div
            key={b.id}
            role="listitem"
            aria-label={`${b.title}: ${b.unlocked ? "desbloqueada" : "bloqueada"} — ${b.description}`}
            className={`flex flex-col items-center gap-1 rounded-2xl border-4 border-white p-3 text-center transition-opacity ${
              b.unlocked ? "bg-surface" : "bg-surface/60 opacity-70 grayscale"
            }`}
            style={{ boxShadow: "0 0 0 2px #1c1c11, 4px 4px 0 #1c1c11" }}
          >
            <span className="text-4xl" aria-hidden="true">
              {b.unlocked ? b.emoji : "🔒"}
            </span>
            <p className="text-xs font-black leading-tight text-ink">{b.title}</p>
            <p className="text-[10px] leading-snug text-ink/70">{b.description}</p>
            <span className="mt-1 rounded-full border-2 border-ink bg-[#99B4D8]/30 px-2 py-0.5 text-[10px] font-bold text-ink">
              {b.progressLabel}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-[11px] text-ink/50">
        Ojo de Halcón, Guardián Nocturno y Ducha Relámpago cuentan repeticiones totales guardadas
        en este dispositivo, no rachas de días consecutivos reales.
      </p>
    </div>
  );
}
