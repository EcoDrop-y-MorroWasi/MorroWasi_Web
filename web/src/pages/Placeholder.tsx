// Stub para tabs fuera de alcance de este MVP visual (Cursos/Juegos/Misiones/Ahorro)

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 py-12 text-center">
      <span aria-hidden="true" className="text-4xl">
        🚧
      </span>
      <h1 className="font-display text-xl font-bold">{title}</h1>
      <p className="font-body text-sm">Sección en construcción — próximo sprint.</p>
    </div>
  )
}
