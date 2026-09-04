import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const SECTIONS = [
  { icon: '💧', title: 'Qué es MorroWasi', tone: 'bg-primary', text: 'Una plataforma educativa para que familias, escuelas y comunidades de Piura conviertan el cuidado del agua en hábitos visibles. Eco-Drop, su aliado autónomo, detecta goteos junto al caño y avisa con sonido local: no usa Bluetooth ni se conecta al celular.' },
  { icon: '🌱', title: 'Cómo ayuda', tone: 'bg-secondary', text: 'Registra hábitos de ahorro, aprende con cursos de video, juega desafíos educativos y hace crecer tu Wasi en sus 10 etapas. Cada acción suma litros, HydroPuntos y motivación para seguir cuidando el agua.' },
  { icon: '📍', title: 'Dónde nació', tone: 'bg-surface', text: 'MorroWasi nace en Morropón, Piura, como parte del Desafío Amauta 2026: una respuesta local, alegre y práctica para una necesidad que compartimos.' },
  { icon: '🎯', title: 'Nuestro objetivo', tone: 'bg-primary/30', text: 'Promover el uso responsable del agua en hogares y escuelas mediante educación práctica, actividades familiares y una comunidad que celebra cada gota ahorrada.' },
] as const

const GALLERY = [
  { src: '/media/hero/morro.jpg', alt: 'Bosque seco de algarrobos en Lambayeque, cerca de Piura', title: 'Morropón nos inspira' },
  { src: '/media/courses/sodis/cover.jpg', alt: 'Botellas de agua expuestas al sol para desinfección SODIS', title: 'Aprende SODIS' },
  { src: '/media/courses/aguas-grises/cover.jpg', alt: 'Sistema doméstico de reuso de aguas grises', title: 'Reúsa agua gris' },
  { src: '/media/courses/filtros-caseros/cover.jpg', alt: 'Filtros caseros de arena en Guatemala', title: 'Crea filtros' },
  { src: '/media/courses/riego-goteo/cover.jpg', alt: 'Sistema de riego por goteo en un cultivo', title: 'Riega mejor' },
  { src: '/media/courses/cosecha-lluvia/cover.jpg', alt: 'Recolección de agua de lluvia', title: 'Cosecha lluvia' },
] as const

export default function InicioPublico() {
  return (
    <main className="min-h-screen bg-bg-light px-4 py-6 text-ink sm:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2" aria-label="MorroWasi inicio">
            <Logo className="h-10 w-auto sm:h-12" />
          </Link>
          <AccessLink label="Acceder" />
        </header>

        <section className="keyline-border relative overflow-hidden rounded-2xl bg-primary p-6 shadow-[4px_4px_0_var(--color-ink)] sm:p-10">
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(-15deg, transparent 0 18px, var(--color-ink) 18px 19px)' }} />
          <div className="relative max-w-2xl">
            <p className="font-bold">💧 Desafío Amauta 2026 · Morropón, Piura</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl">Cada gota cuida nuestro Wasi.</h1>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-ink/80">Una comunidad que aprende, ahorra y protege el agua desde casa y la escuela.</p>
            <AccessLink label="Acceder a mi Wasi" extra="mt-6 bg-accent text-white shadow-[4px_4px_0_var(--color-ink)]" />
          </div>
        </section>

        <section aria-labelledby="conoce-title">
          <h2 id="conoce-title" className="font-display text-2xl font-extrabold">Conoce MorroWasi</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {SECTIONS.map((section) => <article key={section.title} className={`keyline-border rounded-2xl p-5 shadow-[4px_4px_0_var(--color-ink)] transition-transform hover:-translate-y-[2px] ${section.tone}`}><span aria-hidden="true" className="text-3xl">{section.icon}</span><h3 className="mt-3 font-display text-xl font-extrabold">{section.title}</h3><p className="mt-2 font-semibold leading-relaxed text-ink/80">{section.text}</p></article>)}
          </div>
        </section>

        <section className="keyline-border rounded-2xl bg-surface p-5 shadow-[4px_4px_0_var(--color-ink)]" aria-labelledby="galeria-title">
          <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 id="galeria-title" className="font-display text-2xl font-extrabold">Galería de aprendizaje</h2><p className="mt-1 font-semibold text-ink/80">Fotos reales de referencia — de dominio público o licencia Creative Commons.</p></div><span className="rounded-full border-2 border-ink bg-secondary px-3 py-1 text-sm font-bold">6 recursos</span></div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {GALLERY.map((item) => <figure key={item.src} className="keyline-border overflow-hidden rounded-xl bg-bg-light shadow-[2px_2px_0_var(--color-ink)]"><img src={item.src} alt={item.alt} className="aspect-video w-full object-cover" /><figcaption className="p-2 text-sm font-bold">{item.title}</figcaption></figure>)}
          </div>
        </section>

        <section className="keyline-border rounded-2xl bg-secondary p-6 text-center shadow-[4px_4px_0_var(--color-ink)]"><h2 className="font-display text-2xl font-extrabold">¿Listos para ahorrar juntos?</h2><p className="mx-auto mt-2 max-w-xl font-semibold text-ink/80">Entra, registra tus hábitos y mira cómo florece tu Wasi.</p><AccessLink label="Acceder" extra="mt-5 bg-accent text-white shadow-[2px_2px_0_var(--color-ink)]" /></section>
      </div>
    </main>
  )
}

function AccessLink({ label, extra = 'bg-primary shadow-[2px_2px_0_var(--color-ink)]' }: { label: string; extra?: string }) {
  return <Link to="/login" className={`inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-ink px-5 font-display font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${extra}`}>{label}</Link>
}
