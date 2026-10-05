import { describe, expect, it } from "vitest";
import { courseAccess, coursesMock, unlockCost, unlockLabel } from "./courses.mock";

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

describe("courseAccess", () => {
  const nada = new Set<string>();

  it("usa 250 HP para el segundo curso y aumenta 50 HP por curso", () => {
    const costs = coursesMock
      .flatMap((course) => (course.unlock.type === "requiresCourseAndHydroPoints" ? [course.unlock.value] : []))
      .sort((a, b) => a - b);
    expect(costs).toEqual(Array.from({ length: 29 }, (_, index) => 250 + index * 50));
    expect(costs.reduce((total, cost) => total + cost, 0)).toBe(27_550);
  });

  it("completar un curso NO abre el siguiente solo: hay que pagarlo aunque sobren puntos", () => {
    const segundo = coursesMock.find((c) => c.unlock.type === "requiresCourseAndHydroPoints" && c.unlock.courseId === "ciclo-agua-basico");
    expect(segundo).toBeDefined();
    if (!segundo) return;
    const previo = new Set(["ciclo-agua-basico"]);
    expect(courseAccess(segundo, 999_999, previo, nada)).toEqual({ estado: "comprable", costo: unlockCost(segundo.unlock) });
    expect(courseAccess(segundo, 999_999, previo, new Set([segundo.id]))).toEqual({ estado: "abierto" });
  });

  it("sin el curso previo terminado no se puede pagar, aunque sobren HydroPuntos", () => {
    coursesMock
      .filter((c) => c.unlock.type === "requiresCourseAndHydroPoints")
      .forEach((c) => expect(courseAccess(c, 999_999, nada, nada).estado).toBe("falta-curso"));
  });

  it("con el previo terminado pero sin puntos suficientes, indica cuántos faltan", () => {
    const conCosto = coursesMock.find((c) => c.unlock.type === "requiresCourseAndHydroPoints");
    if (!conCosto || conCosto.unlock.type !== "requiresCourseAndHydroPoints") throw new Error("sin curso con costo");
    const costo = conCosto.unlock.value;
    expect(courseAccess(conCosto, costo - 10, new Set([conCosto.unlock.courseId]), nada)).toEqual({ estado: "sin-hp", costo, faltan: 10 });
  });

  it("el primer curso es libre y la cadena recorre los 30 cursos sin huecos", () => {
    const libres = coursesMock.filter((c) => c.unlock.type === "free");
    expect(libres).toHaveLength(1);
    const ids = new Set(coursesMock.map((c) => c.id));
    coursesMock.forEach((c) => {
      if (c.unlock.type === "requiresCourseAndHydroPoints") expect(ids.has(c.unlock.courseId)).toBe(true);
    });
  });

  it("unlockLabel siempre devuelve un texto no vacío para los 30 cursos", () => {
    coursesMock.forEach((course) => {
      expect(unlockLabel(course.unlock).length).toBeGreaterThan(0);
    });
  });
});
