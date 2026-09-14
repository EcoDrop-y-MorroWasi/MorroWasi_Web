import { useMemo, useState } from "react";
import { readLedger, totalsFromLedger, totalsToday, ledgerMatches } from "../utils/leaderboardLedger";
import { getHydroPoints } from "../utils/hydroStore";
import { getExp } from "../utils/expStore";
import { MINIGAMES, MISIONES_DIARIAS_POOL, MISIONES_SEMANALES_POOL, MISIONES_MENSUALES } from "../utils/gamification";
import { coursesMock } from "../data/courses.mock";

// Visor del libro de eventos. Existe para que el libro no sea una caja negra:
// el usuario puede ver exactamente qué se registró y comprobar que el total
// coincide, sin abrir DevTools. También sirve de diagnóstico cuando el servidor
// rechaza un envío al ranking.

const ETIQUETA_TIPO: Record<string, string> = {
  juego: "🎮 Juego",
  mision: "✅ Misión",
  curso: "📚 Curso",
  ahorro: "💧 Ahorro",
};

/** Nombre legible de un ref del catálogo ("jg-1" → "Caza-Fugas Exprés"). */
function nombreDe(ref: string): string {
  const juego = MINIGAMES.find((g) => g.id === ref);
  if (juego) return juego.title;
  const mision = [...MISIONES_DIARIAS_POOL, ...MISIONES_SEMANALES_POOL, ...MISIONES_MENSUALES].find((m) => m.id === ref);
  if (mision) return mision.text;
  const curso = coursesMock.find((c) => c.id === ref);
  if (curso) return curso.title;
  if (ref === "personalizada") return "Misión personalizada";
  return ref;
}

const fecha = (t: number) =>
  new Date(t).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function LedgerViewer() {
  const [abierto, setAbierto] = useState(false);
  const [verTodo, setVerTodo] = useState(false);

  const eventos = useMemo(() => (abierto ? [...readLedger()].reverse() : []), [abierto]);
  const totales = useMemo(() => (abierto ? totalsFromLedger() : { exp: 0, hydro: 0 }), [abierto]);
  const hoy = useMemo(() => (abierto ? totalsToday() : { exp: 0, hydro: 0 }), [abierto]);
  const cuadra = abierto ? ledgerMatches(getExp(), getHydroPoints()) : true;

  const visibles = verTodo ? eventos : eventos.slice(0, 25);

  return (
    <div className="keyline-border rounded-2xl bg-surface p-4 sm:col-span-2">
      <p className="font-display text-sm font-bold text-secondary">Libro de eventos</p>
      <p className="mt-1 font-body text-xs text-ink/60">
        Cada vez que ganas EXP o HydroPuntos se anota aquí qué lo produjo. Es lo que se envía al
        ranking para comprobar que tu progreso es real — nunca solo el número final.
      </p>

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="mt-2 min-h-12 w-full rounded-xl border-2 border-ink bg-primary/30 px-4 font-display text-sm font-bold shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        {abierto ? "Ocultar mi libro de eventos" : "📒 Ver mi libro de eventos"}
      </button>

      {abierto && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="keyline-border rounded-xl bg-bg-light p-3">
              <p className="font-body text-[11px] font-bold text-ink/60">Hoy</p>
              <p className="font-display text-base font-extrabold text-accent">{hoy.hydro} HP</p>
              <p className="font-body text-[11px] text-ink/60">{hoy.exp} EXP</p>
            </div>
            <div className="keyline-border rounded-xl bg-bg-light p-3">
              <p className="font-body text-[11px] font-bold text-ink/60">Total del libro</p>
              <p className="font-display text-base font-extrabold text-accent">{totales.hydro} HP</p>
              <p className="font-body text-[11px] text-ink/60">{totales.exp} EXP</p>
            </div>
          </div>

          <p
            className={`keyline-border mt-2 rounded-xl p-3 font-body text-xs font-semibold ${
              cuadra ? "bg-[#8fcf9f]/40" : "bg-secondary/40"
            }`}
          >
            {cuadra
              ? "✅ El libro cuadra con tus totales."
              : `⚠️ El libro (${totales.hydro} HP / ${totales.exp} EXP) no coincide con tus totales (${getHydroPoints()} HP / ${getExp()} EXP). Es normal si ya jugabas antes de que existiera el libro: esos puntos viejos no tienen registro y el ranking solo contará los nuevos.`}
          </p>

          {eventos.length === 0 ? (
            <p className="mt-3 font-body text-xs text-ink/60">
              Todavía no hay eventos. Completa una misión o juega una partida y vuelve a mirar.
            </p>
          ) : (
            <>
              <ul className="mt-3 flex flex-col gap-1.5">
                {visibles.map((e) => (
                  <li
                    key={`${e.t}-${e.ref}`}
                    className="keyline-border flex items-center gap-2 rounded-xl bg-bg-light p-2"
                  >
                    <span className="shrink-0 rounded-lg border-2 border-ink bg-surface px-2 py-1 font-body text-[10px] font-bold">
                      {ETIQUETA_TIPO[e.tipo] ?? e.tipo}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-body text-xs font-semibold">{nombreDe(e.ref)}</span>
                      <span className="block font-body text-[10px] text-ink/55">
                        {fecha(e.t)} · <code>{e.ref}</code>
                      </span>
                    </span>
                    <span className="shrink-0 text-right font-display text-xs font-extrabold text-accent">
                      {e.hydro > 0 && <span className="block">+{e.hydro} HP</span>}
                      {e.exp > 0 && <span className="block">+{e.exp} EXP</span>}
                    </span>
                  </li>
                ))}
              </ul>

              {eventos.length > 25 && (
                <button
                  type="button"
                  onClick={() => setVerTodo((v) => !v)}
                  className="mt-2 min-h-12 w-full rounded-xl border-2 border-ink bg-bg-light font-display text-xs font-bold shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  {verTodo ? "Ver solo los últimos 25" : `Ver los ${eventos.length} eventos`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
