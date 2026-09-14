import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RankingTable } from '../components/RankingTable'
import { mockFamily } from '../data/mock'
import { getProfileId } from '../utils/progressBackup'
import { totalsToday, totalsFromLedger } from '../utils/leaderboardLedger'
import {
  PERIODOS,
  darConsentimiento,
  fetchLeaderboard,
  subscribeLeaderboard,
  submitScore,
  tieneConsentimiento,
  type LeaderboardPeriodo,
  type LeaderboardRow,
} from '../utils/leaderboardSync'

const TOP = 10

function leerPerfil() {
  try {
    const saved = window.localStorage.getItem('morrowasi_perfil_v1')
    const parsed = saved ? (JSON.parse(saved) as Partial<{ name: string; avatar: string }>) : {}
    return { name: parsed.name || mockFamily.name, avatar: parsed.avatar || mockFamily.avatar }
  } catch {
    return { name: mockFamily.name, avatar: mockFamily.avatar }
  }
}

export const Ranking = () => {
  const [periodo, setPeriodo] = useState<LeaderboardPeriodo>('dia')
  // Se guarda junto al periodo que devolvió los datos, así "cargando" se deriva
  // durante el render (¿lo que tengo es de otro periodo?) en vez de necesitar un
  // estado aparte que haya que encender y apagar a mano en cada camino.
  const [resultado, setResultado] = useState<{
    periodo: LeaderboardPeriodo
    rows: LeaderboardRow[]
    error: string | null
  } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [pidiendoConsentimiento, setPidiendoConsentimiento] = useState(false)

  const miProfileId = getProfileId()
  const hoy = totalsToday()
  const historico = totalsFromLedger()
  const periodoActual = PERIODOS.find((p) => p.id === periodo) ?? PERIODOS[0]
  const cargando = resultado?.periodo !== periodo
  const error = resultado?.periodo === periodo ? resultado.error : null
  const entries = resultado?.periodo === periodo ? resultado.rows : []

  // El periodo vive en un ref además del estado porque la suscripción realtime se
  // monta una sola vez: sin esto el callback recargaría siempre el periodo que
  // estaba activo cuando se suscribió.
  const periodoRef = useRef(periodo)

  const cargar = useCallback(async (p: LeaderboardPeriodo) => {
    try {
      setResultado({ periodo: p, rows: await fetchLeaderboard(p, TOP), error: null })
    } catch (e) {
      setResultado({
        periodo: p,
        rows: [],
        error: e instanceof Error ? e.message : 'No se pudo cargar la tabla.',
      })
    }
  }, [])

  useEffect(() => {
    periodoRef.current = periodo
    // set-state-in-effect: falso positivo. cargar() solo escribe estado cuando la
    // respuesta del servidor llegó — el estado no es derivable del render porque
    // depende de una petición de red.
    // eslint-disable-next-line react/set-state-in-effect
    void cargar(periodo)
  }, [periodo, cargar])

  // Tiempo real: cada puntaje que comparte cualquier familia inserta eventos, y
  // eso vuelve a pedir el ranking del periodo que el usuario está mirando. La
  // tabla se reemplaza debajo sin volver al esqueleto, porque el periodo no cambió.
  useEffect(() => subscribeLeaderboard(() => void cargar(periodoRef.current)), [cargar])

  const compartir = async () => {
    if (!tieneConsentimiento()) {
      setPidiendoConsentimiento(true)
      return
    }
    setEnviando(true)
    setAviso(null)
    try {
      const perfil = leerPerfil()
      const res = await submitScore(perfil.name, perfil.avatar)
      setAviso(
        res.eventosNuevos > 0
          ? `¡Listo! Se registraron ${res.eventosNuevos} logro${res.eventosNuevos === 1 ? '' : 's'} nuevo${res.eventosNuevos === 1 ? '' : 's'}.`
          : 'Tu puntaje ya estaba al día.',
      )
      if (res.nombreAplicado !== perfil.name) {
        setAviso(`Tu puntaje se compartió como "${res.nombreAplicado}".`)
      }
      await cargar(periodo)
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'No se pudo compartir tu puntaje.')
    } finally {
      setEnviando(false)
    }
  }

  const aceptarConsentimiento = () => {
    darConsentimiento()
    setPidiendoConsentimiento(false)
    void compartir()
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <section className="keyline-border rounded-2xl bg-primary/25 p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <h1 className="font-display text-xl font-extrabold">🏆 Tabla de clasificación</h1>
        <p className="mt-1 font-body text-sm font-semibold text-ink/75">
          Top {TOP} de familias que más HydroPuntos acumulan. El conteo del día arranca a las
          00:00 y cierra a las 23:59, hora de Perú.
        </p>

        {/* Tu resumen local — lo que llevas ganado según tu propio dispositivo */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="keyline-border rounded-xl bg-bg-light p-3">
            <p className="font-body text-[11px] font-bold text-ink/60">Ganado hoy</p>
            <p className="font-display text-lg font-extrabold text-accent">
              {hoy.hydro.toLocaleString('es-PE')} <span className="text-xs">HP</span>
            </p>
            <p className="font-body text-[11px] font-semibold text-ink/60">{hoy.exp.toLocaleString('es-PE')} EXP</p>
          </div>
          <div className="keyline-border rounded-xl bg-bg-light p-3">
            <p className="font-body text-[11px] font-bold text-ink/60">Histórico registrado</p>
            <p className="font-display text-lg font-extrabold text-accent">
              {historico.hydro.toLocaleString('es-PE')} <span className="text-xs">HP</span>
            </p>
            <p className="font-body text-[11px] font-semibold text-ink/60">{historico.exp.toLocaleString('es-PE')} EXP</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void compartir()}
          disabled={enviando}
          data-tour="compartir-puntaje"
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-ink bg-accent px-5 font-display text-sm font-bold text-white shadow-[2px_2px_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
        >
          {enviando ? 'Compartiendo…' : '📤 Compartir mi puntaje'}
        </button>
        <p className="mt-2 font-body text-[11px] font-semibold text-ink/60">
          Nada se sube solo: tu progreso viaja únicamente cuando tocas este botón.
        </p>

        <AnimatePresence>
          {aviso && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="status"
              className="keyline-border mt-3 rounded-xl bg-bg-light p-3 font-body text-sm font-semibold"
            >
              {aviso}
            </motion.p>
          )}
        </AnimatePresence>
      </section>

      {/* Tabs de periodo — scroll horizontal en pantallas angostas */}
      <div role="tablist" aria-label="Periodo del ranking" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={periodo === p.id}
            onClick={() => setPeriodo(p.id)}
            className={`min-h-12 shrink-0 rounded-xl border-2 border-ink px-4 font-display text-sm font-bold shadow-[2px_2px_0_var(--color-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
              periodo === p.id ? 'bg-accent text-white' : 'bg-bg-light text-ink/80'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <section className="keyline-border rounded-2xl bg-bg-light p-4 shadow-[4px_4px_0_var(--color-ink)] sm:p-6">
        <h2 className="mb-4 font-display text-lg font-extrabold">{periodoActual.label}</h2>

        {cargando ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border-2 border-ink/20 bg-surface/60" />
            ))}
          </div>
        ) : error ? (
          <div className="keyline-border rounded-2xl bg-secondary/30 p-5 text-center">
            <p className="text-3xl" aria-hidden="true">📡</p>
            <p className="mt-2 font-body text-sm font-semibold">{error}</p>
          </div>
        ) : (
          <RankingTable entries={entries} miProfileId={miProfileId} periodoLabel={periodoActual.label} />
        )}
      </section>

      <AnimatePresence>
        {pidiendoConsentimiento && (
          <motion.div
            role="presentation"
            onClick={() => setPidiendoConsentimiento(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c11]/60 p-4"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="consent-title"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              className="keyline-border w-full max-w-md rounded-3xl bg-bg-light p-6 shadow-[4px_4px_0_var(--color-ink)]"
            >
              <h2 id="consent-title" className="font-display text-lg font-extrabold">
                ¿Publicamos tu puntaje?
              </h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 font-body text-sm">
                <li>Se verán tu <strong>nombre de perfil</strong>, tu avatar y tus puntos.</li>
                <li>No se comparte tu correo, ni tu ubicación, ni nada más.</li>
                <li>Puedes dejar de compartir cuando quieras: basta con no tocar el botón.</li>
              </ul>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={aceptarConsentimiento}
                  className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-accent font-display text-sm font-bold text-white shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Sí, publicar
                </button>
                <button
                  type="button"
                  onClick={() => setPidiendoConsentimiento(false)}
                  className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-bg-light font-display text-sm font-bold shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Ahora no
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
