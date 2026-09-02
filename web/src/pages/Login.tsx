import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

const AUTH_KEY = 'morrowasi_auth_v1'

export function isAuthenticated() {
  try {
    return window.localStorage.getItem(AUTH_KEY) === 'true'
  } catch {
    return false
  }
}

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated()) return <Navigate to="/" replace />

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (username.trim().toLowerCase() !== 'admin' || password !== '1234') {
      setError('Usuario o contraseña incorrectos.')
      return
    }

    try {
      window.localStorage.setItem(AUTH_KEY, 'true')
    } catch {
      setError('No se pudo guardar el acceso en este dispositivo.')
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-light p-4 text-ink">
      <form onSubmit={submit} className="keyline-border w-full max-w-md rounded-2xl bg-white p-6 shadow-[4px_4px_0_var(--color-ink)] sm:p-8">
        {/* Logo plataforma — SVG inline (currentColor/var(--color-ink)) para seguir siempre
            el tema de la app en vez del prefers-color-scheme del sistema operativo. */}
        <div className="flex flex-col items-center gap-3">
          <Logo className="h-12 w-auto sm:h-14" />
        </div>

        <h1 className="mt-6 text-center font-display text-3xl font-extrabold text-accent">Acceder a MorroWasi</h1>
        <p className="mt-2 text-center font-semibold text-ink/80">Ingresa para ver el progreso de tu familia.</p>
        <p className="mt-1 text-center font-body text-xs text-ink/60">Demo: <strong>admin</strong> / <strong>1234</strong></p>

        <label className="mt-5 block font-bold">
          Usuario
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value)
              setError('')
            }}
            className="mt-1 min-h-12 w-full rounded-xl border-2 border-ink bg-bg-light px-3"
            required
          />
        </label>
        <label className="mt-4 block font-bold">
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError('')
            }}
            className="mt-1 min-h-12 w-full rounded-xl border-2 border-ink bg-bg-light px-3"
            required
          />
        </label>
        {error && (
          <p role="alert" className="mt-3 font-bold text-accent">
            {error}
          </p>
        )}
        <button className="mt-5 min-h-12 w-full rounded-xl border-2 border-ink bg-accent px-5 font-display font-bold text-white shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
          Entrar
        </button>
        <Link to="/inicio-publico" className="mt-3 flex min-h-12 items-center justify-center rounded-xl border-2 border-ink bg-bg-light px-4 text-sm font-bold shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
          ← Volver al inicio público
        </Link>
      </form>
    </main>
  )
}
