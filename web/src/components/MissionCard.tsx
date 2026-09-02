type Props = {
  text: string;
  liters: number;
  xp: number;
  completed: boolean;
  emoji?: string;
  onToggle: () => void;
};

// MissionCard — pixel-perfect morrowasi-preview.html .mission-item
// Paleta #99B4D8/#FFB793/#E26D5C, borde 2px #1c1c11, 48dp, español, mock local
export default function MissionCard({ text, liters, xp, completed, emoji = "💧", onToggle }: Props) {
  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-xl border-2 bg-white px-3 py-3 shadow-[2px_2px_0_#1c1c11] ${completed ? "!bg-[#d4edda] !border-[#28a745]" : "border-[#1c1c11]"}`}
      role="listitem"
      aria-label={`${text} ${liters} litros ${xp} XP ${completed ? "completada" : "pendiente"}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="shrink-0 text-xl" aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold leading-tight text-[#1c1c11]">{text}</p>
          <p className="text-xs font-bold text-[#E26D5C]">
            +{liters} L · +{xp} XP
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={completed}
        aria-label={completed ? `Desmarcar ${text}` : `Completar ${text}`}
        className={`shrink-0 min-h-12 min-w-[96px] rounded-lg border-2 border-[#1c1c11] px-4 py-2 text-sm font-extrabold shadow-[2px_2px_0_#1c1c11] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${completed ? "bg-[#28a745] text-white" : "bg-[#99B4D8] text-[#1c1c11] hover:bg-[#a9c4e8]"}`}
      >
        {completed ? "✓ Listo" : "Completar"}
      </button>
    </li>
  );
}
