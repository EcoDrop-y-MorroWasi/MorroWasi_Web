// Inicio — hero impacto + Wasi vivo + stats generales + blurb Eco-Drop autónomo (Morrowasi_web.md §9.1)
// Pulido warm-neobrutalism + accesibilidad Piura: 48dp, contraste 15.8:1, mock local, español, sin BLE/Firebase
import { useState } from 'react'
import { Link } from 'react-router-dom'
import WasiModal from '../components/WasiModal'
import { calcPew, calcWasiStage, WASI_STAGES } from '../data/mock'
import { wasiVisualFor, wasiMood } from '../data/wasiVisuals'
import { useExp } from '../utils/expStore'
import { useStreakDays } from '../utils/streakStore'

const GALLERY_ITEMS = [
  { title: 'Morropón nos inspira', alt: 'Paisaje rural de Morropón, Piura', src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=960&q=80' },
  { title: 'Aprende SODIS', alt: 'Botellas de agua expuestas al sol para aprender SODIS', src: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=960&q=80' },
  { title: 'Reúsa aguas grises', alt: 'Agua reutilizada para regar plantas', src: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=960&q=80' },
  { title: 'Crea un filtro casero', alt: 'Frasco de vidrio para una actividad de filtro de agua', src: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=960&q=80' },
  { title: 'Riega mejor', alt: 'Plantas recibiendo riego eficiente', src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=960&q=80' },
  { title: 'Cosecha lluvia', alt: 'Gotas de lluvia sobre una superficie', src: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=960&q=80' },
] as const

function useLocalCoverFallback(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null
  event.currentTarget.src = '/media/courses/sodis/cover.jpg'
}

export default function Inicio() {
  const [isWasiModalOpen, setWasiModalOpen] = useState(false)
  const [exp] = useExp()
  const streakDays = useStreakDays()
  const pew = calcPew(exp, streakDays)
  const { stage, progressInStage, xpParaSiguiente } = calcWasiStage(pew)
  const wasiStage = WASI_STAGES.find((w) => w.number === stage) ?? WASI_STAGES[0]
  const nextStage = WASI_STAGES.find((w) => w.number === stage + 1)
  const progressPct = Math.round((progressInStage / xpParaSiguiente) * 100)
  const wasiVisual = wasiVisualFor(stage)
  const mood = wasiMood(streakDays)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Hero impacto — neobrutal base */}
      <section
        aria-labelledby="inicio-hero-title"
        className="keyline-border relative overflow-hidden rounded-2xl bg-primary p-6 text-[#1c1c11] shadow-[4px_4px_0_var(--color-ink)] sm:p-8"
      >
        {/* textura sutil 3% líneas Sechura — no sobre cards */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient( -15deg, transparent 0 18px, var(--color-ink) 18px 19px )',
          }}
        />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-bg-light px-3 py-1 font-body text-xs font-bold">
            <span aria-hidden="true">💧</span> Desafío Amauta 2026 — Morropón, Piura
          </p>
          <h1
            id="inicio-hero-title"
            className="font-display mt-3 text-3xl font-extrabold leading-tight text-[#1c1c11] sm:text-4xl"
            style={{ letterSpacing: '-0.5px' }}
          >
            Cuidemos juntos el agua de Morropón
          </h1>
          <p className="mt-3 max-w-prose font-body text-base leading-relaxed text-[#1c1c11]/90">
            MorroWasi acompaña a familias, colegios y comunidades de Piura en el ahorro de
            agua mediante hábitos diarios, cursos con video y mini-juegos. Todo funciona
            <strong> sin internet</strong>: tu avance vive en el celular.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-ink bg-accent px-6 font-display text-sm font-bold text-white shadow-[2px_2px_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Ver mi Wasi
            </Link>
            <Link
              to="/cursos"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-ink bg-bg-light px-6 font-display text-sm font-bold shadow-[2px_2px_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Explorar Academia
            </Link>
          </div>
        </div>
      </section>

      {/* Tarjeta viva Wasi — clickable abre modal 10 etapas (AGENTS.md §5, RF-011/012) */}
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
            <span
              aria-hidden="true"
              className="keyline-border flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-light text-4xl shadow-[2px_2px_0_var(--color-ink)]"
            >
              {wasiVisual.icon}
            </span>
          </div>

          <p className="mt-2 font-body text-xs font-semibold text-[#1c1c11]/70">
            {mood.icon} {mood.label}
          </p>

          <div
            role="progressbar"
            aria-valuenow={progressInStage}
            aria-valuemin={0}
            aria-valuemax={xpParaSiguiente}
            aria-label={`Progreso hacia ${nextStage ? nextStage.name : 'etapa máxima'}`}
            className="keyline-border mt-4 h-5 w-full overflow-hidden rounded-full bg-surface/60"
          >
            <div className="h-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
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
        streakDays={streakDays}
      />

      {/* Stats generales — grid responsive 2→4, 48dp, contraste */}
      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="sr-only">
          Estadísticas generales
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Familias activas" value="128" hint="en Morropón" />
          <StatCard label="Litros ahorrados" value="284 300 L" hint="acumulado" accent />
          <StatCard label="Colegios participantes" value="6" hint="inicial + primaria" />
          <StatCard label="Cursos completados" value="512" hint="SODIS y reuso" />
        </div>
      </section>

      {/* Blurb Eco-Drop autónomo */}
      <section
        aria-labelledby="ecodrop-title"
        className="keyline-border rounded-2xl bg-secondary/40 p-6 shadow-[4px_4px_0_var(--color-ink)]"
      >
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="keyline-border flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-bg-light text-3xl shadow-[2px_2px_0_var(--color-ink)]"
          >
            📡
          </div>
          <div>
            <h2 id="ecodrop-title" className="font-display text-lg font-bold">
              ¿Qué es Eco-Drop?
            </h2>
            <p className="mt-2 font-body text-sm leading-relaxed">
              Un dispositivo <strong>autónomo</strong> que detecta goteos junto al caño con
              visión TinyML y avisa con sonido en el momento. <strong>Sin internet</strong>,{' '}
              <strong>sin Bluetooth</strong> y sin conexión con el celular: el aprendizaje y el
              registro viven en MorroWasi App.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 font-body text-sm">
              <li>ESP32-CAM + TinyML local, alerta con DFPlayer Mini.</li>
              <li>La familia registra “Cero goteos” en la app de forma voluntaria.</li>
              <li>Sincronización diferida con Firebase solo cuando hay Wi-Fi.</li>
            </ul>
            <Link
              to="/misiones"
              className="mt-4 inline-flex min-h-12 items-center rounded-xl border-2 border-ink bg-bg-light px-5 font-body text-sm font-bold shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Ver misiones diarias
            </Link>
          </div>
        </div>
      </section>

      {/* Placeholder media — garantiza que /public/media exista */}
      <section
        aria-labelledby="media-title"
        className="hidden"
      >
        <h2 id="media-title" className="font-display text-sm font-bold">
          Recursos locales (mock)
        </h2>
        <p className="mt-1 font-body text-xs text-ink/70">
          Videos y portadas en <code>/public/media/courses/*</code> — reproducibles sin conexión.
          Si falta un archivo, verás un placeholder “Descarga con Wi-Fi”.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="keyline-border flex min-h-12 items-center justify-center rounded-xl bg-primary/20 p-2 text-center font-body text-xs font-bold">
            📷 sodis/cover.svg
          </div>
          <div className="keyline-border flex min-h-12 items-center justify-center rounded-xl bg-secondary/20 p-2 text-center font-body text-xs font-bold">
            🎬 sodis/botellas.mp4 (mock)
          </div>
          <div className="keyline-border flex min-h-12 items-center justify-center rounded-xl bg-accent/15 p-2 text-center font-body text-xs font-bold">
            📝 .vtt subtítulos
          </div>
        </div>
      </section>

      <section aria-labelledby="gallery-title" className="keyline-border rounded-2xl bg-surface p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <h2 id="gallery-title" className="font-display text-xl font-extrabold">Galería de aprendizaje</h2>
        <p className="mt-1 font-body text-sm font-semibold text-ink/70">Ideas para cuidar el agua en casa, la escuela y nuestra comunidad.</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {GALLERY_ITEMS.map((item) => (
            <figure key={item.title} className="overflow-hidden rounded-xl border-2 border-ink bg-bg-light shadow-[2px_2px_0_#1c1c11]">
              <img src={item.src} alt={item.alt} onError={useLocalCoverFallback} className="aspect-video w-full object-cover" />
              <figcaption className="p-2 font-body text-sm font-bold">{item.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div
      className={`keyline-border flex min-h-24 flex-col justify-center rounded-2xl p-4 shadow-[4px_4px_0_var(--color-ink)] transition-transform hover:-translate-y-[2px] ${accent ? 'bg-accent text-white' : 'bg-bg-light'}`}
    >
      <p
        className={`font-display text-xl font-extrabold ${accent ? 'text-white' : 'text-accent'}`}
        style={{ letterSpacing: '-0.5px' }}
      >
        {value}
      </p>
      <p className={`font-body text-sm font-semibold ${accent ? 'text-white' : 'text-ink'}`}>
        {label}
      </p>
      {hint && (
        <p className={`font-body text-xs ${accent ? 'text-white/80' : 'text-ink/60'}`}>{hint}</p>
      )}
    </div>
  )
}
