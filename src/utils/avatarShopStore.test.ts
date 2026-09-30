import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AVATAR_ACCESSORIES, SPECIAL_SKIN_PRICE, findAvatar } from "../data/avatarShop";
import { addHydroPoints, getHydroPoints } from "./hydroStore";
import { purchaseSpecialSkin, useAvatarShop } from "./avatarShopStore";

const KEY = "morrowasi_avatares_v1";
const read = () => JSON.parse(window.localStorage.getItem(KEY) || "{}");
const seed = (state: object) => window.localStorage.setItem(KEY, JSON.stringify(state));
const allOf = (avatarId: string, except = 0) => AVATAR_ACCESSORIES[avatarId].slice(except).map((a) => a.id);
const angie = findAvatar("angie")!;

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("purchaseSpecialSkin", () => {
  it(`cuesta ${SPECIAL_SKIN_PRICE} HP, exige los 11 accesorios y queda comprada y puesta`, () => {
    seed({ ownedAccessoryIds: allOf("angie") });
    addHydroPoints(SPECIAL_SKIN_PRICE + 40);
    expect(purchaseSpecialSkin("angie")).toBe(true);
    expect(getHydroPoints()).toBe(40);
    expect(read().ownedSpecialSkins).toEqual(["angie"]);
    expect(read().specialSkin.angie.active).toBe(true);
    // Segunda vez no vuelve a cobrar.
    expect(purchaseSpecialSkin("angie")).toBe(true);
    expect(getHydroPoints()).toBe(40);
  });

  it("con un accesorio faltante no cobra ni desbloquea", () => {
    seed({ ownedAccessoryIds: allOf("angie", 1) });
    addHydroPoints(5000);
    expect(purchaseSpecialSkin("angie")).toBe(false);
    expect(getHydroPoints()).toBe(5000);
    expect(read().ownedSpecialSkins ?? []).toEqual([]);
  });

  it("sin HP suficientes no cobra ni desbloquea", () => {
    seed({ ownedAccessoryIds: allOf("britney") });
    addHydroPoints(SPECIAL_SKIN_PRICE - 1);
    expect(purchaseSpecialSkin("britney")).toBe(false);
    expect(getHydroPoints()).toBe(SPECIAL_SKIN_PRICE - 1);
  });
});

describe("useAvatarShop — Skin Especial", () => {
  it("un active=true guardado sin haberla comprado no cuenta (la vieja vista previa lo persistía)", () => {
    seed({ ownedAccessoryIds: allOf("angie"), specialSkin: { angie: { active: true, colorA: "#fff", colorB: "#000" } } });
    const { result } = renderHook(() => useAvatarShop());
    expect(result.current.isSpecialOwned("angie")).toBe(false);
    expect(result.current.specialSkinFor(angie).active).toBe(false);
  });

  it("sin comprarla, ponérsela no hace nada", () => {
    seed({ ownedAccessoryIds: allOf("angie") });
    const { result } = renderHook(() => useAvatarShop());
    act(() => result.current.toggleSpecialSkin("angie"));
    expect(result.current.specialSkinFor(angie).active).toBe(false);
    expect(read().specialSkin?.angie).toBeUndefined();
  });

  it("al comprarla el hook se actualiza solo y después se puede sacar y poner", () => {
    seed({ ownedAccessoryIds: allOf("angie") });
    addHydroPoints(SPECIAL_SKIN_PRICE);
    const { result } = renderHook(() => useAvatarShop());
    expect(result.current.allOwned(angie)).toBe(true);

    let ok = false;
    act(() => {
      ok = result.current.buySpecialSkin(angie);
    });
    expect(ok).toBe(true);
    expect(result.current.isSpecialOwned("angie")).toBe(true);
    expect(result.current.specialSkinFor(angie).active).toBe(true);
    expect(getHydroPoints()).toBe(0);

    act(() => result.current.toggleSpecialSkin("angie"));
    expect(result.current.specialSkinFor(angie).active).toBe(false);
    act(() => result.current.toggleSpecialSkin("angie"));
    expect(result.current.specialSkinFor(angie).active).toBe(true);
    expect(read().specialSkin.angie.active).toBe(true);
  });

  it("dos pantallas con el hook montado se enteran de la compra", () => {
    seed({ ownedAccessoryIds: allOf("angie") });
    addHydroPoints(SPECIAL_SKIN_PRICE);
    const a = renderHook(() => useAvatarShop());
    const b = renderHook(() => useAvatarShop());
    act(() => {
      a.result.current.buySpecialSkin(angie);
    });
    expect(b.result.current.isSpecialOwned("angie")).toBe(true);
  });
});
