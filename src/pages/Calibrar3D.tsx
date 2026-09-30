import { useMemo, useState } from "react";
import { AVATARS, AVATAR_ACCESSORIES, SLOT_LABELS, type AccessorySlot } from "../data/avatarShop";
import { accessoryModelUrl, accessoryPlacements, avatarModelUrl, socketsFor } from "../data/models3d";
import { SHAPE_SPECS, shapeKey, type SocketName, type Vec3 } from "../data/models3dSpec";
import { ACCESSORY_FIT, AVATAR_SOCKETS, DEFAULT_SOCKETS, type AccessoryFit, type Socket } from "../data/models3dSockets";
import AvatarModelViewer from "../components/AvatarModelViewer";
import type { AvatarModelContent } from "../three/avatarModelScene";

// Calibrador de modelos 3D (/dev/calibrar-3d, solo `pnpm dev`). Flujo:
//   1. pnpm modelos:procesar  → los .glb quedan en public/models/ + manifiesto
//   2. acá: elegir avatar, ponerle accesorios, mover sockets / ajustar cada accesorio
//   3. "Copiar" y pegar el bloque en src/data/models3dSockets.ts
// Nada se guarda solo: lo que no se pega en models3dSockets.ts se pierde al recargar.

const SLOTS: AccessorySlot[] = ["cabeza", "cara", "pecho", "espalda", "piernas", "manos"];
const SOCKET_NAMES = Object.keys(DEFAULT_SOCKETS) as SocketName[];
type Target = { kind: "socket"; name: SocketName } | { kind: "acc"; id: string };

const round = (v: number) => Math.round(v * 1000) / 1000;
const roundVec = (v: Vec3): Vec3 => [round(v[0]), round(v[1]), round(v[2])];

