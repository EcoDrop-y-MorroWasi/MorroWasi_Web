import { useEffect, useRef } from "react";
import { createWasiScene } from "../three/wasiScene";
import type { WasiSceneController } from "../three/wasiScene";

interface WasiViewer3DProps {
  stage: number;
  /** "md" (Dashboard / cabecera del modal) o "sm" (fila expandida del acordeón de etapas) */
  size?: "md" | "sm";
}

const SIZE_CLASSES: Record<"md" | "sm", string> = {
  md: "h-56 sm:h-64",
  sm: "h-44 sm:h-52",
};

// Visualización 3D del Wasi (Three.js, WebGL) — sin tarjeta ni fondo propio: el canvas
// es transparente y flota directo sobre el fondo de la pantalla que lo contenga, en
// mobile y en web. Se manipula arrastrando para girar. Un canvas/contexto WebGL por
// instancia: mantené como mucho una montada a la vez fuera del Dashboard (por eso el
// acordeón de WasiModal cierra la fila anterior antes de abrir otra).
export default function WasiViewer3D({ stage, size = "md" }: WasiViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<WasiSceneController | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const controller = createWasiScene(el);
    controllerRef.current = controller;

    const ro = new ResizeObserver(() => controller.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.selectStage(stage);
  }, [stage]);

  return (
    <div className={`relative w-full ${SIZE_CLASSES[size]}`}>
      <div ref={containerRef} className="h-full w-full" />
      <span className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 font-body text-[10px] font-bold text-ink/50">
        Arrastrá para girar
      </span>
    </div>
  );
}
