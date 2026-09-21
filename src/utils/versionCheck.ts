import { useEffect, useState } from "react";

// Detecta cuándo Vercel ya publicó un deploy nuevo, para forzar un reload
// (UpdateGate.tsx) — nunca a mitad de un deploy: Vercel solo cambia el
// tráfico a la versión nueva de forma atómica cuando el build terminó y está
// sano, así que en cuanto el HTML que devuelve el servidor trae una huella
// distinta a la de este bundle, es porque el deploy ya quedó "OK" del todo.
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION ?? "dev";
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // cada 5 min alcanza — no es urgente enterarse al segundo

async function hayVersionNueva(): Promise<boolean> {
  try {
    const res = await fetch("/", { cache: "no-store" });
    if (!res.ok) return false;
    const html = await res.text();
    const match = html.match(/<meta name="app-version" content="([^"]*)"/);
    const remota = match?.[1];
    return Boolean(remota) && remota !== CURRENT_VERSION;
  } catch {
    // Red caída o algo raro de CORS — no interrumpe nada, se reintenta en el próximo ciclo.
    return false;
  }
}

/** true en cuanto detecta que Vercel publicó un deploy distinto al que está corriendo. */
export function useUpdateAvailable(): boolean {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // "dev" = local (npm run dev/build sin pasar por Vercel) — nunca comprobar acá,
    // compararía contra sí mismo o dispararía falsos positivos sin sentido.
    if (CURRENT_VERSION === "dev") return;

    let cancelado = false;
    const chequear = async () => {
      const hay = await hayVersionNueva();
      if (hay && !cancelado) setUpdateAvailable(true);
    };

    void chequear();
    const id = window.setInterval(() => void chequear(), CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void chequear();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelado = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return updateAvailable;
}
