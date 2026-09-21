// Minitutorial guiado con driver.js (MIT, ~5 KB, sin dependencias). Se eligió
// sobre Shepherd.js (6-8x más pesado, y esta app ya carga three.js) y sobre
// Intro.js (su versión gratuita es AGPL-3.0, licencia comercial de pago).
//
// El recorrido NAVEGA de verdad: cada paso abre la pantalla que está explicando,
// así el usuario la ve por dentro en vez de leer una descripción de un tab. La
// navegación la hace react-router, por eso startTutorial() recibe el `navigate`
// de quien lo dispara — este módulo no puede usar el hook por su cuenta.
import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";

const VISTO_KEY = "morrowasi_tutorial_visto_v1";

// Navegar fuera del Dashboard y volver lo remonta, y con el tour todavía abierto
// eso lanzaba un segundo recorrido encima del primero (dos globos apilados). El
// flag es de módulo, no estado de React, justamente porque tiene que sobrevivir
// al desmontaje del componente que lo inició.
let tourActivo = false;

export function tutorialVisto(): boolean {
  try {
    return window.localStorage.getItem(VISTO_KEY) === "true";
  } catch {
    return false;
  }
}

function marcarVisto(): void {
  try {
    window.localStorage.setItem(VISTO_KEY, "true");
  } catch {
    /* localStorage no disponible */
  }
}

export function reiniciarTutorial(): void {
  try {
    window.localStorage.removeItem(VISTO_KEY);
  } catch {
    /* localStorage no disponible */
  }
}

export type NavegarTutorial = (ruta: string) => void;

interface PasoTutorial {
  /** Pantalla que se abre antes de mostrar el paso. */
  ruta: string;
  /** data-tour del elemento a resaltar. Sin esto el globo sale centrado. */
  ancla?: string;
  titulo: string;
  descripcion: string;
}

