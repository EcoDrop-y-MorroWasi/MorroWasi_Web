// Visor 3D de avatares .glb con accesorios enganchados en sockets. Los
// archivos ya vienen normalizados por scripts/modelos-3d.ts (metros, avatar de
// 1.70 m con pies en y=0, accesorio con su pivote en el origen), así que acá
// solo se carga, se clona y se coloca — nada de medir cajas en runtime.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { AVATAR_HEIGHT, type SocketName, type Vec3 } from "../data/models3dSpec";
import type { Placement } from "../data/models3d";

export interface AvatarModelContent {
  avatarUrl: string;
  accessories: { id: string; url: string; placements: Placement[] }[];
  /** Solo el calibrador: marca cada socket con una esferita (la elegida en amarillo). */
  sockets?: { name: SocketName; pos: Vec3; selected?: boolean }[];
}

/** Cuerpo entero (visor, tienda) o de la cintura para arriba (foto de perfil). */
export type Encuadre = "cuerpo" | "busto";

export interface AvatarModelSceneOptions {
  width: number;
  height: number;
  /** 1 = el avatar entra justo en el cuadro; >1 acerca. */
  zoom?: number;
  encuadre?: Encuadre;
  /** Ángulo inicial de la cámara en grados (0 = de frente, positivo = hacia su izquierda). */
  yaw?: number;
  /** Cámara levantada en grados (0 = a la altura del centro). Las fotos de accesorios usan ~25° para que un aro no se vea de canto. */
  pitch?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  interactive?: boolean;
  onError?: (url: string, error: unknown) => void;
}

export interface AvatarModelSceneController {
  setContent: (content: AvatarModelContent) => void;
  dispose: () => void;
}

// Caché por URL para toda la sesión: cambiar de accesorio o volver a un avatar
// no vuelve a bajar ni a decodificar el .glb, solo clona (comparte geometría
// y materiales, por eso dispose() nunca libera lo que vino de acá).
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map<string, Promise<THREE.Object3D>>();

function loadModel(url: string): Promise<THREE.Object3D> {
  let p = cache.get(url);
  if (!p) {
    p = loader.loadAsync(url).then((gltf) => gltf.scene);
    p.catch(() => cache.delete(url)); // un fallo de red no queda pegado en la caché
    cache.set(url, p);
  }
  return p;
}

/** Descarga por adelantado (ej. el accesorio sobre el que pasa el dedo). */
export function preloadAvatarModel(url: string) {
  loadModel(url).catch(() => {});
}