function NumField({ label, value, step, min, max, onChange }: { label: string; value: number; step: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold">
      <span className="w-14 shrink-0">{label}</span>
      <input type="range" className="flex-1" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <input type="number" className="w-20 rounded border border-ink/30 bg-bg-light px-1" step={step} value={round(value)} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function VecFields({ label, value, step, range, onChange }: { label: string; value: Vec3; step: number; range: number; onChange: (v: Vec3) => void }) {
  return (
    <div className="space-y-1">
      {(["x", "y", "z"] as const).map((axis, i) => (
        <NumField
          key={axis}
          label={`${label} ${axis}`}
          value={value[i]}
          step={step}
          min={-range}
          max={range}
          onChange={(v) => {
            const next: Vec3 = [...value];
            next[i] = v;
            onChange(next);
          }}
        />
      ))}
    </div>
  );
}

export default function Calibrar3D() {
  const withModel = AVATARS.filter((a) => avatarModelUrl(a.id, false) || avatarModelUrl(a.id, true));
  const [avatarId, setAvatarId] = useState(withModel[0]?.id ?? "");
  const [especial, setEspecial] = useState(false);
  const [equipped, setEquipped] = useState<Partial<Record<AccessorySlot, string>>>({});
  const [sockets, setSockets] = useState(AVATAR_SOCKETS);
  const [fits, setFits] = useState(ACCESSORY_FIT);
  const [target, setTarget] = useState<Target>({ kind: "socket", name: "cabeza" });
  const [copied, setCopied] = useState(false);

  const avatarUrl = avatarModelUrl(avatarId, especial) || avatarModelUrl(avatarId, !especial);
  const table = useMemo(() => socketsFor(avatarId, sockets[avatarId]), [avatarId, sockets]);
  const accs = (AVATAR_ACCESSORIES[avatarId] || []).filter((a) => accessoryModelUrl(a.id));

  const content = useMemo<AvatarModelContent | null>(() => {
    if (!avatarUrl) return null;
    const list = SLOTS.flatMap((slot) => {
      const acc = accs.find((a) => a.id === equipped[slot]);
      const url = acc && accessoryModelUrl(acc.id);
      return acc && url ? [{ id: acc.id, url, placements: accessoryPlacements(acc, table, fits[acc.id] || {}) }] : [];
    });
    const markers = SOCKET_NAMES.map((name) => ({ name, pos: table[name].pos, selected: target.kind === "socket" && target.name === name }));
    return { avatarUrl, accessories: list, sockets: markers };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarUrl, equipped, table, fits, target]);

  const setSocket = (name: SocketName, patch: Partial<Socket>) =>
    setSockets((prev) => ({ ...prev, [avatarId]: { ...prev[avatarId], [name]: { ...table[name], ...patch } } }));
  const setFit = (id: string, patch: Partial<AccessoryFit>) => setFits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const output = useMemo(() => {
    const cleanSockets = Object.fromEntries(
      Object.entries(sockets)
        .map(([id, t]) => [id, Object.fromEntries(Object.entries(t || {}).map(([n, s]) => [n, { pos: roundVec(s!.pos), ...(s!.escala && s!.escala !== 1 ? { escala: round(s!.escala) } : {}) }]))])
        .filter(([, t]) => Object.keys(t).length),
    );
    const cleanFits = Object.fromEntries(
      Object.entries(fits)
        .map(([id, f]) => {
          const o: AccessoryFit = {};
          if (f.offset && f.offset.some((v) => v !== 0)) o.offset = roundVec(f.offset);
          if (f.rot && f.rot.some((v) => v !== 0)) o.rot = roundVec(f.rot);
          if (f.escala != null && f.escala !== 1) o.escala = round(f.escala);
          return [id, o] as const;
        })
        .filter(([, o]) => Object.keys(o).length),
    );
    return (
      `export const AVATAR_SOCKETS: Record<string, Partial<Record<SocketName, Socket>>> = ${JSON.stringify(cleanSockets, null, 2)};\n\n` +
      `export const ACCESSORY_FIT: Record<string, AccessoryFit> = ${JSON.stringify(cleanFits, null, 2)};\n`
    );
  }, [sockets, fits]);

  if (!withModel.length) {
    return (
      <div className="mx-auto max-w-xl p-6 text-sm">
        <h1 className="mb-2 text-xl font-extrabold">Calibrar 3D</h1>
        <p>
          Todavía no hay avatares procesados. Corré <code>pnpm modelos:procesar</code> y recargá.
        </p>
      </div>
    );
  }

  const selAcc = target.kind === "acc" ? accs.find((a) => a.id === target.id) : undefined;
  const selFit = selAcc ? fits[selAcc.id] || {} : {};

  return (
    <div className="mx-auto grid max-w-5xl gap-4 p-4 md:grid-cols-[380px_1fr]">
      <div className="keyline-border rounded-xl bg-bg-light">
        {content && <AvatarModelViewer content={content} width={380} height={520} autoRotate={false} interactive />}
        <p className="p-2 text-center text-[11px] font-bold text-ink/60">Arrastrá para girar · rosa = socket · amarillo = el que editás</p>
      </div>

      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-xl font-extrabold">Calibrar 3D</h1>
          <select className="rounded border border-ink/30 bg-bg-light px-2 py-1" value={avatarId} onChange={(e) => setAvatarId(e.target.value)}>
            {withModel.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs font-bold">
            <input type="checkbox" checked={especial} onChange={(e) => setEspecial(e.target.checked)} /> skin especial
          </label>
        </div>

        <section className="space-y-1">
          <h2 className="font-extrabold">Accesorios puestos</h2>
          {SLOTS.map((slot) => (
            <div key={slot} className="flex items-center gap-2">
              <span className="w-16 text-xs font-bold">{SLOT_LABELS[slot]}</span>
              <select
                className="flex-1 rounded border border-ink/30 bg-bg-light px-2 py-1"
                value={equipped[slot] || ""}
                onChange={(e) => {
                  const id = e.target.value;
                  setEquipped((p) => ({ ...p, [slot]: id }));
                  if (id) setTarget({ kind: "acc", id });
                }}
              >
                <option value="">— ninguno —</option>
                {accs
                  .filter((a) => a.slot === slot)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({SHAPE_SPECS[shapeKey(a)]?.label})
                    </option>
                  ))}
              </select>
              {equipped[slot] && (
                <button type="button" className="rounded border border-ink/30 px-2 py-1 text-xs font-bold" onClick={() => setTarget({ kind: "acc", id: equipped[slot]! })}>
                  ajustar
                </button>
              )}
            </div>
          ))}
          {!accs.length && <p className="text-xs text-ink/60">Este avatar todavía no tiene accesorios procesados.</p>}
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold">Sockets de {AVATARS.find((a) => a.id === avatarId)?.name}</h2>
          <div className="flex flex-wrap gap-1">
            {SOCKET_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTarget({ kind: "socket", name })}
                className={`rounded-full border px-2 py-0.5 text-xs font-bold ${target.kind === "socket" && target.name === name ? "border-ink bg-secondary/40" : "border-ink/30"}`}
              >
                {name}
              </button>
            ))}
          </div>
          {target.kind === "socket" && (
            <div className="space-y-1 rounded-lg border border-ink/20 p-2">
              <VecFields label="pos" value={table[target.name].pos} step={0.005} range={2} onChange={(pos) => setSocket(target.name, { pos })} />
              <NumField label="escala" value={table[target.name].escala ?? 1} step={0.01} min={0.3} max={2} onChange={(escala) => setSocket(target.name, { escala })} />
              {target.name === "pierna_i" && <p className="text-[11px] text-ink/60">La pierna izquierda espeja al accesorio; su pos es independiente.</p>}
            </div>
          )}
        </section>

        {selAcc && (
          <section className="space-y-1 rounded-lg border border-ink/20 p-2">
            <h2 className="font-extrabold">
              Ajuste de {selAcc.name} <span className="font-mono text-xs text-ink/60">{selAcc.id}</span>
            </h2>
            <VecFields label="mover" value={selFit.offset || [0, 0, 0]} step={0.005} range={0.5} onChange={(offset) => setFit(selAcc.id, { offset })} />
            <VecFields label="rot°" value={selFit.rot || [0, 0, 0]} step={1} range={180} onChange={(rot) => setFit(selAcc.id, { rot })} />
            <NumField label="escala" value={selFit.escala ?? 1} step={0.01} min={0.2} max={3} onChange={(escala) => setFit(selAcc.id, { escala })} />
          </section>
        )}

        <section className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="mr-auto font-extrabold">Pegar en src/data/models3dSockets.ts</h2>
            <button
              type="button"
              className="rounded border-2 border-ink px-3 py-1 text-xs font-extrabold"
              onClick={() => {
                void navigator.clipboard.writeText(output).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
          <textarea readOnly className="h-48 w-full rounded border border-ink/30 bg-bg-light p-2 font-mono text-[11px]" value={output} />
        </section>
      </div>
    </div>
  );
}
