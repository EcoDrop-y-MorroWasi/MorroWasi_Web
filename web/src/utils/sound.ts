// Sonidos "juice UI" sintetizados con Web Audio — sin archivos de audio, opcionales y silenciosos si no hay soporte.

function beep(freqs: number[], noteMs = 90) {
  try {
    const Ctx: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    freqs.forEach((freq, i) => {
      const start = ctx.currentTime + i * (noteMs / 1000);
      const end = start + noteMs / 1000;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.07, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(end);
    });
    setTimeout(() => ctx.close(), freqs.length * noteMs + 120);
  } catch {
    /* Web Audio no disponible, silencioso */
  }
}

/** Pop de burbuja — al completar una misión (juice UI). */
export function playPop() {
  beep([520]);
}

/** Campanita — al superar récord en un mini-juego o subir de etapa Wasi. */
export function playChime() {
  beep([660, 880, 1050]);
}
