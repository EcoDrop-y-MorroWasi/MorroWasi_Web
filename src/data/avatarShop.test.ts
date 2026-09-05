import { describe, expect, it } from "vitest";
import { ACCESSORY_ICONS, AVATARS, AVATAR_ACCESSORIES, findAccessory, findAvatar, prevAvatar } from "./avatarShop";

describe("avatarShop", () => {
  it("tiene 10 avatares de etapa + 1 secreto, alternando géneros como en el diseño", () => {
    expect(AVATARS).toHaveLength(11);
    const staged = AVATARS.filter((a) => !a.special);
    expect(staged).toHaveLength(10);
    expect(staged.filter((a) => a.gender === "m")).toHaveLength(2);
    const secret = AVATARS.find((a) => a.special);
    expect(secret?.id).toBe("claudio");
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
    const first = AVATAR_ACCESSORIES.angie[5].price; // pecho, slot con precio
    const secret = AVATAR_ACCESSORIES.claudio[5].price;
    expect(secret).toBeGreaterThan(first);
  });

  it("prevAvatar encadena las etapas en orden y no tiene anterior en la primera ni en la secreta", () => {
    const britney = findAvatar("britney")!;
    expect(prevAvatar(britney)?.id).toBe("angie");
    const angie = findAvatar("angie")!;
    expect(prevAvatar(angie)).toBeUndefined();
    const claudio = findAvatar("claudio")!;
    expect(prevAvatar(claudio)).toBeUndefined();
  });

  it("findAccessory ubica un accesorio por id entre todos los avatares", () => {
    const acc = findAccessory("flordejesus-acc7");
    expect(acc?.avatarId).toBe("flordejesus");
    expect(acc?.slot).toBe("espalda");
    expect(findAccessory("no-existe")).toBeUndefined();
  });

  it("cada accesorio pago es único en todo el juego — solo el gratis (price 0) puede repetirse", () => {
    const seenPaid = new Map<string, string>(); // nombre -> "avatarId-index" donde se vio primero
    AVATARS.forEach((av) => {
      AVATAR_ACCESSORIES[av.id].forEach((acc) => {
        if (acc.price === 0) return; // el gratuito puede repetir nombre entre avatares
        const previo = seenPaid.get(acc.name);
        expect(previo, `"${acc.name}" de ${av.id} ya existía en ${previo}`).toBeUndefined();
        seenPaid.set(acc.name, `${av.id}[${acc.index}]`);
      });
    });
  });

  it("cada accesorio pago tiene un ícono único en todo el juego — solo el gratis puede repetirse", () => {
    const seenPaid = new Map<string, string>(); // ícono -> "avatarId[index]" donde se vio primero
    AVATARS.forEach((av) => {
      AVATAR_ACCESSORIES[av.id].forEach((acc) => {
        const icon = ACCESSORY_ICONS[av.id]?.[acc.index];
        expect(icon, `falta ícono para ${av.id}[${acc.index}]`).toBeTruthy();
        if (acc.price === 0) return;
        const previo = seenPaid.get(icon!);
        expect(previo, `ícono "${icon}" de ${av.id}[${acc.index}] ya existía en ${previo}`).toBeUndefined();
        seenPaid.set(icon!, `${av.id}[${acc.index}]`);
      });
    });
  });
});
