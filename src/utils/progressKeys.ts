// Lista única de keys de localStorage que cuentan como "progreso del usuario".
// La comparten progressBackup (export/import), progressMeta (marca de tiempo) y
// progressSync (código de acceso) — un store nuevo entra a los tres con solo
// agregar su key acá.
export const PROGRESS_STORAGE_KEYS = [
  "morrowasi_hydropuntos_v1",
  "morrowasi_exp_v1",
  "morrowasi_reservorio_v1",
  "morrowasi_avatares_v1",
  "morrowasi_games_v1",
  "morrowasi_academia_progress_v1",
  "morrowasi_stats_v1",
  "morrowasi_streak_v1",
] as const;

export const PROGRESS_SCHEMA_VERSION = 1;
