import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { mockFamily } from '../data/mock'
import Logo from './Logo'
import ProfileAvatarGlyph from './ProfileAvatarGlyph'
import LiveClock from './LiveClock'
import ChatWidget from './ChatWidget'
import { signOut as signOutSupabase } from '../utils/authStore'

interface NavTab {
  to: string
  label: string
  icon: string
}

// Bottom nav: 5 tabs oficiales (AGENTS.md §6 / UI_UX_Guide.md §2.1) + Avatares
// agregado al costado de Noticias (pedido explícito, a sabiendas de que excede
// el conteo documentado — la Tienda de Avatares necesitaba acceso directo).
const TABS: NavTab[] = [
  { to: '/cursos', label: 'Cursos', icon: '📚' },
  { to: '/juegos', label: 'Juegos', icon: '🎮' },
  { to: '/', label: 'Inicio', icon: '💧' },
  { to: '/misiones', label: 'Misiones', icon: '✅' },
  { to: '/noticias', label: 'Noticias', icon: '📰' },
  { to: '/avatares', label: 'Avatares', icon: '🧑' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(readProfile)
  const navigate = useNavigate()

  useEffect(() => {
    const refresh = () => setProfile(readProfile())
    window.addEventListener('morrowasi-perfil-actualizado', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('morrowasi-perfil-actualizado', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const signOut = () => {
    signOutSupabase().finally(() => navigate('/inicio-publico', { replace: true }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-light font-body text-ink">
      <header className="keyline-border sticky top-0 z-10 border-x-0 border-t-0 bg-bg-light px-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 py-2">
          <div className="flex items-center justify-between gap-2">
            <LiveClock />
          </div>
          <div className="flex h-14 w-full items-center justify-between gap-4">
            <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="MorroWasi inicio">
              <Logo className="h-12 w-auto sm:h-14" />
            </Link>

            {/* Tabs: solo desktop/tablet — en mobile siguen en la barra fija de abajo
                (patrón estándar para pantallas chicas, el pulgar llega fácil). */}
            <nav aria-label="Navegación principal" className="hidden min-w-0 flex-1 items-center justify-center gap-1 sm:flex">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.to === '/'}
                  className={({ isActive }) =>
                    `flex min-h-12 items-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-ink px-3 text-sm font-semibold shadow-[2px_2px_0_#1c1c11] transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      isActive ? (tab.to === '/' ? 'bg-[#E26D5C] text-white' : 'bg-primary/35 text-ink') : 'bg-bg-light text-ink/80'
                    }`
                  }
                >
                  <span aria-hidden="true" className="text-lg leading-none">
                    {tab.icon}
                  </span>
                  {tab.label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile: solo el ícono (sin nombre ni botón "Salir", que se cortaban en pantallas
                angostas) — lleva a Perfil, donde ahora vive Salir. */}
            <Link
              to="/perfil"
              aria-label={`Perfil de ${profile.name}`}
              className="keyline-border flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl sm:hidden"
            >
              <ProfileAvatarGlyph value={profile.avatar} />
            </Link>

            {/* Desktop/tablet: layout original completo. */}
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <span className="text-right text-sm font-bold" title={profile.name}>
                {profile.name}
              </span>
              <button type="button" onClick={signOut} className="min-h-12 rounded-xl border-2 border-ink bg-secondary px-3 text-sm font-bold text-ink shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">Salir</button>
              <Link
                to="/perfil"
                aria-label={`Perfil de ${profile.name}`}
                className="keyline-border flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl"
              >
                <ProfileAvatarGlyph value={profile.avatar} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor único: capa el ancho en desktop (1152px) para que ninguna página se estire
          edge-to-edge en pantallas grandes; en mobile max-w-6xl no aplica (siempre más angosto).
          pb con env(safe-area-inset-bottom): en celulares con barra/gesto inferior (notch), el
          nav real ocupa más que su alto nominal — sin esto el contenido queda tapado. */}
      {/* pb grande + safe-area solo hasta sm: es lo que el bottom nav mobile necesita para no tapar
          contenido; en sm+ no hay bottom nav (los tabs viven en el header), así que pb vuelve a lo normal. */}
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-4">
        {children}
      </main>

      {/* Bottom nav: solo mobile — en desktop/tablet los tabs ya están en el header de arriba. */}
      <nav
        aria-label="Navegación principal"
        className="keyline-border fixed inset-x-0 bottom-0 z-10 border-x-0 border-b-0 bg-bg-light sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex h-20 w-full max-w-xl gap-1 px-1.5 sm:gap-1.5 sm:px-2">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `my-2 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border-2 border-ink px-0.5 text-[10px] font-semibold shadow-[2px_2px_0_#1c1c11] transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:gap-1 sm:text-xs ${
                  isActive ? (tab.to === '/' ? 'bg-[#E26D5C] text-white' : 'bg-primary/35 text-ink') : 'bg-bg-light text-ink/80'
                }`
              }
            >
              <span aria-hidden="true" className="text-2xl leading-none sm:text-[28px]">
                {tab.icon}
              </span>
              <span className="truncate">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

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
