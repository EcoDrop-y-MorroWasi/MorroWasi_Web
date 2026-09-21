import { useEffect, useMemo, useState } from "react";
import MissionCard from "../components/MissionCard";
import {
  calcCustomXp,
  CUSTOM_TASK_ICONS,
  getConsejoDiario,
  getConsejoSemanal,
  getDayPeriodKey,
  getMisionesDiariasDeHoy,
  getMisionesSemanalesDeEstaSemana,
  getMonthPeriodKey,
  getWeekPeriodKey,
  MISIONES_MENSUALES,
} from "../utils/gamification";
import type { Task } from "../utils/gamification";
import { useExp } from "../utils/expStore";
import { addLiters } from "../utils/litersStore";
import { markActivityToday } from "../utils/streakStore";
import { recordLedgerEvent, removeLedgerEvent } from "../utils/leaderboardLedger";
import { playPop } from "../utils/sound";

type Tab = "diarias" | "semanales" | "mensuales" | "personalizadas";

const STORAGE_KEY = "morrowasi_misiones_v1";
// Sin tope, "personalizadas" era una fuente de EXP sin límite (creabas y completabas
// las que quisieras el mismo día) — rompía cualquier cálculo de cuánto EXP/día es
// legítimo. Mismo tope que las diarias fijas (4), para que no sea el atajo obvio.
const CUSTOM_DAILY_CAP = 4;

interface StoredState {
  periodoDiario: string;
  diariasCompletadas: string[];
  litrosHoy: number;
  periodoSemanal: string;
  semanalesCompletadas: string[];
  periodoMensual: string;
  mensualesCompletadas: string[];
  customTasks: Task[];
}

function readStored(): StoredState {
  const vacio: StoredState = {
    periodoDiario: "",
    diariasCompletadas: [],
    litrosHoy: 0,
    periodoSemanal: "",
    semanalesCompletadas: [],
    periodoMensual: "",
    mensualesCompletadas: [],
    customTasks: [],
  };
  if (typeof window === "undefined") return vacio;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return vacio;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      periodoDiario: parsed.periodoDiario ?? "",
      diariasCompletadas: parsed.diariasCompletadas ?? [],
      litrosHoy: Number.isFinite(parsed.litrosHoy) ? (parsed.litrosHoy as number) : 0,
      periodoSemanal: parsed.periodoSemanal ?? "",
      semanalesCompletadas: parsed.semanalesCompletadas ?? [],
      periodoMensual: parsed.periodoMensual ?? "",
      mensualesCompletadas: parsed.mensualesCompletadas ?? [],
      customTasks: parsed.customTasks ?? [],
    };
  } catch {
    return vacio;
  }
}

/**
 * Marca completadas solo las que corresponden al período guardado — si ya
 * pasó el día (diarias) o la semana (semanales), el bloque rotó a otro pool y
 * se muestra sin marcar aunque el id ya se haya completado en un período
 * anterior (ver getDayPeriodKey/getWeekPeriodKey en gamification.ts).
 */
function mergeStored(defaults: Task[], completadasIds: string[], periodoGuardado: string, periodoActual: string) {
  const completadas = periodoGuardado === periodoActual ? new Set(completadasIds) : new Set<string>();
  return defaults.map((t) => ({ ...t, completed: completadas.has(t.id) }));
}