const PASOS: PasoTutorial[] = [
  {
    ruta: "/inicio",
    titulo: "👋 Bienvenido a MorroWasi",
    descripcion:
      "Te voy a llevar por cada pantalla de la app para mostrarte qué hace, cómo ganar puntos y cómo evitar que tu progreso se pierda.<br><br>Son 11 pasos y puedes salir cuando quieras con Esc.",
  },
  {
    ruta: "/inicio",
    ancla: "metricas",
    titulo: "💧 Tus tres números",
    descripcion:
      "<b>Litros hoy</b>: lo que ahorraste en el día.<br><b>HydroPuntos</b>: tu moneda, sirve para comprar avatares.<br><b>Racha</b>: días seguidos usando la app. Cada día de racha suma PEW (Puntos de Evolución del Wasi) y hace crecer a tu Wasi.",
  },
  {
    ruta: "/inicio",
    ancla: "wasi",
    titulo: "🌱 Tu Wasi crece contigo",
    descripcion:
      "Tu Wasi sube por las 10 etapas según tu <b>PEW</b> (Puntos de Evolución del Wasi = EXP de misiones + racha). Tócalo para ver todas las etapas y cuánto falta para la siguiente.",
  },
  {
    ruta: "/misiones",
    ancla: "pagina-misiones",
    titulo: "✅ Misiones — así ganas EXP",
    descripcion:
      "Esta es la pantalla de Misiones. Son hábitos diarios y semanales de ahorro de agua; cada una que completas te da <b>EXP</b>, y el EXP es lo único que hace crecer a tu Wasi.<br><br>Rotan cada día, así que vale la pena volver seguido.",
  },
  {
    ruta: "/juegos",
    ancla: "pagina-juegos",
    titulo: "🎮 Juegos — así ganas HydroPuntos",
    descripcion:
      "15 mini-juegos de 60 a 240 segundos. Dan entre <b>30 y 100 HydroPuntos</b>, pero solo cuando <b>superas tu propio récord</b>: repetir una partida floja no suma.<br><br>Jugar cuenta como actividad para tu racha diaria.",
  },
  {
    ruta: "/cursos",
    ancla: "pagina-cursos",
    titulo: "📚 Cursos — HydroPuntos por aprender",
    descripcion:
      "Video-lecciones sobre SODIS, aguas grises, filtros caseros, riego y más. Al terminar todas las lecciones de un curso ganas sus HydroPuntos de golpe: entre 150 y 400.",
  },
  {
    ruta: "/avatares",
    ancla: "pagina-avatares",
    titulo: "🧑 Avatares — en qué gastas los HydroPuntos",
    descripcion:
      "La tienda. Aquí cambias los HydroPuntos que ganaste por avatares 3D y accesorios, y eliges cuál será tu foto de perfil.",
  },
  {
    ruta: "/noticias",
    ancla: "pagina-noticias",
    titulo: "📰 Noticias",
    descripcion:
      "Novedades sobre el agua en Piura y Morropón. Se actualizan solas cada hora, sin que tengas que hacer nada.",
  },
  {
    ruta: "/ranking",
    ancla: "tarjeta-ranking",
    titulo: "🏆 Ranking — compite con otras personas",
    descripcion:
      "Cuando tengas HydroPuntos y EXP, toca este botón para entrar a la tabla.<br><br><b>Nada se sube solo</b>: tu progreso viaja únicamente cuando lo tocas. El conteo del día va de las 00:00 a las 23:59 hora de Perú, y también hay ranking por semana, mes e histórico.",
  },
  {
    ruta: "/perfil",
    ancla: "tarjeta-perfil",
    titulo: "🧑‍🤝‍🧑 Tu perfil",
    descripcion:
      "Aquí cambias tu nombre y tu avatar — es el nombre que verán los demás en el ranking. También es donde cierras sesión.",
  },
  {
    ruta: "/perfil",
    ancla: "respaldo",
    titulo: "💾 Lo más importante: guarda tu progreso",
    descripcion:
      "Tu avance vive <b>solo en este dispositivo</b>. Si limpias el navegador, se pierde.<br><br>Más abajo en esta misma pantalla: usa <b>Exportar</b> para descargar un archivo de respaldo, o el <b>código de sincronización</b> para recuperarlo en otro celular, sin correo ni contraseña.",
  },
  {
    ruta: "/inicio",
    titulo: "¡Listo! 🎉",
    descripcion:
      "Empieza por una misión diaria: es lo más rápido para ver crecer a tu Wasi.<br><br>Puedes repetir este recorrido cuando quieras con el botón <b>¿Cómo funciona MorroWasi?</b> del inicio.",
  },
];

/**
 * Los tabs del nav se pintan dos veces (header en desktop, cierre del cuerpo en mobile)
 * con el mismo data-tour. querySelector devolvería siempre el primero, que en
 * mobile está oculto: driver.js lo resaltaría fuera de la pantalla.
 */
function visible(ancla: string): Element | undefined {
  const candidatos = Array.from(document.querySelectorAll(`[data-tour="${ancla}"]`));
  return candidatos.find((el) => (el as HTMLElement).offsetParent !== null) ?? candidatos[0];
}

/** Espera a que React monte el ancla tras navegar (las páginas lazy tardan más). */
function esperarAncla(ancla: string | undefined, limiteMs = 2500): Promise<void> {
  if (!ancla) return new Promise((r) => setTimeout(r, 220));
  return new Promise((resolve) => {
    const inicio = Date.now();
    const revisar = () => {
      if (visible(ancla) || Date.now() - inicio > limiteMs) {
        // Un frame extra: el elemento ya existe pero su posición final depende
        // del layout que React acaba de aplicar, y driver.js mide al resaltar.
        requestAnimationFrame(() => setTimeout(resolve, 60));
        return;
      }
      requestAnimationFrame(revisar);
    };
    revisar();
  });
}

