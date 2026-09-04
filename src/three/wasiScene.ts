// Motor 3D del Wasi — casa voxel + sakura procedural, portado del prototipo Artifact.
// Cada etapa reutiliza la misma planta/pilotes/entrada; solo mejoran materiales, techo,
// jardín y árbol. Ver STAGE_CONFIGS más abajo para el detalle por etapa.
import * as THREE from "three";

export interface Block {
  x: number;
  y: number;
  z: number;
  c: string;
}

const PAL = {
  grass: "#63C25B",
  soil: "#C79A63",
  groundEdge: "#4A3220",
  deck: "#8B5A34",
  post: "#5B3A29",
  stilt: "#4A3220",
  window: "#BFE9F2",
  stair: "#7A5230",
  potWood: "#8A5A2E",
  sprout: "#8FE07A",
  sproutDark: "#6FC25E",
  trunk: "#6B4A2B",
  leafLight: "#F4B7CE",
  leafDeep: "#E8829F",
  stone: "#9DAAB3",
  water: "#3C93E0",
  waterLight: "#8FDBF7",
  tank: "#6FA8CF",
  panel: "#20303A",
  gold: "#FFCB3F",
  box: "#8A5A2E",
  bench: "#B07B3F",
  accentGrey: "#B9BDC2",
} as const;

interface Level {
  wall: string;
  trim: string;
  roofLight: string;
  roofMid: string;
  tiers: number;
  win: [boolean, boolean];
  rail: string | false;
  post: string;
}

const LEVELS: Level[] = [
  { wall: "#CBAF86", trim: "#6B4A33", roofLight: "#E3C4B9", roofMid: "#D9B9A6", tiers: 1, win: [false, false], rail: false, post: "#6B4A33" },
  { wall: "#CBAF86", trim: "#654530", roofLight: "#E9BEC0", roofMid: "#E0AEB0", tiers: 1, win: [false, false], rail: false, post: "#654530" },
  { wall: "#D6C199", trim: "#5F3F2C", roofLight: "#F0C2C6", roofMid: "#E7A9AE", tiers: 2, win: [false, false], rail: false, post: "#5F3F2C" },
  { wall: "#F0D2C2", trim: "#5B3A29", roofLight: "#F6C7D6", roofMid: "#EDA6BC", tiers: 2, win: [true, false], rail: false, post: "#5B3A29" },
  { wall: "#F0D2C2", trim: "#5B3A29", roofLight: "#F6C7D6", roofMid: "#EDA6BC", tiers: 3, win: [true, true], rail: false, post: "#5B3A29" },
  { wall: "#F3D7C9", trim: "#5B3A29", roofLight: "#F6C7D6", roofMid: "#EFA9C0", tiers: 3, win: [true, true], rail: "#8A5A2E", post: "#5B3A29" },
  { wall: "#F3D7C9", trim: "#5B3A29", roofLight: "#F6C7D6", roofMid: "#EFA9C0", tiers: 4, win: [true, true], rail: "#8A5A2E", post: "#5B3A29" },
  { wall: "#F6DFD2", trim: "#4A3220", roofLight: "#F8D4E0", roofMid: "#F0A6C4", tiers: 4, win: [true, true], rail: "#4A3220", post: "#4A3220" },
  { wall: "#FBE3D6", trim: "#D9A441", roofLight: "#FADCE6", roofMid: "#F3ADCB", tiers: 5, win: [true, true], rail: "#D9A441", post: "#4A3220" },
  { wall: "#FBE3D6", trim: "#FFCB3F", roofLight: "#FCE4EC", roofMid: "#F6C7D6", tiers: 5, win: [true, true], rail: "#FFCB3F", post: "#4A3220" },
];

