export interface NoticiaAgua {
  id: string;
  date: string;
  title: string;
  snippet: string;
  tag: string;
  source: string;
  url: string;
}

/**
 * Llama a la función serverless /api/noticias-agua (Vercel Edge Function que trae
 * Google News RSS filtrado por "agua Piura Morropón", cacheado 1h). Si la función
 * no existe todavía en el entorno actual (por ejemplo `vite dev` sin `vercel dev`)
 * o el feed falla, el caller (Noticias.tsx) cae al boletín estático local.
 */
export async function fetchNoticiasAgua(): Promise<NoticiaAgua[]> {
  const res = await fetch("/api/noticias-agua");
  if (!res.ok) throw new Error(`feed no disponible (${res.status})`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("respuesta inválida del feed de noticias");
  return data as NoticiaAgua[];
}
