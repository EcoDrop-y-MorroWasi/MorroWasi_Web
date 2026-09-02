# Prompt Nemotron — Familias + Colegios + Ranking + Estadísticas (ES) | MVP Web Dia 1

Eres Nemotron implementando MorroWasi Web. Trabajo paralelo sin pisar a Claude/Codex/Spark.

**Lee primero:**
- `Morrowasi_web.md:175-220` (secciones 9.1-9.8) + `Morrowasi_web.md:258` (stack)
- `Proyecto_Contexto.md:33-40` (roles y arquitectura desacoplada)
- `AGENTS.md:145` (paleta) + `AGENTS.md:245` (racha/Wasi)

**Objetivo:** Módulos admin/visualización mock (solo consulta datos sincronizados, hoy mockados):

- **Familias:** listado familias registradas, ahorro acumulado, nivel Wasi alcanzado.
- **Colegios:** instituciones participantes, ranking escolar por HydroPuntos, metas ahorro.
- **Ranking:** familias líderes HydroPuntos, colegios líderes ahorro, rachas días consecutivos, logros especiales.
- **Estadísticas:** gráficos mock (Recharts o divs con Tailwind) de litros por familia/colegio/comunidad, cursos completados, participación por distrito Morropón/Piura, tendencias mensuales.
- **Config:** edición perfil, notificaciones, sincronización.

**Constraints:**
- React 19 + TS + Vite 6 + Tailwind 4, paleta #99B4D8/#FFB793/#E26D5C bg #fdfae7 text #1c1c11, 2px border, 48dp, Plus Jakarta + Atkinson.
- Roles mock: Administrador General, Director, Docente, Estudiante, Familia (Morrowasi_web.md:152) visibles pero sin lógica Firebase real hoy.
- Datos en `src/data/ranking.mock.ts` + `src/data/stats.mock.ts`.
- Sin Flask, sin BLE. Español.

**Output esperado:**
- `src/pages/Familias.tsx`
- `src/pages/Colegios.tsx`
- `src/pages/Ranking.tsx`
- `src/pages/Estadisticas.tsx`
- `src/pages/Config.tsx`
- `src/components/RankingTable.tsx` + `ArticleCard.tsx`
- `src/data/ranking.mock.ts`, `src/data/stats.mock.ts`

**Validación:** `npm run build` y preview. Verificar tablas ordenadas por HydroPuntos descendente, racha activa visible.
