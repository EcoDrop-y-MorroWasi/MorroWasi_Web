// Vercel Edge Function — trae noticias reales sobre agua en Piura/Morropón desde
// Google News RSS (público, sin API key) y las cachea 1h en el edge de Vercel.
// El navegador nunca llama a Google News directo: RSS no manda header CORS, así
// que un fetch desde el cliente sería bloqueado. Esta función corre en el servidor
// y le entrega al frontend JSON ya listo, del mismo origen.
export const config = { runtime: "edge" };

interface NoticiaAgua {
  id: string;
  date: string;
  title: string;
  snippet: string;
  tag: string;
  source: string;
  url: string;
}

const RSS_URL =
  "https://news.google.com/rss/search?q=agua+Piura+Morrop%C3%B3n&hl=es-419&gl=PE&ceid=PE:es-419";

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function stripCdata(value: string): string {
  const match = value.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return match ? match[1] : value;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function formatearFecha(pubDate: string): string {
  const parsed = new Date(pubDate);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Lima" });
}

function parseRssItems(xml: string): NoticiaAgua[] {
  const bloques = xml.split("<item>").slice(1);
  const items: NoticiaAgua[] = [];

  for (const bloqueCrudo of bloques) {
    const bloque = bloqueCrudo.split("</item>")[0] ?? bloqueCrudo;

    const tituloCrudo = decodeEntities(stripCdata(extractTag(bloque, "title")));
    const link = decodeEntities(stripCdata(extractTag(bloque, "link"))).trim();
    const pubDate = extractTag(bloque, "pubDate");
    const fuenteCruda = decodeEntities(stripCdata(extractTag(bloque, "source")));
    // Google devuelve description con las etiquetas HTML como entidades
    // (&lt;a href=...&gt;), no como CDATA — hay que decodificar ANTES de
    // stripHtml, si no stripHtml no encuentra ningún "<" real que limpiar.
    const descripcionCruda = stripHtml(decodeEntities(stripCdata(extractTag(bloque, "description"))));

    if (!tituloCrudo || !link) continue;

    items.push({
      id: link,
      date: formatearFecha(pubDate),
      title: tituloCrudo,
      snippet: descripcionCruda.slice(0, 220),
      tag: "💧 Agua",
      source: fuenteCruda || "Google News",
      url: link,
    });
  }

  return items.slice(0, 8);
}

export default async function handler() {
  try {
    const respuestaRss = await fetch(RSS_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MorroWasiBot/1.0)" },
    });
    if (!respuestaRss.ok) throw new Error(`RSS respondió ${respuestaRss.status}`);

    const xml = await respuestaRss.text();
    const noticias = parseRssItems(xml);

    return new Response(JSON.stringify(noticias), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "No se pudo obtener el feed", detail: String(error) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
