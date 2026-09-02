import { rankingMock } from '../data/ranking.mock'
import {
  litrosPorFamilia,
  participacionPorDistrito,
  progresoCursos,
} from '../data/stats.mock'

export default function Familias() {
  const familiasOrdenadas = [...rankingMock].sort(
    (a, b) => b.family.hydroPoints - a.family.hydroPoints,
  )
  const ahorroPromedio = Math.round(
    rankingMock.reduce((sum, e) => sum + e.totalLitersSaved, 0) / rankingMock.length,
  )

  return (
    <div className="keyline-border rounded-2xl bg-bg-light p-6">
      <h2 className="font-display text-lg font-bold mb-6">Familias Registradas</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {familiasOrdenadas.slice(0, 6).map((entry) => (
          <div
            key={entry.family.name}
            className="keyline-border rounded-2xl bg-white p-4"
            aria-label={`Familia ${entry.family.name} - ${entry.family.hydroPoints} HydroPuntos`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{entry.family.avatar}</span>
                <span className="font-body text-sm">{entry.family.name}</span>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-accent">{entry.family.hydroPoints}</p>
                <p className="font-body text-xs">HydroPuntos</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="font-body text-sm">Racha: {entry.streakDays} días</p>
              <p className="font-body text-xs">PEW: {entry.pew}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {litrosPorFamilia.map((item) => (
          <div key={item.label} className="keyline-border rounded-2xl bg-white p-4">
            <p className="font-display text-xl font-bold text-accent">{item.value}</p>
            <p className="font-body text-sm">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {participacionPorDistrito.map((item) => (
          <div key={item.label} className="keyline-border rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between">
              <span>{item.label}</span>
              <p className="font-display text-xl font-bold text-accent">{item.value}%</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {progresoCursos.map((item) => (
          <div key={item.course} className="keyline-border rounded-2xl bg-white p-4">
            <p className="font-display text-sm font-medium">{item.completed} de {item.total}</p>
            <p className="font-body text-xs text-ink/60">{item.course}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl bg-primary/10 p-4">
        <h3 className="font-display text-sm font-bold text-primary mb-2">Ahorro Promedio</h3>
        <p className="font-body text-base">
          Las familias del ranking han ahorrado un promedio de{' '}
          <span className="font-display text-accent">{ahorroPromedio} litros</span>
        </p>
      </section>
    </div>
  )
}