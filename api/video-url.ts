/// <reference types="node" />
// Genera una URL firmada de corta duración (Vercel Blob privado) para uno de los
// videos protegidos. Los 3 de la noticia MiniFeria exigen sesión de Supabase válida
// (la noticia ya está detrás de login); el cortometraje de InicioPublico es público
// (esa página no requiere cuenta), pero igual pasa por Blob privado + URL rotativa
// para que no quede un link permanente indexable/compartible.
//
// Corre en runtime Node.js (NO edge, a propósito): @vercel/blob usa `undici` real
// para hablar con la API de Blob, que depende de módulos nativos de Node
// (node:net, node:tls, etc.) no disponibles en el runtime edge — con `runtime:
// "edge"` esta función fallaba en el build. El handler igual usa Request/Response
// estándar: Vercel Functions en Node.js también soporta esa firma.
//
// La validación de sesión pega directo al endpoint REST de Supabase Auth (fetch)
// en vez de importar @supabase/supabase-js, para no arrastrar esa dependencia acá.
import { issueSignedToken, presignUrl } from "@vercel/blob";

const VIDEOS: Record<string, { pathname: string; requiresAuth: boolean }> = {
  "video-1": { pathname: "news/miniferia-cada-gota-cuenta/video-1.mp4", requiresAuth: true },
  "video-2": { pathname: "news/miniferia-cada-gota-cuenta/video-2.mp4", requiresAuth: true },
  "video-3": { pathname: "news/miniferia-cada-gota-cuenta/video-3.mp4", requiresAuth: true },
  cortometraje: { pathname: "club/cortometraje-cada-gota-cuenta.mp4", requiresAuth: false },
};

const URL_TTL_MS = 10 * 60 * 1000; // 10 min: suficiente para cargar el video en conexión lenta

async function tieneSesionValida(req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return false;

  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
  });
  return res.ok;
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? "";
  const video = VIDEOS[id];

  if (!video) {
    return new Response(JSON.stringify({ error: "id de video desconocido" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (video.requiresAuth && !(await tieneSesionValida(req))) {
    return new Response(JSON.stringify({ error: "no autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const validUntil = Date.now() + URL_TTL_MS;
    const signed = await issueSignedToken({
      pathname: video.pathname,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(signed, {
      operation: "get",
      pathname: video.pathname,
      access: "private",
    });

    return new Response(JSON.stringify({ url: presignedUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "no se pudo generar la URL", detail: String(error) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
