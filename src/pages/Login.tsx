import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Footer from '../components/Footer'
import Logo from '../components/Logo'
import { signInAnonymously, useAuthSession } from '../utils/authStore'
import { claimNewCode, restoreFromCode } from '../utils/progressSync'

type Modo = 'elegir' | 'nuevo' | 'existente'

export default function Login() {
  const { session, loading } = useAuthSession()
  const [modo, setModo] = useState<Modo>('elegir')
  const [codigoGenerado, setCodigoGenerado] = useState('')
  const [codigoInput, setCodigoInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState(false)
  // Evita que el auto-redirect de abajo dispare a mitad de "soy nuevo"/"ya
  // tengo cuenta": signInAnonymously() actualiza `session` antes de que
  // claimNewCode()/restoreFromCode() terminen, y sin esta bandera ese cambio
  // de sesión mandaría a /inicio sin código generado ni progreso restaurado.
  const [enFlujo, setEnFlujo] = useState(false)

  if (loading) return null
  // Alguien que ya tenía sesión de una visita anterior y entra directo a /login: pasa de largo.
  if (session && !enFlujo && !codigoGenerado) return <Navigate to="/inicio" replace />

  const soyNuevo = async () => {
    setEnFlujo(true)
    setError('')
    setCargando(true)
    try {
      if (!session) await signInAnonymously()
      const code = await claimNewCode()
      setCodigoGenerado(code)
    } catch {
      setError('No se pudo crear tu código. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const yaTengoCuenta = async () => {
    const code = codigoInput.trim()
    if (code.length !== 10) {
      setError('El código tiene 10 caracteres.')
      return
    }
    setEnFlujo(true)
    setError('')
    setCargando(true)
    try {
      if (!session) await signInAnonymously()
      await restoreFromCode(code)
      // Recarga completa: todos los stores (exp, hydro, litros, racha, etc.) leen
      // de localStorage al montar — un simple navigate() los dejaría con los
      // valores viejos ya en memoria.
      window.location.href = '/inicio'
    } catch (e) {
      // El cooldown escalonado vive en el servidor (intentar_codigo_login) — el
      // mensaje ya viene listo para mostrar, con la hora exacta si está bloqueado.
      setError(e instanceof Error ? e.message : 'Código no encontrado. Revisa que esté bien escrito.')
      setCargando(false)
    }
  }

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(codigoGenerado)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      /* clipboard no disponible */
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-light p-4 text-ink">
      <div className="keyline-border w-full max-w-md rounded-2xl bg-surface p-6 shadow-[4px_4px_0_var(--color-ink)] sm:p-8">
        <div className="flex flex-col items-center gap-3">
          <Logo className="h-12 w-auto sm:h-14" />
        </div>

        <h1 className="mt-6 text-center font-display text-3xl font-extrabold text-accent">Acceder a MorroWasi</h1>
        <p className="mt-2 text-center font-semibold text-ink/80">
          Sin correo, sin contraseña: tu progreso vive detrás de un código de acceso.
        </p>

        {codigoGenerado ? (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <p className="font-bold text-ink/80">Este es tu código — guárdalo, es la única forma de recuperar tu progreso en otro dispositivo:</p>
            <p className="rounded-xl border-2 border-ink bg-bg-light px-4 py-3 text-2xl font-black tracking-[0.15em]">{codigoGenerado}</p>
            <button
              type="button"
              onClick={copiarCodigo}
              className="min-h-12 w-full rounded-xl border-2 border-ink bg-bg-light px-5 font-display font-bold shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {copiado ? '✓ Copiado' : '📋 Copiar código'}
            </button>
            <a
              href="/inicio"
              className="mt-1 min-h-12 flex w-full items-center justify-center rounded-xl border-2 border-ink bg-accent px-5 font-display font-bold text-white shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Ya lo guardé, continuar →
            </a>
          </div>
        ) : modo === 'elegir' ? (
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={soyNuevo}
              disabled={cargando}
              className="min-h-12 w-full rounded-xl border-2 border-ink bg-accent px-5 font-display font-bold text-white shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
            >
              {cargando ? 'Creando…' : 'Soy nuevo — crear mi código'}
            </button>
            <button
              type="button"
              onClick={() => setModo('existente')}
              className="min-h-12 w-full rounded-xl border-2 border-ink bg-bg-light px-5 font-display font-bold shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Ya tengo un código
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <label className="text-sm font-bold text-ink/70">
              Tu código de 10 caracteres
              <input
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.trim())}
                placeholder="Ej: aB3dEfG7hJ"
                maxLength={10}
                className="mt-1 min-h-12 w-full rounded-lg border-2 border-ink px-3 text-center text-lg font-black tracking-widest"
              />
            </label>
            <button
              type="button"
              onClick={yaTengoCuenta}
              disabled={codigoInput.length !== 10 || cargando}
              className="min-h-12 w-full rounded-xl border-2 border-ink bg-accent px-5 font-display font-bold text-white shadow-[2px_2px_0_var(--color-ink)] disabled:opacity-40"
            >
              {cargando ? 'Restaurando…' : 'Recuperar mi progreso'}
            </button>
            <button
              type="button"
              onClick={() => { setModo('elegir'); setError('') }}
              className="min-h-12 w-full rounded-xl border-2 border-ink bg-bg-light px-5 font-display font-bold shadow-[2px_2px_0_var(--color-ink)]"
            >
              ← Volver
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-center font-bold text-accent">
            {error}
          </p>
        )}

        {!codigoGenerado && (
          <Link to="/inicio-publico" className="mt-3 flex min-h-12 items-center justify-center rounded-xl border-2 border-ink bg-bg-light px-4 text-sm font-bold shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            ← Volver al inicio público
          </Link>
        )}
      </div>
      <div className="w-full max-w-md">
        <Footer />
      </div>
    </main>
  )
}
