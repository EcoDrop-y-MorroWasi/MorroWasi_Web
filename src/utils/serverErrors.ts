import { supabase } from "../lib/supabaseClient";

// Reporte de fallas del servidor (migración 0027). La tabla la revisa cada hora
// .github/workflows/avisar-errores.yml y abre un issue en GitHub si hay algo
// nuevo, así una RPC rota se detecta sin esperar la captura de un usuario.

interface ErrorRpc {
  message: string;
  code?: string;
}

/**
 * true si el error es culpa del servidor y no del usuario ni de su conexión:
 * deja fuera los `raise exception` propios (P0001, mensajes pensados para el
 * usuario), los cortes de red y el reloj desfasado del dispositivo.
 */
export function esErrorTecnico(error: ErrorRpc): boolean {
  if (error.code === "P0001") return false;
  if (/fetch|network|failed to|load failed/i.test(error.message)) return false;
  if (/jwt|issued at|clock/i.test(error.message)) return false;
  return true;
}

/** Fire-and-forget: si el reporte también falla no hay nada más que hacer. */
export function reportarErrorServidor(origen: string, error: ErrorRpc): void {
  void supabase
    .rpc("reportar_error", { p_origen: origen, p_codigo: error.code ?? null, p_mensaje: error.message })
    .then(
      () => undefined,
      () => undefined,
    );
}

/** Atajo para los sitios que solo propagan el error: reporta si corresponde. */
export function reportarSiEsTecnico(origen: string, error: ErrorRpc): void {
  if (esErrorTecnico(error)) reportarErrorServidor(origen, error);
}
