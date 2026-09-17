// Insignias del Álbum — extraído de Album.tsx para que Perfil.tsx pueda
// mostrar el mismo listado (con los mismos umbrales) sin mantener una segunda
// copia que se puede desincronizar. Única fuente de verdad para "qué logros
// existen y cuándo se desbloquean".
import { coursesMock } from "../data/courses.mock";
import { calcPew, calcWasiStage, mockFamily, mockReservoir } from "../data/mock";
import { getStats } from "./stats";
import { useExp } from "./expStore";
import { getReservoir } from "./litersStore";
import { useHydroPoints } from "./hydroStore";
import { allGamesCompleted } from "./completionStore";
import { hizoBackupAlgunaVez } from "./progressBackup";
import { getLinkedCode } from "./progressSync";
import { useStreakDays } from "./streakStore";

const ACADEMIA_PROGRESS_KEY = "morrowasi_academia_progress_v1";
const CHAT_USADO_KEY = "morrowasi_chat_usado_v1";
const AVATARES_STORAGE_KEY = "morrowasi_avatares_v1";
const MISIONES_KEY = "morrowasi_misiones_v1";
const PERFIL_KEY = "morrowasi_perfil_v1";

function misionesPersonalizadasCreadas(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(MISIONES_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { customTasks?: unknown[] };
    return parsed.customTasks?.length ?? 0;
  } catch {
    return 0;
  }
}

function perfilPersonalizado(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(PERFIL_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<{ name: string; avatar: string }>;
    return (parsed.name && parsed.name !== mockFamily.name) || (parsed.avatar && parsed.avatar !== mockFamily.avatar) || false;
  } catch {
    return false;
  }
}

function chatUsado(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CHAT_USADO_KEY) === "true";
  } catch {
    return false;
  }
}

function accesoriosComprados(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(AVATARES_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { ownedAccessoryIds?: string[] };
    return parsed.ownedAccessoryIds?.length ?? 0;
  } catch {
    return 0;
  }
}

function readAcademiaProgress(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACADEMIA_PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  progressLabel: string;
}

