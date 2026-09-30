// Pipeline de modelos 3D (.glb) de avatares y accesorios: toma los crudos que
// salen del generador (Meshy/Tripo/Rodin/Claude), los lleva al estándar de
// src/data/models3dSpec.ts (metros, pivote por forma, avatar de 1.70 m),
// los optimiza/comprime y regenera src/data/models3d.generated.ts.
//
//   pnpm modelos:check                      valida y mide todo, no escribe nada
//   pnpm modelos:procesar                   procesa y escribe en public/models/ + manifiesto
//   pnpm modelos:procesar --solo angie-acc0,britney
//   pnpm modelos:procesar --salida <dir>    prueba: escribe en <dir>, no toca public/ ni el manifiesto
//   pnpm modelos:manifiesto                 solo regenera el manifiesto desde public/models/
//   pnpm modelos:miniaturas                 foto (webp transparente) de cada avatar ya procesado, con Chrome headless
//
// Otros flags: --crudos <dir> (o env MODELOS_CRUDOS; por defecto ../avatares 3d),
// --forzar (escribe aunque supere el tamaño máximo).
//
// Crudos esperados:
//   <crudos>/accesorios/<id del accesorio>.glb      ej. angie-acc0.glb
//   <crudos>/<carpeta del avatar>/<cualquiera>.glb   el avatar normal (uno solo)
//   <crudos>/<carpeta del avatar>/<subcarpeta>/<...>.glb la skin especial (una sola subcarpeta con .glb)
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Logger, NodeIO, type Document, type Mesh } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, getBounds, join as joinPrims, meshopt, prune, simplify, textureCompress, transformMesh, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { AVATARS, AVATAR_ACCESSORIES, type Accessory } from "../src/data/avatarShop.ts";
import { AVATAR_HEIGHT, AVATAR_SOURCE_DIRS, BUDGET, SHAPE_SPECS, shapeKey, targetSize, type Anchor, type Vec3 } from "../src/data/models3dSpec.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = join(ROOT, "public", "models");
const MANIFEST = join(ROOT, "src", "data", "models3d.generated.ts");
const THUMB_DIR = join(PUBLIC_DIR, "miniaturas");
const ACC_SUBDIR = "accesorios";

// ---------- CLI ----------
const [cmd = "check", ...rest] = process.argv.slice(2);
function flag(name: string): string | undefined {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
}
const has = (name: string) => rest.includes(`--${name}`);
const CRUDOS = flag("crudos") || process.env.MODELOS_CRUDOS || join(ROOT, "..", "avatares 3d");
const SALIDA = flag("salida");
const SOLO = flag("solo")?.split(",").map((s) => s.trim()).filter(Boolean);
const FORZAR = has("forzar");

// ---------- Reporte ----------
interface Row {
  key: string;
  kind: "avatar" | "accesorio";
  status: "ok" | "aviso" | "error" | "falta";
  trisIn?: number;
  trisOut?: number;
  kbIn?: number;
  kbOut?: number;
  file?: string;
  notes: string[];
}
const rows: Row[] = [];

// ---------- glTF ----------
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const quiet = new Logger(Logger.Verbosity.WARN);
async function read(path: string): Promise<Document> {
  return (await io.read(path)).setLogger(quiet);
}

function countTris(doc: Document): number {
  let t = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const p of mesh.listPrimitives()) {
      if (p.getMode() !== 4) continue; // solo TRIANGLES
      const idx = p.getIndices();
      t += (idx ? idx.getCount() : p.getAttribute("POSITION")?.getCount() || 0) / 3;
    }
  }
  return Math.round(t);
}

/** Saca todo lo que el visor no usa y avisa, así nada raro llega a producción. */
function stripExtras(doc: Document, notes: string[]) {
  const root = doc.getRoot();
  const anims = root.listAnimations();
  if (anims.length) notes.push(`${anims.length} animación(es) eliminada(s)`);
  anims.forEach((a) => a.dispose());
  root.listSkins().forEach((s) => s.dispose());
  root.listCameras().forEach((c) => c.dispose());
  for (const ext of root.listExtensionsUsed()) {
    if (ext.extensionName === "KHR_lights_punctual") {
      ext.dispose();
      notes.push("luces embebidas eliminadas");
    }
  }
}

function anchorValue(a: Anchor, min: number, max: number): number {
  return a === "min" ? min : a === "max" ? max : (min + max) / 2;
}

