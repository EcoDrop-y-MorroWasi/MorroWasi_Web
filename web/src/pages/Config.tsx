export const Config = () => {
  return (
    <div className="keyline-border rounded-2xl bg-bg-light p-6">
      <h2 className="font-display text-lg font-bold mb-6">Configuración</h2>

      <section className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
        <div className="keyline-border rounded-2xl bg-white p-4">
          <p className="font-display text-sm font-bold text-secondary">Tema</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl bg-primary/20 border-2 border-primary text-primary py-2 text-sm font-body"
            >
              Claro
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl bg-secondary/20 border-2 border-secondary text-secondary py-2 text-sm font-body"
            >
              Oscuro
            </button>
          </div>
        </div>

        <div className="keyline-border rounded-2xl bg-white p-4">
          <p className="font-display text-sm font-bold text-secondary">Sincronización</p>
          <div className="mt-2">
            <p className="font-body text-xs text-ink/60">Ultima sincronización: hace 2 horas</p>
            <button
              type="button"
              className="mt-2 w-full rounded-xl bg-primary text-white py-2 text-sm font-body"
            >
              Sincronizar ahora
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
        <div className="keyline-border rounded-2xl bg-white p-4">
          <p className="font-display text-sm font-bold text-secondary">Notificaciones</p>
          <div className="mt-2 space-y-2">
            <label className="font-body cursor-pointer">
              <input type="checkbox" className="rounded border-2" />
              <span>Recordatorios de misiones diarias</span>
            </label>
            <label className="font-body cursor-pointer">
              <input type="checkbox" className="rounded border-2" checked />
              <span>Alertas de goteo (Eco-Drop)</span>
            </label>
            <label className="font-body cursor-pointer">
              <input type="checkbox" className="rounded border-2" />
              <span>Semana de logros</span>
            </label>
          </div>
        </div>

        <div className="keyline-border rounded-2xl bg-white p-4">
          <p className="font-display text-sm font-bold text-secondary">Cuenta</p>
          <div className="mt-2 space-y-2">
            <button type="button" className="w-full rounded-xl bg-primary text-white py-2 text-sm font-body">
              Cerrar sesión
            </button>
            <button type="button" className="w-full rounded-xl bg-bg-light border-2 border-[#1c1c11] py-2 text-sm font-body">
              Cambiar contraseña
            </button>
          </div>
        </div>
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