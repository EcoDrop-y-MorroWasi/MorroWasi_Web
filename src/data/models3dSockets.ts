// Calibración de los modelos 3D — se edita a mano o pegando lo que copia la
// página /dev/calibrar-3d (solo en `pnpm dev`). A diferencia de
// models3d.generated.ts, el pipeline nunca pisa este archivo.
import type { SocketName, Vec3 } from "./models3dSpec";

export interface Socket {
  /** Posición en metros, sobre el avatar ya normalizado a 1.70 m. */
  pos: Vec3;
  /** Multiplica el tamaño de todo lo que cuelga de acá (cabeza más grande → 1.1, etc.). */
  escala?: number;
}

export interface AccessoryFit {
  offset?: Vec3;
  /** Grados, orden XYZ. */
  rot?: Vec3;
  escala?: number;
}

// Medido sobre angie (proporción chibi). Sirve de arranque pa cualquier avatar
// que todavía no pasó por el calibrador.
export const DEFAULT_SOCKETS: Record<SocketName, Socket> = {
  cabeza: { pos: [0, 1.52, 0] },
  cara: { pos: [0, 1.44, 0.21] },
  pecho: { pos: [0, 1.02, 0.13] },
  espalda: { pos: [0, 1.2, -0.13] },
  pierna_d: { pos: [-0.1, 0, 0.02] },
  pierna_i: { pos: [0.1, 0, 0.02] },
  mano_d: { pos: [-0.33, 0.71, 0.02] },
};

/** Sockets por avatar — solo los que difieren de DEFAULT_SOCKETS. */
export const AVATAR_SOCKETS: Record<string, Partial<Record<SocketName, Socket>>> = {};

/** Ajuste fino por accesorio (id del juego, ej. "angie-acc0"). */
export const ACCESSORY_FIT: Record<string, AccessoryFit> = {};