/**
 * Mete toda la escena bajo un nodo que la escala a `size` (lado más largo) y
 * lleva el pivote al origen. bakeWorldTransforms() + join() después hornean esa
 * transformación en los vértices: el archivo final ya viene en metros.
 */
function normalize(doc: Document, scaleFor: (size: Vec3) => number, pivot: (min: Vec3, max: Vec3) => Vec3): { size: Vec3 } {
  const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  if (!scene) throw new Error("el archivo no tiene escena");
  const { min, max } = getBounds(scene);
  const size: Vec3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  if (!size.every((v) => Number.isFinite(v)) || Math.max(...size) <= 0) throw new Error("no tiene geometría visible");
  const k = scaleFor(size);
  const p = pivot(min as Vec3, max as Vec3);
  const wrap = doc.createNode("normalizado").setScale([k, k, k]).setTranslation([-p[0] * k, -p[1] * k, -p[2] * k]);
  for (const child of scene.listChildren()) {
    scene.removeChild(child);
    wrap.addChild(child);
  }
  scene.addChild(wrap);
  return { size: [size[0] * k, size[1] * k, size[2] * k] };
}

// Bits de cuantización de meshopt (los defaults de medium son posición 14,
// normal 10, color 8). Avatares y accesorios van con más precisión: se ven
// grandes en el visor y el pedido fue no perder calidad — a 16 bits el
// error de posición en un avatar de 1.70 m es < 0.03 mm, a 12 la normal < 0.05°.
interface Quality {
  quantize?: { quantizePosition: number; quantizeNormal: number; quantizeColor: number; quantizeTexcoord: number };
  webpQuality?: number;
}
const HIGH_QUALITY: Quality = {
  quantize: { quantizePosition: 16, quantizeNormal: 12, quantizeColor: 12, quantizeTexcoord: 14 },
  webpQuality: 92,
};

/**
 * Hornea la matriz de mundo completa de cada malla en sus vértices y la cuelga
 * de la escena sin transformación. Reemplaza a flatten(): flatten reexpresa
 * cada nodo como traslación/rotación/escala, y cuando un grupo tiene escala no
 * uniforme con hijos rotados (cizalla) eso no es representable — en milagros y
 * genesis-especial deformaba piezas hasta 5 mm. La matriz entera es exacta.
 */
function bakeWorldTransforms(doc: Document) {
  const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  const meshNodes: ReturnType<Document["createNode"]>[] = [];
  scene.traverse((n) => {
    if (n.getMesh()) meshNodes.push(n);
  });
  const oldRoots = scene.listChildren();
  const baked = new Set<Mesh>();
  for (const node of meshNodes) {
    let mesh = node.getMesh()!;
    // Una malla usada por dos nodos se copia: cada copia recibe su propia matriz.
    if (baked.has(mesh)) {
      const copy = doc.createMesh(mesh.getName());
      for (const p of mesh.listPrimitives()) copy.addPrimitive(p.clone());
      mesh = copy;
    }
    baked.add(mesh);
    transformMesh(mesh, node.getWorldMatrix());
    node.setMesh(null);
    scene.addChild(doc.createNode(node.getName()).setMesh(mesh));
  }
  const stale: typeof meshNodes = [];
  for (const n of oldRoots) {
    scene.removeChild(n);
    n.traverse((c) => stale.push(c));
  }
  stale.forEach((n) => n.dispose());
}

async function optimize(doc: Document, trisTarget: number | null, texture: number, notes: string[], quality: Quality = {}) {
  bakeWorldTransforms(doc);
  await doc.transform(dedup(), joinPrims(), weld());
  const tris = countTris(doc);
  if (trisTarget && tris > trisTarget) {
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: trisTarget / tris, error: 0.01 }));
    notes.push(`simplificado ${tris} → ${countTris(doc)} tris`);
  }
  await doc.transform(prune(), dedup());
  if (doc.getRoot().listTextures().length) {
    await doc.transform(textureCompress({ encoder: sharp, targetFormat: "webp", resize: [texture, texture], quality: quality.webpQuality }));
  }
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "medium", ...quality.quantize }));
}

function hash8(buf: Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex").slice(0, 8);
}

