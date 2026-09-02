import {
  statsChartData,
  litrosPorFamilia,
  participacionPorDistrito,
  progresoCursos,
  rachaSemanal,
} from '../data/stats.mock'

export default function Estadisticas() {
  return (
    <div className="keyline-border rounded-2xl bg-bg-light p-6">
      <h2 className="font-display text-lg font-bold mb-6">Estadísticas</h2>

      <section className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
        {statsChartData.map((item) => (
          <div key={item.label} className="keyline-border rounded-2xl bg-white p-4">
            <p className="font-display text-xl font-bold text-accent">{item.value}</p>
            <p className="font-body text-sm">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
        {litrosPorFamilia.map((item) => (
          <div key={item.label} className="keyline-border rounded-2xl bg-white p-4">
            <p className="font-display text-sm font-medium">{item.value}</p>
            <p className="font-body text-xs text-ink/60">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
        {participacionPorDistrito.map((item) => (
          <div key={item.label} className="keyline-border rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm">{item.label}</span>
              <p className="font-display text-xl font-bold text-accent">{item.value}%</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
        {progresoCursos.map((item) => (
          <div key={item.course} className="keyline-border rounded-2xl bg-white p-4">
            <div className="keyline-border rounded-t-2xl bg-primary/10 p-3 mb-2">
              <p className="font-body text-xs text-primary">{item.completed} completados</p>
            </div>
            <div className="keyline-border rounded-b-2xl bg-accent/10">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${item.completed / item.total * 100}%` }}
              />
            </div>
            <p className="font-body text-xs text-ink/60">{item.course}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
        {rachaSemanal.map((item) => (
          <div key={item.label} className="keyline-border rounded-2xl bg-white p-4">
            <p className="font-body text-sm">{item.label}: {item.value} familias</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl bg-primary/10 p-4">
        <h3 className="font-display text-sm font-bold text-primary mb-2">Información</h3>
        <p className="font-body text-base text-ink/60">
          Versión 2.0.0 · MorroWasi · Datos locales sin conexión ·
          <a
            href="#"
            className="underline text-primary hover:text-accent transition-colors"
          >
            Políticas de privacidad
          </a>
        </p>
      </section>
    </div>
  )
}