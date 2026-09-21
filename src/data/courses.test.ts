import { describe, expect, it } from "vitest";
import { coursesMock, isCourseUnlocked, unlockLabel } from "./courses.mock";

describe("coursesMock", () => {
  it("tiene 30 cursos, exactamente 3 por cada una de las 10 etapas del Wasi", () => {
    expect(coursesMock).toHaveLength(30);
    for (let stage = 1; stage <= 10; stage++) {
      expect(coursesMock.filter((c) => c.stage === stage)).toHaveLength(3);
    }
  });

  it("cada curso tiene lecciones y cada lección un quiz con la respuesta correcta dentro del rango de opciones", () => {
    coursesMock.forEach((course) => {
      expect(course.lessons.length).toBeGreaterThan(0);
      course.lessons.forEach((lesson) => {
        expect(lesson.quiz.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(lesson.quiz.correctAnswer).toBeLessThan(lesson.quiz.options.length);
      });
    });
  });
});

describe("isCourseUnlocked", () => {
  it("jugando en el orden natural (A, B, C de cada etapa) nunca te quedás bloqueado", () => {
    // Mismo criterio que CourseCard/Academia: se recorre etapa por etapa, curso
    // por curso, sumando los HydroPuntos de cada uno apenas se completa —
    // replica el simulacro que valida la economía de desbloqueo diseñada esta
    // sesión (cada curso paga más de lo que pide el siguiente).
    let wallet = 0;
    const completados = new Set<string>();

    for (let stage = 1; stage <= 10; stage++) {
      const cursosDeEtapa = coursesMock.filter((c) => c.stage === stage);
      expect(cursosDeEtapa).toHaveLength(3);
      cursosDeEtapa.forEach((course) => {
        expect(isCourseUnlocked(course, wallet, completados)).toBe(true);
        wallet += course.xpReward;
        completados.add(course.id);
      });
    }
  });

  it("un curso con HydroPuntos + curso previo está bloqueado con 0 puntos, incluso con el previo ya completado", () => {
    // Toda la economía es en cadena ahora: cada curso exige el anterior YA
    // completado, no solo desbloqueado — ver el diseño en el comentario de
    // arriba de courses.mock.ts. Ya no queda ningún curso con solo "hydroPoints".
    expect(coursesMock.some((c) => c.unlock.type === "hydroPoints")).toBe(false);
    const conCosto = coursesMock.find((c) => c.unlock.type === "requiresCourseAndHydroPoints");
    expect(conCosto).toBeDefined();
    if (conCosto && conCosto.unlock.type === "requiresCourseAndHydroPoints") {
      const previoCompletado = new Set([conCosto.unlock.courseId]);
      expect(isCourseUnlocked(conCosto, 0, previoCompletado)).toBe(false);
    }
  });

  it("un curso que exige terminar el anterior está bloqueado aunque sobren HydroPuntos, si no se completó ese curso", () => {
    const requiereCurso = coursesMock.find((c) => c.unlock.type === "requiresCourse" || c.unlock.type === "requiresCourseAndHydroPoints");
    expect(requiereCurso).toBeDefined();
    if (requiereCurso) expect(isCourseUnlocked(requiereCurso, 999_999, new Set())).toBe(false);
  });

  it("unlockLabel siempre devuelve un texto no vacío para los 30 cursos", () => {
    coursesMock.forEach((course) => {
      expect(unlockLabel(course.unlock).length).toBeGreaterThan(0);
    });
  });
});
