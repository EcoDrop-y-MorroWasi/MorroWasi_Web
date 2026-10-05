import { useEffect, useState } from "react";
import { RIVER_SPECIES, type RiverSpecies, SPECIES_BY_ID } from "../data/guardianRio";

// Colección de especies vistas en "Guardián del Río". Vive en localStorage
// igual que streakStore y completionStore: el álbum es un extra del juego, no
// vale la pena una migración de Supabase hasta que se vea que se usa.
const STORAGE_KEY = "morrowasi_album_rio_v1";
const EVENT_NAME = "morrowasi-album-rio-actualizado";

export type AlbumRecord = Record<string, number>; // speciesId -> veces descubierta

function readAlbum(): AlbumRecord {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    // Sólo se aceptan ids que existen en el catálogo: si mañana se renombra una
    // especie, el registro viejo no debe romper el render del álbum.
    const out: AlbumRecord = {};
    for (const [id, count] of Object.entries(parsed as Record<string, unknown>)) {
      if (SPECIES_BY_ID[id] && typeof count === "number" && Number.isFinite(count) && count > 0) {
        out[id] = Math.floor(count);
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function getAlbum(): AlbumRecord {
  return readAlbum();
}

export function discoveredCount(album: AlbumRecord = readAlbum()): number {
  return RIVER_SPECIES.filter((s) => (album[s.id] ?? 0) > 0).length;
}

/** Suma un descubrimiento. Idempotente en la escritura, no en el conteo. */
export function recordDiscovery(speciesId: string): void {
  if (!SPECIES_BY_ID[speciesId] || typeof window === "undefined") return;
  const album = readAlbum();
  album[speciesId] = (album[speciesId] ?? 0) + 1;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(album));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* localStorage no disponible */
  }
}

/** Hook reactivo: se actualiza en vivo cuando se descubre algo en otra partida. */
export function useAlbum(): AlbumRecord {
  const [album, setAlbum] = useState<AlbumRecord>(readAlbum);

  useEffect(() => {
    const refresh = () => setAlbum(readAlbum());
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return album;
}

/** Especies en el orden del catálogo, marcando cuáles ya se descubrieron. */
export function albumEntries(album: AlbumRecord): { species: RiverSpecies; count: number; found: boolean }[] {
  return RIVER_SPECIES.map((species) => {
    const count = album[species.id] ?? 0;
    return { species, count, found: count > 0 };
  });
}