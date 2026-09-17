// Audio real (no generado) del modal de minijuegos — 3 pistas en loop, una
// sola sonando a la vez: durante el juego, al ganar, al perder. Vive aparte
// de sound.ts (esos son tonos cortos de Web Audio para toasts/misiones, sin
// archivo); esto sí son archivos .m4a reales en public/sfx.
const PISTAS = {
  duranteJuego: "/sfx/durante-juego.m4a",
  victoria: "/sfx/victoria.m4a",
  derrota: "/sfx/derrota.m4a",
} as const;

type Pista = keyof typeof PISTAS;

let actual: HTMLAudioElement | null = null;

function reproducir(pista: Pista) {
  detenerAudio();
  try {
    const audio = new Audio(PISTAS[pista]);
    audio.loop = true;
    audio.volume = 0.35;
    // Autoplay puede fallar si el navegador exige interacción previa — el
    // juego ya arrancó con un tap del usuario a esta altura, pero por las
    // dudas no se deja una promesa rechazada sin atrapar.
    void audio.play().catch(() => {});
    actual = audio;
  } catch {
    /* audio no disponible */
  }
}

/** Se corta sola cuando termina la partida (gana o pierde). */
export function playDuranteJuego(): void {
  reproducir("duranteJuego");
}

/** Se corta sola al cerrar el modal del juego o jugar de nuevo. */
export function playVictoria(): void {
  reproducir("victoria");
}

/** Se corta sola al cerrar el modal del juego o jugar de nuevo. */
export function playDerrota(): void {
  reproducir("derrota");
}

/**
 * "Desbloquea" el audio del navegador: victoria/derrota suenan recién cuando
 * termina la partida, casi siempre disparadas por un setTimeout (no por un
 * click directo) — algunos navegadores bloquean ese primer play() por no
 * venir de un gesto del usuario, y de ahí en más ni suena ni avisa. Reproducir
 * y pausar al instante, una sola vez, dentro del primer click real del modal
 * (el botón "Empezar" del intro) cuenta como gesto y desbloquea el resto de
 * la sesión — todos los play() posteriores, aunque vengan de un timer, ya
 * funcionan igual.
 */
export function desbloquearAudio(): void {
  for (const src of Object.values(PISTAS)) {
    try {
      const audio = new Audio(src);
      audio.volume = 0;
      void audio
        .play()
        .then(() => audio.pause())
        .catch(() => {});
    } catch {
      /* audio no disponible */
    }
  }
}

export function detenerAudio(): void {
  if (!actual) return;
  actual.pause();
  actual.currentTime = 0;
  actual = null;
}
