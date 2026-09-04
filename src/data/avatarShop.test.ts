import { describe, expect, it } from "vitest";
import { AVATARS, AVATAR_ACCESSORIES, findAccessory, findAvatar, prevAvatar } from "./avatarShop";

describe("avatarShop", () => {
  it("tiene 10 avatares de etapa + 1 secreto, alternando géneros como en el diseño", () => {
    expect(AVATARS).toHaveLength(11);
    const staged = AVATARS.filter((a) => !a.special);
    expect(staged).toHaveLength(10);
    expect(staged.filter((a) => a.gender === "m")).toHaveLength(2);
    const secret = AVATARS.find((a) => a.special);
    expect(secret?.id).toBe("nayeli");
  });

  it("cada avatar tiene exactamente 11 accesorios, el primero siempre gratis", () => {
    AVATARS.forEach((av) => {
      const accs = AVATAR_ACCESSORIES[av.id];
      expect(accs).toHaveLength(11);
      expect(accs[0].price).toBe(0);
      // precio no decrece a medida que avanza el slot
      for (let i = 1; i < accs.length; i++) {
        expect(accs[i].price).toBeGreaterThanOrEqual(accs[i - 1].price);
      }
    });
  });

  it("la skin especial (avatar tierIndex=special) cuesta más que la del primer avatar en el mismo slot", () => {
    const first = AVATAR_ACCESSORIES.yamile[5].price; // pecho, slot con precio
    const secret = AVATAR_ACCESSORIES.nayeli[5].price;
    expect(secret).toBeGreaterThan(first);
  });

  it("prevAvatar encadena las etapas en orden y no tiene anterior en la primera ni en la secreta", () => {
    const camila = findAvatar("camila")!;
    expect(prevAvatar(camila)?.id).toBe("yamile");
    const yamile = findAvatar("yamile")!;
    expect(prevAvatar(yamile)).toBeUndefined();
    const nayeli = findAvatar("nayeli")!;
    expect(prevAvatar(nayeli)).toBeUndefined();
  });

  it("findAccessory ubica un accesorio por id entre todos los avatares", () => {
    const acc = findAccessory("rosa-acc7");
    expect(acc?.avatarId).toBe("rosa");
    expect(acc?.slot).toBe("espalda");
    expect(findAccessory("no-existe")).toBeUndefined();
  });
});