export function useBadges(): Badge[] {
  const stats = getStats();
  const progress = readAcademiaProgress();
  const coursesCompleted = coursesMock.filter((c) => (progress[c.id]?.length ?? 0) === c.lessons.length).length;

  const [exp] = useExp();
  const [hydroPoints] = useHydroPoints();
  const streakDays = useStreakDays();
  const pew = calcPew(exp, streakDays);
  const { stage } = calcWasiStage(pew);
  const reservoir = getReservoir();
  const reservoirPct = reservoir.capacityLiters > 0 ? reservoir.currentLiters / reservoir.capacityLiters : 0;
  const reservoirGuardian = mockReservoir.daysOfWaterCut > 0 && reservoirPct >= 0.5;
  const totalLitros = reservoir.totalLitersSaved;
  const accesorios = accesoriosComprados();

  return [
    {
      id: "ojo-halcon",
      emoji: "🔍",
      title: "Ojo de Halcón",
      description: "Repara 5 fugas en Caza-Fugas Exprés.",
      unlocked: stats.fugasReparadas >= 5,
      progressLabel: `${Math.min(stats.fugasReparadas, 5)}/5 fugas`,
    },
    {
      id: "guardian-nocturno",
      emoji: "🌙",
      title: "Guardián Nocturno",
      description: "Completa la misión de riego nocturno 7 veces.",
      unlocked: stats.nochesRiego >= 7,
      progressLabel: `${Math.min(stats.nochesRiego, 7)}/7 noches`,
    },
    {
      id: "ducha-relampago",
      emoji: "⚡",
      title: "Ducha Relámpago",
      description: "Completa Ducha Flash (menos de 4 min) 10 veces.",
      unlocked: stats.duchasFlash >= 10,
      progressLabel: `${Math.min(stats.duchasFlash, 10)}/10 duchas`,
    },
    {
      id: "erudito",
      emoji: "📚",
      title: "Erudito del Agua",
      description: "Completa los 6 cursos multimedia de la Academia.",
      unlocked: coursesCompleted >= 6,
      progressLabel: `${coursesCompleted}/6 cursos`,
    },
    {
      id: "guardian-reservorio",
      emoji: "🛡️",
      title: "Guardián del Reservorio",
      description: "Mantén el reservorio sobre el 50% durante un corte programado.",
      unlocked: reservoirGuardian,
      progressLabel: reservoirGuardian ? "Reservorio protegido" : `${Math.round(reservoirPct * 100)}% durante corte`,
    },
    {
      id: "lider-chira",
      emoji: "🏆",
      title: "Líder del Chira",
      description: "Alcanza la etapa 10, Oasis Sagrado.",
      unlocked: stage >= 10,
      progressLabel: `Etapa ${stage}/10`,
    },
    {
      id: "primeras-gotas",
      emoji: "💧",
      title: "Primeras Gotas",
      description: "Ahorra tus primeros 100 litros en total.",
      unlocked: totalLitros >= 100,
      progressLabel: `${Math.min(totalLitros, 100)}/100 L`,
    },
    {
      id: "rio-constancia",
      emoji: "🌊",
      title: "Río de Constancia",
      description: "Ahorra 2000 litros en total entre misiones y ahorro.",
      unlocked: totalLitros >= 2000,
      progressLabel: `${Math.min(totalLitros, 2000)}/2000 L`,
    },
    {
      id: "meta-cumplida",
      emoji: "🎯",
      title: "Meta Cumplida",
      description: "Llega a la meta de 5000 litros ahorrados de Noticias.",
      unlocked: totalLitros >= 5000,
      progressLabel: `${Math.min(totalLitros, 5000)}/5000 L`,
    },
    {
      id: "explorador-agua",
      emoji: "🗺️",
      title: "Explorador del Agua",
      description: "Completa al menos 3 cursos de la Academia.",
      unlocked: coursesCompleted >= 3,
      progressLabel: `${Math.min(coursesCompleted, 3)}/3 cursos`,
    },
    {
      id: "ahorrador-inteligente",
      emoji: "🧠",
      title: "Ahorrador Inteligente",
      description: "Junta 1000 HydroPuntos.",
      unlocked: hydroPoints >= 1000,
      progressLabel: `${Math.min(hydroPoints, 1000)}/1000 HP`,
    },
    {
      id: "coleccionista",
      emoji: "🎽",
      title: "Coleccionista",
      description: "Compra 3 accesorios en la Tienda de Avatares.",
      unlocked: accesorios >= 3,
      progressLabel: `${Math.min(accesorios, 3)}/3 accesorios`,
    },
    {
      id: "voz-comunidad",
      emoji: "💬",
      title: "Voz de la Comunidad",
      description: "Usa el chat temporal para hablar con otra persona.",
      unlocked: chatUsado(),
      progressLabel: chatUsado() ? "Chat usado" : "Aún no usaste el chat",
    },
    {
      id: "maestro-minijuegos",
      emoji: "🕹️",
      title: "Maestro de los Minijuegos",
      description: "Consigue puntaje en los 15 minijuegos.",
      unlocked: allGamesCompleted(),
      progressLabel: allGamesCompleted() ? "15/15 juegos" : "Faltan juegos por jugar",
    },
    {
      id: "inventor-habitos",
      emoji: "✏️",
      title: "Inventor de Hábitos",
      description: "Crea 3 misiones personalizadas propias.",
      unlocked: misionesPersonalizadasCreadas() >= 3,
      progressLabel: `${Math.min(misionesPersonalizadasCreadas(), 3)}/3 misiones`,
    },
    {
      id: "ingeniero-hidrico",
      emoji: "🚰",
      title: "Ingeniero Hídrico",
      description: "Configura la capacidad de tu reservorio.",
      unlocked: reservoir.capacityLiters > 0,
      progressLabel: reservoir.capacityLiters > 0 ? "Reservorio configurado" : "Sin configurar",
    },
    {
      id: "respaldo-seguro",
      emoji: "💾",
      title: "Respaldo Seguro",
      description: "Exporta un backup de tu progreso desde tu Perfil.",
      unlocked: hizoBackupAlgunaVez(),
      progressLabel: hizoBackupAlgunaVez() ? "Backup hecho" : "Aún no exportaste",
    },
    {
      id: "conectado",
      emoji: "🔗",
      title: "Conectado",
      description: "Sincroniza tu progreso con un código de acceso.",
      unlocked: Boolean(getLinkedCode()),
      progressLabel: getLinkedCode() ? "Código vinculado" : "Sin vincular",
    },
    {
      id: "estilo-propio",
      emoji: "🎨",
      title: "Estilo Propio",
      description: "Cambia tu nombre o avatar en Perfil.",
      unlocked: perfilPersonalizado(),
      progressLabel: perfilPersonalizado() ? "Perfil personalizado" : "Perfil por defecto",
    },
  ];
}
