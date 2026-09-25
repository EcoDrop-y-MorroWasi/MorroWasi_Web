// Script de un solo uso: sube los 4 videos protegidos a Vercel Blob (privado) y
// borra los .mp4 de public/ (dejan de ser estáticos/públicos). Correr con:
//   node --env-file=.env.local scripts/upload-videos-to-blob.mjs
import { put } from "@vercel/blob";
import { readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const FILES = [
  {
    local: "public/media/news/miniferia-cada-gota-cuenta/video-1.mp4",
    pathname: "news/miniferia-cada-gota-cuenta/video-1.mp4",
  },
  {
    local: "public/media/news/miniferia-cada-gota-cuenta/video-2.mp4",
    pathname: "news/miniferia-cada-gota-cuenta/video-2.mp4",
  },
  {
    local: "public/media/news/miniferia-cada-gota-cuenta/video-3.mp4",
    pathname: "news/miniferia-cada-gota-cuenta/video-3.mp4",
  },
  {
    local: "public/media/club/cortometraje-cada-gota-cuenta.mp4",
    pathname: "club/cortometraje-cada-gota-cuenta.mp4",
  },
];

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Falta BLOB_READ_WRITE_TOKEN. Corré con: node --env-file=.env.local scripts/upload-videos-to-blob.mjs");
  process.exit(1);
}

for (const file of FILES) {
  if (!existsSync(file.local)) {
    console.error(`No existe ${file.local}, salteando`);
    continue;
  }
  console.log(`Subiendo ${file.local} -> ${file.pathname} ...`);
  const buffer = await readFile(file.local);
  const result = await put(file.pathname, buffer, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "video/mp4",
  });
  console.log(`  OK: ${result.pathname} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
}

console.log("\nBorrando copias locales de public/ ...");
for (const file of FILES) {
  if (existsSync(file.local)) {
    await rm(file.local);
    console.log(`  Borrado ${file.local}`);
  }
}

console.log("\nListo.");
