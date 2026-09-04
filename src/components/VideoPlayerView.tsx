import { useEffect, useRef, useState } from "react";

interface VideoPlayerViewProps {
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  onEnded?: () => void;
}

function fallbackThumbnail(title: string) {
  return `https://placehold.co/960x540/1c1c11/fdfae7?text=${encodeURIComponent(title)}`;
}

function isYouTubeEmbed(url: string) {
  return url.includes("youtube.com/embed");
}

function withYouTubeParams(url: string) {
  const params = "enablejsapi=1&rel=0&modestbranding=1&cc_load_policy=1&cc_lang_pref=es&hl=es&playsinline=1&autoplay=1";
  return `${url}${url.includes("?") ? "&" : "?"}${params}`;
}

/**
 * Player MVP: cursos usan YouTube embebido con videos reales y temáticos (uno por curso, verificado
 * por tema — SODIS, aguas grises, filtros, riego, cosecha de lluvia, humedales) mientras se graban
 * videos propios. Contrato futuro: mismo `videoUrl`/`thumbnailUrl` podrá apuntar a Firebase Storage +
 * Media3 (Android) sin tocar este componente — solo cambia si `isYouTubeEmbed(videoUrl)` es true o false.
 */
export default function VideoPlayerView({ title, videoUrl, thumbnailUrl, onEnded }: VideoPlayerViewProps) {
  const [playing, setPlaying] = useState(false);
  const [poster, setPoster] = useState(thumbnailUrl);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const youtube = isYouTubeEmbed(videoUrl);

  // Protocolo postMessage de YouTube: con enablejsapi=1 basta escuchar "infoDelivery"
  // tras registrar el listener "listening" — no requiere cargar iframe_api.js completo.
  useEffect(() => {
    if (!youtube || !playing || !onEnded) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info?.playerState === 0) {
          onEnded();
        }
      } catch {
        /* mensajes no-JSON del embed, ignorar */
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [youtube, playing, onEnded]);

  const handleIframeLoad = () => {
    iframeRef.current?.contentWindow?.postMessage('{"event":"listening","id":1}', "*");
  };

  return (
    <section
      className="overflow-hidden rounded-2xl border-2 border-ink bg-[#1c1c11] shadow-[4px_4px_0_0_#1c1c11]"
      aria-label={`Video: ${title}`}
    >
      {playing ? (
        youtube ? (
          <iframe
            ref={iframeRef}
            className="aspect-video w-full"
            src={withYouTubeParams(videoUrl)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleIframeLoad}
          />
        ) : (
          <video className="aspect-video w-full" controls autoPlay poster={poster} onEnded={onEnded}>
            <source src={videoUrl} type="video/mp4" />
            Tu navegador no puede reproducir este video.
          </video>
        )
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="relative block min-h-12 w-full"
          aria-label={`Reproducir ${title}`}
        >
          <img
            src={poster}
            alt=""
            className="aspect-video w-full object-cover opacity-80"
            onError={() => setPoster(fallbackThumbnail(title))}
          />
          <span className="absolute inset-0 grid place-items-center">
            <span
              className="grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-[#FFB793] text-2xl shadow-[4px_4px_0_0_#1c1c11]"
              aria-hidden="true"
            >
              ▶
            </span>
          </span>
        </button>
      )}

      <div className="flex items-center justify-between gap-2 border-t-2 border-ink bg-bg-light px-3 py-2">
        <p className="truncate font-body text-xs font-bold text-ink">{title}</p>
        {youtube && (
          <span className="shrink-0 rounded-full border-2 border-ink bg-[#FFB793] px-2 py-0.5 text-[10px] font-bold text-ink">
            CC ES disponible
          </span>
        )}
      </div>
    </section>
  );
}
