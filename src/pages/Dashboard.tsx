import { useState, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import WasiModal from '../components/WasiModal'
import { calcPew, calcWasiStage, mockFamily, mockReservoir, WASI_STAGES } from '../data/mock'
import { wasiVisualFor, wasiMood } from '../data/wasiVisuals'
import { useHydroPoints } from '../utils/hydroStore'
import { useExp } from '../utils/expStore'
import { useReservoir } from '../utils/litersStore'

// Three.js (~1MB) se descarga aparte del bundle principal — el Dashboard sigue pintando rápido.
const WasiViewer3D = lazy(() => import('../components/WasiViewer3D'))

// Dashboard central (AGENTS.md §6, RF-010/011/012) — pulido wasi + ola SVG + racha visible + mood/visuales
export default function Dashboard() {
  const [isWasiModalOpen, setWasiModalOpen] = useState(false)
  const [hydroPoints] = useHydroPoints()
  const [exp] = useExp()
  const pew = calcPew(exp, mockFamily.streakDays)
  const { stage, progressInStage, xpParaSiguiente } = calcWasiStage(pew)
  const wasiStage = WASI_STAGES.find((w) => w.number === stage) ?? WASI_STAGES[0]
  const nextStage = WASI_STAGES.find((w) => w.number === stage + 1)
  const progressPct = Math.round((progressInStage / xpParaSiguiente) * 100)
  const wasiVisual = wasiVisualFor(stage)
  const mood = wasiMood(mockFamily.streakDays)

  const reservoir = useReservoir()
  const hasCapacity = reservoir.capacityLiters > 0
  const reservoirPct = hasCapacity ? Math.round((reservoir.currentLiters / reservoir.capacityLiters) * 100) : 0

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {/* Métricas 48dp, contraste, accesible */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Litros hoy" value={`${mockFamily.litersToday} L`} />
        <MetricCard label="HydroPuntos" value={String(hydroPoints)} highlight />
        <MetricCard
          label="Racha"
          value={`${mockFamily.streakDays} días`}
          sub="🔥 visible · días consecutivos"
        />
      </div>

      {/* Modelo 3D del Wasi en la etapa actual — visible siempre en Inicio, debajo de HydroPuntos */}
      <Suspense
        fallback={
          <div className="keyline-border flex h-56 w-full animate-pulse items-center justify-center rounded-2xl bg-primary/15 font-body text-xs font-semibold text-ink/50 sm:h-64">
            Cargando Wasi en 3D…
          </div>
        }
      >
        <WasiViewer3D stage={stage} />
      </Suspense>

      {/* Tarjeta viva Wasi — clickable abre modal 10 etapas */}
      <section aria-label="Tarjeta viva del Wasi">
        <button
          type="button"
          onClick={() => setWasiModalOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Wasi etapa ${wasiStage.number} ${wasiStage.name}, PEW ${pew}, toca para ver las 10 etapas`}
          className="keyline-border group flex min-h-12 w-full flex-col rounded-2xl bg-gradient-to-br from-primary to-[#b8d4f0] p-5 text-left text-[#1c1c11] shadow-[4px_4px_0_var(--color-ink)] transition-transform hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-body text-sm font-semibold text-[#1c1c11]/70">Etapa {wasiStage.number} de 10</p>
              <h2 className="font-display text-xl font-extrabold tracking-tight">{wasiStage.name}</h2>
              <p className="font-body text-xs font-semibold text-[#1c1c11]/60">PEW: {pew}</p>
            </div>
            <span aria-hidden="true" className="keyline-border flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-light text-4xl shadow-[2px_2px_0_var(--color-ink)]">
              {wasiVisual.icon}
            </span>
          </div>

          <p className="mt-2 font-body text-xs font-semibold text-[#1c1c11]/70">
            {mood.icon} {mood.label}
          </p>
          <p className="mt-1 font-body text-xs text-[#1c1c11]/60">{wasiVisual.scene}</p>

          {/* Progreso 0-500 — wasi-bar-track según skill */}
          <div
            role="progressbar"
            aria-valuenow={progressInStage}
            aria-valuemin={0}
            aria-valuemax={xpParaSiguiente}
            aria-label={`Progreso hacia ${nextStage ? nextStage.name : 'etapa máxima'}`}
            className="keyline-border mt-4 h-5 w-full overflow-hidden rounded-full bg-surface/60"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-accent"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-body text-sm">
            <span>
              {progressInStage.toLocaleString('es-PE')}/{xpParaSiguiente.toLocaleString('es-PE')} ({progressPct}%)
            </span>
            <span className="font-semibold">
              {nextStage ? `Siguiente: ${nextStage.name}` : 'Etapa máxima alcanzada'}
            </span>
          </div>
          <p className="mt-1 font-body text-xs font-bold text-[#1c1c11]/60 group-hover:text-[#1c1c11]">
            Toca para ver las 10 etapas →
          </p>
        </button>
      </section>

      <WasiModal
        isOpen={isWasiModalOpen}
        onClose={() => setWasiModalOpen(false)}
        currentStage={stage}
        pew={pew}
        progressInStage={progressInStage}
        xpParaSiguiente={xpParaSiguiente}
        streakDays={mockFamily.streakDays}
      />

      {/* Monitor reservorio — ola SVG animada por % */}
      <section
        className="keyline-border rounded-2xl bg-primary/20 p-5 shadow-[4px_4px_0_var(--color-ink)]"
        aria-label="Monitor de reservorio familiar"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Reservorio familiar</h2>
          <span className="keyline-border rounded-full bg-bg-light px-3 py-1 font-body text-xs font-bold">
            {hasCapacity ? `${reservoirPct}% lleno` : 'Configura tu reservorio'}
          </span>
        </div>

        <ReservoirWave percent={reservoirPct} />

        <div
          role="progressbar"
          aria-valuenow={reservoirPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Nivel de agua del reservorio"
          className="sr-only"
        >
          {reservoirPct}%
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 font-body text-sm">
          <div className="keyline-border rounded-xl bg-bg-light p-3">
            <dt className="text-xs font-bold text-ink/60">Capacidad</dt>
            <dd className="font-display text-base font-bold">{hasCapacity ? `${reservoir.capacityLiters} L` : 'Sin configurar'}</dd>
          </div>
          <div className="keyline-border rounded-xl bg-bg-light p-3">
            <dt className="text-xs font-bold text-ink/60">Nivel actual</dt>
            <dd className="font-display text-base font-bold">
              {reservoir.currentLiters} L
            </dd>
          </div>
          <div className="keyline-border rounded-xl bg-bg-light p-3">
            <dt className="text-xs font-bold text-ink/60">Días de corte</dt>
            <dd className="font-bold">{mockReservoir.daysOfWaterCut} días</dd>
          </div>
          <div className="keyline-border rounded-xl bg-bg-light p-3">
            <dt className="text-xs font-bold text-ink/60">Integrantes</dt>
            <dd className="font-bold">{mockReservoir.familyMembersCount} familias</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  highlight,
  sub,
}: {
  label: string
  value: string
  highlight?: boolean
  sub?: string
}) {
  return (
    <div
      className={`keyline-border flex min-h-24 flex-col items-center justify-center rounded-2xl p-3 text-center shadow-[4px_4px_0_var(--color-ink)] ${highlight ? 'bg-accent text-white' : 'bg-bg-light'}`}
    >
      <p
        className={`font-display text-lg font-extrabold ${highlight ? 'text-white' : 'text-accent'}`}
        style={{ letterSpacing: '-0.5px' }}
      >
        {value}
      </p>
      <p className="font-body text-xs font-bold">{label}</p>
      {sub && <p className={`font-body text-[10px] ${highlight ? 'text-white/80' : 'text-ink/60'}`}>{sub}</p>}
    </div>
  )
}

// Ola SVG animada proporcional a percent (0-100) — framer-motion, respeta prefers-reduced-motion
function ReservoirWave({ percent }: { percent: number }) {
  const safe = Math.max(0, Math.min(100, percent))
  // altura de ola: translateY inverso al llenado
  const waveY = 100 - safe

  return (
    <div className="keyline-border relative mt-3 h-28 w-full overflow-hidden rounded-2xl bg-bg-light">
      {/* contenedor agua */}
      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`Tanque al ${safe} por ciento`}
      >
        <defs>
          <clipPath id="tank-clip">
            <rect x="0" y="0" width="200" height="100" rx="16" />
          </clipPath>
        </defs>

        {/* fondo agua base */}
        <g clipPath="url(#tank-clip)">
          <rect x="0" y={`${waveY}`} width="200" height="100" fill="var(--color-primary)" opacity="0.95" />
          {/* ola frontal animada */}
          <motion.g
            animate={{ x: [0, -40, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
            style={{ y: `${waveY - 8}px` }}
          >
            <path
              d="M0 12 Q 25 0 50 12 T 100 12 T 150 12 T 200 12 T 250 12 V 100 H 0 Z"
              fill="var(--color-primary)"
            />
            <path
              d="M0 18 Q 25 6 50 18 T 100 18 T 150 18 T 200 18 T 250 18 V 100 H 0 Z"
              fill="white"
              opacity="0.35"
            />
          </motion.g>
        </g>

        {/* borde y marca % */}
        <rect x="1" y="1" width="198" height="98" rx="16" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="keyline-border rounded-full bg-bg-light/90 px-4 py-1 font-display text-sm font-extrabold backdrop-blur">
          {safe}%
        </span>
      </div>

      {/* detalle borde inferior ola estática para accesibilidad sin motion */}
      <style>{`@media (prefers-reduced-motion: reduce) { svg g { animation: none !important; } }`}</style>
    </div>
  )
}
