import { Link } from "react-router-dom";
import ProtectedVideo from "../components/ProtectedVideo";

// Nota de prensa fija — MiniFeria "Cada Gota Cuenta.." (Club de Ciencias "Código
// Científico TPC - Todo Por Cristo", Desafío Amauta 2026). Pinneada desde Noticias.tsx,
// NO borrar esta página ni su entrada en App.tsx. Videos servidos vía Vercel Blob
// privado + URL firmada de corta duración (ver api/video-url.ts) — no son archivos
// estáticos en public/.
const VIDEO_IDS = ["video-1", "video-2", "video-3"];

export default function NoticiaMiniferiaCadaGota() {
  return (
    <div className="mx-auto max-w-[800px] p-4 space-y-4">
      <Link to="/noticias" className="text-sm font-extrabold text-[#E26D5C] hover:underline">
        ← Volver a Noticias
      </Link>

      <article className="rounded-xl bg-surface keyline shadow-[4px_4px_0_#1c1c11] p-4 sm:p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border-2 border-ink bg-[#99B4D8] px-2 py-0.5 text-[10px] font-black">
            📌 Fijada
          </span>
          <span className="text-xs font-bold text-ink/60">02 set. 2026 · Código Científico TPC - Todo Por Cristo</span>
        </div>

        <h1 className="font-display text-2xl font-extrabold text-ink leading-snug">
          MiniFeria "Cada Gota Cuenta..": el Club de Ciencias Código Científico TPC - Todo Por Cristo lleva el cuidado del
          agua al pabellón de 5to A
        </h1>

        <img
          src="/media/news/miniferia-cada-gota-cuenta/flyer.jpg"
          alt='Flyer de la MiniFeria "Cada Gota Cuenta.." — 02 de setiembre, 11:30 a.m., I.E. "Almirante Miguel Grau", pabellón de 5to A'
          className="mt-4 mx-auto w-full max-w-xs rounded-xl border-2 border-ink object-cover"
        />

        <div className="mt-4 space-y-3 text-sm sm:text-base text-ink/80 leading-relaxed">
          <p>
            El 02 de setiembre, a las 11:30 a.m., el pabellón de 5to grado sección A de la I.E. "Almirante Miguel Grau" se
            convirtió en punto de encuentro para la MiniFeria <strong>"Cada Gota Cuenta.."</strong>, actividad organizada en
            el marco del proyecto <strong>"EcoDrop y MorroWasi: Protegiendo el agua para Ti"</strong> y presentada por el
            Club de Ciencias <strong>"Código Científico TPC - Todo Por Cristo"</strong> como parte de su participación en
            el Desafío Amauta 2026.
          </p>
          <p>
            La feria reunió a estudiantes, docentes y familias alrededor de estands, demostraciones y dinámicas pensadas
            para sensibilizar sobre el uso responsable del agua potable en la región Piura, donde las lluvias intensas y
            las sequías prolongadas ponen a prueba constantemente el acceso al recurso. Con paneles informativos, juegos y
            materiales elaborados por los propios integrantes del club, los estudiantes explicaron a sus compañeros cómo
            pequeños cambios en el consumo diario —cerrar bien un caño, reutilizar el agua de lavado, detectar fugas a
            tiempo— pueden traducirse en un ahorro real para sus hogares y su comunidad.
          </p>
          <p>
            "Cada Gota Cuenta.." se suma a una serie de actividades que el Club de Ciencias Código Científico TPC viene
            desarrollando bajo las etiquetas #DesafioAmauta26 y #ClubesQueInspiran, reforzando su compromiso con la
            educación ambiental desde las aulas.
          </p>
        </div>

        <h2 className="mt-6 font-display text-lg font-extrabold text-ink">Videos de la actividad</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VIDEO_IDS.map((id) => (
            <div key={id} className="aspect-video overflow-hidden rounded-xl border-2 border-ink bg-black">
              <ProtectedVideo id={id} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>

        <a
          href="https://www.instagram.com/p/DcxS6-bO0-t/?stkn=dGR1d3k1Nm9mM2h3"
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block text-sm font-extrabold text-[#E26D5C] hover:underline"
        >
          📸 Ver publicación original en Instagram ↗
        </a>
      </article>
    </div>
  );
}
