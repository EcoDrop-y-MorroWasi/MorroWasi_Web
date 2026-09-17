import { motion } from 'framer-motion'
import ProfileAvatarGlyph from './ProfileAvatarGlyph'
import { WASI_STAGES } from '../data/mock'
import type { LeaderboardRow } from '../utils/leaderboardSync'

const MEDALLAS = ['🥇', '🥈', '🥉'] as const

function nombreEtapa(etapa: number) {
  return WASI_STAGES.find((w) => w.number === etapa)?.name ?? 'Pequeño Brote'
}

/**
 * Top del ranking. En mobile cada puesto es una tarjeta apilada (una tabla de 5
 * columnas obliga a scroll horizontal en 360 px); a partir de sm pasa a tabla.
 */
export function RankingTable({
  entries,
  miProfileId,
  periodoLabel,
}: {
  entries: LeaderboardRow[]
  miProfileId: string
  periodoLabel: string
}) {
  if (entries.length === 0) {
    return (
      <div className="keyline-border rounded-2xl bg-bg-light p-8 text-center">
        <p className="text-4xl" aria-hidden="true">🏜️</p>
        <p className="mt-2 font-display text-base font-extrabold">Todavía no hay nadie en {periodoLabel.toLowerCase()}</p>
        <p className="mt-1 font-body text-sm text-ink/70">
          Sé la primera persona en compartir su puntaje y encabeza la tabla.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile: tarjetas apiladas */}
      <ol className="flex flex-col gap-2 sm:hidden">
        {entries.map((row, i) => (
          <motion.li
            key={row.profile_id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
            className={`keyline-border flex items-center gap-3 rounded-2xl p-3 shadow-[3px_3px_0_var(--color-ink)] ${
              row.profile_id === miProfileId ? 'bg-accent/20' : 'bg-bg-light'
            }`}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-surface font-display text-base font-extrabold">
              {MEDALLAS[i] ?? i + 1}
            </span>
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink bg-primary text-2xl">
              <ProfileAvatarGlyph value={row.avatar} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-extrabold">
                {row.nombre}
                {row.profile_id === miProfileId && <span className="ml-1 text-xs font-bold text-accent">(tú)</span>}
              </p>
              <p className="truncate font-body text-xs font-semibold text-ink/60">{nombreEtapa(row.etapa)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-base font-extrabold text-accent">{row.hydro_points.toLocaleString('es-PE')}</p>
              <p className="font-body text-[10px] font-bold text-ink/60">{row.exp.toLocaleString('es-PE')} EXP</p>
            </div>
          </motion.li>
        ))}
      </ol>

      {/* Desktop/tablet: tabla */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-ink text-left font-body text-xs font-bold text-ink/60">
              <th scope="col" className="p-3">#</th>
              <th scope="col" className="p-3">Persona</th>
              <th scope="col" className="p-3">HydroPuntos</th>
              <th scope="col" className="p-3">EXP</th>
              <th scope="col" className="p-3">Etapa Wasi</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((row, i) => (
              <tr
                key={row.profile_id}
                className={`border-b-2 border-ink/20 ${row.profile_id === miProfileId ? 'bg-accent/15' : ''}`}
              >
                <td className="p-3 font-display font-extrabold">{MEDALLAS[i] ?? `${i + 1}.`}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink bg-primary text-xl">
                      <ProfileAvatarGlyph value={row.avatar} />
                    </span>
                    <span className="font-semibold">{row.nombre}</span>
                    {row.profile_id === miProfileId && (
                      <span className="rounded-full border-2 border-ink bg-accent px-2 text-[10px] font-bold text-white">tú</span>
                    )}
                  </div>
                </td>
                <td className="p-3 font-display font-extrabold text-accent">{row.hydro_points.toLocaleString('es-PE')}</td>
                <td className="p-3 font-body text-sm">{row.exp.toLocaleString('es-PE')}</td>
                <td className="p-3 font-body text-sm">{nombreEtapa(row.etapa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
