# Prompt Claude Sonnet 5 — Shell + Dashboard Wasi (EN) | MVP Web Dia 1

> You are Claude Sonnet 5, development lead for MorroWasi Web MVP.

**Read first:**
- `AGENTS.md:145` (official palette) + `AGENTS.md:224-245` (HydroPuntos/Wasi formula)
- `Morrowasi_web.md:74-94` (stack + 9 sections) + `Morrowasi_web.md:258` (React 19 + TS + Vite 6 + Tailwind 4 + Vercel)
- `Proyecto_Contexto.md:58-62` (no BLE/Flask, offline-first, Eco-Drop autonomous)
- `morrowasi-preview.html` (real JS logic: PEW = HydroPoints + min(streak*10,1000), stage=min(10,floor(PEW/500)+1), xp=round(liters/3) capped 5-40)
- `Flujotrabajo.md:213` (Fase 10 gate approved)

**Objective:** Build visual MVP shell + Inicio + Dashboard central. Dashboard shows: liters saved today, total HydroPoints, active streak, Wasi live card (10 stages: 1 Pequeño Brote, 2 Semilla Germinada, 3 Jardín de Duna, 4 Arbusto Resiliente, 5 Oasis Temprano, 6 Refugio Verde, 7 Flujo del Chira, 8 Bosque Seco, 9 Santuario Hídrico, 10 Oasis Sagrado + progress PEW%500/500) and family reservoir monitor.

**Constraints:**
- React 19 + TypeScript + Vite 6 + Tailwind CSS 4, deployed to Vercel. Direct Firebase SDK only (mock today, no real calls).
- Palette #99B4D8 primary / #FFB793 secondary / #E26D5C tertiary / bg #fdfae7 light #0a0a0a dark / text #1c1c11, 2px solid keyline-border, no shadows. Fonts Plus Jakarta Sans (headings) + Atkinson Hyperlegible (body).
- Accessibility: touch targets ≥48dp, WCAG AA contrast, contentDescription.
- Mock data only in `src/data/mock.ts`. Spanish UI strings. No BLE/Bluetooth, no Flask/backend.
- BottomNav 5 tabs: Cursos / Juegos / Dashboard (center) / Misiones / Ahorro. TopBar avatar -> Perfil.

**Output expected:**
- `src/components/Layout.tsx` (MorrowasiTopBar, MorrowasiBottomBar)
- `src/pages/Dashboard.tsx` + `src/pages/Inicio.tsx`
- `src/data/mock.ts` (shared types: Task, Course, Minigame, WasiStage, families)
- `src/index.css` palette tokens
- Language: ENGLISH ONLY for explanations (Token saving: ~30%). Code comments in Spanish.

**Validation:** `npm run build` passes. Palette matches AGENTS.md:145. Wasi formula AGENTS.md:245 verified with mock HydroPoints 850 + streak 12 => PEW 970 => stage 2.

---
Spark+Gemini note: Obligates reading real MVP logic to avoid HAL on liters/XP. Shell first so Codex/Spark/Nemotron can import Layout without collision. Gemini validates Vite build.