function houseShell(levelIdx: number): Block[] {
  const L = LEVELS[levelIdx];
  const blocks: Block[] = [];
  const add = (x: number, y: number, z: number, c: string) => blocks.push({ x, y, z, c });
  const ring = (x0: number, x1: number, y0: number, y1: number, z: number, edge: string, fill: string) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) add(x, y, z, x === x0 || x === x1 || y === y0 || y === y1 ? edge : fill);
  };
  ([[0, 0], [5, 0], [0, 2], [5, 2], [0, 5], [5, 5], [-1, -1], [6, -1], [-1, 6], [6, 6]] as const).forEach((p) => add(p[0], p[1], -1, PAL.stilt));
  for (let dx = -1; dx <= 6; dx++) for (let dy = -1; dy <= 6; dy++) add(dx, dy, 0, PAL.deck);
  ([[0, 0], [5, 0], [0, 2], [5, 2], [0, 5], [5, 5]] as const).forEach((p) => {
    add(p[0], p[1], 1, L.post);
    add(p[0], p[1], 2, L.post);
  });
  if (L.rail) for (let rx = 1; rx <= 4; rx++) add(rx, -1, 1, L.rail);
  for (let wx = 0; wx <= 5; wx++) {
    if (wx === 0 || wx === 5) continue;
    const isWin1 = wx === 3 && L.win[0];
    const isWin2 = wx === 2 && L.win[1];
    add(wx, 5, 1, isWin1 || isWin2 ? PAL.window : L.wall);
    add(wx, 5, 2, L.wall);
  }
  ring(-1, 6, -1, 6, 3, L.trim, L.roofLight);
  if (L.tiers >= 2) ring(0, 5, 0, 5, 4, L.trim, L.roofMid);
  if (L.tiers >= 3) ring(1, 4, 1, 4, 5, L.trim, L.roofLight);
  if (L.tiers >= 4) ring(2, 3, 2, 3, 6, L.trim, L.roofMid);
  if (L.tiers >= 5) {
    add(2, 2, 7, L.roofLight);
    add(3, 3, 7, L.roofLight);
    add(2, 3, 7, L.roofMid);
    add(3, 2, 7, L.roofMid);
    add(2, 2, 8, L.trim);
  }
  add(2, 6, -1, PAL.stair);
  add(2, 6, 0, PAL.stair);
  return blocks;
}

const SOIL_PATCHES: Array<{ x0: number; x1: number; y0: number; y1: number } | null> = [
  null,
  { x0: -1, x1: 3, y0: 6, y1: 9 },
  { x0: 0, x1: 2, y0: 6, y1: 8 },
  { x0: 0, x1: 1, y0: 6, y1: 7 },
];

function groundBlocks(soilLevel: number): Block[] {
  let blocks: Block[] = [];
  const add = (x: number, y: number, z: number, c: string) => blocks.push({ x, y, z, c });
  for (let x = -4; x <= 11; x++)
    for (let y = -4; y <= 11; y++) {
      const edge = x === -4 || x === 11 || y === -4 || y === 11;
      add(x, y, -2, edge ? PAL.groundEdge : PAL.grass);
    }
  const p = SOIL_PATCHES[soilLevel];
  if (p) {
    blocks = blocks.filter((b) => !(b.x >= p.x0 && b.x <= p.x1 && b.y >= p.y0 && b.y <= p.y1 && b.z === -2));
    for (let sx = p.x0; sx <= p.x1; sx++) for (let sy = p.y0; sy <= p.y1; sy++) add(sx, sy, -2, PAL.soil);
  }
  return blocks;
}

