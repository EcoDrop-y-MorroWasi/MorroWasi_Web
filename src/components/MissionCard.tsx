type Props = {
  text: string;
  liters: number;
  xp: number;
  completed: boolean;
  emoji?: string;
  onToggle: () => void;
  /** Solo las misiones personalizadas se pueden borrar. */
  onDelete?: () => void;
  /** Tope diario alcanzado (personalizadas) — distinto de "completed": esta no se hizo, pero no se puede hacer hoy. */
  disabled?: boolean;
};

// MissionCard — pixel-perfect morrowasi-preview.html .mission-item
// Paleta #99B4D8/#FFB793/#E26D5C, borde 2px #1c1c11, 48dp, español, mock local
export default function MissionCard({ text, liters, xp, completed, emoji = "💧", onToggle, onDelete, disabled = false }: Props) {
  return (
    <li
      className={`flex flex-col gap-2 rounded-xl border-2 bg-surface px-3 py-3 shadow-[2px_2px_0_#1c1c11] sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${completed ? "!bg-[#28a745]/20 !border-[#28a745]" : "border-ink"}`}
      role="listitem"
      aria-label={`${text} ${liters} litros ${xp} XP ${completed ? "completada" : "pendiente"}`}
    >
      {/* Texto a ancho completo en móvil para leerse normal; en desktop vuelve al lado del botón. */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="shrink-0 text-xl" aria-hidden>
          {emoji}
        </span>
        {/* Texto en varias líneas, nunca cortado con "…": en celular el botón le
            quitaba casi todo el ancho y ninguna misión se podía leer. Ahora el
            texto va primero a todo el ancho y el botón queda al costado abajo. */}
        <div className="min-w-0">
          <p className="break-words text-[15px] font-bold leading-snug text-ink">{text}</p>
          <p className="text-xs font-bold text-[#E26D5C]">
            +{liters} L · +{xp} XP
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={completed || disabled}
          aria-pressed={completed}
          aria-label={completed ? `${text} completada por hoy` : disabled ? `${text}: tope diario alcanzado` : `Completar ${text}`}
          className={`min-h-12 min-w-[84px] rounded-lg border-2 border-ink px-3 py-2 text-sm sm:min-w-[96px] sm:px-4 font-extrabold shadow-[2px_2px_0_#1c1c11] transition-all ${
            completed
              ? "cursor-default bg-[#28a745] text-white"
              : disabled
                ? "cursor-not-allowed bg-stone-300 text-stone-600 shadow-none"
                : "bg-[#99B4D8] text-ink hover:bg-[#a9c4e8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          }`}
        >
          {completed ? "✓ Listo" : disabled ? "Mañana" : "Completar"}
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
