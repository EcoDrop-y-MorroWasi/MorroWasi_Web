import { useState } from "react";
import CourseCard from "../components/CourseCard";
import VideoPlayerView from "../components/VideoPlayerView";
import { coursesMock, isCourseUnlocked, type WaterCourse } from "../data/courses.mock";
import { WASI_STAGES } from "../data/mock";
import { addHydroPoints } from "../utils/hydroStore";
import { useExp } from "../utils/expStore";
import { calcCourseExp } from "../utils/gamification";
import { recordLedgerEvent } from "../utils/leaderboardLedger";
import { markActivityToday } from "../utils/streakStore";

interface AcademiaProps {
  hydroPoints?: number;
  wasiLevel?: number;
}

const PROGRESS_STORAGE_KEY = "morrowasi_academia_progress_v1";
// Sombra dura neobrutalista (.opencode/skills/ui-warm-neobrutalism): 2px borde + 4px offset sin blur
const HARD_SHADOW = "shadow-[4px_4px_0_0_#1c1c11]";

type LessonProgress = Record<string, string[]>;
// Flujo por curso: detalle+malla → flashcards de lectura (sin timer) → quiz por lección → catálogo
type CourseStage = "detail" | "flashcards" | "quiz";

function loadProgress(): LessonProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LessonProgress) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: LessonProgress) {
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* localStorage no disponible (modo privado, cuota, etc.) */
  }
}

