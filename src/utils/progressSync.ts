// Sync de progreso entre dispositivos con un código corto — sin email, sin
// Google. El código es el único "secreto": quien lo tiene puede leer/escribir
// ese progreso, mismo modelo que un código de sala de chat compartido.
import { supabase } from "../lib/supabaseClient";
import { PROGRESS_STORAGE_KEYS } from "./progressKeys";
import { getLastModified } from "./progressMeta";
import { readAllProgress } from "./progressBackup";

const LINKED_CODE_KEY = "morrowasi_sync_code_v1";
const CODE_LENGTH = 10;
// Mayúsculas + minúsculas + dígitos para más variedad, sin los que se confunden
// a simple vista al copiar a mano: 0/O, 1/I/l. Es sensible a mayúsculas/minúsculas.
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

interface RemoteProgressData {
  lastModified: number;
  values: Record<string, string>;
}

export type SyncResult =
  | { status: "sin-cambios" }
  | { status: "subido" } // local se guardó en el servidor
  | { status: "descargado" } // servidor se aplicó localmente
  | { status: "conflicto"; local: RemoteProgressData; remote: RemoteProgressData };

export function generateSyncCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function getLinkedCode(): string | null {
  try {
    return window.localStorage.getItem(LINKED_CODE_KEY);
  } catch {
    return null;
  }
}

export function setLinkedCode(code: string | null): void {
  try {
    if (code) window.localStorage.setItem(LINKED_CODE_KEY, code);
    else window.localStorage.removeItem(LINKED_CODE_KEY);
  } catch {
    /* localStorage no disponible */
  }
}

function readLocal(): RemoteProgressData {
  return { lastModified: getLastModified(), values: readAllProgress() };
}

function applyRemote(remote: RemoteProgressData): void {
  for (const [key, value] of Object.entries(remote.values ?? {})) {
    if ((PROGRESS_STORAGE_KEYS as readonly string[]).includes(key)) {
      // El servidor no valida la forma de p_data — un código de sync compartido
      // podría recibir basura (objeto, número). Forzar string, igual que hace
      // el import de JSON, para no reventar un JSON.parse aguas abajo.
      window.localStorage.setItem(key, String(value));
    }
  }
}

async function fetchRemote(code: string): Promise<RemoteProgressData | null> {
  const { data, error } = await supabase.rpc("get_progress_sync", { p_code: code });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return row.data as RemoteProgressData;
}

async function pushRemote(code: string, local: RemoteProgressData): Promise<void> {
  const { error } = await supabase.rpc("save_progress_sync", { p_code: code, p_data: local });
  if (error) throw error;
}

/**
 * Compara local vs servidor y aplica "el más reciente gana" cuando la
 * decisión es obvia (uno de los dos nunca cambió, o son iguales). Si los dos
 * lados tienen cambios reales y no coinciden, no pisa nada solo — devuelve
 * "conflicto" para que la pantalla le pregunte al usuario cuál conservar.
 */
export async function syncProgress(code: string): Promise<SyncResult> {
  const local = readLocal();
  const remote = await fetchRemote(code);

  if (!remote) {
    await pushRemote(code, local);
    return { status: "subido" };
  }

  if (remote.lastModified === local.lastModified) {
    return { status: "sin-cambios" };
  }

  if (local.lastModified === 0 || remote.lastModified > local.lastModified) {
    applyRemote(remote);
    window.location.reload();
    return { status: "descargado" };
  }

  if (remote.lastModified === 0 || local.lastModified > remote.lastModified) {
    await pushRemote(code, local);
    return { status: "subido" };
  }

  return { status: "conflicto", local, remote };
}

/** El usuario ya eligió qué lado conservar tras un "conflicto" — aplica esa decisión. */
export async function resolveConflict(code: string, keep: "local" | "remote", result: Extract<SyncResult, { status: "conflicto" }>): Promise<void> {
  if (keep === "local") {
    // Lee el progreso de nuevo en vez de usar result.local: si el usuario tocó
    // algo mientras el modal de conflicto estaba abierto, esa snapshot vieja
    // lo dejaría fuera del push.
    await pushRemote(code, readLocal());
  } else {
    applyRemote(result.remote);
    window.location.reload();
  }
}
