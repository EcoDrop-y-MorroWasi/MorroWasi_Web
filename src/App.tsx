import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
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
import { useAuthSession } from './utils/authStore'
import { useHydroPoints } from './utils/hydroStore'
import { useExp } from './utils/expStore'

// Lazy: arrastra skinview3d + three.js (motor 3D de los avatares) fuera del bundle
// principal, igual que WasiViewer3D — no todos los usuarios abren esta pestaña.
const Avatares = lazy(() => import('./pages/Avatares'))

const THEME_STORAGE_KEY = 'morrowasi_theme_v1'

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

  return (
    <>
      <Routes>
        <Route path="/inicio-publico" element={<InicioPublico />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<ProtectedRoutes />} />
      </Routes>
      <Analytics />
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
