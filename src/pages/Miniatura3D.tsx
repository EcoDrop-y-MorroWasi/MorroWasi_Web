import { useEffect, useMemo } from "react";
import AvatarModelViewer from "../components/AvatarModelViewer";
import { avatarModelUrl } from "../data/models3d";
import type { Encuadre } from "../three/avatarModelScene";

// /dev/miniatura?avatar=angie&especial=1&encuadre=busto&w=192&h=192 — solo en
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
  const url = avatarModelUrl(avatarId, especial);
  const content = useMemo(() => (url ? { avatarUrl: url, accessories: [] } : null), [url]);

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
      <AvatarModelViewer content={content} width={w} height={h} encuadre={encuadre} yaw={18} autoRotate={false} interactive={false} />
    </div>
  );
}
