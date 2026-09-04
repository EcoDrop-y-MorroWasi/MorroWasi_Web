import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { signInWithEmail, signInWithGoogle, useAuthSession } from '../utils/authStore'

export default function Login() {
  const { session, loading } = useAuthSession()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [cargandoGoogle, setCargandoGoogle] = useState(false)

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  const entrarConGoogle = async () => {
    setError('')
    setCargandoGoogle(true)
    try {
      await signInWithGoogle()
    } catch {
      setError('No se pudo iniciar sesión con Google. Intenta de nuevo.')
      setCargandoGoogle(false)
    }
  }

  const enviarEnlace = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      await signInWithEmail(email.trim())
      setEnviado(true)
    } catch {
      setError('No se pudo enviar el enlace de acceso. Verifica el correo.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-light p-4 text-ink">
      <div className="keyline-border w-full max-w-md rounded-2xl bg-surface p-6 shadow-[4px_4px_0_var(--color-ink)] sm:p-8">
        <div className="flex flex-col items-center gap-3">
          <Logo className="h-12 w-auto sm:h-14" />
        </div>

        <h1 className="mt-6 text-center font-display text-3xl font-extrabold text-accent">Acceder a MorroWasi</h1>
        <p className="mt-2 text-center font-semibold text-ink/80">Ingresa para ver el progreso de tu familia.</p>

        <button
          type="button"
          onClick={entrarConGoogle}
          disabled={cargandoGoogle}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-bg-light px-5 font-display font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
        >
          <span aria-hidden>🔐</span> Continuar con Google
        </button>

        <div className="my-5 flex items-center gap-2 text-xs font-bold text-ink/50">
          <span className="h-px flex-1 bg-ink/20" /> o <span className="h-px flex-1 bg-ink/20" />
        </div>

        {enviado ? (
          <p className="rounded-xl border-2 border-ink bg-bg-light px-4 py-3 text-center font-semibold text-ink/80">
            Revisa tu correo: te mandamos un enlace para entrar sin contraseña.
          </p>
        ) : (
          <form onSubmit={enviarEnlace}>
            <label className="block font-bold">
              Correo
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
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
            <button className="mt-4 min-h-12 w-full rounded-xl border-2 border-ink bg-accent px-5 font-display font-bold text-white shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              Enviar enlace de acceso
            </button>
          </form>
        )}

        <Link to="/inicio-publico" className="mt-3 flex min-h-12 items-center justify-center rounded-xl border-2 border-ink bg-bg-light px-4 text-sm font-bold shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
          ← Volver al inicio público
        </Link>
      </div>
    </main>
  )
}
