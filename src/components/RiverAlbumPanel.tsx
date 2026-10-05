import { albumEntries, useAlbum } from "../utils/riverAlbumStore";

// Colección de especies del río Piura y sus manglares, descubierta jugando
// "Guardián del Río". Vive en la sección de Álbum de la plataforma; el juego
// sólo enseña el contador (n/22) y remite acá.
export default function RiverAlbumPanel() {
  const album = useAlbum();
  const entries = albumEntries(album);
  const found = entries.filter((e) => e.found).length;
  const fauna = entries.filter((e) => e.species.kind === "fauna");
  const trash = entries.filter((e) => e.species.kind === "trash");

  return (
    <section aria-labelledby="album-rio-titulo">
      <header className="mb-3 rounded-2xl border-2 border-ink bg-[#99B4D8] p-5 shadow-[4px_4px_0_#1c1c11]">
        <p className="text-sm font-bold text-ink/70">Colección del río</p>
        <h2 id="album-rio-titulo" className="font-display text-2xl font-extrabold text-ink">
          🐟 Fauna y manglares
        </h2>
        <p className="mt-1 text-sm font-bold text-ink">
          {found}/{entries.length} especies descubiertas
        </p>
      </header>

      <div className="mb-6 space-y-6">
        <Group title="Fauna y manglar · déjalas pasar" items={fauna} />
        <Group title="Basura · recíclala" items={trash} />
      </div>

      <p className="mb-6 text-center text-[11px] text-ink/50">
        Las especies se descubren clasificando bien en Guardián del Río Piura y Manglares. Se guardan en este
        dispositivo.
      </p>
    </section>
  );
}

function Group({
  title,
  items,
}: {
  title: string;
  items: ReturnType<typeof albumEntries>;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-ink/60">{title}</h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map(({ species, count, found: isFound }) => (
          <li
            key={species.id}
            className={`flex gap-3 rounded-2xl border-4 border-white p-3 ${
              isFound ? "bg-surface" : "bg-surface/60 opacity-70 grayscale"
            }`}
            style={{ boxShadow: "0 0 0 2px #1c1c11, 4px 4px 0 #1c1c11" }}
          >
            <span className="text-4xl" aria-hidden>
              {isFound ? species.emoji : "🔒"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black leading-tight text-ink">
                {isFound ? species.nombre : "Sin descubrir"}
              </p>
              {isFound ? (
                <>
                  <p className="mt-0.5 text-xs leading-snug text-ink/70">{species.dato}</p>
                  {count > 1 && (
                    <span className="mt-1 inline-block rounded-full border-2 border-ink bg-[#99B4D8]/30 px-2 py-0.5 text-[10px] font-bold text-ink">
                      la viste {count} veces
                    </span>
                  )}
                </>
              ) : (
                <p className="mt-0.5 text-xs leading-snug text-ink/60">
                  Clasifícala bien en el juego para desbloquear su ficha.
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}