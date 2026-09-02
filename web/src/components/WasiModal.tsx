import { useEffect, useRef, useState, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WASI_STAGES, WASI_STAGE_THRESHOLDS } from '../data/mock'
import { wasiVisualFor, wasiMood } from '../data/wasiVisuals'

// Three.js (~1MB) solo se descarga cuando el modal abre por primera vez, no en la carga inicial de la app.
const WasiViewer3D = lazy(() => import('./WasiViewer3D'))

interface WasiModalProps {
  isOpen: boolean
  onClose: () => void
  currentStage: number
  pew: number
  progressInStage: number
  xpParaSiguiente: number
  streakDays?: number
}

// Modal 10 etapas Wasi — AGENTS.md §5 (PEW + WASI_STAGE_THRESHOLDS + 10 nombres) — pulido neobrutal + framer-motion + 48dp
// Visuales y ánimo por etapa (Morrowasi_web.md:186-192): maceta de barro → oasis radiante, sin castigar inactividad.
export default function WasiModal({ isOpen, onClose, currentStage, pew, progressInStage, xpParaSiguiente, streakDays = 0 }: WasiModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const progressPct = Math.round((progressInStage / xpParaSiguiente) * 100)
  const mood = wasiMood(streakDays)
  // Solo una fila expandida a la vez: cada visor 3D abre su propio contexto WebGL.
  // `mountedStage` es la única fila con <WasiViewer3D> realmente en el DOM; `closing`
  // indica que esa fila está en su animación de salida; `pendingStage` es lo último que
  // el usuario pidió mientras tanto. Nada nuevo se monta hasta que la salida anterior
  // termina (onExitComplete más abajo) — así nunca conviven dos contextos WebGL, ni
  // aunque el usuario haga clic varias veces seguidas antes de que termine la animación.
  const [mountedStage, setMountedStage] = useState<number | null>(null)
  const [closing, setClosing] = useState(false)
  const [pendingStage, setPendingStage] = useState<number | null>(null)

  function toggleStage(n: number) {
    if (mountedStage === n && !closing) {
      setClosing(true)
      setPendingStage(null)
    } else if (mountedStage === null && !closing) {
      setMountedStage(n)
    } else {
      setPendingStage(n)
      setClosing(true)
    }
  }

  // foco y ESC + bloqueo scroll
  useEffect(() => {
    if (!isOpen) {
      setMountedStage(null)
      setClosing(false)
      setPendingStage(null)
      return
    }
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 z-20 flex items-end justify-center bg-ink/55 backdrop-blur-[1px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wasi-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="keyline-border max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg-light p-5 shadow-[6px_6px_0_var(--color-ink)] sm:rounded-3xl"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="wasi-modal-title" className="font-display text-lg font-extrabold">
                Las 10 etapas del Wasi
              </h2>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal de etapas"
                className="keyline-border flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bg-light text-xl font-bold shadow-[2px_2px_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                ×
              </button>
            </div>

            <p className="mt-2 flex items-center gap-1 font-body text-xs font-semibold text-ink/70">
              <span aria-hidden="true">{mood.icon}</span> {mood.label}
            </p>
            <p className="mt-2 font-body text-sm">
              <span className="keyline-border inline-flex rounded-full bg-primary/20 px-2 py-0.5 font-bold">
                PEW: {pew}
              </span>{' '}
              <span className="ml-2">
                Progreso: {progressInStage.toLocaleString('es-PE')}/{xpParaSiguiente.toLocaleString('es-PE')} ({progressPct}%)
              </span>
            </p>
            <div
              role="progressbar"
              aria-valuenow={progressInStage}
              aria-valuemin={0}
              aria-valuemax={xpParaSiguiente}
              aria-label="Progreso PEW hacia la siguiente etapa del Wasi"
              className="keyline-border mt-3 h-4 w-full overflow-hidden rounded-full bg-white"
            >
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              />
            </div>

            <ol className="mt-4 flex flex-col gap-2" aria-label="Listado de etapas — tocá una para ver su modelo 3D">
              {WASI_STAGES.map((stage) => {
                const achieved = stage.number < currentStage
                const active = stage.number === currentStage
                const visual = wasiVisualFor(stage.number)
                const isExpanded = mountedStage === stage.number && !closing
                const panelId = `wasi-stage-3d-${stage.number}`
                return (
                  <li
                    key={stage.number}
                    className={`keyline-border overflow-hidden rounded-xl shadow-[2px_2px_0_var(--color-ink)] transition-colors ${
                      active
                        ? 'bg-accent text-white'
                        : achieved
                          ? 'bg-primary/25'
                          : 'bg-bg-light opacity-70'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleStage(stage.number)}
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      className="flex min-h-12 w-full items-start gap-3 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      <span
                        aria-hidden="true"
                        className={`keyline-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base ${active ? 'bg-white' : 'bg-bg-light'}`}
                      >
                        {visual.icon}
                      </span>
                      <span className="min-w-0 flex-1 font-body text-sm">
                        <span className="font-semibold">
                          {stage.number}. {stage.name}
                        </span>
                        <span className={`block text-xs ${active ? 'text-white/85' : 'text-ink/60'}`}>{visual.scene}</span>
                        <span className={`block text-xs font-semibold ${active ? 'text-white/85' : 'text-ink/50'}`}>
                          Requiere {WASI_STAGE_THRESHOLDS[stage.number - 1].toLocaleString('es-PE')} PEW
                        </span>
                      </span>
                      {active && (
                        <span className="shrink-0 rounded-full bg-white px-2 py-1 font-body text-xs font-bold text-accent">
                          Actual
                        </span>
                      )}
                      {achieved && !active && (
                        <span aria-label="Etapa completada" className="shrink-0 text-accent">
                          ✓
                        </span>
                      )}
                      <span aria-hidden="true" className={`shrink-0 self-center text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </button>
                    <AnimatePresence
                      initial={false}
                      onExitComplete={() => {
                        // esta fila terminó de cerrarse — recién ahora se monta la siguiente, si había una pedida
                        setMountedStage(pendingStage)
                        setClosing(false)
                        setPendingStage(null)
                      }}
                    >
                      {isExpanded && (
                        <motion.div
                          id={panelId}
                          key="panel"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3">
                            <Suspense
                              fallback={
                                <div className="keyline-border flex h-44 w-full animate-pulse items-center justify-center rounded-2xl bg-bg-light/60 font-body text-xs font-semibold text-ink sm:h-52">
                                  Cargando Wasi en 3D…
                                </div>
                              }
                            >
                              <WasiViewer3D stage={stage.number} size="sm" />
                            </Suspense>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                )
              })}
            </ol>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-ink bg-accent px-6 font-display text-sm font-bold text-white shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