/** Escribe <dir>/<key>.<hash>.glb y borra versiones viejas del mismo key. */
function writeHashed(dir: string, key: string, buf: Uint8Array, ext = "glb"): string {
  mkdirSync(dir, { recursive: true });
  const file = `${key}.${hash8(buf)}.${ext}`;
  for (const old of readdirSync(dir)) {
    if (old !== file && parseHashed(old, ext)?.key === key) rmSync(join(dir, old));
  }
  writeFileSync(join(dir, file), buf);
  return file;
}

function parseHashed(file: string, ext = "glb"): { key: string; hash: string } | null {
  const m = /^(.+)\.([0-9a-f]{8})\.([a-z0-9]+)$/.exec(file);
  return m && m[3] === ext ? { key: m[1], hash: m[2] } : null;
}

const kb = (n: number) => Math.round(n / 1024);

// ---------- Accesorios ----------
const ALL_ACCESSORIES: Accessory[] = AVATARS.flatMap((a) => AVATAR_ACCESSORIES[a.id]);
const ACC_BY_ID = new Map(ALL_ACCESSORIES.map((a) => [a.id, a]));

function pairWarning(size: Vec3): string | null {
  // Piernas es UNA pieza que el visor espeja: un par lado a lado sale mucho más ancho que profundo.
  return size[0] > size[2] * 1.1 && size[0] > size[1] * 0.9
    ? "parece un PAR (más ancho que largo) — piernas debe ser una sola pieza, el visor la espeja"
    : null;
}

/**
 * ¿La pieza viene armada en el espacio del avatar (como las genera Claude con
 * las medidas del .md) o suelta en el origen (Meshy/Tripo)? Suelta = centrada
 * cerca del origen; posada = sobre el cuerpo (cabeza/torso arriba de 0.45 m,
 * o un pie corrido a un costado).
 */
function isPosed(acc: Accessory, center: Vec3): boolean {
  if (acc.slot === "piernas") return Math.abs(center[0]) > 0.04;
  return center[1] > 0.45 || Math.hypot(center[0], center[2]) > 0.2;
}

/** Espeja en X: nodo con escala (-1,1,1) que después se hornea; transformMesh invierte el orden de los triángulos. */
function mirrorX(doc: Document) {
  const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  const wrap = doc.createNode("espejo").setScale([-1, 1, 1]);
  for (const child of scene.listChildren()) {
    scene.removeChild(child);
    wrap.addChild(child);
  }
  scene.addChild(wrap);
}

async function processAccessory(acc: Accessory, src: string, write: boolean): Promise<Row> {
  const row: Row = { key: acc.id, kind: "accesorio", status: "ok", notes: [], kbIn: kb(statSync(src).size) };
  const spec = SHAPE_SPECS[shapeKey(acc)];
  if (!spec) throw new Error(`sin forma definida pa ${shapeKey(acc)} en models3dSpec.ts`);
  const doc = await read(src);
  row.trisIn = countTris(doc);
  stripExtras(doc, row.notes);
  const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  const b = getBounds(scene);
  const raw: Vec3 = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
  const center: Vec3 = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
  if (isPosed(acc, center)) {
    // Ya viene ubicado sobre el avatar (1.70 m): se respeta su posición. El
    // archivo queda con el pivote en su centro y la posición original va en
    // extras, así el calibrador lo gira/escala sobre sí mismo.
    let mirror = false;
    if (acc.slot === "piernas") {
      if (b.min[0] < -0.03 && b.max[0] > 0.03) row.notes.push("parece un PAR (cruza x = 0) — piernas debe ser un solo pie, el visor lo espeja");
      else if (center[0] > 0) {
        mirror = true;
        row.notes.push("venía en el pie izquierdo: se espejó al derecho");
      }
    }
    const pos: Vec3 = [mirror ? -center[0] : center[0], center[1], center[2]];
    normalize(doc, () => 1, () => center);
    if (mirror) mirrorX(doc);
    scene.setExtras({ ...scene.getExtras(), morrowasi: { posado: pos.map((v) => Math.round(v * 10000) / 10000) } });
    row.notes.push(`posado sobre el avatar en (${pos.map((v) => v.toFixed(2)).join(", ")})`);
    const ratio = Math.max(...raw) / targetSize(acc);
    if (ratio < 0.5 || ratio > 2) row.notes.push(`mide ${Math.max(...raw).toFixed(2)} m, la ficha pide ${targetSize(acc)} m — revisar escala`);
  } else {
    const { size } = normalize(
      doc,
      (s) => targetSize(acc) / Math.max(...s),
      (min, max) => [anchorValue(spec.pivot.x, min[0], max[0]), anchorValue(spec.pivot.y, min[1], max[1]), anchorValue(spec.pivot.z, min[2], max[2])],
    );
    if (acc.slot === "piernas") {
      const w = pairWarning(size);
      if (w) row.notes.push(w);
    }
  }
  await optimize(doc, BUDGET.accesorio.trisTarget, BUDGET.accesorio.texture, row.notes, HIGH_QUALITY);
  row.trisOut = countTris(doc);
  const buf = await io.writeBinary(doc);
  row.kbOut = kb(buf.byteLength);
  if (row.kbOut > BUDGET.accesorio.kbMax && !FORZAR) {
    row.status = "error";
    row.notes.push(`pesa ${row.kbOut} KB (máx ${BUDGET.accesorio.kbMax}) — no se escribió, usá --forzar`);
    return row;
  }
  if (row.kbOut > BUDGET.accesorio.kbWarn) row.notes.push(`pesa ${row.kbOut} KB (ideal ≤ ${BUDGET.accesorio.kbWarn})`);
  if (write) row.file = writeHashed(join(SALIDA || PUBLIC_DIR, "accesorios"), acc.id, buf);
  return row;
}

