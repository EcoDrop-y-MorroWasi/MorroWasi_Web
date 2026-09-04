// Tabla visual de las 10 etapas del Wasi — AGENTS.md:239 (nombres oficiales, no tocar mock.ts).
// Aporta ícono/escena por etapa y el "ánimo" del Wasi (racha activa vs sed) sin modificar la fórmula PEW.

export interface WasiVisual {
  stage: number;
  icon: string;
  scene: string;
}

export const WASI_VISUALS: WasiVisual[] = [
  { stage: 1, icon: "🪴", scene: "Maceta de barro con un brote tímido sobre tierra seca." },
  { stage: 2, icon: "🌱", scene: "Primeras dos hojas verdes con una gota de rocío brillante." },
  { stage: 3, icon: "🌵", scene: "Cactus y suculentas floreciendo sobre arena clara." },
  { stage: 4, icon: "🌾", scene: "Arbusto verde con pequeñas flores amarillas de algarrobo." },
  { stage: 5, icon: "🦋", scene: "Un charco de agua cristalina y una mariposa cerca." },
  { stage: 6, icon: "🌳", scene: "Tronco firme con sombra densa y césped alrededor." },
  { stage: 7, icon: "💧", scene: "Un canalito de agua limpia fluye alrededor de las raíces." },
  { stage: 8, icon: "🐦", scene: "Árbol robusto con aves locales — chilalos y picaflores." },
  { stage: 9, icon: "🌿", scene: "Bosquecillo con fauna y plantas medicinales bien regadas." },
  { stage: 10, icon: "✨", scene: "Árbol ancestral radiante con flores, frutos y cielo despejado." },
];

export function wasiVisualFor(stage: number): WasiVisual {
  return WASI_VISUALS.find((v) => v.stage === stage) ?? WASI_VISUALS[0];
}

/** Ánimo del Wasi: racha activa = alegre; sin actividad reciente = "sed" (nunca castiga, solo incentiva). */
export function wasiMood(streakDays: number): { icon: string; label: string } {
  return streakDays > 0
    ? { icon: "🦋", label: "Racha activa — hojas brillantes y animalitos alrededor." }
    : { icon: "💧", label: "El Wasi tiene sed — una actividad hoy lo alegra de nuevo." };
}