export default function Misiones() {
  const [tab, setTab] = useState<Tab>("diarias");
  const [exp, addExp] = useExp();

  const periodoDiario = useMemo(() => getDayPeriodKey(), []);
  const periodoSemanal = useMemo(() => getWeekPeriodKey(), []);
  const periodoMensual = useMemo(() => getMonthPeriodKey(), []);

  const defaultsDiarias = useMemo<Task[]>(() => getMisionesDiariasDeHoy().map((m) => ({ ...m, completed: false } as Task)), []);
  const defaultsSemanales = useMemo<Task[]>(() => getMisionesSemanalesDeEstaSemana().map((m) => ({ ...m, completed: false } as Task)), []);
  const defaultsMensuales = useMemo<Task[]>(() => MISIONES_MENSUALES.map((m) => ({ ...m, completed: false } as Task)), []);

  const stored = useMemo(() => readStored(), []);
  const [tasks, setTasks] = useState<Task[]>(() => [
    ...mergeStored(defaultsDiarias, stored.diariasCompletadas, stored.periodoDiario, periodoDiario),
    ...mergeStored(defaultsSemanales, stored.semanalesCompletadas, stored.periodoSemanal, periodoSemanal),
    ...mergeStored(defaultsMensuales, stored.mensualesCompletadas, stored.periodoMensual, periodoMensual),
  ]);
  const [customTasks, setCustomTasks] = useState<Task[]>(stored.customTasks);
  // Cuántas personalizadas ya se completaron HOY — se deriva de completedAt (no de
  // un contador aparte) para no tener que resetearlo a mano cuando cambia el día.
  const customCompletadasHoy = useMemo(
    () => customTasks.filter((t) => t.completed && t.completedAt !== undefined && getDayPeriodKey(new Date(t.completedAt)) === periodoDiario).length,
    [customTasks, periodoDiario],
  );
  const customTopeAlcanzado = customCompletadasHoy >= CUSTOM_DAILY_CAP;
  // Litros ahorrados hoy vía misiones — se resetea solo cuando cambia periodoDiario
  // (antes era un useState(68) fijo, mock que ni se guardaba ni reflejaba nada real).
  const [litrosHoy, setLitrosHoy] = useState(() => (stored.periodoDiario === periodoDiario ? stored.litrosHoy : 0));

  const [customText, setCustomText] = useState("");
  const [customLitros, setCustomLitros] = useState(30);
  const [customIcon, setCustomIcon] = useState<string>(CUSTOM_TASK_ICONS[0]);
  const previewXp = calcCustomXp(customLitros);

  useEffect(() => {
    try {
      const diariasCompletadas = tasks.filter((t) => t.tab === "diaria" && t.completed).map((t) => t.id);
      const semanalesCompletadas = tasks.filter((t) => t.tab === "semanal" && t.completed).map((t) => t.id);
      const mensualesCompletadas = tasks.filter((t) => t.tab === "mensual" && t.completed).map((t) => t.id);
      const state: StoredState = {
        periodoDiario,
        diariasCompletadas,
        litrosHoy,
        periodoSemanal,
        semanalesCompletadas,
        periodoMensual,
        mensualesCompletadas,
        customTasks,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* mock local, sin BLE */
    }
  }, [tasks, customTasks, litrosHoy, periodoDiario, periodoSemanal, periodoMensual]);

  // Completar una misión es definitivo por hoy — no se puede desmarcar (queda
  // "✓ Listo" hasta que rote a otra misión al día siguiente, ver
  // getMisionesDiariasDeHoy/getMisionesSemanalesDeEstaSemana).
  const toggle = (id: string, isCustom: boolean) => {
    const list = isCustom ? customTasks : tasks;
    const target = list.find((t) => t.id === id);
    if (!target || target.completed) return;
    if (isCustom && customCompletadasHoy >= CUSTOM_DAILY_CAP) return;
    playPop();
    addExp(target.xp);
    // Las personalizadas las escribe el usuario, así que no tienen un id fijo en
    // el catálogo: van bajo "personalizada", cuyo rango de EXP el servidor acota
    // igual que calcCustomXp() (5 a 40).
    const ref = isCustom ? "personalizada" : target.id;
    const t = recordLedgerEvent("mision", ref, { exp: target.xp });
    addLiters(target.litersSaved);
    markActivityToday();
    setLitrosHoy((l) => l + target.litersSaved);
    if (isCustom) setCustomTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: true, completedAt: t ?? undefined } : task)));
    else setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: true } : task)));
  };

  // Solo las personalizadas se pueden borrar (las diarias/semanales son del
  // catálogo fijo, rotan solas). Si ya estaba completada, revierte el EXP y los
  // litros que otorgó y saca su evento del ledger para que no siga sumando en
  // el ranking.
  const deleteCustom = (id: string) => {
    const target = customTasks.find((t) => t.id === id);
    if (!target) return;
    if (target.completed) {
      addExp(-target.xp);
      addLiters(-target.litersSaved);
      setLitrosHoy((l) => Math.max(0, l - target.litersSaved));
      if (target.completedAt !== undefined) removeLedgerEvent(target.completedAt, "personalizada");
    }
    setCustomTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addCustom = () => {
    const txt = customText.trim();
    if (!txt) return;
    const xp = calcCustomXp(customLitros);
    const nt: Task = {
      id: `custom-${Date.now()}`,
      text: txt,
      litersSaved: customLitros,
      xp,
      completed: false,
      category: "otros",
      tab: "personalizada",
      icon: customIcon,
    };
    setCustomTasks((p) => [...p, nt]);
    setCustomText("");
  };

  // Misiones diarias/semanales del pool ya vienen en su orden de bloque (4 fijas
  // por rotación), no requieren reordenarse por id.
  const diariasOrdenadas = useMemo(() => tasks.filter((t) => t.tab === "diaria"), [tasks]);
  const semanales = useMemo(() => tasks.filter((t) => t.tab === "semanal"), [tasks]);
  const mensuales = useMemo(() => tasks.filter((t) => t.tab === "mensual"), [tasks]);

  const emojiPorCategoria = (cat: string) =>
    cat === "fugas" ? "🚰" : cat === "ducha" ? "🚿" : cat === "lavanderia" ? "♻️" : cat === "riego" ? "🌙" : cat === "cocina" ? "🍳" : "🎯";
  const emojiDiarias = (cat: string) => emojiPorCategoria(cat);
  const emojiSemanal = (cat: string) => emojiPorCategoria(cat);

  const consejoDiario = useMemo(() => getConsejoDiario(), []);
  const consejoSemanal = useMemo(() => getConsejoSemanal(), []);

  return (
    <div className="mx-auto max-w-[800px] bg-bg-light p-4" data-tour="pagina-misiones">
      {/* Header */}
      <h1 className="mb-4 flex items-center gap-2 text-[22px] font-extrabold leading-none text-ink">
        <span aria-hidden>🎯</span> Centro de Misiones
      </h1>

      {/* Tabs 48dp */}
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Categorías de misiones">
        {(["diarias", "semanales", "mensuales", "personalizadas"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`min-h-12 rounded-lg border-2 border-ink px-4 text-sm font-extrabold capitalize shadow-[2px_2px_0_#1c1c11] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${tab === t ? "bg-[#E26D5C] text-white" : "bg-[#FFB793] text-ink hover:brightness-105"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Info mock */}
      <div className="mb-4 flex gap-2 text-xs font-bold">
        <span className="rounded-full border-2 border-ink bg-surface px-3 py-1">
          {litrosHoy} L hoy · {exp} EXP
        </span>
      </div>

      {tab === "diarias" ? (
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border-2 border-ink bg-[#99B4D8]/30 p-4 shadow-[4px_4px_0_#1c1c11]">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-ink">
              <span aria-hidden>💡</span> Consejo del día
            </h2>
            <p className="text-sm text-ink">{consejoDiario}</p>
          </section>

          <section className="rounded-xl border-2 border-ink bg-surface p-[18px] shadow-[4px_4px_0_#1c1c11]">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
              <span aria-hidden>📋</span> Lista de tareas
            </h2>
            <ul className="flex flex-col gap-3" role="list">
              {diariasOrdenadas.map((m) => (
                <MissionCard
                  key={m.id}
                  text={m.text}
                  liters={m.litersSaved}
                  xp={m.xp}
                  completed={m.completed}
                  emoji={emojiDiarias(m.category)}
                  onToggle={() => toggle(m.id, false)}
                />
              ))}
            </ul>
          </section>
        </div>
      ) : tab === "semanales" ? (
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border-2 border-ink bg-[#FFB793]/40 p-4 shadow-[4px_4px_0_#1c1c11]">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-ink">
              <span aria-hidden>💡</span> Consejo de la semana
            </h2>
            <p className="text-sm text-ink">{consejoSemanal}</p>
          </section>

          <section className="rounded-xl border-2 border-ink bg-surface p-[18px] shadow-[4px_4px_0_#1c1c11]">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
              <span aria-hidden>📅</span> Desafío Semanal
            </h2>
            <ul className="flex flex-col gap-3" role="list">
              {semanales.map((m) => (
                <MissionCard
                  key={m.id}
                  text={m.text}
                  liters={m.litersSaved}
                  xp={m.xp}
                  completed={m.completed}
                  emoji={emojiSemanal(m.category)}
                  onToggle={() => toggle(m.id, false)}
                />
              ))}
            </ul>
          </section>
        </div>
      ) : tab === "mensuales" ? (
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border-2 border-ink bg-[#8fcf9f]/30 p-4 shadow-[4px_4px_0_#1c1c11]">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-ink">
              <span aria-hidden>🗓️</span> Retos del mes
            </h2>
            <p className="text-sm text-ink">Objetivos más grandes, con todo el mes para lograrlos. Se reinician al empezar el mes siguiente.</p>
          </section>

          <section className="rounded-xl border-2 border-ink bg-surface p-[18px] shadow-[4px_4px_0_#1c1c11]">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
              <span aria-hidden>🏆</span> Misiones del Mes
            </h2>
            <ul className="flex flex-col gap-3" role="list">
              {mensuales.map((m) => (
                <MissionCard
                  key={m.id}
                  text={m.text}
                  liters={m.litersSaved}
                  xp={m.xp}
                  completed={m.completed}
                  emoji="🗓️"
                  onToggle={() => toggle(m.id, false)}
                />
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <section className="rounded-xl border-2 border-ink bg-surface p-[18px] shadow-[4px_4px_0_#1c1c11]">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
            <span aria-hidden>✏️</span> Crear Misión Personalizada
          </h2>
          <p className={`mb-3 text-xs font-bold ${customTopeAlcanzado ? "text-[#E26D5C]" : "text-ink/60"}`}>
            {customTopeAlcanzado
              ? `Ya completaste ${CUSTOM_DAILY_CAP} misiones personalizadas hoy — vuelve mañana por más EXP.`
              : `Puedes completar ${CUSTOM_DAILY_CAP - customCompletadasHoy} más hoy (${customCompletadasHoy}/${CUSTOM_DAILY_CAP}).`}
          </p>
          <div className="flex flex-col gap-3">
            <input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Ej: Regar las plantas con agua reciclada"
              className="min-h-12 rounded-lg border-2 border-ink bg-surface px-3 text-sm"
              aria-label="Descripción de misión personalizada"
            />
            <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Elegir ícono de la misión">
              <span className="text-sm font-bold">Ícono:</span>
              {CUSTOM_TASK_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  role="radio"
                  aria-checked={customIcon === ic}
                  onClick={() => setCustomIcon(ic)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink text-lg shadow-[2px_2px_0_#1c1c11] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${customIcon === ic ? "bg-[#E26D5C]" : "bg-surface hover:brightness-105"}`}
                >
                  {ic}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm font-bold">Litros:</label>
              <input
                type="number"
                min={5}
                max={200}
                value={customLitros}
                onChange={(e) => setCustomLitros(Number(e.target.value) || 0)}
                className="min-h-12 w-24 rounded-lg border-2 border-ink bg-surface px-2 text-center text-sm font-bold"
                aria-label="Litros estimados"
              />
              <span className="rounded-full border-2 border-ink bg-[#FFB793] px-3 py-1 text-xs font-extrabold">
                {previewXp} XP · fórmula round(l/3) 5–40
              </span>
              <button
                type="button"
                onClick={addCustom}
                className="min-h-12 rounded-lg border-2 border-ink bg-[#99B4D8] px-4 text-sm font-extrabold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                + Agregar
              </button>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-3" role="list">
            {customTasks.map((m) => (
              <MissionCard
                key={m.id}
                text={m.text}
                liters={m.litersSaved}
                xp={m.xp}
                completed={m.completed}
                disabled={!m.completed && customTopeAlcanzado}
                emoji={m.icon ?? "✏️"}
                onToggle={() => toggle(m.id, true)}
                onDelete={() => deleteCustom(m.id)}
              />
            ))}
          </ul>
          {customTasks.length === 0 && <p className="mt-3 text-sm text-ink/60">Aún no creaste misiones personalizadas.</p>}
        </section>
      )}
    </div>
  );
}
