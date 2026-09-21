import { beforeEach, describe, expect, it } from "vitest";
import {
  ledgerMatches,
  readLedger,
  recordLedgerEvent,
  removeLedgerEvent,
  startOfTodayLima,
  totalsFromLedger,
  totalsToday,
} from "./leaderboardLedger";

const LEDGER_KEY = "morrowasi_ledger_v1";
const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  window.localStorage.clear();
});

describe("recordLedgerEvent", () => {
  it("agrega un evento y devuelve su marca de tiempo", () => {
    const t = recordLedgerEvent("mision", "diaria-01", { exp: 5, hydro: 0 });
    expect(t).toEqual(expect.any(Number));
    expect(readLedger()).toEqual([{ t, tipo: "mision", ref: "diaria-01", exp: 5, hydro: 0 }]);
  });

  it("un evento sin puntos (0 y 0) no se registra — devuelve null", () => {
    const t = recordLedgerEvent("mision", "diaria-01", { exp: 0, hydro: 0 });
    expect(t).toBeNull();
    expect(readLedger()).toHaveLength(0);
  });

  it("redondea y nunca guarda negativos, aunque el llamador mande algo raro", () => {
    recordLedgerEvent("juego", "jg-1", { exp: -50, hydro: 30.6 });
    expect(readLedger()[0]).toMatchObject({ exp: 0, hydro: 31 });
  });
});

describe("removeLedgerEvent", () => {
  it("saca el evento exacto (t + ref) sin tocar los demás", () => {
    const t1 = recordLedgerEvent("curso", "sodis", { exp: 30, hydro: 150 });
    recordLedgerEvent("curso", "aguas-grises", { exp: 40, hydro: 200 });
    removeLedgerEvent(t1!, "sodis");
    const restantes = readLedger();
    expect(restantes).toHaveLength(1);
    expect(restantes[0].ref).toBe("aguas-grises");
  });
});

describe("readLedger — retención de 95 días", () => {
  it("descarta eventos más viejos que la ventana de retención, conserva los vigentes", () => {
    const ahora = Date.now();
    const viejo = { t: ahora - 96 * DAY_MS, tipo: "juego" as const, ref: "jg-1", exp: 20, hydro: 100 };
    const vigente = { t: ahora - 10 * DAY_MS, tipo: "juego" as const, ref: "jg-2", exp: 20, hydro: 100 };
    window.localStorage.setItem(LEDGER_KEY, JSON.stringify([viejo, vigente]));
    const leidos = readLedger();
    expect(leidos).toHaveLength(1);
    expect(leidos[0].ref).toBe("jg-2");
  });

  it("un payload corrupto (no es un array, o un elemento le falta un campo) no rompe nada", () => {
    window.localStorage.setItem(LEDGER_KEY, "esto no es json de un array");
    expect(readLedger()).toEqual([]);
    window.localStorage.setItem(
      LEDGER_KEY,
      JSON.stringify([{ tipo: "juego" }, { t: Date.now(), tipo: "juego", ref: "x", exp: 1, hydro: 1 }]),
    );
    expect(readLedger()).toHaveLength(1);
  });
});

describe("totales", () => {
  it("totalsFromLedger suma exp e hydro de todo lo vigente", () => {
    recordLedgerEvent("mision", "diaria-01", { exp: 5, hydro: 0 });
    recordLedgerEvent("juego", "jg-1", { exp: 0, hydro: 100 });
    expect(totalsFromLedger()).toEqual({ exp: 5, hydro: 100 });
  });

  it("totalsToday solo cuenta desde la medianoche de Lima, no desde hace 24h reloj", () => {
    const hoy = startOfTodayLima();
    const eventoAyer = { t: hoy - 1, tipo: "mision" as const, ref: "diaria-01", exp: 5, hydro: 0 };
    const eventoHoy = { t: hoy + 1000, tipo: "mision" as const, ref: "diaria-02", exp: 8, hydro: 0 };
    window.localStorage.setItem(LEDGER_KEY, JSON.stringify([eventoAyer, eventoHoy]));
    expect(totalsToday()).toEqual({ exp: 8, hydro: 0 });
  });
});

describe("ledgerMatches", () => {
  it("true cuando el total guardado coincide con la suma real del libro", () => {
    recordLedgerEvent("curso", "sodis", { exp: 30, hydro: 150 });
    expect(ledgerMatches(30, 150)).toBe(true);
  });

  it("false cuando alguien editó el total a mano por fuera del libro", () => {
    recordLedgerEvent("curso", "sodis", { exp: 30, hydro: 150 });
    expect(ledgerMatches(9999, 9999)).toBe(false);
  });
});
