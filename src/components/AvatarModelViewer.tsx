import { useEffect, useRef } from "react";
import { createAvatarModelScene, type AvatarModelContent, type AvatarModelSceneController, type Encuadre } from "../three/avatarModelScene";

interface AvatarModelViewerProps {
  content: AvatarModelContent;
  width: number;
  height: number;
  zoom?: number;
  encuadre?: Encuadre;
  yaw?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  interactive?: boolean;
  /** Falla al bajar un .glb, o el navegador no tiene WebGL (url = content.avatarUrl). */
  onError?: (url: string, error: unknown) => void;
  className?: string;
}

// Visor de avatares .glb (three/avatarModelScene.ts) — reemplaza a
// AvatarSkinViewer cuando el avatar ya tiene modelo procesado por el pipeline.
// A diferencia del visor de skins, el contexto WebGL se crea una sola vez por
// tamaño y el contenido (avatar + accesorios) se cambia en caliente.
export default function AvatarModelViewer({ content, width, height, zoom, encuadre, yaw, autoRotate, autoRotateSpeed, interactive = true, onError, className }: AvatarModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<AvatarModelSceneController | null>(null);
  const contentRef = useRef(content);
  const onErrorRef = useRef(onError);
  // Declarado antes que el efecto que crea la escena: los efectos corren en
  // orden, así al recrearla (cambio de tamaño) ya lee el contenido vigente.
  useEffect(() => {
    contentRef.current = content;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let ctrl: AvatarModelSceneController;
    try {
      ctrl = createAvatarModelScene(el, {
        width,
        height,
        zoom,
        encuadre,
        yaw,
        autoRotate,
        autoRotateSpeed,
        interactive,
        onError: (url, err) => onErrorRef.current?.(url, err),
      });
    } catch (err) {
      // Sin WebGL: que el padre caiga al visor de skins en vez de romper la página.
      onErrorRef.current?.(contentRef.current.avatarUrl, err);
      return;
    }
    ctrl.setContent(contentRef.current);
    ctrlRef.current = ctrl;
    return () => {
      ctrl.dispose();
      ctrlRef.current = null;
    };
  }, [width, height, zoom, encuadre, yaw, autoRotate, autoRotateSpeed, interactive]);

  useEffect(() => {
    ctrlRef.current?.setContent(content);
  }, [content]);

  return <div ref={containerRef} style={{ width, height }} className={className} aria-hidden={!interactive} />;
}
