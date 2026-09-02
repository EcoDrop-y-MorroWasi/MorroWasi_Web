# Prompt Codex Terra — Academia del Agua + Cursos con Video (ES) | MVP Web Dia 1

Eres Codex Terra implementando MorroWasi Web. Trabajo paralelo a Claude (shell) y Muse Spark/Nemotron.

**Lee primero:**
- `AGENTS.md:69,145,224` (stack, paleta, gamificación)
- `Morrowasi_web.md:186-191` (Academia: 6 cursos + 4 mini-juegos) y `Morrowasi_web.md:258` (React 19 + TS + Vite 6 + Tailwind 4)
- `Proyecto_Contexto.md:34-38` (sin BLE/Flask, offline-first)
- `morrowasi-preview.html` (lógica unlock)

**Objetivo:** Módulo Academia del Agua visual. Catálogo 6 cursos con video propio:
- SODIS 150 XP sin requisito
- Reuso Aguas Grises 200 XP sin requisito
- Filtros Caseros 250 XP requiere 300 HP
- Riego por Goteo 180 XP requiere 200 HP
- Cosecha Lluvia 300 XP requiere Wasi nivel 2
- Tratamiento Biológico 400 XP requiere Wasi nivel 3
Incluir lecciones modulares + quiz + duración + video thumbnail + player mock (preparado para Firebase Storage).

**Constraints:**
- React + Tailwind, paleta AGENTS.md:145 (#99B4D8/#FFB793/#E26D5C bg #fdfae7), bordes 2px sólidos, 48dp, español.
- Componentes reutilizables: CourseCard, VideoThumbnailCard, VideoPlayerView mock.
- Desbloqueo reactivo por HydroPuntos/Wasi (no hardcodear). Datos en `src/data/courses.mock.ts` (no tocar `src/data/mock.ts` de Claude).
- Sin BLE/Flask. Mock offline-first. Textos en español.

**Output esperado:**
- `src/pages/Academia.tsx` (lista + detalle)
- `src/components/CourseCard.tsx`
- `src/components/video/VideoPlayerView.tsx` (mock player con thumbnail)
- `src/components/video/VideoThumbnailCard.tsx`
- `src/data/courses.mock.ts`

**Validación:** `npm run build` ok. Unlock respeta tabla AGENTS.md:224. Paleta y tipografías validadas.
