import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { QUICK_SAVE, TARIFA_SOLES_POR_LITRO, calcCostoSoles } from "../utils/gamification";
import { fetchNoticiasAgua, type NoticiaAgua } from "../utils/noticiasFeed";
import { useReservoir } from "../utils/litersStore";
import { markActivityToday } from "../utils/streakStore";

// Noticias — fusiona Ahorro (hero + registro rápido + calculadora) con el boletín de agua
// Piura/Morropón (4 noticias reales verificadas: Correo, Infobae, La República, El Peruano).
// Paleta AGENTS.md:145, 48dp, mock local, español — pulido con motion + confeti en meta.

interface NewsItem {
  date: string;
  title: string;
  snippet: string;
  tag: string;
  source: string;
  url: string;
}

// Boletín de respaldo con noticias REALES verificadas (título/fecha/fuente confirmados
// contra el artículo original) — se muestra si /api/noticias-agua todavía no está
// desplegado o falla. Se actualiza a mano cada tanto; no reemplaza el feed en vivo.
const NEWS: NewsItem[] = [
  {
    date: "10 jun. 2026",
    title: "Río destruyó puente y dejó incomunicados a pobladores de Morropón",
    snippet:
      "El desborde del río Bigote por lluvias intensas en la sierra de Piura destruyó por completo un puente en el caserío Tórtola (San Juan de Bigote, Morropón), dejando a los pobladores sin acceso directo.",
    tag: "🌧️ Emergencia",
    source: "Diario Correo",
    url: "https://diariocorreo.pe/edicion/piura/piura-rio-destruyo-puente-y-dejo-incomunicados-a-pobladores-de-morropon-noticia/",
  },
  {
    date: "19 feb. 2026",
    title: "Lluvias desatan angustia en Piura: familias enfrentan inundaciones",
    snippet:
      "Vecinos de Piura enfrentaron el ingreso de agua a sus viviendas durante las lluvias de febrero; niños debieron cruzar zonas inundadas en balsas improvisadas.",
    tag: "🌧️ Emergencia",
    source: "Infobae",
    url: "https://www.infobae.com/peru/2026/02/19/lluvias-desatan-angustia-en-piura-padre-usa-su-cuerpo-para-impedir-que-el-agua-inunde-su-casa-y-ninos-cruzan-en-balsas-improvisadas/",
  },
  {
    date: "02 feb. 2026",
    title: "Lluvias dejan caseríos incomunicados en Morropón y Huancabamba",
    snippet:
      "La crecida del río Corral del Medio dejó intransitables las vías de acceso a los caseríos El Ingenio, La Maravilla, La Herrada y Pampa Flores, en la provincia de Morropón.",
    tag: "🌧️ Emergencia",
    source: "La República",
    url: "https://larepublica.pe/sociedad/2026/02/02/piura-lluvias-dejan-caserios-incomunicados-en-morropon-y-huancabamba-70826",
  },
  {
    date: "31 oct. 2024",
    title: "Declaran en emergencia Piura por déficit hídrico",
    snippet:
      "El Consejo de Ministros aprobó un decreto de emergencia por 60 días en 34 distritos de 7 provincias piuranas —incluida Morropón— ante el peligro inminente por escasez de agua.",
    tag: "💧 Déficit hídrico",
    source: "El Peruano",
    url: "https://www.elperuano.pe/noticia/256667-declaran-en-emergencia-piura-por-deficit-hidrico",
  },
];

type FeedStatus = "cargando" | "ok" | "error";

