import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WASI_STAGES, WASI_STAGE_THRESHOLDS } from '../data/mock'
import { wasiVisualFor } from '../data/wasiVisuals'
import { coursesMock } from '../data/courses.mock'
import { AVATARS, AVATAR_ACCESSORIES } from '../data/avatarShop'
import { getAvatarThumbnail } from '../utils/avatarSkinPainter'

const WasiViewer3D = lazy(() => import('./WasiViewer3D'))

interface WasiLevelUpModalProps {
  stage: number
  onClose: () => void
}

// Celebración de "subiste de etapa" — se dispara una sola vez por etapa desde
// Layout (ver utils/wasiLevelUp.ts), nunca dentro de WasiModal (ese es el
// acordeón de consulta libre, repetible). El Wasi 3D real se eleva y da 2
// vueltas (WasiViewer3D autoAscend, motor en three/wasiScene.ts) sin que se
// pueda arrastrar mientras tanto; recién al asentarse aparecen el brillo y el
// panel de lo que se desbloqueó — antes de eso solo se ve el Wasi subiendo.
export default function WasiLevelUpModal({ stage, onClose }: WasiLevelUpModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const [settled, setSettled] = useState(false)
  const info = WASI_STAGES.find((w) => w.number === stage) ?? WASI_STAGES[0]
  const visual = wasiVisualFor(stage)
  const pewRequerido = WASI_STAGE_THRESHOLDS[stage - 1] ?? 0
  const cursos = coursesMock.filter((c) => c.stage === stage)
  const avatar = AVATARS.find((a) => a.stage === stage)
  const accesorios = avatar ? (AVATAR_ACCESSORIES[avatar.id]?.length ?? 0) : 0

  useEffect(() => {
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      // Solo cierra con Esc una vez asentado — cerrar a mitad del ascenso
      // desmontaría el WebGL context de golpe.
      if (e.key === 'Escape' && settled) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, settled])

  return (
    <AnimatePresence>
      <motion.div
        role="presentation"
        className="fixed inset-0 z-30 flex items-end justify-center bg-ink/60 backdrop-blur-[1px] sm:items-center sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="wasi-levelup-title"
          className="keyline-border relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg-light p-5 shadow-[6px_6px_0_var(--color-ink)] sm:rounded-3xl"
          initial={{ y: 28, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 18, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <p className="text-center font-display text-xs font-extrabold uppercase tracking-wide text-accent">
            {settled ? '¡Tu Wasi subió de etapa!' : 'Tu Wasi está subiendo de etapa…'}
          </p>
          <h2 id="wasi-levelup-title" className="mt-1 text-center font-display text-2xl font-extrabold">
            Etapa {stage} de 10 · {info.name}
          </h2>

          {/* Brillo de fondo: aparece recién cuando el ascenso terminó, detrás del visor 3D. */}
          <AnimatePresence>
            {settled && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2 rounded-full bg-secondary/60 blur-2xl"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 0.8, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          <div className="relative">
            <Suspense
              fallback={
                <div className="keyline-border mt-3 flex h-52 w-full animate-pulse items-center justify-center rounded-2xl bg-primary/15 font-body text-xs font-semibold text-ink/50">
                  Cargando Wasi en 3D…
                </div>
              }
            >
              <WasiViewer3D stage={stage} autoAscend onAscendEnd={() => setSettled(true)} />
            </Suspense>
          </div>

          <p className="mt-2 text-center font-body text-xs font-semibold text-ink/60">{visual.scene}</p>
          <p className="mt-3 text-center font-body text-sm">
            <span className="keyline-border inline-flex rounded-full bg-primary/20 px-2 py-0.5 font-bold">
              {stage === 1 ? 'Etapa inicial' : `Llegaste con ${pewRequerido.toLocaleString('es-PE')} PEW`}
            </span>
          </p>

          <AnimatePresence>
            {settled && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
                <h3 className="mt-5 flex items-center gap-2 font-display text-sm font-extrabold">🎁 Se desbloqueó</h3>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="keyline-border flex flex-col items-center gap-1 rounded-xl bg-surface p-3 text-center">
                    <span aria-hidden className="text-2xl">
                      📚
                    </span>
                    <span className="font-display text-lg font-extrabold">{cursos.length}</span>
                    <span className="font-body text-[10px] font-bold uppercase tracking-wide text-ink/60">Cursos nuevos</span>
                  </div>
                  <div className="keyline-border flex flex-col items-center gap-1 rounded-xl bg-surface p-3 text-center">
                    {avatar ? (
                      <img src={getAvatarThumbnail(avatar)} alt="" className="h-9 w-9 object-contain" />
                    ) : (
                      <span aria-hidden className="text-2xl">
                        🧑
                      </span>
                    )}
                    <span className="font-display text-lg font-extrabold">{avatar ? 1 : 0}</span>
                    <span className="font-body text-[10px] font-bold uppercase tracking-wide text-ink/60">Avatar nuevo</span>
                  </div>
                  <div className="keyline-border flex flex-col items-center gap-1 rounded-xl bg-surface p-3 text-center">
                    <span aria-hidden className="text-2xl">
                      🎒
                    </span>
                    <span className="font-display text-lg font-extrabold">{accesorios}</span>
                    <span className="font-body text-[10px] font-bold uppercase tracking-wide text-ink/60">Accesorios</span>
                  </div>
                </div>
                {avatar && (
                  <p className="mt-2 text-center font-body text-xs text-ink/60">
                    El avatar <span className="font-bold">{avatar.name}</span> y sus accesorios ya están en la Tienda de Avatares.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            disabled={!settled}
            className="keyline-border mt-5 min-h-12 w-full rounded-xl bg-accent font-display font-bold text-white shadow-[3px_3px_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {settled ? '¡Genial! →' : 'Subiendo…'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
