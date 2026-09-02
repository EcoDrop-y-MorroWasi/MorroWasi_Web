export const Colegios = () => {
  const colegiosOrdenados = [
    { rank: 1, nombre: 'IE San Miguel', estudiantes: 420, hydroPoints: 2850, nivelAhorro: 'Oro' },
    { rank: 2, nombre: 'IE Nuestra Señora', estudiantes: 385, hydroPoints: 2610, nivelAhorro: 'Plata' },
    { rank: 3, nombre: 'IE Santa Rosa', estudiantes: 310, hydroPoints: 2150, nivelAhorro: 'Bronce' },
    { rank: 4, nombre: 'IE Francisco Bolognesi', estudiantes: 298, hydroPoints: 1840, nivelAhorro: 'Madera' },
    { rank: 5, nombre: 'IE César Vallejo', estudiantes: 275, hydroPoints: 1520, nivelAhorro: 'Madera' },
    { rank: 6, nombre: 'IE Jorge Chávez', estudiantes: 243, hydroPoints: 1280, nivelAhorro: 'Madera' },
  ]

  return (
    <div className="keyline-border rounded-2xl bg-bg-light p-6">
      <h2 className="font-display text-lg font-bold mb-6">Colegios Participantes</h2>

      <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
        {colegiosOrdenados.map((colegio) => (
          <div
            key={colegio.nombre}
            className="keyline-border rounded-2xl bg-white p-4 flex items-start gap-4"
            aria-label={`Colegio ${colegio.nombre} - ${colegio.hydroPoints} HydroPuntos`}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl" aria-hidden="true">🏫</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-bold">{colegio.nombre}</p>
              <p className="font-body text-xs text-ink/60">{colegio.estudiantes} estudiantes</p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-bold text-accent">{colegio.hydroPoints}</p>
              <p className="font-body text-xs">HydroPuntos</p>
            </div>
          </div>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="keyline-border rounded-2xl bg-white p-3">
          <p className="font-display text-sm font-bold text-accent">Meta Semanal</p>
          <p className="font-body text-base">Ahorrar 500 L entre todas las instituciones</p>
        </div>
        <div className="keyline-border rounded-2xl bg-white p-3">
          <p className="font-display text-sm font-bold text-accent">Total Ahorrado</p>
          <p className="font-body text-base">15,280 L</p>
        </div>
        <div className="keyline-border rounded-2xl bg-white p-3">
          <p className="font-display text-sm font-bold text-accent">Colectivos</p>
          <p className="font-body text-base">6 colegios participantes</p>
        </div>
      </section>

      <section className="mt-6 grid gap-3">
        <div className="keyline-border rounded-2xl bg-white p-3">
          <p className="font-display text-sm font-bold text-secondary">Liderazgo</p>
          <p className="font-body text-base">IE San Miguel (2,850 HP)</p>
        </div>
        <div className="keyline-border rounded-2xl bg-white p-3">
          <p className="font-display text-sm font-bold text-secondary">Participación</p>
          <p className="font-body text-base">87% de metas cumplidas</p>
        </div>
        <div className="keyline-border rounded-2xl bg-white p-3">
          <p className="font-display text-sm font-bold text-secondary">Distritos</p>
          <p className="font-body text-base">Piura, Morropón, Lima</p>
        </div>
      </section>
    </div>
  )
}