export function startTutorial(navegar: NavegarTutorial): void {
  if (tourActivo) return;
  tourActivo = true;

  // La primera vez que alguien lo ve, no puede saltárselo (ni con Esc, ni
  // clic afuera, ni la X): así se asegura que vea el recorrido completo antes
  // de quedar marcado como visto. Si ya lo vio y lo reabre a propósito desde
  // Perfil, puede cerrarlo cuando quiera.
  const primeraVez = !tutorialVisto();
  let completo = false;

  const steps: DriveStep[] = PASOS.map((paso, indice) => ({
    // Función en vez de selector: se resuelve al resaltar, que es cuando la
    // pantalla nueva ya está montada y se sabe cuál de los duplicados se ve.
    element: paso.ancla ? () => visible(paso.ancla!) as Element : undefined,
    popover: {
      title: paso.titulo,
      description:
        indice === 0 && primeraVez
          ? paso.descripcion.replace(
              "Son 11 pasos y puedes salir cuando quieras con Esc.",
              "Son 11 pasos; esta primera vez hay que verlos todos, pero después podrás repetirlo cuando quieras.",
            )
          : paso.descripcion,
    },
    // Si una pantalla cambió y el ancla ya no existe, el paso se muestra
    // centrado en vez de romper el recorrido.
    skipMissingElement: false,
  }));

  let tour: Driver;

  /** Abre la pantalla del paso destino y recién entonces avanza el recorrido. */
  const irA = async (indice: number, mover: () => void) => {
    const destino = PASOS[indice];
    if (!destino) return;
    if (window.location.pathname !== destino.ruta) {
      navegar(destino.ruta);
      // React Router no resetea el scroll al navegar: sin esto la pantalla nueva
      // podía aparecer scrolleada a donde había quedado la anterior, cortando
      // el título/info de arriba (Misiones, Cursos, etc.) detrás del popover.
      window.scrollTo(0, 0);
      await esperarAncla(destino.ancla);
    }
    mover();
  };

  tour = driver({
    showProgress: true,
    allowClose: !primeraVez,
    // Sin esto, driver.js deja el elemento resaltado clickeable de verdad —
    // durante el recorrido se podía navegar la app por debajo del tutorial
    // tocando el tab o botón que estaba iluminado.
    disableActiveInteraction: true,
    overlayOpacity: 0.65,
    stagePadding: 6,
    stageRadius: 14,
    popoverClass: "morrowasi-tour",
    nextBtnText: "Siguiente →",
    prevBtnText: "← Atrás",
    doneBtnText: "¡Entendido!",
    progressText: "{{current}} de {{total}}",
    steps,
    onNextClick: () => {
      const actual = tour.getActiveIndex() ?? 0;
      // En el último paso el botón dice "¡Entendido!" y no hay a dónde avanzar:
      // sin este caso irA() no encontraba destino y el recorrido quedaba abierto
      // para siempre, sin marcarse como visto.
      if (actual >= PASOS.length - 1) {
        completo = true;
        tour.destroy();
        return;
      }
      void irA(actual + 1, () => tour.moveNext());
    },
    onPrevClick: () => {
      const actual = tour.getActiveIndex() ?? 0;
      if (actual <= 0) return;
      void irA(actual - 1, () => tour.movePrevious());
    },
    // La X del popover no respeta `allowClose` (esa opción solo tapa Esc y clic
    // en el overlay), así que la primera vez hay que bloquearla acá también.
    onCloseClick: () => {
      if (primeraVez) return;
      completo = true;
      tour.destroy();
    },
    onDestroyed: () => {
      tourActivo = false;
      // Solo se marca visto si llegó hasta el final: si alguien lo abandona a
      // medias, hay que poder volver a ofrecérselo solo más adelante.
      if (completo) marcarVisto();
    },
  });

  // El recorrido arranca en "/" aunque se dispare desde otra pantalla.
  void irA(0, () => tour.drive());
}
