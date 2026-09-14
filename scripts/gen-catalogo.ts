// Genera supabase/migrations/0010_catalogo_recompensas.sql desde el catálogo real
// de TypeScript. El servidor necesita saber que "diaria-03" paga 7 EXP para poder
// rechazar un libro de eventos que diga 9999 — pero mantener esa tabla a mano
// significaría que cambiar un XP en gamification.ts rompe los submits legítimos
// hasta que alguien se acuerde de tocar el SQL. Este script elimina ese riesgo:
// el SQL se regenera desde la única fuente de verdad.
//
//   pnpm gen:catalogo
//
// Node 24 ejecuta .ts directamente (type stripping nativo), sin dependencias extra.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  MINIGAMES,
  MISIONES_DIARIAS_POOL,
  MISIONES_SEMANALES_POOL,
  MISIONES_MENSUALES,
} from "../src/utils/gamification.ts";
import { coursesMock } from "../src/data/courses.mock.ts";

interface Fila {
  ref: string;
  tipo: "juego" | "mision" | "curso" | "ahorro";
  expMin: number;
  expMax: number;
  hydroMin: number;
  hydroMax: number;
  segundosMin: number;
}

const filas: Fila[] = [];

// Juegos: calcMinigameScore() acota siempre a [30, 100] HydroPuntos y no toca EXP.
// segundosMin es la duración real de la partida — el servidor la usa para detectar
// partidas solapadas (12 juegos de 60 s no caben en 30 segundos).
for (const juego of MINIGAMES) {
  filas.push({
    ref: juego.id,
    tipo: "juego",
    expMin: 0,
    expMax: 0,
    hydroMin: 30,
    hydroMax: 100,
    segundosMin: juego.durationSeconds,
  });
}

// Misiones: EXP fija por misión, sin HydroPuntos.
for (const mision of [...MISIONES_DIARIAS_POOL, ...MISIONES_SEMANALES_POOL, ...MISIONES_MENSUALES]) {
  filas.push({
    ref: mision.id,
    tipo: "mision",
    expMin: mision.xp,
    expMax: mision.xp,
    hydroMin: 0,
    hydroMax: 0,
    segundosMin: 0,
  });
}

// Misiones personalizadas: el usuario elige los litros y calcCustomXp() acota a [5, 40].
filas.push({
  ref: "personalizada",
  tipo: "mision",
  expMin: 5,
  expMax: 40,
  hydroMin: 0,
  hydroMax: 0,
  segundosMin: 0,
});

// Cursos: Academia.tsx acredita course.xpReward en HydroPuntos, una sola vez por curso.
for (const curso of coursesMock) {
  filas.push({
    ref: curso.id,
    tipo: "curso",
    expMin: 0,
    expMax: 0,
    hydroMin: curso.xpReward,
    hydroMax: curso.xpReward,
    segundosMin: 0,
  });
}

const escape = (s: string) => s.replace(/'/g, "''");

const values = filas
  .map(
    (f) =>
      `  ('${escape(f.ref)}', '${f.tipo}', ${f.expMin}, ${f.expMax}, ${f.hydroMin}, ${f.hydroMax}, ${f.segundosMin})`,
  )
  .join(",\n");

const sql = `-- GENERADO POR scripts/gen-catalogo.ts — NO EDITAR A MANO.
-- Regenerar con: pnpm gen:catalogo
--
-- Espejo en SQL del catálogo de recompensas de src/utils/gamification.ts y
-- src/data/courses.mock.ts. submit_leaderboard_score() valida contra esto cada
-- evento del libro que manda el cliente.

delete from catalogo_recompensas;

insert into catalogo_recompensas (ref, tipo, exp_min, exp_max, hydro_min, hydro_max, segundos_min) values
${values}
on conflict (ref) do update
  set tipo = excluded.tipo,
      exp_min = excluded.exp_min,
      exp_max = excluded.exp_max,
      hydro_min = excluded.hydro_min,
      hydro_max = excluded.hydro_max,
      segundos_min = excluded.segundos_min;
`;

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = join(aqui, "..", "supabase", "migrations", "0010_catalogo_recompensas.sql");
writeFileSync(destino, sql, "utf8");

console.log(`✅ ${filas.length} recompensas escritas en ${destino}`);
