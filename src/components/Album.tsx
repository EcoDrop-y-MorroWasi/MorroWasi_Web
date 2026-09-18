import { Link } from "react-router-dom";
import { useBadges } from "../utils/badges";

// Álbum de insignias (Morrowasi_web.md:186-192) — estilo pegatina: borde blanco grueso + trazo negro 2px neo.
// Datos reales donde existen (cursos vía localStorage compartido, Wasi vía fórmula oficial); contadores de
// juego/racha son mock persistente en utils/stats.ts (repeticiones totales, no días consecutivos reales).
export default function Album() {
  const badges = useBadges();
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/juegos"
        className="mb-4 inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-ink bg-surface px-4 text-sm font-extrabold text-ink shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <span aria-hidden>←</span> Volver a Juegos
      </Link>
      <header className="mb-4 rounded-2xl border-2 border-ink bg-[#FFB793] p-5 shadow-[4px_4px_0_#1c1c11]">
        <p className="text-sm font-bold text-ink/70">Álbum de insignias</p>
        <h1 className="font-display text-2xl font-extrabold text-ink">🏅 Colección MorroWasi</h1>
        <p className="mt-1 text-sm font-bold text-ink">{unlockedCount}/{badges.length} insignias desbloqueadas</p>
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
