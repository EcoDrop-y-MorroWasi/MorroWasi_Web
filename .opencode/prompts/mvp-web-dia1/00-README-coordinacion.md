# MVP Web Día 1 — Coordinación 4 IAs en paralelo

**Fecha:** 31-ago-2026 (Fase 10 habilitada `Proyecto_Contexto.md:9`)
**Stack:** `Morrowasi_web.md:258` React 19 + TS + Vite 6 + Tailwind 4 → Vercel, Firebase mock
**Paleta:** `AGENTS.md:145` #99B4D8 / #FFB793 / #E26D5C / #fdfae7 / #0a0a0a / #1c1c11
**Fórmulas:** `AGENTS.md:245` PEW = Hydro + min(racha*10,1000), etapa = min(10, floor(PEW/500)+1), xp=round(litros/3) 5-40

## Orden de lanzamiento hoy

1. **Claude primero (5 min):** Crea `src/data/mock.ts` + `Layout.tsx` + `index.css`. Hace `npm create vite@latest morrowasi-web -- --template react-ts` + `npm install -D tailwindcss`.
   ```bash
   npm create vite@latest morrowasi-web -- --template react-ts
   cd morrowasi-web; npm install; npx tailwindcss init -p
   ```

2. **Luego en paralelo (sin esperar build final):**
   - Codex → `src/data/courses.mock.ts` (no toca mock.ts)
   - Muse Spark → `src/data/minigames.mock.ts` + `tasks.mock.ts`
   - Nemotron → `src/data/ranking.mock.ts` + `stats.mock.ts`

3. **Integración:** Todos importan `Layout.tsx` de Claude. No duplicar paleta.

## Archivos por IA (sin pisarse)

| IA | Puede tocar | NO tocar |
|---|---|---|
| Claude | `mock.ts`, `Layout.tsx`, `Dashboard.tsx`, `Inicio.tsx`, `index.css` | `courses.mock.ts`, `minigames.mock.ts` |
| Codex | `courses.mock.ts`, `Academia.tsx`, `CourseCard.tsx`, `video/*` | `mock.ts`, `Ranking.tsx` |
| Muse Spark | `minigames.mock.ts`, `tasks.mock.ts`, `Juegos.tsx`, `Misiones.tsx`, `Ahorro.tsx` | `courses.mock.ts`, `ranking.mock.ts` |
| Nemotron | `ranking.mock.ts`, `stats.mock.ts`, `Familias.tsx`, `Ranking.tsx`, `Estadisticas.tsx` | `tasks.mock.ts` |

## Prompt listo para copiar/pegar

Cada archivo `01-04` ya está en formato copy-paste para el chat de cada IA.

## Validación final (Gemini)

```bash
npm run build
npm run preview
# Verificar: 5 tabs visibles, Wasi etapa correcta, desbloqueo cursos 200/300 HP, xp=round(litros/3)
```

## Qué es MOCK hoy y qué queda para mañana

Hoy: solo visual con datos mock, sin `firebaseConfig`. Mañana Sprint 1 `Roadmap.md` conecta Firestore/Storage real.

