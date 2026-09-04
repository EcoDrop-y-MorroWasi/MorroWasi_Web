// Logo inline (reemplaza <img src="/logo.svg">): usa currentColor/var(--color-ink)
// para seguir SIEMPRE el tema de la app (data-theme), nunca el prefers-color-scheme
// del sistema operativo. El SVG externo cargado por <img> vivía en un documento aislado
// y respondía al modo oscuro del SO, no al toggle de la app: en tema claro + SO oscuro
// el trazo salía crema sobre fondo crema (invisible).
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" role="img" aria-label="MorroWasi" className={className}>
      <g transform="translate(12,12) scale(0.75)">
        <path
          d="M68 26 C96 58 104 70 104 82 A36 36 0 1 1 32 82 C32 70 40 58 68 26 Z"
          fill="var(--color-ink)"
        />
        <path
          d="M80 14 C92 14 100 24 96 36 C92 46 80 46 74 38 C68 30 70 18 80 14 Z"
          fill="#FFB793"
          stroke="var(--color-ink)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path d="M76 36 L94 18" stroke="var(--color-ink)" strokeWidth={1.5} strokeLinecap="round" />
        <path
          d="M64 22 C92 54 100 66 100 78 A36 36 0 1 1 28 78 C28 66 36 54 64 22 Z"
          fill="#99B4D8"
          stroke="var(--color-ink)"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <circle cx={52} cy={76} r={5} fill="var(--color-ink)" />
        <circle cx={76} cy={76} r={5} fill="var(--color-ink)" />
        <path d="M50 90 Q64 102 78 90" fill="none" stroke="var(--color-ink)" strokeWidth={4} strokeLinecap="round" />
      </g>
      <text
        x="130"
        y="76"
        fontSize="44"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={800}
        letterSpacing="-0.5px"
        fill="var(--color-ink)"
      >
        MorroWasi
      </text>
    </svg>
  )
}