// ---------- Avatares ----------
function findSingleGlb(dir: string): { file?: string; error?: string } {
  if (!existsSync(dir)) return {};
  const glbs = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".glb") && statSync(join(dir, f)).isFile());
  if (glbs.length > 1) return { error: `hay ${glbs.length} .glb en ${dir} (${glbs.join(", ")}) — dejá uno solo` };
  return glbs.length ? { file: join(dir, glbs[0]) } : {};
}

// La skin especial es la única subcarpeta con un .glb, se llame como se llame
// (en los crudos conviven "skin_esp", "esp" y "skin eso"). "accesorios/" no cuenta.
function findEspecialDir(dir: string): { dir?: string; error?: string } {
  if (!existsSync(dir)) return {};
  const subs = readdirSync(dir)
    .map((f) => join(dir, f))
    .filter((p) => basename(p).toLowerCase() !== ACC_SUBDIR && statSync(p).isDirectory() && readdirSync(p).some((f) => f.toLowerCase().endsWith(".glb")));
  if (subs.length > 1) return { error: `hay ${subs.length} subcarpetas con .glb en ${dir} (${subs.map((s) => basename(s)).join(", ")}) — la especial debe ser una sola` };
  return { dir: subs[0] };
}

async function processAvatar(key: string, src: string, write: boolean): Promise<Row> {
  const row: Row = { key, kind: "avatar", status: "ok", notes: [`origen: ${basename(src)}`], kbIn: kb(statSync(src).size) };
  const doc = await read(src);
  row.trisIn = countTris(doc);
  stripExtras(doc, row.notes);
  // Altura exacta de 1.70 m, pies en y=0, centrado en x. Z se respeta: el
  // frente (+Z) y lo que cuelga atrás (mochilas, pelo) ya vienen bien del generador.
  normalize(
    doc,
    (s) => AVATAR_HEIGHT / s[1],
    (min, max) => [(min[0] + max[0]) / 2, min[1], 0],
  );
  await optimize(doc, null, BUDGET.avatar.texture, row.notes, HIGH_QUALITY);
  row.trisOut = countTris(doc);
  if (row.trisOut > BUDGET.avatar.trisWarn) row.notes.push(`${row.trisOut} tris (ideal ≤ ${BUDGET.avatar.trisWarn}) — pesado en celulares`);
  const buf = await io.writeBinary(doc);
  row.kbOut = kb(buf.byteLength);
  if (row.kbOut > BUDGET.avatar.kbMax && !FORZAR) {
    row.status = "error";
    row.notes.push(`pesa ${row.kbOut} KB (máx ${BUDGET.avatar.kbMax}) — no se escribió, usá --forzar`);
    return row;
  }
  if (row.kbOut > BUDGET.avatar.kbWarn) row.notes.push(`pesa ${row.kbOut} KB (ideal ≤ ${BUDGET.avatar.kbWarn})`);
  if (write) row.file = writeHashed(join(SALIDA || PUBLIC_DIR, "avatares"), key, buf);
  return row;
}

// ---------- Manifiesto ----------
/** El JSON de un .glb sin decodificar nada (alcanza para leer extras). */
function readGlbJson(path: string): { scenes?: { extras?: { morrowasi?: { posado?: Vec3 } } }[] } {
  const b = readFileSync(path);
  return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString("utf8"));
}

