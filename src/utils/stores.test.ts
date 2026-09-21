import { beforeEach, describe, expect, it } from "vitest";
import { addHydroPoints, getHydroPoints } from "./hydroStore";
import { addExp, getExp } from "./expStore";

beforeEach(() => {
  window.localStorage.clear();
});

describe("hydroStore", () => {
  it("una cuenta nueva arranca en 0, no en el mock viejo (1240)", () => {
    expect(getHydroPoints()).toBe(0);
  });

  it("addHydroPoints suma, resta y persiste entre llamadas", () => {
    addHydroPoints(150);
    expect(getHydroPoints()).toBe(150);
    addHydroPoints(-50);
    expect(getHydroPoints()).toBe(100);
  });

  it("nunca baja de 0, aunque se reste más de lo que hay", () => {
    addHydroPoints(30);
    addHydroPoints(-999);
    expect(getHydroPoints()).toBe(0);
  });

  it("un valor corrupto en localStorage (edición manual, payload roto) no envenena para siempre — se lee como 0", () => {
    window.localStorage.setItem("morrowasi_hydropuntos_v1", "no-soy-un-numero");
    expect(getHydroPoints()).toBe(0);
    addHydroPoints(20);
    expect(getHydroPoints()).toBe(20);
  });
});

describe("expStore", () => {
  it("una cuenta nueva arranca en 0", () => {
    expect(getExp()).toBe(0);
  });

  it("addExp suma, resta y persiste entre llamadas", () => {
    addExp(80);
    expect(getExp()).toBe(80);
    addExp(-30);
    expect(getExp()).toBe(50);
  });

  it("nunca baja de 0, aunque se reste más de lo que hay (revertir una misión borrada, por ejemplo)", () => {
    addExp(10);
    addExp(-500);
    expect(getExp()).toBe(0);
  });

  it("un valor corrupto en localStorage se lee como 0, no como NaN contagiado", () => {
    window.localStorage.setItem("morrowasi_exp_v1", "NaN");
    expect(getExp()).toBe(0);
    addExp(15);
    expect(getExp()).toBe(15);
  });
});
