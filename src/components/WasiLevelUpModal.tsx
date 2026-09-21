import { Suspense, lazy, useEffect, useRef } from 'react'
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
// acordeón de consulta libre, repetible). v1 simplificada: el Wasi 3D real
// entra con fade/scale (framer-motion) y ya queda arrastrable como en
// cualquier otro visor — sin la coreografía de elevarse+girar del prototipo,
// que para algo que se ve como mucho 9 veces en toda la cuenta no pagaba su
// complejidad todavía.
export default function WasiLevelUpModal({ stage, onClose }: WasiLevelUpModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const info = WASI_STAGES.find((w) => w.number === stage) ?? WASI_STAGES[0]
  const visual = wasiVisualFor(stage)
  const pewRequerido = WASI_STAGE_THRESHOLDS[stage - 1] ?? 0
  const cursos = coursesMock.filter((c) => c.stage === stage)
  const avatar = AVATARS.find((a) => a.stage === stage)
  const accesorios = avatar ? (AVATAR_ACCESSORIES[avatar.id]?.length ?? 0) : 0

  useEffect(() => {
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
  }, [onClose])

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
          className="keyline-border max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg-light p-5 shadow-[6px_6px_0_var(--color-ink)] sm:rounded-3xl"
          initial={{ y: 28, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 18, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <p className="text-center font-display text-xs font-extrabold uppercase tracking-wide text-accent">¡Tu Wasi subió de etapa!</p>
          <h2 id="wasi-levelup-title" className="mt-1 text-center font-display text-2xl font-extrabold">
            Etapa {stage} de 10 · {info.name}
          </h2>

          <Suspense
            fallback={
              <div className="keyline-border mt-3 flex h-52 w-full animate-pulse items-center justify-center rounded-2xl bg-primary/15 font-body text-xs font-semibold text-ink/50">
                Cargando Wasi en 3D…
              </div>
            }
          >
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}>
              <WasiViewer3D stage={stage} />
            </motion.div>
          </Suspense>

          <p className="mt-2 text-center font-body text-xs font-semibold text-ink/60">{visual.scene}</p>
          <p className="mt-3 text-center font-body text-sm">
            <span className="keyline-border inline-flex rounded-full bg-primary/20 px-2 py-0.5 font-bold">
              {stage === 1 ? 'Etapa inicial' : `Llegaste con ${pewRequerido.toLocaleString('es-PE')} PEW`}
            </span>
          </p>

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

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="keyline-border mt-5 min-h-12 w-full rounded-xl bg-accent font-display font-bold text-white shadow-[3px_3px_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            ¡Genial! →
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
