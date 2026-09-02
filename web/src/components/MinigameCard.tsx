import { motion } from "framer-motion";
import type { MinigameType } from "../utils/gamification";

type Props = {
  title: string;
  description: string;
  type: MinigameType;
  xpMaxReward: number; // 30-100
  durationSeconds: number; // 60 o 90
  videoIntroUri: string | null;
  bestScore?: number;
  played?: boolean;
  onPlay: () => void;
};

const typeMeta: Record<MinigameType, { emoji: string; label: string; color: string }> = {
  FUGAS_DETECT: { emoji: "🔧", label: "Caza-Fugas", color: "bg-[#99B4D8]" },
  HUELLA_HIDRICA: { emoji: "⚖️", label: "Peso invisible", color: "bg-[#FFB793]" },
  COSECHA_LLUVIA: { emoji: "🌧️", label: "Atrapa-Lluvias", color: "bg-[#99B4D8]" },
  RIEGO_OPT: { emoji: "🌱", label: "Maestro del riego", color: "bg-[#FFB793]" },
  FILTROS_LAB: { emoji: "🧪", label: "Laboratorio de filtros", color: "bg-[#99B4D8]" },
  RUTAS_AGUAS: { emoji: "🔀", label: "Rutas de aguas grises", color: "bg-[#FFB793]" },
  SODIS_UV: { emoji: "☀️", label: "Desafío SODIS", color: "bg-[#99B4D8]" },
  GUARDIAN_RIO: { emoji: "🧹", label: "Guardián del río", color: "bg-[#FFB793]" },
  DUCHA_MUSICAL: { emoji: "🚿", label: "Ducha musical", color: "bg-[#99B4D8]" },
  CORTE_AGUA: { emoji: "🛢️", label: "Corte de agua", color: "bg-[#FFB793]" },
  ACUIFERO_ALGARROBO: { emoji: "🌳", label: "Acuífero del algarrobo", color: "bg-[#99B4D8]" },
  CLORACION_SEGURA: { emoji: "🧪", label: "Cloración segura", color: "bg-[#FFB793]" },
};

// MinigameCard — variante Arcade juvenil (ui-warm-neobrutalism): borde 3px, sombra 6px, hover arcade
// 48dp, video intro mock local, sin BLE, español, duración real 60-90s por juego oficial Piura
export default function MinigameCard({ title, description, type, xpMaxReward, durationSeconds, videoIntroUri, bestScore, played, onPlay }: Props) {
  const meta = typeMeta[type];
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col overflow-hidden rounded-xl bg-white border-[3px] border-[#1c1c11] shadow-[6px_6px_0_#1c1c11] hover:shadow-[6px_6px_0_#1c1c11]"
      aria-label={`${title} ${xpMaxReward} XP, ${durationSeconds} segundos`}
    >
      {/* Video intro mock — placeholder local, no remoto, sin BLE */}
      <div className={`relative h-40 flex items-center justify-center border-b-[3px] border-[#1c1c11] ${meta.color}`}>
        {videoIntroUri ? (
          <div className="flex flex-col items-center gap-1 p-3 text-center">
            <span className="text-5xl" aria-hidden>
              {meta.emoji}
            </span>
            <span className="rounded-md bg-white/90 border-2 border-[#1c1c11] px-2 py-1 text-[11px] font-extrabold">▶ Video intro mock</span>
            <span className="text-[11px] font-semibold text-[#1c1c11]/70 truncate max-w-[90%]">{videoIntroUri}</span>
          </div>
        ) : (
          <span className="text-5xl" aria-hidden>
            {meta.emoji}
          </span>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-white border-2 border-[#1c1c11] px-2 py-1 text-[11px] font-extrabold">
          {meta.label}
        </span>
        <span className="absolute top-2 right-2 rounded-full bg-[#E26D5C] text-white border-2 border-[#1c1c11] px-2 py-1 text-xs font-extrabold">
          {xpMaxReward} XP
        </span>
        <span className="absolute bottom-2 right-2 rounded-full bg-white border-2 border-[#1c1c11] px-2 py-1 text-[11px] font-extrabold">
          ⏱ {durationSeconds}s
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 bg-[#fdfae7]/50">
        <h3 className="text-[16px] font-extrabold text-[#1c1c11] leading-tight">{title}</h3>
        <p className="text-sm text-[#1c1c11]/70 leading-snug line-clamp-3">{description}</p>

        {played && bestScore !== undefined && (
          <p className="text-xs font-bold text-[#1c6b34]">Mejor puntaje: {bestScore} pts</p>
        )}

        <div className="mt-auto flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97, x: 2, y: 2 }}
            onClick={onPlay}
            className="flex-1 min-h-[48px] rounded-lg bg-[#E26D5C] text-white border-2 border-[#1c1c11] font-extrabold shadow-[2px_2px_0_#1c1c11] active:shadow-none transition-all"
            aria-label={`Jugar ${title}`}
          >
            {played ? "Jugar de nuevo" : "Jugar"}
          </motion.button>
          <span className="inline-flex items-center rounded-lg bg-white border-2 border-[#1c1c11] px-3 text-xs font-bold">
            30–100 XP
          </span>
        </div>
      </div>
    </motion.article>
  );
}
