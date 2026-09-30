import { useEffect, useMemo } from "react";
import AvatarModelViewer from "../components/AvatarModelViewer";
import { findAccessory } from "../data/avatarShop";
import { accessoryModelUrl, accessoryPlacements, avatarModelUrl, socketsFor } from "../data/models3d";
import type { SocketName } from "../data/models3dSpec";
import type { Encuadre } from "../three/avatarModelScene";

// /dev/miniatura?avatar=angie&especial=1&encuadre=busto&w=192&h=192&yaw=18 — solo en
// `pnpm dev`. La abre Chrome headless desde `pnpm modelos:miniaturas` para
// sacar la foto de cada avatar: el canvas ocupa la ventana entera, sin giro ni
// fondo (el PNG sale transparente).
export default function Miniatura3D() {
  const q = new URLSearchParams(window.location.search);
  const avatarId = q.get("avatar") || "angie";
  const especial = q.get("especial") === "1";
  const encuadre: Encuadre = q.get("encuadre") === "busto" ? "busto" : "cuerpo";
  const w = Number(q.get("w")) || 240;
  const h = Number(q.get("h")) || 360;
  const yaw = Number(q.get("yaw") ?? 18);
  const pitch = Number(q.get("pitch") ?? 0);
  // &acc=angie-acc0,angie-acc2 → los pone con su calibración actual (para revisar
  // cómo calzan desde distintos ángulos); &sockets=1 marca los sockets.
  const accIds = (q.get("acc") || "").split(",").filter(Boolean).join(",");
  const showSockets = q.get("sockets") === "1";
  // &solo=angie-acc0 → el accesorio suelto, encuadrado (foto de su tarjeta en la tienda).
  const solo = q.get("solo");
  const url = solo ? accessoryModelUrl(solo) : avatarModelUrl(avatarId, especial);
  const content = useMemo(() => {
    if (!url) return null;
    if (solo) return { avatarUrl: url, accessories: [] };
    const sockets = socketsFor(avatarId);
    const accessories = accIds
      .split(",")
      .map((id) => findAccessory(id))
      .flatMap((acc) => {
        const u = acc ? accessoryModelUrl(acc.id) : null;
        return acc && u ? [{ id: acc.id, url: u, placements: accessoryPlacements(acc, sockets) }] : [];
      });
    const marks = showSockets ? (Object.keys(sockets) as SocketName[]).map((name) => ({ name, pos: sockets[name].pos })) : undefined;
    return { avatarUrl: url, accessories, sockets: marks };
  }, [url, solo, avatarId, accIds, showSockets]);

  useEffect(() => {
    const prev = [document.documentElement.style.background, document.body.style.background];
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    return () => {
      [document.documentElement.style.background, document.body.style.background] = prev;
    };
  }, []);

  if (!content) return <p>Sin modelo para {avatarId}</p>;
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <AvatarModelViewer content={content} width={w} height={h} encuadre={encuadre} yaw={yaw} pitch={pitch} autoRotate={false} interactive={false} />
    </div>
  );
}
