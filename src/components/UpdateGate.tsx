import { useEffect } from 'react'
import { useUpdateAvailable } from '../utils/versionCheck'

// Aviso bloqueante de "hay una versión nueva" — se dispara solo, sin que
// nadie lo pida, cuando versionCheck.ts detecta que Vercel ya publicó un
// deploy distinto al que está corriendo en este navegador. A propósito no
// tiene X, no cierra tocando afuera, no cierra con Esc: la única salida es
// recargar, porque el objetivo es que todo el mundo quede en la misma
// versión del código (evita bugs raros de un cliente viejo hablando con un
// backend/Supabase ya migrado a la versión nueva).
export default function UpdateGate() {
  const updateAvailable = useUpdateAvailable()

  useEffect(() => {
    if (!updateAvailable) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [updateAvailable])

  if (!updateAvailable) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="update-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-[2px]"
    >
      <div className="keyline-border w-full max-w-md rounded-3xl bg-surface p-6 text-center shadow-[6px_6px_0_var(--color-ink)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-secondary text-3xl shadow-[3px_3px_0_var(--color-ink)]" aria-hidden="true">
          🚀
        </div>
        <h1 id="update-gate-title" className="font-display text-xl font-extrabold">
          Hay una versión nueva de MorroWasi
        </h1>
        <p className="mt-2 font-body text-sm text-ink/80">
          Actualizamos la plataforma. Para seguir usándola necesitas cargar la versión nueva — es un solo paso.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="keyline-border mt-5 min-h-12 w-full rounded-xl bg-accent font-display font-bold text-white shadow-[3px_3px_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          🔄 Recargar ahora
        </button>
        <p className="mt-3 flex items-center justify-center gap-1 font-body text-[11px] font-bold text-ink/60">🔒 No se puede cerrar sin recargar</p>
      </div>
    </div>
  )
}
