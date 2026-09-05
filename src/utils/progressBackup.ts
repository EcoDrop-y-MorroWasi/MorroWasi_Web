// Exporta/importa todo el progreso local (sin cuenta, sin email) como un solo
// archivo JSON. Reúne las mismas keys que ya usan hydroStore/expStore/etc, así
// que un store nuevo entra al backup con solo agregar su key a progressKeys.ts.
import { PROGRESS_SCHEMA_VERSION, PROGRESS_STORAGE_KEYS } from "./progressKeys";
import { getLastModified } from "./progressMeta";

const PROFILE_ID_KEY = "morrowasi_profile_id_v1";
const BACKUP_HECHO_KEY = "morrowasi_backup_exportado_v1";

/** true si el usuario alguna vez descargó un backup — usado por el logro "Respaldo Seguro" (Album.tsx). */
export function hizoBackupAlgunaVez(): boolean {
  try {
    return window.localStorage.getItem(BACKUP_HECHO_KEY) === "true";
  } catch {
    return false;
  }
}

interface ProgressBackup {
  schemaVersion: number;
  exportedAt: string;
  lastModified: number;
  profileId: string;
  data: Record<string, string>;
}

/** Id random estable por navegador — no es cuenta, solo sirve para reconocer un mismo perfil entre export/import/sync. */
export function getProfileId(): string {
  try {
    let id = window.localStorage.getItem(PROFILE_ID_KEY);
    if (!id) {
      id = `wasi-${crypto.randomUUID().slice(0, 8)}`;
      window.localStorage.setItem(PROFILE_ID_KEY, id);
    }
    return id;
  } catch {
    return "wasi-local";
  }
}

/** Junta todas las keys de progreso en un objeto exportable (valores tal cual están en localStorage, sin parsear). */
export function readAllProgress(): Record<string, string> {
  const data: Record<string, string> = {};
  for (const key of PROGRESS_STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) data[key] = raw;
  }
  return data;
}

/** Arma el backup y dispara la descarga del .json en el navegador del usuario. */
export function exportProgress(): void {
  const backup: ProgressBackup = {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    lastModified: getLastModified(),
    profileId: getProfileId(),
    data: readAllProgress(),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `morrowasi-progreso-${backup.profileId}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  try {
    window.localStorage.setItem(BACKUP_HECHO_KEY, "true");
  } catch {
    /* localStorage no disponible */
  }
}

export interface ImportPreview {
  profileId: string;
  exportedAt: string;
  entries: { key: string; value: string }[];
  /** true si lo que ya hay guardado en este navegador es más nuevo que el archivo — el usuario podría estar por pisar progreso mejor con uno peor. */
  localIsNewer: boolean;
  localLastModified: number;
  fileLastModified: number;
}

/** Lee y valida el archivo sin escribir nada todavía — para mostrar un preview antes de sobreescribir. */
export async function readProgressFile(file: File): Promise<ImportPreview> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("El archivo no es un JSON válido.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("data" in parsed) ||
    typeof (parsed as ProgressBackup).data !== "object"
  ) {
    throw new Error("El archivo no tiene el formato de un backup de MorroWasi.");
  }

  const backup = parsed as ProgressBackup;
  if (backup.schemaVersion !== PROGRESS_SCHEMA_VERSION) {
    throw new Error(`Backup de una versión no compatible (schemaVersion ${backup.schemaVersion}).`);
  }

  const localLastModified = getLastModified();
  const fileLastModified = backup.lastModified ?? 0;

  return {
    profileId: backup.profileId ?? "desconocido",
    exportedAt: backup.exportedAt ?? "desconocida",
    entries: Object.entries(backup.data)
      .filter(([key]) => (PROGRESS_STORAGE_KEYS as readonly string[]).includes(key))
      .map(([key, value]) => ({ key, value: String(value) })),
    localIsNewer: localLastModified > 0 && localLastModified > fileLastModified,
    localLastModified,
    fileLastModified,
  };
}

/**
 * Escribe el preview ya confirmado por el usuario en localStorage y recarga la
 * página — así Dashboard/Perfil/Academia/etc (algunos reactivos por evento,
 * otros solo leen al montar) quedan consistentes sin cablear un evento por
 * cada store nuevo. initProgressTracking() se encarga de actualizar
 * lastModified con estas mismas escrituras.
 */
export function applyImportedProgress(preview: ImportPreview): void {
  for (const { key, value } of preview.entries) {
    window.localStorage.setItem(key, value);
  }
  window.location.reload();
}
