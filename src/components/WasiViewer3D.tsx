import { useEffect, useRef, useState } from "react";
import { createWasiScene } from "../three/wasiScene";
import type { WasiSceneController } from "../three/wasiScene";

interface WasiViewer3DProps {
  stage: number;
  /** "md" (Dashboard / cabecera del modal) o "sm" (fila expandida del acordeón de etapas) */
  size?: "md" | "sm";
  /** Reproduce la animación de ascenso (elevarse + 2 vueltas) apenas monta — WasiLevelUpModal. */
  autoAscend?: boolean;
  /** Se llama cuando termina la animación de ascenso (si autoAscend está activo). */
  onAscendEnd?: () => void;
}

const SIZE_CLASSES: Record<"md" | "sm", string> = {
  md: "h-52 sm:h-60",
  sm: "h-44 sm:h-52",
};

// Visualización 3D del Wasi (Three.js, WebGL) — sin tarjeta ni fondo propio: el canvas
// es transparente y flota directo sobre el fondo de la pantalla que lo contenga, en
// mobile y en web. Se manipula arrastrando para girar. Un canvas/contexto WebGL por
// instancia: mantené como mucho una montada a la vez fuera del Dashboard (por eso el
// acordeón de WasiModal cierra la fila anterior antes de abrir otra).
export default function WasiViewer3D({ stage, size = "md", autoAscend = false, onAscendEnd }: WasiViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<WasiSceneController | null>(null);
  const [ascending, setAscending] = useState(autoAscend);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const controller = createWasiScene(el);
    controllerRef.current = controller;
    if (autoAscend) {
      controller.selectStage(stage);
      controller.playAscent(() => {
        setAscending(false);
        onAscendEnd?.();
      });
    }

    const ro = new ResizeObserver(() => controller.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      controller.dispose();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar: stage/autoAscend/onAscendEnd se leen una vez, seleccionar de nuevo reiniciaría el WebGL context innecesariamente
  }, []);

  useEffect(() => {
    controllerRef.current?.selectStage(stage);
  }, [stage]);

  return (
    <div className="w-full">
      <div ref={containerRef} className={`w-full ${SIZE_CLASSES[size]}`} />
      {/* Debajo del canvas, no encima: superpuesto tapaba la base del modelo y se leía mal. */}
      <p className="mt-1 text-center font-body text-[11px] font-bold text-ink/60">
        {ascending ? "🔒 Bloqueado mientras asciende" : "Arrastra para girar"}
      </p>
    </div>
  );
}
