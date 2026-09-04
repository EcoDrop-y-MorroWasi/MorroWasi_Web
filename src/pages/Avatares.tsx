import { useEffect, useMemo, useState } from "react";
import {
  AVATARS,
  SPECIAL_CAPE_TYPES,
  SPECIAL_LOOKS,
  SWATCHES,
  findAccessory,
  findAvatar,
  prevAvatar,
  type Accessory,
  type AccessorySlot,
  type Avatar,
} from "../data/avatarShop";
import {
  accessoriesFor,
  buildCapeCanvas,
  buildSkinCanvas,
  buildSpecialSkin,
  getAvatarThumbnail,
  type EquippedDisplay,
} from "../utils/avatarSkinPainter";
import { useAvatarShop } from "../utils/avatarShopStore";
import { getHydroPoints, useHydroPoints } from "../utils/hydroStore";
import { allCoursesCompleted, allGamesCompleted } from "../utils/completionStore";
import AvatarSkinViewer from "../components/AvatarSkinViewer";

// Tienda de Avatares 3D — portada de web/mockups/tienda-avatares-3d.html.
// 10 avatares (uno por etapa del Wasi, RF-Wasi) + 1 secreto, 11 accesorios cada
// uno en 6 zonas reales del modelo 3D, y una Skin Especial de 2 colores al
// completar el set. Gasta y persiste sobre los mismos HydroPuntos del resto
// de la app (utils/hydroStore.ts) — no crea una moneda paralela.

const SLOT_ICON: Record<AccessorySlot, string[]> = {
  cabeza: ["🧢", "🎀", "👑"],
  cara: ["🕶️", "🎭"],
  pecho: ["🦺", "🏅"],
  espalda: ["🧣", "🎒"],
  piernas: ["👢", "🩹"],
  manos: [],
};
const HAND_ICON: Record<string, string> = { regadera: "🚿", balde: "🪣", libro: "📖", vara: "🪄" };
const SLOT_LABEL: Record<AccessorySlot, string> = { cabeza: "Cabeza", cara: "Cara", pecho: "Pecho", espalda: "Espalda", piernas: "Piernas", manos: "Manos" };

function accessoryIcon(acc: Accessory): string {
  if (acc.slot === "manos") return HAND_ICON[acc.handShape || "regadera"];
  return SLOT_ICON[acc.slot][acc.poolIndex] || "❔";
}

function fmt(n: number): string {
  return n.toLocaleString("es-PE");
}

interface AvataresProps {
  /** Etapa actual del Wasi (1-10), misma fuente que Academia (calcWasiStage). */
  wasiStage: number;
}

