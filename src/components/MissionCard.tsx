type Props = {
  text: string;
  liters: number;
  xp: number;
  completed: boolean;
  emoji?: string;
  onToggle: () => void;
  /** Solo las misiones personalizadas se pueden borrar. */
  onDelete?: () => void;
};

// MissionCard — pixel-perfect morrowasi-preview.html .mission-item
// Paleta #99B4D8/#FFB793/#E26D5C, borde 2px #1c1c11, 48dp, español, mock local
export default function MissionCard({ text, liters, xp, completed, emoji = "💧", onToggle, onDelete }: Props) {
  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-xl border-2 bg-surface px-3 py-3 shadow-[2px_2px_0_#1c1c11] ${completed ? "!bg-[#28a745]/20 !border-[#28a745]" : "border-ink"}`}
      role="listitem"
      aria-label={`${text} ${liters} litros ${xp} XP ${completed ? "completada" : "pendiente"}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="shrink-0 text-xl" aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold leading-tight text-ink">{text}</p>
          <p className="text-xs font-bold text-[#E26D5C]">
            +{liters} L · +{xp} XP
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={completed}
          aria-pressed={completed}
          aria-label={completed ? `${text} completada por hoy` : `Completar ${text}`}
          className={`min-h-12 min-w-[96px] rounded-lg border-2 border-ink px-4 py-2 text-sm font-extrabold shadow-[2px_2px_0_#1c1c11] transition-all ${
            completed
              ? "cursor-default bg-[#28a745] text-white"
              : "bg-[#99B4D8] text-ink hover:bg-[#a9c4e8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          }`}
        >
          {completed ? "✓ Listo" : "Completar"}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Eliminar misión ${text}`}
            className="grid h-12 w-12 place-items-center rounded-lg border-2 border-ink bg-surface text-lg shadow-[2px_2px_0_#1c1c11] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  );
}
