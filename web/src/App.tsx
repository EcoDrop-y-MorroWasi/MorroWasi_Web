import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import Login, { isAuthenticated } from './pages/Login'
import { useHydroPoints } from './utils/hydroStore'
import { useExp } from './utils/expStore'

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
    <Routes>
      <Route path="/inicio-publico" element={<InicioPublico />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<ProtectedRoutes />} />
    </Routes>
  )
}

function ProtectedRoutes() {
  const location = useLocation()
  const [hydroPoints] = useHydroPoints()
  const [exp] = useExp()
  if (!isAuthenticated()) return <Navigate to="/inicio-publico" replace state={{ from: location }} />
  return <Layout><Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/inicio" element={<Inicio />} />
    <Route path="/cursos" element={<Academia hydroPoints={hydroPoints} wasiLevel={calcWasiStage(calcPew(exp, mockFamily.streakDays)).stage} />} />
    <Route path="/juegos" element={<Juegos />} />
    <Route path="/misiones" element={<Misiones />} />
    <Route path="/ahorro" element={<Ahorro />} />
    <Route path="/noticias" element={<Noticias />} />
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