const pot = (x: number, y: number): Block[] => [
  { x, y, z: -1, c: PAL.potWood },
  { x, y, z: 0, c: PAL.sprout },
];
const stem = (x: number, y: number, h: number): Block[] => {
  const b: Block[] = [];
  for (let i = 0; i < h; i++) b.push({ x, y, z: -1 + i, c: i === h - 1 ? PAL.sprout : PAL.sproutDark });
  return b;
};
const well = (x: number, y: number): Block[] => [
  { x, y, z: -1, c: PAL.stone },
  { x: x + 1, y, z: -1, c: PAL.stone },
  { x, y: y + 1, z: -1, c: PAL.stone },
  { x: x + 1, y: y + 1, z: -1, c: PAL.stone },
  { x, y, z: 0, c: PAL.post },
  { x: x + 1, y: y + 1, z: 0, c: PAL.post },
];
const fountain = (x: number, y: number): Block[] => [
  { x, y, z: -1, c: PAL.stone },
  { x: x + 1, y, z: -1, c: PAL.stone },
  { x, y: y + 1, z: -1, c: PAL.stone },
  { x: x + 1, y: y + 1, z: -1, c: PAL.stone },
  { x, y, z: 0, c: PAL.water },
  { x: x + 1, y: y + 1, z: 0, c: PAL.waterLight },
];
function pool(x: number, y: number, big: boolean): Block[] {
  const b: Block[] = [];
  const w = big ? 3 : 2;
  const d = big ? 3 : 2;
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) b.push({ x: x + i, y: y + j, z: -1, c: PAL.water });
  b[0].c = PAL.waterLight;
  b[b.length - 1].c = PAL.waterLight;
  b.push({ x: x - 1, y, z: -1, c: PAL.sprout });
  b.push({ x: x + w, y: y + d - 1, z: -1, c: PAL.sprout });
  if (big) {
    b.push({ x: x - 1, y: y + d - 1, z: -1, c: PAL.sprout });
    b.push({ x: x + w, y, z: -1, c: PAL.sprout });
  }
  return b;
}
const tank = (x: number, y: number): Block[] => [
  { x, y, z: -1, c: PAL.tank },
  { x, y, z: 0, c: PAL.tank },
];
const flowerbox = (): Block[] => [{ x: 3, y: 6, z: 1, c: PAL.box }];
// sits on the deck edge block at (-1,0,z=0) — one block higher and it floats
const postLantern = (): Block[] => [{ x: -1, y: 0, z: 1, c: PAL.gold }];
const apexTopper = (color: string): Block[] => [{ x: 2, y: 2, z: 9, c: color }];
const bush = (x: number, y: number, topColor: string, big: boolean): Block[] => {
  const b: Block[] = [
    { x, y, z: -1, c: topColor },
    { x: x + 1, y, z: -1, c: topColor },
    { x: x - 1, y, z: -1, c: topColor },
    { x, y: y + 1, z: -1, c: topColor },
    { x, y: y - 1, z: -1, c: topColor },
  ];
  if (big) b.push({ x, y, z: 0, c: topColor });
  return b;
};
const bushCluster = (spots: Array<[number, number, number]>): Block[] => {
  let b: Block[] = [];
  spots.forEach((s, i) => {
    b = b.concat(bush(s[0], s[1], i % 2 ? PAL.sproutDark : PAL.sprout, s[2] === 1));
  });
  return b;
};
const stonePath = (points: Array<[number, number]>): Block[] => points.map((p) => ({ x: p[0], y: p[1], z: -1, c: PAL.stone }));

const GARDEN_GRID: Array<[number, number]> = [[4, 9], [4, 10], [3, 9], [5, 9], [3, 10], [5, 10]];
function gardenGrow(n: number, bigN: number): Block[] {
  const spots: Array<[number, number, number]> = GARDEN_GRID.slice(0, n).map((c, i) => [c[0], c[1], i < bigN ? 1 : 0]);
  return bushCluster(spots);
}

const PLANT: [number, number] = [1, 9];
const WATER: [number, number] = [7, 7];
const BENCHSPOT: [number, number] = [1, 8];
const TANKSPOT: [number, number] = [-2, 3];
const BUCKET_SPOTS: Array<[number, number]> = [[2, 9], [10, 8], [1, 11], [6, 10], [6, 11], [7, 10]];
const waterBucket = (x: number, y: number): Block[] => [
  { x, y, z: -1, c: PAL.accentGrey },
  { x, y, z: 0, c: PAL.water },
];
function bucketGrow(n: number): Block[] {
  let b: Block[] = [];
  BUCKET_SPOTS.slice(0, n).forEach((s) => (b = b.concat(waterBucket(s[0], s[1]))));
  return b;
}

// ---------- mesh props: real geometry (branches, petals, furniture), not voxel blocks ----------
const GROUND_Y = -1.5;
const UP = new THREE.Vector3(0, 1, 0);

function makeRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Branch {
  from: THREE.Vector3;
  to: THREE.Vector3;
  rad: number;
}
interface BranchOut {
  branches: Branch[];
  tips: THREE.Vector3[];
}

function growBranches(from: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, depth: number, rng: () => number, out: BranchOut) {
  const to = from.clone().addScaledVector(dir, len);
  out.branches.push({ from: from.clone(), to: to.clone(), rad });
  if (depth <= 0) {
    out.tips.push(to.clone());
    return;
  }
  if (depth <= 1) out.tips.push(to.clone());
  const forks = 2 + (rng() < 0.4 ? 1 : 0);
  for (let i = 0; i < forks; i++) {
    const nd = dir.clone();
    nd.x += (rng() - 0.5) * 1.0;
    nd.z += (rng() - 0.5) * 1.0;
    nd.y += 0.12;
    if (nd.lengthSq() < 1e-6) nd.set(0, 1, 0);
    nd.normalize();
    growBranches(to, nd, len * (0.66 + rng() * 0.16), rad * 0.66, depth - 1, rng, out);
  }
}

