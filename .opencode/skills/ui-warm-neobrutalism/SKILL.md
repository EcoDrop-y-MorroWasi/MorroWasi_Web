# Skill: UI Warm Neo-Brutalism — Identidad Visual MorroWasi

> Universal para Claude (EN), Codex Terra, Muse Spark, Nemotron, Antigravity, Gemini. Fuente visual: `morrowasi-preview.html:11-22`, paleta `AGENTS.md:145`, sistema `UI_UX_Guide.md:5`.

## Objetivo
Garantizar que cualquier IA genere UI con la misma identidad cálida-desértica juvenil, sin desviarse a `DESIGN.md` turquesa obsoleto.

## Tokens oficiales (no cambiar)

```css
:root {
  --primary: #99B4D8;    /* agua, TopBar, stat-card */
  --secondary: #FFB793;  /* gamificación, chips, peach */
  --accent: #E26D5C;     /* CTA, énfasis, coral */
  --bg: #fdfae7;         /* fondo claro cálido */
  --bg-dark: #0a0a0a;    /* dark mode */
  --on-surface: #1c1c11; /* texto, borde */
  --border: 2px solid #1c1c11;
  --shadow: 4px 4px 0 #1c1c11;
  --shadow-sm: 2px 2px 0 #1c1c11;
  --radius: 12px;
}
```

Tipografía: **Plus Jakarta Sans** (headings/Wasi/números `Type.kt displayLarge`) + **Atkinson Hyperlegible** (cuerpo/quiz) `AGENTS.md:158` / `UI_UX_Guide.md:152`.

## Reglas base (todas las pantallas)

1. **Borde 2px sólido** `keyline-border` + **sombra dura sin blur** `4px 4px 0` — nunca `elevation` ni `box-shadow` difusa `UI_UX_Guide.md:149`.
2. **Botón mecánico** `morrowasi-preview.html:266`:
   ```css
   .btn:active { transform: translate(2px, 2px); box-shadow: none; }
   /* Tailwind: active:translate-x-[2px] active:translate-y-[2px] active:shadow-none */
   /* Compose: Modifier.clickable + graphicsLayer { translationX=2.dp } + border */
   ```
3. **Card hover** `morrowasi-preview.html:152`: `hover:translateY(-2px)` + `transition 0.12s`.
4. **Contraste:** `#1c1c11` sobre `#fdfae7` = 15.8:1 (WCAG AA sol intenso).

## Equivalencias Web vs Android

| Concepto | Tailwind (Web) | Jetpack Compose (Android) |
|---|---|---|
| Borde | `border-2 border-[#1c1c11]` | `Modifier.border(2.dp, Color(0xFF1C1C11), RoundedCornerShape(12.dp))` |
| Sombra dura | `shadow-[4px_4px_0_#1c1c11]` | `Modifier.drawBehind { drawRect }` o `Card(elevation=0.dp)` + `offset` |
| Radius | `rounded-xl` (12px) | `RoundedCornerShape(12.dp)` |
| Fondo | `bg-[#fdfae7]` | `Color(0xFFFDFae7)` |
| Touch | `min-h-[48px]` | `Modifier.sizeIn(minHeight=48.dp)` |

## Variantes juveniles por pestaña (misma paleta, diferente energía)

> Mantiene marca `AGENTS.md:145` pero evita monotonía. Cada pestaña usa 1 acento.

| Pestaña `UI_UX_Guide.md:2.1` | Estilo | Tokens activos | Detalle |
|---|---|---|---|
| **Dashboard** (central) | **Neo-brutal base** | `primary` + `accent` | `morrowasi-preview.html` tal cual. `stat-card` + `wasi-card linear-gradient(135deg, #99B4D8, #b8d4f0)` `morrowasi-preview.html:192`. |
| **Cursos** | **Editorial suave** | `bg` + `primary` | Cards `bg-white` borde 2px, thumbnail `course-thumb` 70x70 `morrowasi-preview.html:312`. Sin sombra dura, `shadow-sm` solo. |
| **Juegos** | **Arcade juvenil** | `accent` + `secondary` | Borde 3px, sombra 6px, `canvas-confetti` al ganar. `MinigameCard` ilustración grande `UI_UX_Guide.md:124`. |
| **Misiones** | **Sticker coleccionable** | `secondary` | Badge sticker: `border-2 border-white` externo + `border-2 border-[#1c1c11]` interno + `shadow`. Inspirado en parche bordado. |
| **Ahorro** | **Clay suave** | `primary` + `secondary` | `quick-save-btn` `morrowasi-preview.html:280` hover `bg-secondary`. `savings-hero` gradient `morrowasi-preview.html:377`. |

**Textura opcional juvenil (no obligatoria):** patrón SVG 3% opacidad líneas topográficas Sechura o gotas sobre `bg #fdfae7`. Nunca sobre cards.

## Clases utilitarias recomendadas (Web)

```html
<!-- Card base -->
<div class="bg-white border-2 border-[#1c1c11] rounded-xl shadow-[4px_4px_0_#1c1c11] p-[18px] hover:-translate-y-[2px] transition-transform">

<!-- Botón primario -->
<button class="bg-[#99B4D8] border-2 border-[#1c1c11] rounded-lg shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-bold min-h-[48px]">

<!-- Stat peach/coral -->
<div class="bg-[#FFB793] border-2 border-[#1c1c11] rounded-xl shadow-[2px_2px_0_#1c1c11]"> <!-- peach -->
<div class="bg-[#E26D5C] text-white border-2 border-[#1c1c11]"> <!-- coral -->
```

## Validación
- Claude EN: `npm run build` sin errores Tailwind, `index.css` tokens coinciden `AGENTS.md:145`.
- Gemini Android: `./gradlew assembleDebug` sin `elevation` en cards.
- Contraste AA verificado.

## Referencias
`morrowasi-preview.html:17-19` `--shadow`, `AGENTS.md:145` paleta, `AGENTS.md:159` keyline-border, `UI_UX_Guide.md:149` sin elevation.
