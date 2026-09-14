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

// "¿quién ganó la última vez que este dispositivo sincronizó este código?" —
// server_updated_at es el now() de Postgres al momento de ese push/pull (nunca
// el reloj de un dispositivo), y localAtSync es el getLastModified() local en
// ese mismo instante. Comparar contra este marcador (en vez de comparar el
// reloj de un dispositivo contra el de otro) evita que un reloj mal puesto
// pise progreso ajeno: la autoridad de "qué es más nuevo" pasa a ser siempre
// el servidor.
const SYNC_MARKER_PREFIX = "morrowasi_sync_marker_v1:";

interface SyncMarker {
  serverUpdatedAt: string;
  localAtSync: number;
}

function readMarker(code: string): SyncMarker | null {
  try {
    const raw = window.localStorage.getItem(SYNC_MARKER_PREFIX + code);
    return raw ? (JSON.parse(raw) as SyncMarker) : null;
  } catch {
    return null;
  }
}

function writeMarker(code: string, marker: SyncMarker): void {
  try {
    window.localStorage.setItem(SYNC_MARKER_PREFIX + code, JSON.stringify(marker));
  } catch {
    /* localStorage no disponible */
  }
}

export type SyncResult =
  | { status: "sin-cambios" }
  | { status: "subido" } // local se guardó en el servidor
  | { status: "descargado" } // servidor se aplicó localmente
  | { status: "conflicto"; local: RemoteProgressData; remote: RemoteProgressData; remoteUpdatedAt: string };

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

async function fetchRemote(code: string): Promise<{ data: RemoteProgressData; updatedAt: string } | null> {
  const { data, error } = await supabase.rpc("get_progress_sync", { p_code: code });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return { data: row.data as RemoteProgressData, updatedAt: row.updated_at as string };
}

/** Devuelve el updated_at que puso el propio Postgres al guardar (now() del servidor). */
async function pushRemote(code: string, local: RemoteProgressData): Promise<string> {
  const { data, error } = await supabase.rpc("save_progress_sync", { p_code: code, p_data: local });
  if (error) throw error;
  return data as string;
}

/** Borra el respaldo del servidor de este código — parte de "Eliminar cuenta" en Perfil. */
export async function deleteProgressSync(code: string): Promise<void> {
  const { error } = await supabase.rpc("delete_progress_sync", { p_code: code });
  if (error) throw error;
}

/**
 * Decide "quién gana" comparando contra el marcador del último sync exitoso
 * de este dispositivo con este código (ver SyncMarker), nunca comparando el
 * reloj de un dispositivo contra el de otro. Si algo cambió de ambos lados
 * desde ese marcador (o no hay marcador y el servidor ya tenía datos), no
 * pisa nada solo — devuelve "conflicto" para que la pantalla le pregunte al
 * usuario cuál conservar.
 */
export async function syncProgress(code: string): Promise<SyncResult> {
  const local = readLocal();
  const remote = await fetchRemote(code);

  if (!remote) {
    const updatedAt = await pushRemote(code, local);
    writeMarker(code, { serverUpdatedAt: updatedAt, localAtSync: local.lastModified });
    return { status: "subido" };
  }

  const marker = readMarker(code);
  const localDirty = !marker || marker.localAtSync !== local.lastModified;
  const remoteDirty = !marker || marker.serverUpdatedAt !== remote.updatedAt;

  if (!localDirty && !remoteDirty) {
    return { status: "sin-cambios" };
  }

  if (remoteDirty && !localDirty) {
    applyRemote(remote.data);
    writeMarker(code, { serverUpdatedAt: remote.updatedAt, localAtSync: local.lastModified });
    window.location.reload();
    return { status: "descargado" };
  }

  if (localDirty && !remoteDirty) {
    const updatedAt = await pushRemote(code, local);
    writeMarker(code, { serverUpdatedAt: updatedAt, localAtSync: local.lastModified });
    return { status: "subido" };
  }

  return { status: "conflicto", local, remote: remote.data, remoteUpdatedAt: remote.updatedAt };
}

/** El usuario ya eligió qué lado conservar tras un "conflicto" — aplica esa decisión. */
export async function resolveConflict(code: string, keep: "local" | "remote", result: Extract<SyncResult, { status: "conflicto" }>): Promise<void> {
  if (keep === "local") {
    // Lee el progreso de nuevo en vez de usar result.local: si el usuario tocó
    // algo mientras el modal de conflicto estaba abierto, esa snapshot vieja
    // lo dejaría fuera del push.
    const local = readLocal();
    const updatedAt = await pushRemote(code, local);
    writeMarker(code, { serverUpdatedAt: updatedAt, localAtSync: local.lastModified });
  } else {
    applyRemote(result.remote);
    // applyRemote reescribe las claves de progreso, y eso actualiza el
    // getLastModified() local vía el patch de setItem en progressMeta.ts —
    // por eso se lee de nuevo acá en vez de reusar local.lastModified.
    writeMarker(code, { serverUpdatedAt: result.remoteUpdatedAt, localAtSync: getLastModified() });
    window.location.reload();
  }
}
