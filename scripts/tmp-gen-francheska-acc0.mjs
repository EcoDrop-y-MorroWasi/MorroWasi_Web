// Genera francheska-acc0 «Capucha de Arena Clara»: crudo GLB + HTML de preview.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const C = 0.018;
const vox = [];
const add = (x, y, z, color) => vox.push({ x, y, z, color });

// capucha: cubre coronilla, cae por atrás y costados hasta los hombros,
// abierta adelante, hueca. exterior 29×24, paredes 1 cubito, alto 30 + techo
const X = 29, Z = 24, Y = 30;
for (let y = 0; y < Y; y++) {
  for (let x = 0; x < X; x++) {
    for (let z = 0; z < Z; z++) {
      const interior = x >= 1 && x <= X - 2 && z >= 1 && z <= Z - 2;
      const frente = z === Z - 1; // abierta adelante (+Z)
      if (interior || frente) continue;
      const ribete = y === 0 || z === Z - 2; // borde inferior y filo de la apertura
      add(x, y, z, ribete ? "lila" : "arena");
    }
  }
}
// techo de la capucha (esquinas redondeadas)
for (let x = 0; x < X; x++) {
  for (let z = 0; z < Z; z++) {
    const esquina = (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);
    if (esquina) continue;
    add(x, Y, z, z === Z - 1 ? "lila" : "arena");
  }
}

// colores de Fransheska
const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const srgb2lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const MATS = {
  arena: { hex: "#E3C98F", metal: 0, rough: 0.8 },
  lila: { hex: "#B9A2DF", metal: 0, rough: 0.8 },
};

// espacio del avatar: cabeza+pelo 0.48×0.38 (y 1.22–1.70), centrada en x=0, z=0
const place = (v) => [(v.x - 14) * C, 1.74 - (30.5 - v.y) * C, (v.z - 11.5) * C];