function writeManifest() {
  const avatars: Record<string, { normal?: string; especial?: string }> = {};
  const accessories: Record<string, string> = {};
  const posedAt: Record<string, Vec3> = {};
  const avatarIds = new Set(AVATARS.map((a) => a.id));
  const listDir = (d: string) => (existsSync(d) ? readdirSync(d).sort() : []);
  for (const f of listDir(join(PUBLIC_DIR, "avatares"))) {
    const p = parseHashed(f);
    const id = p?.key.replace(/-especial$/, "");
    if (!p || !id || !avatarIds.has(id)) {
      console.warn(`  ! public/models/avatares/${f} no corresponde a ningún avatar — ignorado`);
      continue;
    }
    (avatars[id] ||= {})[p.key.endsWith("-especial") ? "especial" : "normal"] = f;
  }
  // Miniaturas: <id>[-especial]-<cuerpo|busto>.<hash>.webp
  const thumbs: Record<string, { cuerpo?: string; busto?: string }> = {};
  const accThumbs: Record<string, string> = {};
  for (const f of listDir(THUMB_DIR)) {
    const key = parseHashed(f, "webp")?.key || "";
    if (ACC_BY_ID.has(key)) {
      accThumbs[key] = f;
      continue;
    }
    const m = /^(.+)-(cuerpo|busto)$/.exec(key);
    if (!m || !avatars[m[1].replace(/-especial$/, "")]) {
      console.warn(`  ! public/models/miniaturas/${f} no corresponde a ningún avatar — ignorado`);
      continue;
    }
    (thumbs[m[1]] ||= {})[m[2] as "cuerpo" | "busto"] = f;
  }
  for (const f of listDir(join(PUBLIC_DIR, "accesorios"))) {
    const p = parseHashed(f);
    if (!p || !ACC_BY_ID.has(p.key)) {
      console.warn(`  ! public/models/accesorios/${f} no corresponde a ningún accesorio — ignorado`);
      continue;
    }
    accessories[p.key] = f;
    const posed = readGlbJson(join(PUBLIC_DIR, "accesorios", f)).scenes?.[0]?.extras?.morrowasi?.posado;
    if (posed) posedAt[p.key] = posed;
  }
  const out = `// GENERADO por scripts/modelos-3d.ts — no editar a mano (se regenera en cada \`pnpm modelos:procesar\`).
// Archivos con hash en el nombre dentro de public/models/: cambian de nombre si cambia el contenido.

export const AVATAR_MODEL_FILES: Record<string, { normal?: string; especial?: string }> = ${JSON.stringify(avatars, null, 2)};

/** Clave: id del avatar, o "<id>-especial". Fotos pre-renderizadas por \`pnpm modelos:miniaturas\`. */
export const AVATAR_THUMB_FILES: Record<string, { cuerpo?: string; busto?: string }> = ${JSON.stringify(thumbs, null, 2)};

export const ACCESSORY_MODEL_FILES: Record<string, string> = ${JSON.stringify(accessories, null, 2)};

/** Accesorios que vinieron armados sobre el avatar: van en esta posición (m), no en un socket. */
export const ACCESSORY_POSED_AT: Record<string, [number, number, number]> = ${JSON.stringify(posedAt, null, 2)};

/** Foto de cada accesorio para su tarjeta en la tienda (pnpm modelos:miniaturas). */
export const ACCESSORY_THUMB_FILES: Record<string, string> = ${JSON.stringify(accThumbs, null, 2)};
`;
  writeFileSync(MANIFEST, out);
  console.log(`Manifiesto: ${Object.keys(avatars).length} avatares, ${Object.keys(thumbs).length} con miniatura, ${Object.keys(accessories).length}/${ALL_ACCESSORIES.length} accesorios (${Object.keys(posedAt).length} posados, ${Object.keys(accThumbs).length} con miniatura) → src/data/models3d.generated.ts`);
}

