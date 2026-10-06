import { useCallback, useEffect, useMemo, useState } from "react";
import { AVATAR_ACCESSORIES, SPECIAL_SKIN_PRICE, findAccessory, type Avatar } from "../data/avatarShop";
import { addHydroPoints, getHydroPoints } from "./hydroStore";

// Estado persistente de la Tienda de Avatares: accesorios comprados, equipados,
// y qué Skin Especial está puesta (su modelo _esp es fijo, sin colores a elegir). Mismo patrón que hydroStore.ts
// (localStorage + evento custom) para que sobreviva a la navegación.
const STORAGE_KEY = "morrowasi_avatares_v1";
const EVENT_NAME = "morrowasi-avatares-actualizado";

// Guardados viejos pueden traer colorA/colorB (cuando se elegían 2 colores):
// se ignoran, sin migración — solo importa "active".
interface SpecialSkinState {
  active: boolean;
}

interface ShopState {
  ownedAccessoryIds: string[];
  equipped: Record<string, Partial<Record<string, string>>>; // avatarId -> slot -> accessoryId
  specialSkin: Record<string, SpecialSkinState>;
  /** Avatares cuya Skin Especial ya se pagó (SPECIAL_SKIN_PRICE). */
  ownedSpecialSkins: string[];
  selectedAvatarId: string;
}

function defaultState(): ShopState {
  return { ownedAccessoryIds: [], equipped: {}, specialSkin: {}, ownedSpecialSkins: [], selectedAvatarId: "angie" };
}

function readState(): ShopState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<ShopState>;
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function writeState(next: ShopState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* localStorage no disponible */
  }
}

/** Total de accesorios comprados en todos los avatares — vitrina del ranking. */
export function countOwnedAccessories(): number {
  try {
    return readState().ownedAccessoryIds.length;
  } catch {
    return 0;
  }
}

/** Avatar de tienda seleccionado + cuántos de sus 11 accesorios tiene (x/11 del ranking). */
export function selectedAvatarProgress(): { avatarId: string; owned: number } {
  try {
    const s = readState();
    const accs = AVATAR_ACCESSORIES[s.selectedAvatarId] ?? [];
    const owned = accs.filter((a) => s.ownedAccessoryIds.includes(a.id)).length;
    return { avatarId: s.selectedAvatarId, owned };
  } catch {
    return { avatarId: "angie", owned: 0 };
  }
}

/**
 * Cobra SPECIAL_SKIN_PRICE y deja la Skin Especial comprada y puesta. Exige el
 * set de 11 accesorios completo, relee el saldo real al pagar y no cobra dos
 * veces (mismo criterio que purchaseCourse). Devuelve false si falta algo.
 */
export function purchaseSpecialSkin(avatarId: string): boolean {  const s = readState();
  if (s.ownedSpecialSkins.includes(avatarId)) return true;
  const accs = AVATAR_ACCESSORIES[avatarId];
  if (!accs || !accs.every((a) => s.ownedAccessoryIds.includes(a.id))) return false;
  if (getHydroPoints() < SPECIAL_SKIN_PRICE) return false;
  writeState({
    ...s,
    ownedSpecialSkins: [...s.ownedSpecialSkins, avatarId],
    specialSkin: { ...s.specialSkin, [avatarId]: { active: true } },
  });
  addHydroPoints(-SPECIAL_SKIN_PRICE);
  return true;
}

export function useAvatarShop() {
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

  const update = useCallback((fn: (prev: ShopState) => ShopState) => {
    setState((prev) => {
      const next = fn(prev);
      writeState(next);
      return next;
    });
  }, []);

  const isOwned = useCallback((accessoryId: string) => state.ownedAccessoryIds.includes(accessoryId), [state.ownedAccessoryIds]);
  const allOwned = useCallback((av: Avatar) => AVATAR_ACCESSORIES[av.id].every((a) => isOwned(a.id)), [isOwned]);

  const ownAccessory = useCallback((accessoryId: string) => {
    const acc = findAccessory(accessoryId);
    if (!acc) return;
    update((prev) => ({
      ...prev,
      ownedAccessoryIds: prev.ownedAccessoryIds.includes(accessoryId) ? prev.ownedAccessoryIds : [...prev.ownedAccessoryIds, accessoryId],
      equipped: { ...prev.equipped, [acc.avatarId]: { ...prev.equipped[acc.avatarId], [acc.slot]: accessoryId } },
    }));
  }, [update]);

  const toggleEquip = useCallback((accessoryId: string) => {
    const acc = findAccessory(accessoryId);
    if (!acc) return;
    update((prev) => {
      const current = prev.equipped[acc.avatarId] || {};
      const isEquipped = current[acc.slot] === accessoryId;
      return {
        ...prev,
        equipped: { ...prev.equipped, [acc.avatarId]: { ...current, [acc.slot]: isEquipped ? undefined : accessoryId } },
      };
    });
  }, [update]);

  const setSelectedAvatar = useCallback((id: string) => update((prev) => ({ ...prev, selectedAvatarId: id })), [update]);

  const isSpecialOwned = useCallback((avatarId: string) => state.ownedSpecialSkins.includes(avatarId), [state.ownedSpecialSkins]);

  // "Puesta" exige haberla pagado: un active=true guardado sin compra (la vieja
  // vista previa lo persistía, y antes no se cobraba) no cuenta.
  const specialSkinFor = useCallback(
    (av: Avatar): SpecialSkinState => ({ active: !!state.specialSkin[av.id]?.active && state.ownedSpecialSkins.includes(av.id) }),
    [state.specialSkin, state.ownedSpecialSkins],
  );

  const toggleSpecialSkin = useCallback(
    (avatarId: string) => {
      update((prev) =>
        prev.ownedSpecialSkins.includes(avatarId)
          ? { ...prev, specialSkin: { ...prev.specialSkin, [avatarId]: { active: !prev.specialSkin[avatarId]?.active } } }
          : prev,
      );
    },
    [update],
  );

  // writeState dispara EVENT_NAME, así que el estado del hook se refresca solo.
  const buySpecialSkin = useCallback((av: Avatar) => purchaseSpecialSkin(av.id), []);

  const equippedIdFor = useCallback((avatarId: string, slot: string) => state.equipped[avatarId]?.[slot], [state.equipped]);

  return useMemo(
    () => ({
      isOwned,
      allOwned,
      ownAccessory,
      toggleEquip,
      equippedIdFor,
      selectedAvatarId: state.selectedAvatarId,
      setSelectedAvatar,
      specialSkinFor,
      toggleSpecialSkin,
      isSpecialOwned,
      buySpecialSkin,
    }),
    [isOwned, allOwned, ownAccessory, toggleEquip, equippedIdFor, state.selectedAvatarId, setSelectedAvatar, specialSkinFor, toggleSpecialSkin, isSpecialOwned, buySpecialSkin],
  );
}
