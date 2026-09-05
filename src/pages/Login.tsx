import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { signInAnonymously, useAuthSession } from '../utils/authStore'

export default function Login() {
  const { session, loading } = useAuthSession()
  const [entrando, setEntrando] = useState(false)
  const [error, setError] = useState('')

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  const entrar = async () => {
    setError('')
    setEntrando(true)
    try {
      await signInAnonymously()
    } catch {
      setError('No se pudo entrar. Intenta de nuevo.')
      setEntrando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-light p-4 text-ink">
      <div className="keyline-border w-full max-w-md rounded-2xl bg-surface p-6 shadow-[4px_4px_0_var(--color-ink)] sm:p-8">
        <div className="flex flex-col items-center gap-3">
          <Logo className="h-12 w-auto sm:h-14" />
        </div>

        <h1 className="mt-6 text-center font-display text-3xl font-extrabold text-accent">Acceder a MorroWasi</h1>
        <p className="mt-2 text-center font-semibold text-ink/80">
          Sin correo, sin cuenta: tu progreso queda en este dispositivo.
        </p>

        <button
          type="button"
          onClick={entrar}
          disabled={entrando}
          className="mt-6 min-h-12 w-full rounded-xl border-2 border-ink bg-accent px-5 font-display font-bold text-white shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
        >
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>

        {error && (
          <p role="alert" className="mt-3 text-center font-bold text-accent">
            {error}
          </p>
        )}

        <p className="mt-3 text-center text-xs font-semibold text-ink/60">
          Podés guardar o mover tu progreso más tarde desde tu Perfil (exportar/importar o código de acceso).
        </p>

        <Link to="/inicio-publico" className="mt-3 flex min-h-12 items-center justify-center rounded-xl border-2 border-ink bg-bg-light px-4 text-sm font-bold shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
          ← Volver al inicio público
        </Link>
      </div>
    </main>
  )
}