// ---------- Main ----------
async function run(write: boolean) {
  const wanted = (key: string, avatarId: string) => !SOLO || SOLO.includes(key) || SOLO.includes(avatarId);
  if (!existsSync(CRUDOS)) throw new Error(`no existe la carpeta de crudos: ${CRUDOS}`);
  // Los accesorios pueden estar en <crudos>/accesorios/ o en <crudos>/<avatar>/accesorios/.
  const accDirs = [join(CRUDOS, ACC_SUBDIR), ...AVATARS.map((a) => join(CRUDOS, AVATAR_SOURCE_DIRS[a.id] || a.id, ACC_SUBDIR))].filter((d) => existsSync(d));

  // Archivos que no calzan con ningún id — casi siempre un typo en el nombre.
  for (const d of accDirs) {
    for (const f of readdirSync(d)) {
      if (f.toLowerCase().endsWith(".glb") && !ACC_BY_ID.has(f.slice(0, -4))) {
        rows.push({ key: f, kind: "accesorio", status: "error", notes: [`el nombre no es ningún id de accesorio (ej. angie-acc0.glb) — en ${d}`] });
      }
    }
  }

  for (const av of AVATARS) {
    const dir = join(CRUDOS, AVATAR_SOURCE_DIRS[av.id] || av.id);
    const esp = findEspecialDir(dir);
    for (const [key, sub] of [[av.id, dir], [`${av.id}-especial`, esp.dir]] as const) {
      if (!wanted(key, av.id)) continue;
      const found = key === av.id ? findSingleGlb(sub!) : esp.error ? { error: esp.error } : sub ? findSingleGlb(sub) : {};
      if (found.error) rows.push({ key, kind: "avatar", status: "error", notes: [found.error] });
      else if (!found.file) rows.push({ key, kind: "avatar", status: "falta", notes: [] });
      else rows.push(await processAvatar(key, found.file, write).catch((e: Error) => ({ key, kind: "avatar" as const, status: "error" as const, notes: [e.message] })));
    }
    for (const acc of AVATAR_ACCESSORIES[av.id]) {
      if (!wanted(acc.id, av.id)) continue;
      const found = accDirs.map((d) => join(d, `${acc.id}.glb`)).filter((p) => existsSync(p));
      if (!found.length) {
        rows.push({ key: acc.id, kind: "accesorio", status: "falta", notes: [] });
        continue;
      }
      if (found.length > 1) {
        rows.push({ key: acc.id, kind: "accesorio", status: "error", notes: [`está en ${found.length} carpetas (${found.join(" y ")}) — dejá uno solo`] });
        continue;
      }
      const src = found[0];
      rows.push(await processAccessory(acc, src, write).catch((e: Error) => ({ key: acc.id, kind: "accesorio" as const, status: "error" as const, notes: [e.message] })));
    }
  }

  for (const r of rows) if (r.status === "ok" && r.notes.some((n) => !n.startsWith("origen:") && !n.startsWith("simplificado") && !n.startsWith("posado"))) r.status = "aviso";
  const shown = rows.filter((r) => r.status !== "falta");
  const icon = { ok: "✓", aviso: "!", error: "✗", falta: "·" } as const;
  for (const r of shown) {
    const nums = r.trisIn != null ? `${r.trisIn}→${r.trisOut} tris, ${r.kbIn}→${r.kbOut} KB` : "";
    console.log(`${icon[r.status]} ${r.kind.padEnd(9)} ${r.key.padEnd(22)} ${nums}${r.file ? `  → ${r.file}` : ""}`);
    for (const n of r.notes) console.log(`    ${n}`);
  }
  const count = (s: Row["status"]) => rows.filter((r) => r.status === s).length;
  console.log(`\n${count("ok")} ok, ${count("aviso")} con aviso, ${count("error")} con error, ${count("falta")} sin crudo todavía (crudos: ${CRUDOS})`);
  if (write && !SALIDA) writeManifest();
  if (count("error")) process.exitCode = 1;
}

// ---------- Miniaturas ----------
// Tamaño de la foto: el doble de lo que ocupa en pantalla, para pantallas retina.
const THUMB_SIZES = { cuerpo: [240, 360], busto: [192, 192], accesorio: [160, 160] } as const;

function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const found = candidates.find((c) => c && existsSync(c));
  if (!found) throw new Error("no encontré Chrome/Edge — definí CHROME_PATH");
  return found;
}

function screenshot(chrome: string, url: string, [w, h]: readonly [number, number], out: string, profile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      chrome,
      [
        "--headless=new",
        "--use-angle=swiftshader", // WebGL por software: igual en cualquier máquina, sin GPU
        "--enable-unsafe-swiftshader",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--default-background-color=00000000",
        `--window-size=${w},${h}`,
        "--virtual-time-budget=20000",
        `--user-data-dir=${profile}`,
        `--screenshot=${out}`,
        url,
      ],
      { timeout: 90_000 },
      (err) => (existsSync(out) ? resolve() : reject(err || new Error("Chrome no generó la captura"))),
    );
  });
}

