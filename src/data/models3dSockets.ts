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
  /** Multiplicador extra por eje (x, y, z), para angostar/alargar sin deformar lo demás. */
  escalaEje?: Vec3;
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
export const AVATAR_SOCKETS: Record<string, Partial<Record<SocketName, Socket>>> = {
  // Angie y Britney traen mochila: su espalda se engancha al centro de ESA
  // mochila (medido en el .glb), porque sus piezas de espalda son agregados
  // para ella (models3dSpec SHAPE_BY_ID).
  angie: { espalda: { pos: [0, 1.05, -0.29] } },
  britney: { espalda: { pos: [0, 1.16, -0.25] } },
};

/** Ajuste fino por accesorio (id del juego, ej. "angie-acc0"). */
export const ACCESSORY_FIT: Record<string, AccessoryFit> = {
  // Jimmy ya tiene el escudo del colegio en el lado izquierdo: su insignia va al derecho (x −0.08 en vez de +0.08).
  "jimmy-acc5": { offset: [-0.16, 0, 0] },
  // Angie (piezas posadas: el ajuste es sobre la posición en que vinieron).
  "angie-acc2": { offset: [0, -0.04, 0] }, // venían sobre la frente: sus ojos están centrados en y = 1.42 (de 1.365 a 1.475)
  "angie-acc3": { offset: [0, -0.05, 0] },
  "angie-acc6": { offset: [0, 0, -0.1] }, // venía entre la cabeza y la mochila, tapado por el pelo: arriba de la mochila
  "angie-acc8": { offset: [0, 0.015, 0], escala: 1.1 }, // sus zapatillas asomaban por debajo de la bota
  "angie-acc9": { offset: [-0.005, 0, 0], escalaEje: [0.78, 1, 1] }, // vino de 0.29 m de ancho (su pie mide 0.20): las dos zapatillas se juntaban en una sola
};
