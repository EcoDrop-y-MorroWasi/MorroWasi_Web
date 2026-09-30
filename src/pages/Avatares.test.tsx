import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AVATAR_ACCESSORIES, SPECIAL_SKIN_PRICE } from "../data/avatarShop";
import { getHydroPoints } from "../utils/hydroStore";
import Avatares from "./Avatares";

// jsdom no tiene WebGL ni canvas 2D: el visor 3D se reemplaza por un <div> que
// expone qué modelo está mostrando, y el pintado 2D por canvas vacíos.
vi.mock("../components/AvatarModelViewer", () => ({
  default: ({ content }: { content: { avatarUrl: string; accessories: { id: string }[] } }) => (
    <div data-testid="visor" data-url={content.avatarUrl} data-accs={content.accessories.map((a) => a.id).join(",")} />
  ),
}));
vi.mock("../components/AvatarSkinViewer", () => ({ default: () => <div data-testid="visor-skin" /> }));
vi.mock("../utils/avatarSkinPainter", async (importOriginal) => {
  const real = await importOriginal<typeof import("../utils/avatarSkinPainter")>();
  const blank = () => document.createElement("canvas");
  return { ...real, buildSkinCanvas: blank, buildSpecialSkin: blank, buildCapeCanvas: blank };
});

const KEY = "morrowasi_avatares_v1";
const read = () => JSON.parse(window.localStorage.getItem(KEY) || "{}");
function seed(opts: { complete?: boolean; hp?: number }) {
  const owned = opts.complete ? AVATAR_ACCESSORIES.angie.map((a) => a.id) : [];
  window.localStorage.setItem(KEY, JSON.stringify({ ownedAccessoryIds: owned, selectedAvatarId: "angie" }));
  window.localStorage.setItem("morrowasi_hydropuntos_v1", String(opts.hp ?? 0));
}
const visorUrl = () => screen.getByTestId("visor").getAttribute("data-url") || "";
const visorAccs = () => (screen.getByTestId("visor").getAttribute("data-accs") || "").split(",").filter(Boolean);
const card = (name: string) => screen.getByText(name).closest("div.keyline-border") as HTMLElement;
const click = (name: RegExp) => act(() => void fireEvent.click(screen.getByRole("button", { name })));

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("Avatares — Skin Especial", () => {
  it("sin el set completo: solo vista previa, que se ve pero no se guarda", () => {
    seed({ complete: false });
    render(<Avatares wasiStage={10} />);
    expect(screen.queryByRole("button", { name: /Desbloquear/ })).toBeNull();
    expect(visorUrl()).not.toContain("especial");

    click(/Vista previa de la Skin Especial/);
    expect(visorUrl()).toContain("angie-especial");
    expect(screen.getByRole("button", { name: /Quitar vista previa/ })).toBeTruthy();
    expect(read().specialSkin?.angie).toBeUndefined();
    expect(read().ownedSpecialSkins ?? []).toEqual([]);
  });

  it("la vista previa se apaga al cambiar de avatar", () => {
    seed({ complete: false });
    render(<Avatares wasiStage={10} />);
    click(/Vista previa de la Skin Especial/);
    expect(visorUrl()).toContain("angie-especial");

    const pick = (name: string) => {
      const list = screen.getByRole("list", { name: "Colección de avatares" });
      act(() => void fireEvent.click(within(list).getByText(name).closest("button")!));
    };
    pick("Britney");
    expect(visorUrl()).toContain("/britney.");
    pick("Angie");
    expect(visorUrl()).not.toContain("especial");
    expect(screen.getByRole("button", { name: /Vista previa de la Skin Especial/ })).toBeTruthy();
  });

  it(`con el set completo se compra por ${SPECIAL_SKIN_PRICE} HP y queda puesta`, () => {
    seed({ complete: true, hp: SPECIAL_SKIN_PRICE + 100 });
    render(<Avatares wasiStage={10} />);
    click(new RegExp(`Desbloquear.*${SPECIAL_SKIN_PRICE}`));

    expect(getHydroPoints()).toBe(100);
    expect(read().ownedSpecialSkins).toEqual(["angie"]);
    expect(visorUrl()).toContain("angie-especial");
    // Ya comprada: el botón es ponérsela/sacársela, sin vista previa ni compra.
    expect(screen.queryByRole("button", { name: /Desbloquear/ })).toBeNull();
    click(/volver al look normal/);
    expect(visorUrl()).not.toContain("especial");
    click(/Usar la Skin Especial/);
    expect(read().specialSkin.angie.active).toBe(true);
  });

  it("sin HP suficientes avisa cuánto falta y no cobra", () => {
    const hp = SPECIAL_SKIN_PRICE - 60;
    seed({ complete: true, hp });
    render(<Avatares wasiStage={10} />);
    click(/Desbloquear/);
    expect(screen.getByText("Te faltan 60 HP para la Skin Especial")).toBeTruthy();
    expect(getHydroPoints()).toBe(hp);
    expect(read().ownedSpecialSkins ?? []).toEqual([]);
  });
});

describe("Avatares — accesorios 3D", () => {
  const LENTES = AVATAR_ACCESSORIES.angie[2].name; // angie-acc2
  const PRECIO = AVATAR_ACCESSORIES.angie[2].price;

  it("la tarjeta muestra la foto 3D de la pieza", () => {
    seed({});
    render(<Avatares wasiStage={10} />);
    expect(card(LENTES).querySelector("img")?.getAttribute("src")).toMatch(/^\/models\/miniaturas\/angie-acc2\./);
  });

  it("probárselo lo pone en el avatar 3D antes de comprarlo, sin guardarlo", () => {
    seed({ hp: 0 });
    render(<Avatares wasiStage={10} />);
    expect(visorAccs()).toEqual([]);
    act(() => void fireEvent.click(card(LENTES)));
    expect(visorAccs()).toEqual(["angie-acc2"]);
    expect(read().ownedAccessoryIds).toEqual([]);
    act(() => void fireEvent.click(within(card(LENTES)).getByRole("button", { name: "Quitar" })));
    expect(visorAccs()).toEqual([]);
  });

  it("comprado queda puesto, y tocándolo se saca y se vuelve a poner", () => {
    seed({ hp: 500 });
    render(<Avatares wasiStage={10} />);
    act(() => void fireEvent.click(card(LENTES)));
    act(() => void fireEvent.click(within(card(LENTES)).getByRole("button", { name: "Comprar" })));
    expect(getHydroPoints()).toBe(500 - PRECIO);
    expect(read().ownedAccessoryIds).toEqual(["angie-acc2"]);
    expect(visorAccs()).toEqual(["angie-acc2"]);
    act(() => void fireEvent.click(card(LENTES)));
    expect(visorAccs()).toEqual([]);
    act(() => void fireEvent.click(card(LENTES)));
    expect(visorAccs()).toEqual(["angie-acc2"]);
  });

  it("con la Skin Especial en vista previa no se muestran los accesorios", () => {
    seed({ hp: 500 });
    render(<Avatares wasiStage={10} />);
    act(() => void fireEvent.click(card(LENTES)));
    expect(visorAccs()).toEqual(["angie-acc2"]);
    click(/Vista previa de la Skin Especial/);
    expect(visorAccs()).toEqual([]);
  });
});