// Crea su propio <canvas> dentro de `container` (igual que wasiScene): dispose()
// fuerza la pérdida del contexto WebGL, y un canvas con el contexto perdido no
// sirve para una escena nueva — StrictMode o un cambio de tamaño remontan.
// Tira excepción si el navegador no puede crear un contexto WebGL.
export function createAvatarModelScene(container: HTMLElement, opts: AvatarModelSceneOptions): AvatarModelSceneController {
  const { width, height, zoom = 1, encuadre = "cuerpo", yaw = 0, pitch = 0, autoRotate = true, autoRotateSpeed = 0.8, interactive = true, onError } = opts;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  const canvas = renderer.domElement;
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8a58c, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(1.5, 3, 2.5);
  const rim = new THREE.DirectionalLight(0xffffff, 0.8);
  rim.position.set(-2, 2, -2.5);
  scene.add(key, rim);

  const fov = 30;
  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.05, 50);

  // Mismo manejo que AvatarSkinViewer: solo giro horizontal, sin zoom ni paneo.
  const controls = new OrbitControls(camera, canvas);

  // Encuadre medido sobre el avatar real y no sobre los 1.70 m teóricos: un
  // sombrero de paja o un peinado alto sobresalen distinto en cada uno.
  /** Caja de lo que queda por encima del corte del busto — algo al costado a ras del piso (el perrito de Dayra) no achica la foto. */
  function bustBox(obj: THREE.Object3D): THREE.Box3 {
    const full = new THREE.Box3().setFromObject(obj, true);
    const cut = full.max.y - 0.62;
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    obj.updateWorldMatrix(true, true);
    obj.traverse((o) => {
      const pos = (o as THREE.Mesh).isMesh ? (o as THREE.Mesh).geometry.getAttribute("position") : null;
      if (!pos) return;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        if (v.y >= cut) box.expandByPoint(v);
      }
    });
    box.min.y = cut;
    return box;
  }

  function frame(box: THREE.Box3) {
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const vHalf = THREE.MathUtils.degToRad(fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    const across = Math.max(size.x, size.z); // lo que se ve de ancho al girar
    const dist = Math.max((size.y * 1.08) / 2 / Math.tan(vHalf), (across * 1.08) / 2 / Math.tan(hHalf)) / zoom + across / 2;
    const a = THREE.MathUtils.degToRad(yaw);
    controls.target.copy(center);
    const p = THREE.MathUtils.degToRad(pitch);
    camera.position.set(center.x + Math.sin(a) * Math.cos(p) * dist, center.y + Math.sin(p) * dist, center.z + Math.cos(a) * Math.cos(p) * dist);
    controls.update();
  }
  frame(new THREE.Box3(new THREE.Vector3(-0.4, 0, -0.3), new THREE.Vector3(0.4, AVATAR_HEIGHT, 0.3)));
  let framedUrl = "";
  controls.minPolarAngle = Math.PI / 2 - THREE.MathUtils.degToRad(pitch);
  controls.maxPolarAngle = Math.PI / 2 - THREE.MathUtils.degToRad(pitch);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = interactive;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = autoRotateSpeed;

  const content = new THREE.Group();
  scene.add(content);
  const markerGeo = new THREE.SphereGeometry(0.022, 12, 8);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xff3fa4, depthTest: false });
  const markerSelMat = new THREE.MeshBasicMaterial({ color: 0xffd400, depthTest: false });

  let disposed = false;
  let token = 0;

  async function setContent(c: AvatarModelContent) {
    const mine = ++token;
    const urls = [c.avatarUrl, ...c.accessories.map((a) => a.url)];
    const loaded = await Promise.all(
      urls.map((u) =>
        loadModel(u).catch((err) => {
          onError?.(u, err);
          return null;
        }),
      ),
    );
    // Llegó otro setContent mientras bajaba, o se desmontó: descartar.
    if (disposed || mine !== token) return;

    content.clear();
    const [avatar, ...accs] = loaded;
    if (avatar) {
      const clone = avatar.clone(true);
      content.add(clone);
      // Solo al cambiar de avatar: cambiar un accesorio no debe resetear el giro.
      if (framedUrl !== c.avatarUrl) {
        framedUrl = c.avatarUrl;
        frame(encuadre === "busto" ? bustBox(clone) : new THREE.Box3().setFromObject(clone, true));
      }
    }
    c.accessories.forEach((a, i) => {
      const src = accs[i];
      if (!src) return;
      for (const p of a.placements) {
        const obj = src.clone(true);
        obj.name = `${a.id}@${p.socket}`;
        obj.position.set(...p.position);
        obj.rotation.set(...p.rotation);
        obj.scale.set(...p.scale);
        content.add(obj);
      }
    });
    for (const s of c.sockets || []) {
      const m = new THREE.Mesh(markerGeo, s.selected ? markerSelMat : markerMat);
      m.position.set(...s.pos);
      m.renderOrder = 10;
      content.add(m);
    }
  }

  let raf = 0;
  const loop = () => {
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    setContent: (c) => void setContent(c),
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      controls.dispose();
      content.clear();
      markerGeo.dispose();
      markerMat.dispose();
      markerSelMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss(); // mismo motivo que wasiScene: no acumular contextos WebGL al remontar
      canvas.remove();
    },
  };
}
