// Pie de página compartido — en toda la plataforma, dentro y fuera de Layout
// (InicioPublico y Login no usan Layout, así que se importa suelto ahí).
export default function Footer() {
  return (
    <footer className="mt-8 flex flex-col items-center gap-3 border-t-2 border-ink pt-4 pb-4 text-center font-body text-xs text-ink/60">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
      <span>© 2026</span>
      <span>Club de Ciencias "Código Científico TPC - Todo Por Cristo"</span>
      <span aria-hidden="true">·</span>
      <span>Desafío Amauta 2026</span>
      <span aria-hidden="true">·</span>
      <a
        href="https://www.facebook.com/profile.php?id=61594008554625"
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook de Código Científico TPC"
        className="grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-surface text-ink"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
        </svg>
      </a>
      <a
        href="https://www.instagram.com/ccyt_cc_todoporcristo/"
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram de Código Científico TPC"
        className="grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-surface text-ink"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </a>
      </div>
    </footer>
  )
}