// all branches bake into ONE geometry — a mature tree is 300+ segments, which as separate meshes would be 300+ draw calls
function mergedBranchMesh(branches: Branch[], mat: THREE.Material): THREE.Mesh {
  const positions: number[] = [];
  const normals: number[] = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  const dir = new THREE.Vector3();
  branches.forEach((b) => {
    dir.subVectors(b.to, b.from);
    const len = dir.length();
    if (len < 1e-5) return;
    const g = new THREE.CylinderGeometry(b.rad * 0.68, b.rad, len, 5, 1, false).toNonIndexed();
    q.setFromUnitVectors(UP, dir.clone().normalize());
    p.copy(b.from).addScaledVector(dir, 0.5);
    m4.compose(p, q, one);
    g.applyMatrix4(m4);
    const pa = g.attributes.position.array;
    const na = g.attributes.normal.array;
    for (let i = 0; i < pa.length; i++) {
      positions.push(pa[i]);
      normals.push(na[i]);
    }
    g.dispose();
  });
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  const mesh = new THREE.Mesh(merged, mat);
  mesh.castShadow = true;
  return mesh;
}

function foliage(tips: THREE.Vector3[], count: number, color: string, size: number, spread: number, rng: () => number): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshLambertMaterial({ color: new THREE.Color(color), side: THREE.DoubleSide }),
    count,
  );
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const t = tips[Math.floor(rng() * tips.length)];
    p.set(t.x + (rng() - 0.5) * spread, t.y + (rng() - 0.5) * spread * 0.85, t.z + (rng() - 0.5) * spread);
    e.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    q.setFromEuler(e);
    const s = 0.7 + rng() * 0.7;
    sc.set(s, s, s);
    m4.compose(p, q, sc);
    mesh.setMatrixAt(i, m4);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  return mesh;
}

export interface TreeSpec {
  height: number;
  depth: number;
  leaves: number;
  bloom: boolean;
}

function makeTree(spec: TreeSpec, seed: number): THREE.Group {
  const rng = makeRng(seed);
  const g = new THREE.Group();
  const out: BranchOut = { branches: [], tips: [] };
  const trunkDir = new THREE.Vector3((rng() - 0.5) * 0.12, 1, (rng() - 0.5) * 0.12).normalize();
  growBranches(new THREE.Vector3(0, 0, 0), trunkDir, spec.height * 0.42, spec.height * 0.055, spec.depth, rng, out);
  const barkMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(PAL.trunk) });
  g.add(mergedBranchMesh(out.branches, barkMat));
  if (spec.bloom) {
    g.add(foliage(out.tips, Math.round(spec.leaves * 0.6), PAL.leafLight, 0.3, 0.8, rng));
    g.add(foliage(out.tips, Math.round(spec.leaves * 0.4), PAL.leafDeep, 0.26, 0.75, rng));
  } else {
    g.add(foliage(out.tips, Math.round(spec.leaves * 0.65), "#5FA85A", 0.3, 0.8, rng));
    g.add(foliage(out.tips, Math.round(spec.leaves * 0.35), PAL.leafLight, 0.24, 0.7, rng));
  }
  return g;
}

function makeFlower(petalColor: string, centreColor: string, seed: number): THREE.Group {
  const rng = makeRng(seed);
  const g = new THREE.Group();
  const h = 0.24 + rng() * 0.12;
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, h, 4), new THREE.MeshLambertMaterial({ color: new THREE.Color("#4E8B45") }));
  stalk.position.y = h / 2;
  g.add(stalk);
  const petalMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(petalColor), side: THREE.DoubleSide });
  const petalGeo = new THREE.PlaneGeometry(0.07, 0.13);
  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(Math.cos(a) * 0.06, h, Math.sin(a) * 0.06);
    petal.rotation.set(-Math.PI / 2 + 0.5, 0, -a);
    g.add(petal);
  }
  const centre = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), new THREE.MeshLambertMaterial({ color: new THREE.Color(centreColor) }));
  centre.position.y = h + 0.01;
  g.add(centre);
  g.rotation.y = rng() * Math.PI * 2;
  return g;
}