export default function Academia({ hydroPoints = 0, wasiLevel = 1 }: AcademiaProps) {
  const [selected, setSelected] = useState<WaterCourse | null>(null);
  const [stage, setStage] = useState<CourseStage>("detail");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState<LessonProgress>(() => loadProgress());
  const [, addExp] = useExp();
  const lesson = selected?.lessons[lessonIndex];
  const flashcardLesson = selected?.lessons[flashcardIndex];

  // Al completar la última lección del curso, se acreditan sus HydroPuntos y un
  // EXP proporcional una sola vez (calcCourseExp — las misiones siguen siendo
  // la fuente principal de EXP, esto es un aporte extra, no un reemplazo).
  const markLessonDone = (course: WaterCourse, lessonId: string) => {
    const done = progress[course.id] ?? [];
    if (done.includes(lessonId)) return;
    const next = { ...progress, [course.id]: [...done, lessonId] };
    setProgress(next);
    saveProgress(next);
    markActivityToday();
    if (next[course.id].length === course.lessons.length) {
      const exp = calcCourseExp(course.xpReward);
      addHydroPoints(course.xpReward);
      addExp(exp);
      recordLedgerEvent("curso", course.id, { hydro: course.xpReward, exp });
    }
  };

  const selectAnswer = (lessonId: string, index: number) => {
    setAnswers((current) => ({ ...current, [lessonId]: index }));
    if (selected && lesson && lesson.id === lessonId && index === lesson.quiz.correctAnswer) {
      markLessonDone(selected, lessonId);
    }
  };

  const openCourse = (course: WaterCourse) => {
    setSelected(course);
    setStage("detail");
    setFlashcardIndex(0);
    setLessonIndex(0);
    // Mismo /cursos, sin cambio de ruta: el scroll global de Layout no dispara acá,
    // así que sin esto el detalle del curso abría a mitad de página si venías scrolleado.
    window.scrollTo(0, 0);
  };
  const closeCourse = () => setSelected(null);

  const completedLessonsFor = (course: WaterCourse) => progress[course.id]?.length ?? 0;
  const isCourseComplete = (course: WaterCourse) => completedLessonsFor(course) === course.lessons.length;
  // Set de ids de cursos ya terminados — lo usa isCourseUnlocked para la lógica
  // "curso C exige haber terminado el curso B" / "curso A exige el C de la etapa anterior".
  const completedCourseIds = new Set(coursesMock.filter(isCourseComplete).map((c) => c.id));

  const startCourse = () => {
    setFlashcardIndex(0);
    setStage("flashcards");
    window.scrollTo(0, 0);
  };

  const nextFlashcard = () => {
    if (!selected) return;
    if (flashcardIndex < selected.lessons.length - 1) {
      setFlashcardIndex((i) => i + 1);
    } else {
      setLessonIndex(0);
      setStage("quiz");
    }
  };
  const prevFlashcard = () => setFlashcardIndex((i) => Math.max(0, i - 1));

  // ---------- Etapa 1: detalle del curso + malla curricular ----------
  if (selected && stage === "detail")
    return (
      <main className="mx-auto max-w-3xl space-y-5 bg-bg-light px-4 py-6 text-ink">
        <button type="button" className="min-h-12 font-bold underline" onClick={closeCourse}>
          ← Volver a Academia
        </button>
        <VideoPlayerView title={selected.title} videoUrl={selected.lessons[0].videoUrl} thumbnailUrl={selected.thumbnailUrl} />
        <section className={`rounded-2xl border-2 border-ink bg-surface p-5 ${HARD_SHADOW}`}>
          <h1 className="font-display text-2xl font-bold">{selected.title}</h1>
          <p className="mt-2">{selected.description}</p>
          <p className="mt-3 text-sm font-bold text-[#E26D5C]">
            {selected.durationMinutes} min · {selected.lessons.length} lección{selected.lessons.length === 1 ? "" : "es"} · +{selected.xpReward} XP
          </p>
        </section>
        <section className={`rounded-2xl border-2 border-ink bg-[#99B4D8]/30 p-5 ${HARD_SHADOW}`} aria-label="Malla curricular del curso">
          <h2 className="font-display text-lg font-bold">📋 Malla curricular — qué aprenderás</h2>
          <ol className="mt-3 space-y-2">
            {selected.curriculum.map((item, i) => (
              <li key={item} className="flex items-start gap-3 rounded-xl border-2 border-ink bg-surface p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-[#FFB793] text-sm font-black">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold leading-snug">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Progreso real por lección — no solo el contador agregado de la tarjeta:
            acá se ve exactamente qué lección ya se hizo y cuál falta. */}
        <section className={`rounded-2xl border-2 border-ink bg-surface p-5 ${HARD_SHADOW}`} aria-label="Progreso por lección">
          <h2 className="font-display text-lg font-bold">✅ Tu progreso</h2>
          <ol className="mt-3 space-y-2">
            {selected.lessons.map((l, i) => {
              const hecha = (progress[selected.id] ?? []).includes(l.id);
              return (
                <li
                  key={l.id}
                  className={`flex items-center gap-3 rounded-xl border-2 border-ink p-3 ${hecha ? "bg-[#28a745]/20" : "bg-bg-light"}`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-black ${
                      hecha ? "bg-[#28a745] text-white" : "bg-surface"
                    }`}
                    aria-hidden
                  >
                    {hecha ? "✓" : i + 1}
                  </span>
                  <span className="text-sm font-semibold leading-snug">{l.title}</span>
                  {hecha && <span className="ml-auto shrink-0 text-xs font-bold text-[#28a745]">Hecha</span>}
                </li>
              );
            })}
          </ol>
        </section>
        <button
          type="button"
          onClick={startCourse}
          className={`min-h-12 w-full rounded-xl border-2 border-ink bg-[#E26D5C] font-bold text-white ${HARD_SHADOW} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
        >
          Empezar curso
        </button>
      </main>
    );

  // ---------- Etapa 2: flashcards de lectura, sin timer ----------
  if (selected && stage === "flashcards" && flashcardLesson)
    return (
      <main className="mx-auto max-w-3xl space-y-5 bg-bg-light px-4 py-6 text-ink">
        <button type="button" className="min-h-12 font-bold underline" onClick={closeCourse}>
          ← Volver a Academia
        </button>
        <p className="text-sm font-bold text-[#E26D5C]">
          {selected.title} · Lectura {flashcardIndex + 1} de {selected.lessons.length}
        </p>
        <section className={`rounded-2xl border-2 border-ink bg-surface p-6 ${HARD_SHADOW}`} aria-label={`Flashcard: ${flashcardLesson.title}`}>
          <h1 className="font-display text-2xl font-bold">{flashcardLesson.title}</h1>
          <p className="mt-4 leading-relaxed">{flashcardLesson.contentMarkdown}</p>
        </section>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={flashcardIndex === 0}
            onClick={prevFlashcard}
            className={`min-h-12 flex-1 rounded-xl border-2 border-ink bg-surface font-bold disabled:opacity-40 disabled:shadow-none ${HARD_SHADOW}`}
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={nextFlashcard}
            className={`min-h-12 flex-1 rounded-xl border-2 border-ink bg-[#FFB793] font-bold ${HARD_SHADOW}`}
          >
            {flashcardIndex < selected.lessons.length - 1 ? "Siguiente" : "Comenzar quiz →"}
          </button>
        </div>
      </main>
    );

  // ---------- Etapa 3: quiz por lección ----------
  if (selected && stage === "quiz" && lesson)
    return (
      <main className="mx-auto max-w-3xl space-y-5 bg-bg-light px-4 py-6 text-ink">
        <button type="button" className="min-h-12 font-bold underline" onClick={closeCourse}>
          ← Volver a Academia
        </button>
        <p className="text-sm font-bold text-[#E26D5C]">
          {selected.title} · Quiz {lessonIndex + 1} de {selected.lessons.length} ·{" "}
          {completedLessonsFor(selected)}/{selected.lessons.length} completadas
        </p>
        <section
          className={`rounded-2xl border-2 border-ink bg-[#99B4D8] p-5 ${HARD_SHADOW}`}
          aria-labelledby="quiz-title"
        >
          <h2 id="quiz-title" className="font-bold">
            {lesson.title}: {lesson.quiz.question}
          </h2>
          <div className="mt-3 grid gap-2">
            {lesson.quiz.options.map((option, index) => {
              const respondida = answers[lesson.id] !== undefined;
              const esElegida = answers[lesson.id] === index;
              const esCorrecta = index === lesson.quiz.correctAnswer;
              const clase =
                respondida && esElegida && esCorrecta
                  ? "bg-[#28a745] text-white"
                  : respondida && esElegida && !esCorrecta
                    ? "bg-[#E26D5C] text-white"
                    : "bg-surface";
              return (
                <button
                  key={option}
                  type="button"
                  disabled={respondida && answers[lesson.id] !== lesson.quiz.correctAnswer && esElegida}
                  onClick={() => selectAnswer(lesson.id, index)}
                  className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border-2 border-ink px-4 py-3 text-left font-semibold ${clase}`}
                >
                  <span>{option}</span>
                  {respondida && esElegida && (esCorrecta ? <span aria-hidden="true">✓</span> : <span aria-hidden="true">✗</span>)}
                </button>
              );
            })}
          </div>
          {answers[lesson.id] !== undefined ? (
            <p className="mt-3 text-sm font-bold">
              {answers[lesson.id] === lesson.quiz.correctAnswer
                ? `¡Correcto! ${lesson.quiz.explanation}`
                : "Aún no es la respuesta correcta. Inténtalo otra vez."}
            </p>
          ) : null}
        </section>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={lessonIndex === 0}
            onClick={() => setLessonIndex((index) => index - 1)}
            className={`min-h-12 flex-1 rounded-xl border-2 border-ink bg-surface font-bold disabled:opacity-40 disabled:shadow-none ${HARD_SHADOW}`}
          >
            Anterior
          </button>
          {lessonIndex < selected.lessons.length - 1 ? (
            <button
              type="button"
              disabled={answers[lesson.id] !== lesson.quiz.correctAnswer}
              onClick={() => setLessonIndex((index) => index + 1)}
              className={`min-h-12 flex-1 rounded-xl border-2 border-ink bg-[#FFB793] font-bold disabled:opacity-40 disabled:shadow-none ${HARD_SHADOW}`}
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              disabled={answers[lesson.id] !== lesson.quiz.correctAnswer}
              onClick={closeCourse}
              className={`min-h-12 flex-1 rounded-xl border-2 border-ink bg-[#E26D5C] font-bold text-white disabled:opacity-40 disabled:shadow-none ${HARD_SHADOW}`}
            >
              Finalizar
            </button>
          )}
        </div>
      </main>
    );

  return (
    <main className="mx-auto max-w-6xl bg-bg-light px-4 py-6 text-ink" data-tour="pagina-cursos">
      <header className={`mb-6 rounded-2xl border-2 border-ink bg-[#99B4D8] p-5 text-[#1c1c11] ${HARD_SHADOW}`}>
        <p className="font-bold text-[#E26D5C]">ACADEMIA DEL AGUA</p>
        <h1 className="font-display text-3xl font-bold">Aprende, cuida y suma HydroPuntos</h1>
        <p className="mt-2">
          Cursos con lecciones en video y quiz al final de cada una. Completa todas las lecciones de un curso para
          sumar sus HydroPuntos.
        </p>
        <p className="mt-3 text-sm font-bold">
          {hydroPoints} HydroPuntos · Wasi nivel {wasiLevel}
        </p>
      </header>
      {/* Agrupados por etapa del Wasi: 3 cursos por etapa, 10 etapas. */}
      {WASI_STAGES.map((wasiStage) => {
        const cursosDeEtapa = coursesMock.filter((c) => c.stage === wasiStage.number);
        if (cursosDeEtapa.length === 0) return null;
        return (
          <section key={wasiStage.number} aria-label={`Cursos de la etapa ${wasiStage.number}: ${wasiStage.name}`} className="mb-8 space-y-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-[#FFB793] text-sm font-black">
                {wasiStage.number}
              </span>
              {wasiStage.name}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cursosDeEtapa.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  unlocked={isCourseUnlocked(course, hydroPoints, completedCourseIds)}
                  completed={isCourseComplete(course)}
                  completedLessons={completedLessonsFor(course)}
                  onOpen={openCourse}
                />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
