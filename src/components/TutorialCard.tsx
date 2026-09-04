interface TutorialCardProps {
  title: string;
  instructions: string;
  exampleFrom: string;
  exampleTo: string;
  exampleLabel: string;
  onStart: () => void;
}

// Minitutorial sin timer entre el video intro y la partida real — explica la mecánica
// con un ejemplo sencillo antes de arrancar el reloj. Reutilizable por los 12 mini-juegos.
export default function TutorialCard({ title, instructions, exampleFrom, exampleTo, exampleLabel, onStart }: TutorialCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border-2 border-ink bg-[#99B4D8]/30 p-5">
        <h3 className="font-display text-lg font-extrabold text-ink">📖 Cómo se juega: {title}</h3>
        <p className="mt-2 text-sm font-semibold text-ink/80">{instructions}</p>
        <div className="mt-4 flex items-center justify-center gap-4 rounded-xl border-2 border-ink bg-surface p-4" aria-hidden="true">
          <span className="text-4xl">{exampleFrom}</span>
          <span className="text-2xl">➡️</span>
          <span className="text-4xl">{exampleTo}</span>
        </div>
        <p className="mt-2 text-center text-xs font-bold text-ink/70">{exampleLabel}</p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="min-h-12 rounded-xl border-2 border-ink bg-[#E26D5C] font-bold text-white shadow-[4px_4px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        Comenzar ▶ (empieza el cronómetro)
      </button>
    </div>
  );
}
