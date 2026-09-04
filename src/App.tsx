import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Inicio from './pages/Inicio'
import Academia from './pages/Academia'
import Misiones from './pages/Misiones'
import Juegos from './pages/Juegos'
import Ahorro from './pages/Ahorro'
import Noticias from './pages/Noticias'
import Perfil from './pages/Perfil'
import Album from './components/Album'
import Familias from './pages/Familias'
import { Colegios } from './pages/Colegios'
import { Ranking } from './pages/Ranking'
import Estadisticas from './pages/Estadisticas'
import { Config } from './pages/Config'
import { mockFamily, calcPew, calcWasiStage } from './data/mock'
import InicioPublico from './pages/InicioPublico'
import Login from './pages/Login'
import { signOut, useAuthSession } from './utils/authStore'
import { useHydroPoints } from './utils/hydroStore'
import { useExp } from './utils/expStore'

// Lazy: arrastra skinview3d + three.js (motor 3D de los avatares) fuera del bundle
// principal, igual que WasiViewer3D — no todos los usuarios abren esta pestaña.
const Avatares = lazy(() => import('./pages/Avatares'))

const THEME_STORAGE_KEY = 'morrowasi_theme_v1'
const LIMITE_INACTIVIDAD_MS = 5 * 60 * 1000

export default function App() {
  // Aplica el tema guardado en Perfil (localStorage) al arrancar la app, no solo al visitar /perfil.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
      document.documentElement.dataset.theme = saved === 'oscuro' ? 'dark' : 'light'
    } catch {
      /* localStorage no disponible */
    }
  }, [])

  const { session } = useAuthSession()
  const [sesionExpirada, setSesionExpirada] = useState(false)
  const navigate = useNavigate()

  // Cierra la sesión sola tras 5 min sin actividad (mouse/teclado/touch/scroll)
  // y avisa con un modal — vive acá arriba (no dentro de ProtectedRoutes) para
  // que el modal sobreviva al redirect automático que dispara el signOut.
  useEffect(() => {
    if (!session) return
    let ultimaActividad = Date.now()
    const marcarActividad = () => { ultimaActividad = Date.now() }
    const eventos = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const
    eventos.forEach((e) => window.addEventListener(e, marcarActividad, { passive: true }))
    const intervalo = window.setInterval(() => {
      if (Date.now() - ultimaActividad >= LIMITE_INACTIVIDAD_MS) {
        signOut()
        setSesionExpirada(true)
      }
    }, 10_000)
    return () => {
      eventos.forEach((e) => window.removeEventListener(e, marcarActividad))
      window.clearInterval(intervalo)
    }
  }, [session])

  return (
    <>
      <Routes>
        <Route path="/inicio-publico" element={<InicioPublico />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<ProtectedRoutes />} />
      </Routes>

      {sesionExpirada && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c1c11]/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border-2 border-ink bg-surface p-6 text-center shadow-[4px_4px_0_#1c1c11]">
            <p className="text-4xl" aria-hidden>⏱️</p>
            <h2 className="mt-2 font-display text-lg font-bold text-ink">Sesión cerrada por inactividad</h2>
            <p className="mt-2 text-sm text-ink/70">Por tu seguridad, cerramos tu sesión tras 5 minutos sin actividad.</p>
            <button
              type="button"
              onClick={() => {
                setSesionExpirada(false)
                navigate('/login', { replace: true })
              }}
              className="mt-4 min-h-12 w-full rounded-xl border-2 border-ink bg-accent px-5 font-display font-bold text-white shadow-[2px_2px_0_var(--color-ink)]"
            >
              Volver a iniciar sesión
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function ProtectedRoutes() {
  const location = useLocation()
  const { session, loading } = useAuthSession()
  const [hydroPoints] = useHydroPoints()
  const [exp] = useExp()
  // Mientras la sesión de Supabase carga, no se decide ruta: evita un flash a
  // /inicio-publico que se corrige un instante después una vez resuelta la sesión.
  if (loading) return null
  if (!session) return <Navigate to="/inicio-publico" replace state={{ from: location }} />
  const wasiStage = calcWasiStage(calcPew(exp, mockFamily.streakDays)).stage
  return <Layout><Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/inicio" element={<Inicio />} />
    <Route path="/cursos" element={<Academia hydroPoints={hydroPoints} wasiLevel={wasiStage} />} />
    <Route path="/juegos" element={<Juegos />} />
    <Route path="/misiones" element={<Misiones />} />
    <Route path="/ahorro" element={<Ahorro />} />
    <Route path="/noticias" element={<Noticias />} />
    <Route path="/avatares" element={<Suspense fallback={null}><Avatares wasiStage={wasiStage} /></Suspense>} />
    <Route path="/perfil" element={<Perfil />} />
    <Route path="/album" element={<Album />} />
    <Route path="/familias" element={<Familias />} />
    <Route path="/colegios" element={<Colegios />} />
    <Route path="/ranking" element={<Ranking />} />
    <Route path="/estadisticas" element={<Estadisticas />} />
    <Route path="/config" element={<Config />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Layout>
}