function makeBenchMesh(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(PAL.bench) });
  const darkMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(PAL.post) });
  const seatH = 0.3;
  const seatW = 1.5;
  const seatD = 0.5;
  ([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).forEach((o) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, seatH, 0.07), darkMat);
    leg.position.set(o[0] * (seatW / 2 - 0.09), seatH / 2, o[1] * (seatD / 2 - 0.09));
    leg.castShadow = true;
    g.add(leg);
  });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(seatW, 0.07, seatD), woodMat);
  seat.position.y = seatH;
  seat.castShadow = true;
  g.add(seat);
  for (let i = 0; i < 3; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(seatW, 0.11, 0.09), woodMat);
    slat.position.set(0, seatH + 0.14 + i * 0.15, -seatD / 2 + 0.06);
    slat.rotation.x = -0.16;
    slat.castShadow = true;
    g.add(slat);
  }
  ([-1, 1] as const).forEach((s) => {
    const postB = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.55, 0.07), darkMat);
    postB.position.set(s * (seatW / 2 - 0.09), seatH + 0.24, -seatD / 2 + 0.06);
    postB.rotation.x = -0.16;
    postB.castShadow = true;
    g.add(postB);
  });
  return g;
}

// ---------- stage config (1-indexed etapa n, matches WASI_STAGES / mock.ts order) ----------
export interface GardenConfig {
  n: number;
  bigN: number;
}
interface StageConfig {
  n: number;
  soil: number;
  gold?: boolean;
  garden?: GardenConfig;
  tree?: TreeSpec;
  benchMesh?: boolean;
  extra: Block[];
}

function stageConfig(n: number): StageConfig {
  switch (n) {
    case 1:
      return { n, soil: 1, extra: pot(PLANT[0], PLANT[1]) };
    case 2:
      return { n, soil: 2, extra: stem(PLANT[0], PLANT[1], 2) };
    case 3:
      return { n, soil: 3, extra: [...stem(PLANT[0], PLANT[1], 3), ...well(WATER[0], WATER[1]), ...bucketGrow(1)] };
    case 4:
      return {
        n,
        soil: 0,
        garden: { n: 2, bigN: 0 },
        extra: [...stem(PLANT[0], PLANT[1], 3), ...well(WATER[0], WATER[1]), ...flowerbox(), ...bucketGrow(2)],
      };
    case 5:
      return {
        n,
        soil: 0,
        garden: { n: 2, bigN: 0 },
        tree: { height: 2.6, depth: 3, leaves: 110, bloom: true },
        extra: [...well(WATER[0], WATER[1]), ...flowerbox(), ...postLantern(), ...bucketGrow(2)],
      };
    case 6:
      return {
        n,
        soil: 0,
        garden: { n: 2, bigN: 0 },
        tree: { height: 3.2, depth: 4, leaves: 170, bloom: true },
        extra: [...fountain(WATER[0], WATER[1]), ...flowerbox(), ...postLantern(), ...bucketGrow(3)],
      };
    case 7:
      return {
        n,
        soil: 0,
        garden: { n: 3, bigN: 0 },
        tree: { height: 3.8, depth: 4, leaves: 230, bloom: true },
        extra: [...fountain(WATER[0], WATER[1]), ...flowerbox(), ...postLantern(), ...bucketGrow(3)],
      };
    case 8:
      return {
        n,
        soil: 0,
        garden: { n: 4, bigN: 2 },
        tree: { height: 4.4, depth: 5, leaves: 300, bloom: true },
        benchMesh: true,
        extra: [...pool(WATER[0], WATER[1], false), ...flowerbox(), ...postLantern(), ...bucketGrow(4)],
      };
    case 9:
      return {
        n,
        soil: 0,
        garden: { n: 5, bigN: 3 },
        tree: { height: 5.0, depth: 5, leaves: 360, bloom: true },
        benchMesh: true,
        extra: [
          ...pool(WATER[0], WATER[1], true),
          ...flowerbox(),
          ...postLantern(),
          ...tank(TANKSPOT[0], TANKSPOT[1]),
          ...apexTopper(PAL.panel),
          ...bucketGrow(5),
        ],
      };
    default:
      return {
        n: 10,
        soil: 0,
        gold: true,
        garden: { n: 6, bigN: 6 },
        tree: { height: 5.8, depth: 6, leaves: 440, bloom: true },
        benchMesh: true,
        extra: [
          ...pool(WATER[0], WATER[1], true),
          ...flowerbox(),
          ...postLantern(),
          ...tank(TANKSPOT[0], TANKSPOT[1]),
          ...apexTopper(PAL.gold),
          ...bucketGrow(6),
        ],
      };
  }
}

