import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { calcPew, calcWasiStage, mockFamily } from '../data/mock'
import Footer from './Footer'
import Logo from './Logo'
import ProfileAvatarGlyph from './ProfileAvatarGlyph'
import LiveClock from './LiveClock'
import ChatWidget from './ChatWidget'
import WasiLevelUpModal from './WasiLevelUpModal'
import { useExp } from '../utils/expStore'
import { useStreakDays } from '../utils/streakStore'
import { getCelebratedStage, setCelebratedStage } from '../utils/wasiLevelUp'

interface NavTab {
  to: string
  label: string
  icon: string
  /** Ancla del minitutorial (tutorial.ts). Los tabs se pintan dos veces — header en
      desktop, cierre del cuerpo en mobile — así que el tour elige el que esté visible. */
  tour: string
}

// Bottom nav: 5 tabs oficiales (AGENTS.md §6 / UI_UX_Guide.md §2.1) + Avatares
// agregado al costado de Noticias (pedido explícito, a sabiendas de que excede
// el conteo documentado — la Tienda de Avatares necesitaba acceso directo).
const TABS: NavTab[] = [
  { to: '/cursos', label: 'Cursos', icon: '📚', tour: 'nav-cursos' },
  { to: '/juegos', label: 'Juegos', icon: '🎮', tour: 'nav-juegos' },
  { to: '/misiones', label: 'Misiones', icon: '✅', tour: 'nav-misiones' },
  // Inicio va al centro de los 7 tabs: es el destino más usado y el pulgar llega
  // al medio de la barra inferior más fácil que a los extremos.
  { to: '/inicio', label: 'Inicio', icon: '💧', tour: 'nav-inicio' },
  { to: '/noticias', label: 'Noticias', icon: '📰', tour: 'nav-noticias' },
  { to: '/avatares', label: 'Avatares', icon: '🧑', tour: 'nav-avatares' },
  { to: '/ranking', label: 'Ranking', icon: '🏆', tour: 'nav-ranking' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(readProfile)
  const { pathname } = useLocation()

  useEffect(() => {
    const refresh = () => setProfile(readProfile())
    window.addEventListener('morrowasi-perfil-actualizado', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('morrowasi-perfil-actualizado', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  // React Router no resetea el scroll al cambiar de tab: sin esto, entrar a
  // Misiones/Avatares/etc. después de haber scrolleado la pantalla anterior
  // abría a mitad de página en vez de mostrar el título de arriba.
  // rAF (no llamada directa): en mobile, el tab recién tocado del bottom nav
  // se queda con el foco y algunos WebKit intentan centrarlo en la vista —
  // aunque está en position:fixed, eso alcanza a arrastrar el scroll del
  // documento hacia abajo justo después de este efecto. Corriendo en el
  // siguiente frame y sacando el foco, ganamos esa carrera.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      ;(document.activeElement as HTMLElement | null)?.blur?.()
    })
    return () => cancelAnimationFrame(id)
  }, [pathname])

  // Celebración de "subiste de etapa" — una sola vez por etapa, en cualquier
  // pantalla (el PEW puede subir desde Misiones, Juegos o Cursos, no solo
  // desde Inicio). Ver utils/wasiLevelUp.ts para el detalle de la marca.
  const [exp] = useExp()
  const streakDays = useStreakDays()
  const stage = calcWasiStage(calcPew(exp, streakDays)).stage
  const [levelUpStage, setLevelUpStage] = useState<number | null>(null)

  useEffect(() => {
    const celebrated = getCelebratedStage()
    if (celebrated === 0) {
      // Primera vez que corre este código en este dispositivo: no hay ningún
      // "ascenso" que celebrar recién ahora — el progreso ya existía antes de
      // que existiera esta pantalla. Solo fija la línea base.
      setCelebratedStage(stage)
      return
    }
    if (stage > celebrated) setLevelUpStage(stage)
  }, [stage])

  const closeLevelUp = () => {
    if (levelUpStage !== null) setCelebratedStage(levelUpStage)
    setLevelUpStage(null)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg-light font-body text-ink">
      <header className="keyline-border sticky top-0 z-10 border-x-0 border-t-0 bg-bg-light px-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 py-2">
          <div className="flex items-center justify-between gap-2">
            <LiveClock />
          </div>
          <div className="flex h-14 w-full items-center justify-between gap-4">
            {/* El logo ocupa ~190px a h-14 (viewBox 400x120). Con 7 tabs y el
                contenedor capado en max-w-6xl no quedaba ancho para las etiquetas,
                así que en desktop se achica. */}
            <Link to="/inicio" className="flex shrink-0 items-center gap-2" aria-label="MorroWasi inicio">
              <Logo className="h-12 w-auto sm:h-10 xl:h-12" />
            </Link>

            {/* Tabs: solo desktop/tablet — en mobile siguen en la barra fija de abajo
                (patrón estándar para pantallas chicas, el pulgar llega fácil).
                Con 7 tabs las etiquetas ya no caben junto al nombre y "Salir": por
                debajo de xl se muestra solo el ícono. La etiqueta no se oculta con
                `hidden` sino con `sr-only`, así el lector de pantalla la sigue
                anunciando aunque no se vea. */}
            <nav aria-label="Navegación principal" className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 sm:flex">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.to === '/inicio'}
                  data-tour={tab.tour}
                  title={tab.label}
                  className={({ isActive }) =>
                    `flex min-h-12 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-ink px-3 text-sm font-semibold shadow-[2px_2px_0_#1c1c11] transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      isActive ? (tab.to === '/inicio' ? 'bg-[#E26D5C] text-white' : 'bg-primary/35 text-ink') : 'bg-bg-light text-ink/80'
                    }`
                  }
                >
                  <span aria-hidden="true" className="text-lg leading-none">
                    {tab.icon}
                  </span>
                  <span className="sr-only xl:not-sr-only">{tab.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Mobile: solo el ícono (sin nombre ni botón "Salir", que se cortaban en pantallas
                angostas) — lleva a Perfil, donde ahora vive Salir. */}
            <Link
              to="/perfil"
              aria-label={`Perfil de ${profile.name}`}
              data-tour="nav-perfil"
              className="keyline-border flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl sm:hidden"
            >
              <ProfileAvatarGlyph value={profile.avatar} />
            </Link>

            {/* Desktop/tablet. "Salir" ya no está acá: vive en Perfil (junto al
                resto de la cuenta) y su ancho era justo lo que faltaba para que
                las etiquetas de los tabs entraran sin pisarse con el nombre. */}
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {/* Nombre acotado y recortado: uno largo empujaba los tabs fuera del
                  header. Aparece recién en lg, donde hay ancho para que se lea. */}
              <span className="hidden max-w-[9rem] truncate text-right text-sm font-bold lg:block" title={profile.name}>
                {profile.name}
              </span>
              <Link
                to="/perfil"
                aria-label={`Perfil de ${profile.name}`}
                data-tour="nav-perfil"
                className="keyline-border flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl"
              >
                <ProfileAvatarGlyph value={profile.avatar} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor único: capa el ancho en desktop (1152px) para que ninguna página se estire
          edge-to-edge en pantallas grandes; en mobile max-w-6xl no aplica (siempre más angosto). */}
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-4">
        {children}

        {/* Bottom nav: solo mobile — en desktop/tablet los tabs ya están en el header de arriba.
            A pedido explícito NO es "fixed": va en el flujo normal, como cierre del cuerpo de la
            página, justo antes del Footer — nunca flotando encima del contenido ni del footer. */}
        <nav aria-label="Navegación principal" className="mt-6 sm:hidden">
          <div className="mx-auto flex h-20 w-full max-w-xl gap-1 px-1.5">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/inicio'}
                data-tour={tab.tour}
                className={({ isActive }) =>
                  `my-2 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border-2 border-ink px-0.5 text-[10px] font-semibold shadow-[2px_2px_0_#1c1c11] transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    isActive ? (tab.to === '/inicio' ? 'bg-[#E26D5C] text-white' : 'bg-primary/35 text-ink') : 'bg-bg-light text-ink/80'
                  }`
                }
              >
                <span aria-hidden="true" className="text-2xl leading-none">
                  {tab.icon}
                </span>
                <span className="truncate">{tab.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <Footer />
      </main>

      {levelUpStage !== null && <WasiLevelUpModal stage={levelUpStage} onClose={closeLevelUp} />}

      <ChatWidget />
    </div>
  )
}


function readProfile() {
  try {
    const saved = window.localStorage.getItem('morrowasi_perfil_v1')
    const parsed = saved ? (JSON.parse(saved) as Partial<{ name: string; avatar: string }>) : {}
    return { name: parsed.name || mockFamily.name, avatar: parsed.avatar || mockFamily.avatar }
  } catch {
    return { name: mockFamily.name, avatar: mockFamily.avatar }
  }
}
