import { useCallback, useEffect, useMemo, useState } from "react";
import { AVATAR_ACCESSORIES, GOLD, findAccessory, findAvatar, type Avatar } from "../data/avatarShop";

// Estado persistente de la Tienda de Avatares: accesorios comprados, equipados,
// y colores elegidos para cada Skin Especial. Mismo patrón que hydroStore.ts
// (localStorage + evento custom) para que sobreviva a la navegación.
const STORAGE_KEY = "morrowasi_avatares_v1";
const EVENT_NAME = "morrowasi-avatares-actualizado";

interface SpecialSkinState {
  active: boolean;
  colorA: string;
  colorB: string;
}

interface ShopState {
  ownedAccessoryIds: string[];
  equipped: Record<string, Partial<Record<string, string>>>; // avatarId -> slot -> accessoryId
  specialSkin: Record<string, SpecialSkinState>;
  selectedAvatarId: string;
}

function defaultState(): ShopState {
  return { ownedAccessoryIds: [], equipped: {}, specialSkin: {}, selectedAvatarId: "yamile" };
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

  const specialSkinFor = useCallback(
    (av: Avatar): SpecialSkinState => state.specialSkin[av.id] || { active: false, colorA: av.accent, colorB: GOLD },
    [state.specialSkin],
  );

  const setSpecialColor = useCallback(
    (avatarId: string, which: "colorA" | "colorB", color: string) => {
      update((prev) => {
        const av = findAvatar(avatarId)!;
        const current = prev.specialSkin[avatarId] || { active: false, colorA: av.accent, colorB: GOLD };
        return { ...prev, specialSkin: { ...prev.specialSkin, [avatarId]: { ...current, [which]: color } } };
      });
    },
    [update],
  );

  const toggleSpecialSkin = useCallback(
    (avatarId: string) => {
      update((prev) => {
        const av = findAvatar(avatarId)!;
        const current = prev.specialSkin[avatarId] || { active: false, colorA: av.accent, colorB: GOLD };
        return { ...prev, specialSkin: { ...prev.specialSkin, [avatarId]: { ...current, active: !current.active } } };
      });
    },
    [update],
  );

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
      setSpecialColor,
      toggleSpecialSkin,
    }),
    [isOwned, allOwned, ownAccessory, toggleEquip, equippedIdFor, state.selectedAvatarId, setSelectedAvatar, specialSkinFor, setSpecialColor, toggleSpecialSkin],
  );
}