const FACES = [
  { n: [1, 0, 0], c: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
  { n: [-1, 0, 0], c: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
  { n: [0, 1, 0], c: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
  { n: [0, -1, 0], c: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
  { n: [0, 0, 1], c: [[1, -1, 1], [1, 1, 1], [-1, 1, 1], [-1, -1, 1]] },
  { n: [0, 0, -1], c: [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]] },
];

const groups = new Map();
for (const v of vox) {
  if (!groups.has(v.color)) groups.set(v.color, []);
  groups.get(v.color).push(v);
}

const binParts = [];
const bufferViews = [];
const accessors = [];
const meshes = [];
const nodes = [];
const materials = [];
let byteOffset = 0;
const pushView = (buf, target) => {
  const pad = (4 - (byteOffset % 4)) % 4;
  if (pad) { binParts.push(Buffer.alloc(pad)); byteOffset += pad; }
  bufferViews.push({ buffer: 0, byteOffset, byteLength: buf.byteLength, ...(target ? { target } : {}) });
  binParts.push(Buffer.from(buf));
  byteOffset += buf.byteLength;
  return bufferViews.length - 1;
};

for (const [color, list] of groups) {
  const m = MATS[color];
  const pos = [], nrm = [], idx = [];
  for (const v of list) {
    const [cx, cy, cz] = place(v);
    const base = pos.length / 3;
    for (const f of FACES) {
      for (const corner of f.c) {
        pos.push(cx + (corner[0] * C) / 2, cy + (corner[1] * C) / 2, cz + (corner[2] * C) / 2);
        nrm.push(...f.n);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const posArr = new Float32Array(pos);
  const nrmArr = new Float32Array(nrm);
  const idxArr = new Uint16Array(idx);
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < posArr.length; i += 3) for (let k = 0; k < 3; k++) {
    mn[k] = Math.min(mn[k], posArr[i + k]);
    mx[k] = Math.max(mx[k], posArr[i + k]);
  }
  const posAcc = accessors.length;
  accessors.push({ bufferView: pushView(posArr.buffer, 34962), componentType: 5126, count: posArr.length / 3, type: "VEC3", min: mn, max: mx });
  const nrmAcc = accessors.length;
  accessors.push({ bufferView: pushView(nrmArr.buffer, 34962), componentType: 5126, count: nrmArr.length / 3, type: "VEC3" });
  const idxAcc = accessors.length;
  accessors.push({ bufferView: pushView(idxArr.buffer, 34963), componentType: 5123, count: idxArr.length, type: "SCALAR" });
  const [r, g, b] = hex(m.hex).map(srgb2lin);
  const matIdx = materials.length;
  materials.push({ pbrMetallicRoughness: { baseColorFactor: [r, g, b, 1], metallicFactor: m.metal, roughnessFactor: m.rough } });
  const meshIdx = meshes.length;
  meshes.push({ primitives: [{ attributes: { POSITION: posAcc, NORMAL: nrmAcc }, indices: idxAcc, material: matIdx }] });
  nodes.push({ mesh: meshIdx, name: color });
}

const gltf = {
  asset: { version: "2.0", generator: "morrowasi-voxel" },
  scene: 0,
  scenes: [{ nodes: nodes.map((_, i) => i) }],
  nodes, meshes, materials, accessors, bufferViews,
  buffers: [{ byteLength: byteOffset }],
};
let jsonBuf = Buffer.from(JSON.stringify(gltf), "utf8");
const jsonPad = (4 - (jsonBuf.byteLength % 4)) % 4;
if (jsonPad) jsonBuf = Buffer.concat([jsonBuf, Buffer.from(" ".repeat(jsonPad))]);
const binBuf = Buffer.concat(binParts);
const total = 12 + 8 + jsonBuf.byteLength + 8 + binBuf.byteLength;
const header = Buffer.alloc(12);
header.write("glTF", 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(total, 8);
const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(jsonBuf.byteLength, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binBuf.byteLength, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
const out = Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuf]);

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dest = join(root, "avatares 3d", "francheska", "accesorios", "francheska-acc0.glb");
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, out);
console.log(`voxels: ${vox.length}, ${out.byteLength} bytes → ${dest}`);

// ---------- HTML de preview (mismos voxels) ----------
const voxJs = JSON.stringify(vox);
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>francheska-acc0 — Capucha de Arena Clara</title>
<style>
  html, body { margin: 0; height: 100%; overflow: hidden; background: #1c1c11; }
  #info { position: absolute; top: 10px; left: 10px; color: #fdfae7; font: 14px system-ui; }
  button { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
    padding: 10px 22px; font: 16px system-ui; cursor: pointer; }
</style>
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/"
} }
</script>
</head>
<body>
<div id="info">francheska-acc0 · Capucha de Arena Clara — arrastrá para girar, rueda para zoom</div>
<button id="descargar">Descargar</button>
<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const C = 0.018;
const vox = ${voxJs};
const place = (v) => [(v.x - 14) * C, 1.74 - (30.5 - v.y) * C, (v.z - 11.5) * C];
const COLORS = { arena: 0xE3C98F, lila: 0xB9A2DF };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1c1c11);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.01, 10);
camera.position.set(0.55, 1.45, 0.75);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const sol = new THREE.DirectionalLight(0xffffff, 1.6);
sol.position.set(1.5, 2.5, 1.5);
scene.add(sol);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.45, 0);

const grupos = new Map();
for (const v of vox) {
  if (!grupos.has(v.c)) grupos.set(v.c, []);
  const g = new THREE.BoxGeometry(C, C, C);
  const [x, y, z] = place(v);
  g.translate(x, y, z);
  grupos.get(v.c).push(g);
}
const pieza = new THREE.Group();
for (const [color, geos] of grupos) {
  const mat = new THREE.MeshStandardMaterial({ color: COLORS[color], roughness: 0.8, metalness: 0 });
  pieza.add(new THREE.Mesh(mergeGeometries(geos), mat));
}
scene.add(pieza);

renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

document.getElementById("descargar").onclick = () => {
  new GLTFExporter().parse(pieza, (res) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([res], { type: "model/gltf-binary" }));
    a.download = "francheska-acc0.glb";
    a.click();
    URL.revokeObjectURL(a.href);
  }, (e) => console.error(e), { binary: true });
};
</script>
</body>
</html>
`;
const htmlDest = join(root, "avatares 3d", "francheska-acc0.html");
writeFileSync(htmlDest, html);
console.log(`html → ${htmlDest}`);
