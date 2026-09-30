import { useState } from "react";
import type { CourseAccess, WaterCourse } from "../data/courses.mock";
import { courseTitleById } from "../data/courses.mock";

interface CourseCardProps {
  course: WaterCourse;
  access: CourseAccess;
  /** Paga el desbloqueo. Devuelve false si al final no alcanzaron los puntos. */
  onUnlock: (course: WaterCourse, cost: number) => boolean;
  completed?: boolean;
  completedLessons: number;
  onOpen: (course: WaterCourse) => void;
}

// Neobrutalismo cálido: borde 2px + sombra dura 4px sin blur (.opencode/skills/ui-warm-neobrutalism)
const HARD_SHADOW = "shadow-[4px_4px_0_0_#1c1c11]";

function fallbackCover(title: string) {
  return `https://placehold.co/640x360/99B4D8/1c1c11?text=${encodeURIComponent(title)}`;
}

export default function CourseCard({ course, access, onUnlock, completed = false, completedLessons, onOpen }: CourseCardProps) {
  const [coverSrc, setCoverSrc] = useState(course.thumbnailUrl);
  // Gastar puntos no se deshace: primer toque pregunta, segundo confirma.
  const [confirmando, setConfirmando] = useState(false);
  const totalLessons = course.lessons.length;
  const progressPct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <article className={`overflow-hidden rounded-2xl border-2 border-ink bg-bg-light text-ink ${HARD_SHADOW}`}>
      <img
        src={coverSrc}
        alt={`Portada del curso ${course.title}`}
        className="h-40 w-full border-b-2 border-ink object-cover"
        width={640}
        height={360}
        loading="lazy"
        decoding="async"
        onError={() => setCoverSrc(fallbackCover(course.title))}
      />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold leading-tight">{course.title}</h2>
          <span className="shrink-0 rounded-full border-2 border-ink bg-[#FFB793] px-2 py-1 text-xs font-bold">+{course.xpReward} HP</span>
        </div>
        <p className="text-sm leading-relaxed">{course.description}</p>
        <p className="text-xs font-semibold">
          {course.durationMinutes} min · {totalLessons} lección{totalLessons === 1 ? "" : "es"}
        </p>

        <div aria-label={`Progreso: ${completedLessons} de ${totalLessons} lecciones completadas`}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>{completedLessons}/{totalLessons} lecciones</span>
            {completed ? <span className="text-[#E26D5C]">Curso completado</span> : null}
          </div>
          <div
            role="progressbar"
            aria-valuenow={completedLessons}
            aria-valuemin={0}
            aria-valuemax={totalLessons}
            className="mt-1 h-2 w-full overflow-hidden rounded-full border-2 border-ink bg-surface"
          >
            <div className="h-full bg-[#99B4D8] transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {access.estado === "abierto" ? (
          <button
            type="button"
            onClick={() => onOpen(course)}
            className={`min-h-12 w-full rounded-xl border-2 border-ink bg-[#99B4D8] px-4 py-3 text-sm font-bold transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${HARD_SHADOW}`}
          >
            Ver curso
          </button>
        ) : access.estado === "comprable" ? (
          confirmando ? (
            <div className="space-y-2">
              <p className="text-sm font-bold">¿Gastar {access.costo} HydroPuntos para abrir este curso?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-surface px-3 text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmando(false);
                    if (onUnlock(course, access.costo)) onOpen(course);
                  }}
                  className={`min-h-12 flex-1 rounded-xl border-2 border-ink bg-[#E26D5C] px-3 text-sm font-bold text-white ${HARD_SHADOW} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
                >
                  Sí, desbloquear
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className={`min-h-12 w-full rounded-xl border-2 border-ink bg-[#FFB793] px-4 py-3 text-sm font-bold transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${HARD_SHADOW}`}
            >
              🔓 Desbloquear por {access.costo} HP
            </button>
          )
        ) : (
          <button
            type="button"
            disabled
            className="min-h-12 w-full cursor-not-allowed rounded-xl border-2 border-ink bg-stone-300 px-4 py-3 text-sm font-bold text-stone-600"
          >
            {access.estado === "falta-curso"
              ? `🔒 Termina "${courseTitleById(access.courseId)}"`
              : `🔒 Cuesta ${access.costo} HP · te faltan ${access.faltan}`}
          </button>
        )}
      </div>
    </article>
  );
}