export default function Avatares({ wasiStage }: AvataresProps) {
  const [hydroPoints, addHydroPoints] = useHydroPoints();
  const shop = useAvatarShop();
  const [previewing, setPreviewing] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(t);
  }, [toast]);

  const av = findAvatar(shop.selectedAvatarId) || AVATARS[0];

  const allAccessoriesComplete = useMemo(() => AVATARS.filter((a) => !a.special).every((a) => shop.allOwned(a)), [shop]);
  // Se recalculan en cada render (lecturas baratas de localStorage): el jugador puede
  // volver de Juegos/Academia con progreso nuevo sin recargar la página.
  const achievements = {
    stage10: wasiStage >= 10,
    allGames: allGamesCompleted(),
    allCourses: allCoursesCompleted(),
    allAccessories: allAccessoriesComplete,
  };
  const secretUnlocked = achievements.stage10 && achievements.allGames && achievements.allCourses && achievements.allAccessories;

  const avatarUnlocked = (a: Avatar) => (a.special ? secretUnlocked : (a.stage ?? Infinity) <= wasiStage);
  const gateOk = (a: Avatar) => {
    const p = prevAvatar(a);
    return !p || shop.allOwned(p);
  };

  const unlocked = avatarUnlocked(av);
  const gate = gateOk(av);
  const accessories = accessoriesFor(av.id);
  const ownedCount = accessories.filter((a) => shop.isOwned(a.id)).length;
  const complete = shop.allOwned(av);
  const special = shop.specialSkinFor(av);
  const specialLook = SPECIAL_LOOKS[av.id] || SPECIAL_LOOKS.yamile;

  const previewKey = (slot: AccessorySlot) => `${av.id}:${slot}`;

  const equipped = useMemo<EquippedDisplay>(() => {
    const out: EquippedDisplay = {};
    (["cabeza", "cara", "pecho", "espalda", "piernas", "manos"] as AccessorySlot[]).forEach((slot) => {
      const previewId = previewing[previewKey(slot)];
      const equippedId = previewId || shop.equippedIdFor(av.id, slot);
      out[slot] = equippedId ? findAccessory(equippedId) || null : null;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [av.id, previewing, shop]);

  const { skinCanvas, capeCanvas } = useMemo(() => {
    if (special.active) {
      const skin = buildSpecialSkin(av, special.colorA, special.colorB);
      const cape = SPECIAL_LOOKS[av.id] && SPECIAL_CAPE_TYPES.has(specialLook.type) ? buildCapeCanvas(special.colorB) : null;
      return { skinCanvas: skin, capeCanvas: cape };
    }
    const skin = buildSkinCanvas(av, equipped);
    const cape = equipped.espalda && equipped.espalda.poolIndex === 0 ? buildCapeCanvas(av.accent) : null;
    return { skinCanvas: skin, capeCanvas: cape };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [av, equipped, special.active, special.colorA, special.colorB]);

  const handleAccessoryClick = (acc: Accessory) => {
    if (!unlocked) return;
    if (!shop.isOwned(acc.id) && !gate) return;
    if (shop.isOwned(acc.id)) {
      shop.toggleEquip(acc.id);
      setPreviewing((p) => ({ ...p, [previewKey(acc.slot)]: "" }));
      return;
    }
    if (acc.price === 0) {
      shop.ownAccessory(acc.id);
      setToast(`¡Conseguiste ${acc.name}!`);
      return;
    }
    setPreviewing((p) => {
      const key = previewKey(acc.slot);
      return { ...p, [key]: p[key] === acc.id ? "" : acc.id };
    });
  };

  const confirmBuy = (acc: Accessory) => {
    // Lee el saldo fresco de localStorage (no el `hydroPoints` de React state, que
    // puede estar desactualizado entre dos compras seguidas antes del re-render).
    const currentPoints = getHydroPoints();
    if (currentPoints < acc.price) {
      setToast(`Te faltan ${fmt(acc.price - currentPoints)} HP para esto`);
      return;
    }
    addHydroPoints(-acc.price);
    shop.ownAccessory(acc.id);
    setPreviewing((p) => ({ ...p, [previewKey(acc.slot)]: "" }));
    // shop.allOwned(av) todavía no reflejaría esta compra (el setState de
    // ownAccessory no aplicó aún), así que se calcula acá si esta compra completa el set.
    const willComplete = accessories.every((a) => a.id === acc.id || shop.isOwned(a.id));
    setToast(willComplete ? `¡Set completo! Se desbloqueó la Skin Especial de ${av.name}` : `¡Conseguiste ${acc.name}!`);
  };

  const cancelTry = (acc: Accessory) => setPreviewing((p) => ({ ...p, [previewKey(acc.slot)]: "" }));

  return (
    <div className="relative mx-auto max-w-[800px] space-y-4 p-4 pb-24">
      <div className="pointer-events-none fixed top-4 left-1/2 z-50 -translate-x-1/2">
        {toast && (
          <div className="rounded-xl border-2 border-white bg-ink px-4 py-2 text-sm font-black text-bg-light shadow-[4px_4px_0_rgba(0,0,0,0.25)]">
            {toast}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-extrabold">🧑 Avatares del Wasi</h2>
        <div className="keyline-border flex items-center gap-2 rounded-full bg-bg-light px-3 py-1.5 shadow-[2px_2px_0_var(--color-ink)]">
          <span aria-hidden>💧</span>
          <span className="font-black tabular-nums">{fmt(hydroPoints)}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-ink/60">HydroPuntos</span>
        </div>
      </div>
      <p className="text-sm text-ink/70">
        Vestí a tu avatar del Wasi: 9 chicas y 2 chicos, uno por etapa. Completá los 11 accesorios de cada uno para desbloquear su Skin Especial.
      </p>

      {/* Fila de avatares — miniatura 2D liviana (no un visor 3D por avatar) */}
      <section>
        <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Colección de avatares">
          {AVATARS.map((a) => {
            const isUnlocked = avatarUnlocked(a);
            const selected = a.id === av.id;
            return (
              <button
                key={a.id}
                type="button"
                role="listitem"
                onClick={() => shop.setSelectedAvatar(a.id)}
                className={`keyline-border relative flex w-[92px] shrink-0 flex-col items-center gap-0.5 rounded-2xl bg-surface p-2 text-center shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  selected ? "outline outline-2 outline-offset-2 outline-accent" : ""
                } ${a.special ? "bg-gradient-to-b from-surface to-secondary/25" : ""}`}
              >
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-surface text-[10px]">
                  {isUnlocked ? "✅" : "🔒"}
                </span>
                <img src={getAvatarThumbnail(a)} alt="" className="h-20 w-10 object-contain" style={{ imageRendering: "pixelated" }} />
                <span className="truncate text-[11px] font-extrabold leading-tight">{a.name}</span>
                <span className="text-[9px] font-bold text-ink/60">{a.special ? "Secreto" : `Etapa ${a.stage}`}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Detalle: visor 3D real + accesorios + skin especial */}
      <section className="keyline-border rounded-2xl bg-surface p-4 shadow-[4px_4px_0_var(--color-ink)] sm:p-5">
        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          <div className="text-center">
            <div className="keyline-border relative h-64 overflow-hidden rounded-xl bg-bg-light sm:h-72">
              <AvatarSkinViewer skin={skinCanvas} cape={capeCanvas} model={av.model} width={220} height={288} zoom={0.8} autoRotate interactive />
            </div>
            <p className="mt-2 text-[11px] font-bold text-ink/50">Arrastrá para girar (horizontal)</p>
            <p className="mt-2 text-lg font-extrabold">{av.name}</p>
            <p className="text-xs font-bold text-ink/60">{av.special ? "Avatar secreto" : `Avatar de la etapa ${av.stage}`}</p>
            <div className="mt-2">
              {unlocked ? (
                <span className="inline-block rounded-full border-2 border-ink bg-[#4f9d69]/25 px-3 py-1 text-xs font-extrabold">
                  ✅ {av.special ? "¡Guardiana Dorada desbloqueada!" : `Desbloqueado en la etapa ${av.stage}`}
                </span>
              ) : av.special ? (
                <div className="keyline-border rounded-xl bg-bg-light p-3 text-left text-xs font-bold">
                  🔒 Logro secreto — completá todo lo demás:
                  <ul className="mt-1 space-y-1">
                    <li>{achievements.stage10 ? "✅" : "⬜"} Llegar a la etapa 10 del Wasi</li>
                    <li>{achievements.allGames ? "✅" : "⬜"} Completar todos los juegos</li>
                    <li>{achievements.allCourses ? "✅" : "⬜"} Completar todos los cursos</li>
                    <li>{achievements.allAccessories ? "✅" : "⬜"} Tener todos los accesorios de los 10 avatares</li>
                  </ul>
                </div>
              ) : (
                <div className="keyline-border rounded-xl bg-bg-light p-3 text-left text-xs font-bold">
                  🔒 Se desbloquea en la <strong>{av.unlockLabel}</strong>. Te falta{(av.stage ?? 0) - wasiStage === 1 ? "" : "n"}{" "}
                  {(av.stage ?? 0) - wasiStage} etapa(s).
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-ink/60">{ownedCount} de 11 accesorios · 1 siempre gratis · precios crecientes</p>
            {unlocked && !gate && (
              <p className="mt-1 text-xs font-extrabold text-accent">
                🔒 Bloqueado hasta completar los 11 accesorios de {prevAvatar(av)?.name}
              </p>
            )}
            <p className="mt-1 text-xs italic text-ink/60">Tocá cualquier accesorio para probártelo en el modelo 3D antes de comprarlo.</p>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {accessories.map((acc) => {
                const owned = shop.isOwned(acc.id);
                const isEquipped = shop.equippedIdFor(av.id, acc.slot) === acc.id;
                const isPreviewing = previewing[previewKey(acc.slot)] === acc.id;
                const lockedByGate = !owned && !gate;
                const disabled = !unlocked || lockedByGate;
                return (
                  <div
                    key={acc.id}
                    className={`keyline-border relative flex flex-col gap-1 rounded-xl bg-surface p-2 shadow-[2px_2px_0_var(--color-ink)] ${
                      disabled ? "opacity-55" : "cursor-pointer"
                    } ${isEquipped ? "outline outline-2 outline-offset-2 outline-[#4f9d69]" : ""} ${
                      isPreviewing && !isEquipped ? "outline outline-2 outline-dashed outline-offset-2 outline-accent" : ""
                    }`}
                    onClick={() => !disabled && handleAccessoryClick(acc)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="keyline-border flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-light text-lg">
                        {accessoryIcon(acc)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-extrabold leading-tight">{acc.name}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-ink/50">{SLOT_LABEL[acc.slot]}</p>
                      </div>
                    </div>
                    {!unlocked ? (
                      <span className="text-[10px] font-bold">🔒 Bloqueado</span>
                    ) : lockedByGate ? (
                      <span className="text-[10px] font-bold">🔒 Completa a {prevAvatar(av)?.name}</span>
                    ) : owned ? (
                      <span className="text-[10px] font-bold text-[#4f9d69]">{isEquipped ? "Puesto" : "Tuyo · tocar para usar"}</span>
                    ) : isPreviewing ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmBuy(acc);
                          }}
                          className="min-h-8 flex-1 rounded-lg border-2 border-ink bg-[#4f9d69] px-1 text-[10px] font-extrabold text-white"
                        >
                          Comprar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelTry(acc);
                          }}
                          className="min-h-8 flex-1 rounded-lg border-2 border-ink bg-bg-light px-1 text-[10px] font-extrabold"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold">{acc.price === 0 ? "Gratis · tocar para usar" : `💧 ${fmt(acc.price)}`}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {unlocked && (
              <div className="mt-4 rounded-2xl border-[3px] border-secondary bg-gradient-to-br from-secondary/20 to-surface p-4">
                <h3 className="flex items-center gap-1 text-sm font-extrabold">🌟 {specialLook.title}</h3>
                <p className="mt-1 text-xs font-semibold text-ink/60">
                  Ropa distinta, acorde a {av.name} y su etapa del Wasi — elegí los 2 colores.
                </p>
                {!complete && (
                  <p className="mt-1 text-xs font-bold text-ink/60">
                    🔒 Elegís los colores al completar los 11 accesorios ({ownedCount}/11) — mientras tanto podés ver la vista previa con los colores por defecto.
                  </p>
                )}
                <ColorRow label="Color principal" value={special.colorA} locked={!complete} onPick={(c) => shop.setSpecialColor(av.id, "colorA", c)} />
                <ColorRow label="Color secundario" value={special.colorB} locked={!complete} onPick={(c) => shop.setSpecialColor(av.id, "colorB", c)} />
                <button
                  type="button"
                  onClick={() => shop.toggleSpecialSkin(av.id)}
                  className={`mt-2 min-h-12 rounded-full border-2 border-ink px-4 text-sm font-extrabold shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    special.active ? "bg-secondary" : "bg-surface"
                  }`}
                >
                  {special.active ? "Viendo la Skin Especial · volver al look normal" : complete ? "Usar la Skin Especial" : "Vista previa de la Skin Especial"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ColorRow({ label, value, onPick, locked }: { label: string; value: string; onPick: (color: string) => void; locked?: boolean }) {
  return (
    <div className="mt-2">
      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/60">{label}</p>
      <div className={`flex flex-wrap gap-1.5 ${locked ? "opacity-50" : ""}`}>
        {SWATCHES.map((hex) => (
          <button
            key={hex}
            type="button"
            aria-label={hex}
            disabled={locked}
            onClick={() => onPick(hex)}
            style={{ background: hex }}
            className={`h-6 w-6 rounded-full border-2 border-ink disabled:cursor-not-allowed ${value === hex ? "outline outline-2 outline-offset-2 outline-accent" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
