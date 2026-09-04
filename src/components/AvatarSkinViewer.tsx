import { useEffect, useRef } from "react";
import { SkinViewer } from "skinview3d";

interface AvatarSkinViewerProps {
  skin: HTMLCanvasElement;
  cape?: HTMLCanvasElement | null;
  model: "slim" | "default";
  width: number;
  height: number;
  zoom: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  /** Si es false, ni auto-rotación ni arrastre — usado en la fila chica de miniaturas. */
  interactive?: boolean;
  className?: string;
}

// Visor 3D de skin de avatar (skinview3d/three.js) — portado de
// web/mockups/tienda-avatares-3d.html. El mockup detectó que reusar la misma
// instancia y cambiarle skin/cape en caliente a veces dejaba el canvas en
// negro; reconstruir el visor entero en cada cambio de props es lo confiable.
export default function AvatarSkinViewer({
  skin,
  cape,
  model,
  width,
  height,
  zoom,
  autoRotate = true,
  autoRotateSpeed = 0.8,
  interactive = true,
  className,
}: AvatarSkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const viewer = new SkinViewer({ canvas, width, height, skin, model, cape: cape || undefined });
    viewer.autoRotate = autoRotate;
    viewer.autoRotateSpeed = autoRotateSpeed;
    viewer.zoom = zoom;
    viewer.controls.minPolarAngle = Math.PI / 2;
    viewer.controls.maxPolarAngle = Math.PI / 2;
    viewer.controls.enablePan = false;
    viewer.controls.enableZoom = false;
    viewer.controls.enableRotate = interactive;
    viewerRef.current = viewer;
    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skin, cape, model, width, height, zoom, autoRotate, autoRotateSpeed, interactive]);

  return <canvas ref={canvasRef} className={className} aria-hidden={!interactive} />;
}
