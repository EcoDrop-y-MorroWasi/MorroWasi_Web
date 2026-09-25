import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Video servido vía Vercel Blob privado: pide una URL firmada de corta duración a
// /api/video-url en vez de tener un src estático público. Ver api/video-url.ts.
interface ProtectedVideoProps {
  id: string;
  className?: string;
  poster?: string;
}

export default function ProtectedVideo({ id, className, poster }: ProtectedVideoProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<"cargando" | "ok" | "error">("cargando");

  useEffect(() => {
    let cancelado = false;
    setStatus("cargando");
    setSrc(null);

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/video-url?id=${encodeURIComponent(id)}`, { headers });
        if (!res.ok) throw new Error(`video-url respondió ${res.status}`);
        const body = (await res.json()) as { url?: string };
        if (!body.url) throw new Error("respuesta sin url");
        if (!cancelado) {
          setSrc(body.url);
          setStatus("ok");
        }
      } catch {
        if (!cancelado) setStatus("error");
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [id]);

  if (status === "cargando") {
    return <div className={`${className ?? ""} animate-pulse bg-black/20`} aria-label="Cargando video" />;
  }

  if (status === "error" || !src) {
    return (
      <div className={`${className ?? ""} flex items-center justify-center bg-black/80 text-center text-xs font-bold text-white p-2`}>
        No se pudo cargar el video. Reintenta recargando la página.
      </div>
    );
  }

  return (
    <video
      src={src}
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      disableRemotePlayback
      onContextMenu={(e) => e.preventDefault()}
      playsInline
      preload="metadata"
      poster={poster}
      className={className}
    >
      Tu navegador no soporta la reproducción de este video.
    </video>
  );
}