// Levanta Vite en modo dev (la página /dev/miniatura solo existe ahí), saca
// una foto por avatar × {normal, especial} × {cuerpo, busto} y las guarda con
// hash. Sin miniatura, la app sigue usando la miniatura 2D de siempre.
async function makeThumbnails() {
  const { createServer } = await import("vite");
  const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 5198, strictPort: false } });
  await server.listen();
  const base = server.resolvedUrls?.local[0]?.replace(/\/$/, "");
  if (!base) throw new Error("Vite no levantó");
  const chrome = findChrome();
  const tmp = mkdtempSync(join(tmpdir(), "miniaturas-"));
  const jobs: { key: string; id: string; especial: boolean; encuadre: keyof typeof THUMB_SIZES }[] = [];
  // Accesorios: foto de la pieza sola, de tres cuartos, para su tarjeta en la tienda.
  for (const f of existsSync(join(PUBLIC_DIR, "accesorios")) ? readdirSync(join(PUBLIC_DIR, "accesorios")) : []) {
    const key = parseHashed(f)?.key;
    const acc = key ? ACC_BY_ID.get(key) : undefined;
    if (!acc || (SOLO && !SOLO.includes(acc.id) && !SOLO.includes(acc.avatarId))) continue;
    jobs.push({ key: acc.id, id: acc.id, especial: false, encuadre: "accesorio" });
  }
  for (const f of existsSync(join(PUBLIC_DIR, "avatares")) ? readdirSync(join(PUBLIC_DIR, "avatares")) : []) {
    const key = parseHashed(f)?.key;
    if (!key) continue;
    const id = key.replace(/-especial$/, "");
    if (SOLO && !SOLO.includes(key) && !SOLO.includes(id)) continue;
    for (const encuadre of ["cuerpo", "busto"] as const) jobs.push({ key, id, especial: key !== id, encuadre });
  }
  let failed = 0;
  try {
    // De a 4 en paralelo: cada Chrome con su perfil propio.
    for (let i = 0; i < jobs.length; i += 4) {
      await Promise.all(
        jobs.slice(i, i + 4).map(async (j, n) => {
          const [w, h] = THUMB_SIZES[j.encuadre];
          const png = join(tmp, `${j.key}-${j.encuadre}.png`);
          const url =
            j.encuadre === "accesorio"
              ? `${base}/dev/miniatura?solo=${j.id}&w=${w}&h=${h}&yaw=30&pitch=25`
              : `${base}/dev/miniatura?avatar=${j.id}&especial=${j.especial ? 1 : 0}&encuadre=${j.encuadre}&w=${w}&h=${h}`;
          try {
            await screenshot(chrome, url, [w, h], png, join(tmp, `perfil-${n}`));
            const { data, info } = await sharp(readFileSync(png)).raw().toBuffer({ resolveWithObject: true });
            // Una captura toda transparente = la página no llegó a dibujar (WebGL o carga fallida).
            let opaque = 0;
            for (let p = 3; p < data.length; p += info.channels) if (data[p] > 0) opaque++;
            if (opaque < (w * h) / 50) throw new Error("la captura salió vacía");
            const webp = await sharp(readFileSync(png)).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
            const file = writeHashed(THUMB_DIR, j.encuadre === "accesorio" ? j.key : `${j.key}-${j.encuadre}`, webp, "webp");
            console.log(`✓ miniatura ${(j.key + " " + j.encuadre).padEnd(30)} ${kb(webp.byteLength)} KB → ${file}`);
          } catch (e) {
            failed++;
            console.log(`✗ miniatura ${j.key} ${j.encuadre}: ${(e as Error).message}`);
          }
        }),
      );
    }
  } finally {
    await server.close();
    rmSync(tmp, { recursive: true, force: true });
  }
  writeManifest();
  if (failed) process.exitCode = 1;
}

if (cmd === "check") await run(false);
else if (cmd === "procesar") await run(true);
else if (cmd === "manifiesto") writeManifest();
else if (cmd === "miniaturas") await makeThumbnails();
else {
  console.error(`Comando desconocido: ${cmd} (usá check | procesar | manifiesto | miniaturas)`);
  process.exitCode = 1;
}
