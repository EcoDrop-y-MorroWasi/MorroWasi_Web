import { useEffect, useState } from "react";

// Fuente única del reservorio de agua para toda la app (localStorage + evento
// custom, mismo patrón que hydroStore.ts/expStore.ts): capacidad configurada
// por la familia, nivel actual del tanque y total histórico ahorrado. Antes
// Dashboard/Album leían mockReservoir (fijo) y Misiones tenía su propio
// useState de litros de sesión que nunca persistía ni sumaba al total.
const STORAGE_KEY = "morrowasi_reservorio_v1";
const EVENT_NAME = "morrowasi-reservorio-actualizado";

interface ReservoirState {
  capacityLiters: number;
  currentLiters: number;
  totalLitersSaved: number;
}

function defaultState(): ReservoirState {
  return { capacityLiters: 0, currentLiters: 0, totalLitersSaved: 0 };
}

function readState(): ReservoirState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...(JSON.parse(raw) as Partial<ReservoirState>) };
  } catch {
    return defaultState();
  }
}

function writeState(next: ReservoirState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* localStorage no disponible */
  }
}

export function getReservoir(): ReservoirState {
  return readState();
}

/** Suma (o resta) litros: el nivel actual no baja de 0 ni supera la capacidad
 * configurada (si ya hay una definida), y el total histórico ahorrado no baja de 0. */
export function addLiters(delta: number): ReservoirState {
  const prev = readState();
  const rawCurrent = prev.currentLiters + delta;
  const cappedCurrent = prev.capacityLiters > 0 ? Math.min(prev.capacityLiters, rawCurrent) : rawCurrent;
  const next: ReservoirState = {
    ...prev,
    currentLiters: Math.max(0, cappedCurrent),
    totalLitersSaved: Math.max(0, prev.totalLitersSaved + delta),
  };
  writeState(next);
  return next;
}

export function setCapacityLiters(capacity: number): ReservoirState {
  const prev = readState();
  const next: ReservoirState = { ...prev, capacityLiters: Math.max(0, capacity) };
  writeState(next);
  return next;
}

/** Vuelve el nivel actual y el total histórico a 0, sin tocar la capacidad configurada. */
export function resetReservoir(): ReservoirState {
  const prev = readState();
  const next: ReservoirState = { ...prev, currentLiters: 0, totalLitersSaved: 0 };
  writeState(next);
  return next;
}

interface UseReservoir extends ReservoirState {
  addLiters: (delta: number) => void;
  setCapacityLiters: (capacity: number) => void;
  resetReservoir: () => void;
}

/** Hook reactivo: se mantiene igual en cualquier pestaña/pantalla y se actualiza en vivo. */
export function useReservoir(): UseReservoir {
  const [state, setState] = useState(readState);

  useEffect(() => {
    const refresh = () => setState(readState());
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return {
    ...state,
    addLiters: (delta: number) => setState(addLiters(delta)),
    setCapacityLiters: (capacity: number) => setState(setCapacityLiters(capacity)),
    resetReservoir: () => setState(resetReservoir()),
  };
}