export default function Noticias() {
  // Meta fija de morrowasi-preview.html: goalLiters=5000. El total ahorrado ya no es un
  // mock local — viene del mismo reservorio real que Misiones/Dashboard/Perfil (litersStore.ts),
  // así que una cuenta nueva arranca en 0 y las misiones completadas también suman acá.
  const META = 5000;
  const reservoir = useReservoir();
  const total = reservoir.totalLitersSaved;
  const [wasteLiters, setWasteLiters] = useState(100);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const nextToastId = useRef(0);

  const [feedStatus, setFeedStatus] = useState<FeedStatus>("cargando");
  const [noticiasFeed, setNoticiasFeed] = useState<NoticiaAgua[]>([]);

  useEffect(() => {
    let cancelado = false;
    fetchNoticiasAgua()
      .then((items) => {
        if (cancelado) return;
        if (items.length === 0) throw new Error("feed real sin resultados");
        setNoticiasFeed(items);
        setFeedStatus("ok");
      })
      .catch(() => {
        if (!cancelado) setFeedStatus("error");
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const pct = useMemo(() => Math.min(100, Math.round((total / META) * 100)), [total]);
  const costo = useMemo(() => calcCostoSoles(wasteLiters), [wasteLiters]); // 0.67/L intacto
  const ahorroSolesMensual = useMemo(() => calcCostoSoles(total), [total]);

  const fireConfetti = () => {
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.72 }, colors: ["#99B4D8", "#FFB793", "#E26D5C"] });
  };

  const showToast = (text: string) => {
    const id = ++nextToastId.current;
    setToast({ id, text });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 1700);
  };

  const add = (l: number) => {
    const next = total + l;
    // confeti al alcanzar meta 5000L por primera vez en esta sesión
    if (total < META && next >= META) fireConfetti();
    reservoir.addLiters(l);
    markActivityToday();
    showToast(`+${l} L ahorrados 💧`);
  };
  const reset = () => {
    // No es demo: resetReservoir() borra litros/total reales, compartidos con
    // Dashboard/Perfil/Album (logros por totalLitersSaved) y Misiones. Confirmar
    // antes de un click accidental que no tiene deshacer.
    if (!window.confirm("Esto borra tu ahorro total acumulado (litros y logros relacionados). ¿Reiniciar igual?")) return;
    reservoir.resetReservoir();
    showToast("Total reiniciado");
  };

  return (
    <div className="relative mx-auto max-w-[800px] p-4 pb-24 space-y-4">
      {/* Toast flotante */}
      <div className="pointer-events-none fixed top-4 left-1/2 z-50 -translate-x-1/2">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: -6, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.32 }}
              className="rounded-xl bg-[#1c1c11] text-white border-2 border-white shadow-[4px_4px_0_#1c1c11] px-4 py-2 text-sm font-black"
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <h2 className="text-xl font-extrabold text-ink">📰 Noticias y Ahorro</h2>

      {/* Hero total + meta 5000L — progressbar accesible */}
      <section
        className="rounded-xl bg-gradient-to-br from-[#99B4D8] to-[#b8d4f0] keyline shadow-[4px_4px_0_#1c1c11] p-6 text-center"
        aria-label="Total ahorrado"
      >
        <div className="text-4xl" aria-hidden>
          💧
        </div>
        <motion.div key={total} initial={{ scale: 0.97 }} animate={{ scale: 1 }} className="text-4xl font-black text-[#1c1c11]">
          {total.toLocaleString("es-PE")} L
        </motion.div>
        <div className="text-sm font-semibold text-[#1c1c11]/70">Total ahorrado</div>
        <div
          className="mt-4 h-5 rounded-full bg-surface/60 border-2 border-[#1c1c11] overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso meta 5000L ${pct}%`}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-[#E26D5C]"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-bold text-[#1c1c11]">
          <span>{pct}% de la meta</span>
          <span>Meta: {META.toLocaleString("es-PE")} L</span>
        </div>
        <div className="mt-2 text-xs font-semibold text-[#1c1c11]/70">
          Equivale a S/ {ahorroSolesMensual.toFixed(2)} ahorrados este mes (tarifa S/ {TARIFA_SOLES_POR_LITRO.toFixed(2)}/L)
        </div>
        <motion.button
          whileTap={{ scale: 0.97, x: 2, y: 2 }}
          onClick={reset}
          className="mt-3 min-h-[48px] rounded-lg bg-surface border-2 border-ink px-4 font-bold text-xs shadow-[2px_2px_0_#1c1c11] active:shadow-none"
        >
          Reiniciar ahorro total
        </motion.button>
      </section>

      {/* Botones rápidos AGENTS.md:224 — 48dp, Tailwind, español — QUICK_SAVE exacto */}
      <section className="rounded-xl bg-surface keyline shadow-[4px_4px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-ink mb-3">⚡ Registro rápido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_SAVE.map((q) => (
            <motion.button
              key={q.label}
              whileTap={{ scale: 0.96, x: 2, y: 2 }}
              onClick={() => add(q.liters)}
              className="flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl bg-surface keyline shadow-[2px_2px_0_#1c1c11] hover:bg-[#FFB793] active:shadow-none transition-colors"
              aria-label={`Agregar ${q.liters} litros por ${q.label}`}
            >
              <span className="text-2xl" aria-hidden>
                {q.emoji}
              </span>
              <span className="text-sm font-extrabold text-ink">{q.label}</span>
              <span className="text-xs font-bold text-[#E26D5C]">+{q.liters} L</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Calculadora soles pulida 0.67/L */}
      <section className="rounded-xl bg-surface keyline shadow-[4px_4px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-ink mb-2">🧮 Calculadora de costo por desperdicio (S/)</h3>
        <label className="text-sm font-bold text-ink" htmlFor="wasteRange">
          ¿Cuántos litros desperdicias al mes?
        </label>
        <input
          id="wasteRange"
          type="range"
          min={10}
          max={500}
          step={10}
          value={wasteLiters}
          onChange={(e) => setWasteLiters(Number(e.target.value))}
          className="mt-2 w-full accent-[#E26D5C] min-h-[48px]"
          aria-label="Litros desperdiciados al mes"
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-lg font-black text-ink">{wasteLiters} L</span>
          <span className="text-sm font-extrabold text-[#E26D5C]">S/ {costo.toFixed(2)} al mes</span>
        </div>
        <p className="text-xs text-ink/60">Tarifa referencial EPS Grau (operador de agua en Piura): S/ {TARIFA_SOLES_POR_LITRO.toFixed(2)} por litro.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-bg-light border-2 border-ink p-2">
            <div className="text-xs font-bold">Al año</div>
            <div className="text-sm font-black text-[#E26D5C]">S/ {(costo * 12).toFixed(2)}</div>
          </div>
          <div className="rounded-lg bg-[#99B4D8] border-2 border-ink p-2 text-[#1c1c11]">
            <div className="text-xs font-bold">Si ahorras {total} L</div>
            <div className="text-sm font-black">S/ {ahorroSolesMensual.toFixed(2)}</div>
          </div>
          <div className="rounded-lg bg-[#FFB793] border-2 border-ink p-2 text-[#1c1c11]">
            <div className="text-xs font-bold">Meta {META.toLocaleString("es-PE")} L</div>
            <div className="text-sm font-black">S/ {calcCostoSoles(META).toFixed(2)}</div>
          </div>
        </div>
      </section>

      {/* Boletín de agua Piura/Morropón — feed real vía /api/noticias-agua (Google News RSS,
          función serverless en Vercel), con fallback al boletín estático si la fuente falla. */}
      <section className="rounded-xl bg-surface keyline shadow-[4px_4px_0_#1c1c11] p-4" aria-label="Boletín de noticias sobre el agua en Piura y Morropón">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-extrabold text-ink">📰 Agua en Piura y Morropón</h3>
          {feedStatus === "ok" && (
            <span className="rounded-full border-2 border-ink bg-[#99B4D8]/40 px-2 py-0.5 text-[10px] font-black">
              🔴 En vivo
            </span>
          )}
        </div>

        {feedStatus === "cargando" && (
          <ul className="space-y-3" aria-label="Cargando noticias">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-20 animate-pulse rounded-xl border-2 border-ink/20 bg-bg-light" />
            ))}
          </ul>
        )}

        {feedStatus === "ok" && (
          <>
            <ul className="space-y-3" role="list">
              {noticiasFeed.map((item) => (
                <li key={item.id} className="rounded-xl border-2 border-ink bg-bg-light p-3 shadow-[2px_2px_0_#1c1c11]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink/60">{item.date} · {item.source}</span>
                    <span className="rounded-full border-2 border-ink bg-[#FFB793] px-2 py-0.5 text-[10px] font-black">{item.tag}</span>
                  </div>
                  <a href={item.url} target="_blank" rel="noreferrer" className="mt-1 block font-display text-base font-bold text-ink hover:underline">
                    {item.title}
                  </a>
                  <p className="mt-1 text-sm text-ink/80 leading-snug">{item.snippet}</p>
                </li>
              ))}
            </ul>
          </>
        )}

        {feedStatus === "error" && (
          <>
            <ul className="space-y-3" role="list">
              {NEWS.map((item) => (
                <li key={item.title} className="rounded-xl border-2 border-ink bg-bg-light p-3 shadow-[2px_2px_0_#1c1c11]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink/60">{item.date} · {item.source}</span>
                    <span className="rounded-full border-2 border-ink bg-[#FFB793] px-2 py-0.5 text-[10px] font-black">{item.tag}</span>
                  </div>
                  <a href={item.url} target="_blank" rel="noreferrer" className="mt-1 block font-display text-base font-bold text-ink hover:underline">
                    {item.title}
                  </a>
                  <p className="mt-1 text-sm text-ink/80 leading-snug">{item.snippet}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-ink/50">Sin conexión al feed en vivo — mostrando boletín verificado de MorroWasi.</p>
          </>
        )}
      </section>
    </div>
  );
}