function stageBlocks(cfg: StageConfig): Block[] {
  let blocks = groundBlocks(cfg.soil).concat(houseShell(cfg.n - 1)).concat(stonePath([[0, 7], [0, 8], [0, 9]]));
  if (cfg.garden) blocks = blocks.concat(gardenGrow(cfg.garden.n, cfg.garden.bigN));
  blocks = blocks.concat(cfg.extra);
  const byCell: Record<string, Block> = {};
  blocks.forEach((b) => (byCell[`${b.x},${b.y},${b.z}`] = b));
  return Object.values(byCell);
}

// ---------- controller ----------
export interface WasiSceneController {
  selectStage: (n: number) => void;
  resize: () => void;
  setPaused: (paused: boolean) => void;
  dispose: () => void;
}

export function createWasiScene(container: HTMLDivElement): WasiSceneController {
  const scene = new THREE.Scene();
  // FOV angosto + mucha distancia: se ve todo el terreno flotando dentro del cuadro,
  // como una "carta" (estilo Clash Royale), no solo la casa recortada de cerca.
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xfff3e6, 0x6b5a46, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0dc, 1.15);
  sun.position.set(9, 14, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0015;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.28);
  fill.position.set(-8, 6, -6);
  scene.add(fill);
  const glowLight = new THREE.PointLight(0xffcb3f, 0, 10);
  glowLight.position.set(2, 10, 2);
  scene.add(glowLight);

  const GAP = 0.03;
  const geo = new THREE.BoxGeometry(1 - GAP, 1 - GAP, 1 - GAP);
  const root = new THREE.Group();
  scene.add(root);
  const propsGroup = new THREE.Group();
  scene.add(propsGroup);

  function clearRoot() {
    while (root.children.length) {
      const m = root.children.pop() as THREE.InstancedMesh;
      m.dispose();
      (m.material as THREE.Material).dispose();
    }
  }
  function buildScene(blocks: Block[]) {
    clearRoot();
    const byColor: Record<string, Block[]> = {};
    blocks.forEach((b) => {
      (byColor[b.c] = byColor[b.c] || []).push(b);
    });
    const m4 = new THREE.Matrix4();
    Object.keys(byColor).forEach((hex) => {
      const list = byColor[hex];
      const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(hex) });
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      list.forEach((b, i) => {
        m4.makeTranslation(b.x, b.z, b.y);
        mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
      root.add(mesh);
    });
  }
  function clearProps() {
    while (propsGroup.children.length) {
      const m = propsGroup.children.pop() as THREE.Object3D;
      m.traverse((o) => {
        const anyO = o as THREE.Mesh & { isInstancedMesh?: boolean };
        if (anyO.isInstancedMesh) (anyO as unknown as THREE.InstancedMesh).dispose();
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
        const mat = (o as THREE.Mesh).material;
        if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((m2) => m2.dispose());
      });
    }
  }
  function setProps(cfg: StageConfig) {
    clearProps();
    if (cfg.tree) {
      const tree = makeTree(cfg.tree, 1000 + cfg.n);
      tree.position.set(PLANT[0], GROUND_Y, PLANT[1]);
      propsGroup.add(tree);
    }
    if (cfg.benchMesh) {
      const b = makeBenchMesh();
      b.position.set(BENCHSPOT[0] + 0.5, GROUND_Y, BENCHSPOT[1]);
      b.rotation.y = Math.PI;
      propsGroup.add(b);
    }
    if (cfg.garden && cfg.garden.n >= 3) {
      GARDEN_GRID.slice(0, cfg.garden.n).forEach((c, i) => {
        const rng = makeRng(500 + cfg.n * 13 + i * 7);
        const topY = GROUND_Y + (i < (cfg.garden as GardenConfig).bigN ? 2 : 1);
        for (let k = 0; k < 3; k++) {
          const f = makeFlower(k % 2 ? PAL.leafDeep : "#FFFFFF", PAL.gold, 700 + cfg.n * 31 + i * 11 + k);
          f.position.set(c[0] + (rng() - 0.5) * 0.7, topY, c[1] + (rng() - 0.5) * 0.7);
          propsGroup.add(f);
        }
      });
    }
  }

  // Centrado más alto que el nivel del suelo: la casa/árbol sube hasta ~y=9 en la
  // etapa 10, el suelo está en ~y=-2 — un target bajo dejaba el techo fuera de cuadro.
  // Más cerca del nivel del suelo que del centro geométrico: la cámara "mira" más abajo,
  // así la casa/árbol quedan arriba del cuadro en vez de flotando centrados con medio
  // cuadro de cielo vacío arriba.
  const target = new THREE.Vector3(2.5, 2.3, 2.5);
  // El terreno completo mide ~15x15 unidades (-4..11) — la distancia tiene que alcanzar
  // para que ese lote entero flote adentro del cuadro, no solo la casa.
  const BASE_RADIUS = 37;
  let az = -0.7;
  let pol = 0.95;
  const minPol = 0.35;
  const maxPol = 1.1; // tope más bajo que antes: cerca de 1.35 la cámara queda casi a la altura del techo y puede recortarlo
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  // Sin control de zoom: contenedores anchos y bajos (la franja del Dashboard) recortaban
  // el techo si el usuario se acercaba. En vez de eso, la distancia se aleja sola cuanto
  // más ancho-y-bajo es el contenedor, para que el Wasi entre completo sin encasillarse.
  function currentRadius() {
    const aspect = camera.aspect || 1;
    return aspect > 1.6 ? BASE_RADIUS * (1 + (aspect - 1.6) * 0.22) : BASE_RADIUS;
  }
  function applyCamera() {
    const r = currentRadius();
    const x = target.x + r * Math.sin(pol) * Math.sin(az);
    const y = target.y + r * Math.cos(pol);
    const z = target.z + r * Math.sin(pol) * Math.cos(az);
    camera.position.set(x, y, z);
    camera.lookAt(target);
  }
  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    applyCamera();
  }

  let idleRAF: number | null = null;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  function stopIdle() {
    if (idleRAF !== null) cancelAnimationFrame(idleRAF);
    idleRAF = null;
  }
  function startIdle() {
    stopIdle();
    const step = () => {
      if (dragging) return;
      az += 0.0022;
      applyCamera();
      idleRAF = requestAnimationFrame(step);
    };
    idleRAF = requestAnimationFrame(step);
  }
  function onDown(e: PointerEvent) {
    dragging = true;
    container.style.cursor = "grabbing";
    lastX = e.clientX;
    lastY = e.clientY;
    stopIdle();
    if (idleTimer) clearTimeout(idleTimer);
    if (e.pointerId != null && container.setPointerCapture) {
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        /* not fatal — dragging just won't survive leaving the element */
      }
    }
  }
  function onMove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    az += dx * 0.008;
    pol = Math.min(maxPol, Math.max(minPol, pol - dy * 0.006));
    applyCamera();
  }
  function onEnd() {
    if (!dragging) return;
    dragging = false;
    container.style.cursor = "grab";
    idleTimer = setTimeout(startIdle, 1100);
  }
  container.style.cursor = "grab";
  container.style.touchAction = "none";
  container.addEventListener("pointerdown", onDown);
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerup", onEnd);
  container.addEventListener("pointercancel", onEnd);
  container.addEventListener("lostpointercapture", onEnd);

  let paused = false;
  let rafId = 0;
  function loop() {
    if (!paused) renderer.render(scene, camera);
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  function selectStage(n: number) {
    const cfg = stageConfig(Math.min(10, Math.max(1, n)));
    sun.color.set(cfg.gold ? 0xffd68a : 0xfff0dc);
    sun.intensity = cfg.gold ? 1.35 : 1.15;
    hemi.color.set(cfg.gold ? 0xffe9b8 : 0xfff3e6);
    glowLight.intensity = cfg.gold ? 1.1 : 0;
    buildScene(stageBlocks(cfg));
    setProps(cfg);
  }

  resize();
  applyCamera();
  startIdle();

  return {
    selectStage,
    resize,
    setPaused(p: boolean) {
      paused = p;
      if (p) stopIdle();
      else startIdle();
    },
    dispose() {
      stopIdle();
      if (idleTimer) clearTimeout(idleTimer);
      cancelAnimationFrame(rafId);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerup", onEnd);
      container.removeEventListener("pointercancel", onEnd);
      container.removeEventListener("lostpointercapture", onEnd);
      clearRoot();
      clearProps();
      geo.dispose();
      renderer.dispose();
      renderer.forceContextLoss(); // renderer.dispose() alone leaves the GL context alive until GC; the modal mounts/unmounts a fresh canvas every open/close, and browsers cap concurrent contexts
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    },
  };
}
