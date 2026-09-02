# Skill: Accesibilidad Piura — Sol Intenso + Táctil + Lectura

> Universal. Cumple `AGENTS.md:11` + `AGENTS.md:322` + `UI_UX_Guide.md:9` + `RNF-03/RNF-05`. Obligatorio para Desafío Amauta 2026 (niños + adultos mayores, exteriores).

## Objetivo
Que la app/web sea usable a pleno sol en Morropón, con una mano, sin depender de color.

## 1. Táctil y layout

- **Target ≥48dp** `AGENTS.md:322`: `min-h-[48px] min-w-[48px]` Tailwind / `Modifier.sizeIn(minHeight=48.dp)` Compose. Aplica a botones, tabs, cards clicables, iconos.
- **BottomBar 80dp** `UI_UX_Guide.md:157` a pulgar, 5 tabs `Cursos/Juegos/Dashboard/Misiones/Ahorro` `AGENTS.md:253`.
- **Espaciado** `UI_UX_Guide.md:157`: base 8dp, 16dp entre cards, 24dp padding pantalla.
- **Grid responsive** `morrowasi-preview.html:164-181`: `stats-grid repeat(auto-fit, minmax(160px,1fr))` → desktop 4 col.

## 2. Contraste y color (WCAG AA sol)

- **Texto `#1c1c11` sobre `#fdfae7` = 15.8:1** — usar para todo texto. Nunca texto `#99B4D8` sobre blanco.
- **No solo color:** estado `.done` usa `bg #d4edda + border #28a745 + check ✓` `morrowasi-preview.html:236`, no solo verde.
- **Modo oscuro** `UI_UX_Guide.md:200`: `bg #0a0a0a` + texto `#fdfae7`, borde `#fdfae7`. Toggle en Perfil/Ajustes DataStore `theme`.

```css
/* Claro (default) */
body { background: #fdfae7; color: #1c1c11; }
/* Oscuro */
@media (prefers-color-scheme: dark) { body { background: #0a0a0a; color: #fdfae7; } }
```

## 3. Tipografía hiperlegible

- **Headings/números/Wasi:** `Plus Jakarta Sans` 700-800, `letter-spacing -0.5px` `morrowasi-preview.html:54`.
- **Cuerpo/quiz/captions:** `Atkinson Hyperlegible` 400-600 `UI_UX_Guide.md:154` (diseñada para baja visión).
- **Tamaños mínimos:** `stat-value 1.6rem 800`, `mission-text 0.9rem 600`, `stat-label 0.8rem`.

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">
```
Android `Type.kt`: `displayLarge = TextStyle(PlusJakartaSans, 800, 30.sp)` / `bodyMedium = AtkinsonHyperlegible`.

## 4. Contenido accesible

- **contentDescription obligatorio** `AGENTS.md:322`: todo `Icon`, `Image`, `Video`, `WasiIllustration`, `MrGotaIllustration` `UI_UX_Guide.md:8`.
  ```kotlin
  Icon(..., contentDescription = "Misión Ducha Flash, 60 litros, 15 XP")
  ```
- **Subtítulos video** `UI_UX_Guide.md:202`: `.vtt` español + toggle CC `VideoPlayerView` Web/Android.
- **Mr. Gota guía, no bloquea** `UI_UX_Guide.md:4`: tutorial/empty con mascota, nunca modal obligatorio.

## 5. Checklist por componente

| Componente | 48dp | Contraste | contentDescription | Subtítulos |
|---|---|---|---|---|
| `MissionCard` | botón Completar 48px | texto #1c1c11 | "Completar misión X" | — |
| `CourseCard` | card clic 48px | candado + texto requisito | "Curso SODIS 150XP" | — |
| `VideoPlayerView` | controles 48px | — | "Video lección SODIS" | CC .vtt |
| `MinigameCard` | botón Jugar 48px | — | "Jugar Fugas Detect" | — |
| `WasiIllustration` | — | — | "Wasi etapa 2 Semilla Germinada" | — |

## Validación
- **Web:** Lighthouse Accessibility ≥95, tab navega BottomNav, TalkBack lee `contentDescription`.
- **Android:** Accessibility Scanner sin warnings, `./gradlew assembleDebug` + test a sol (exterior).
- **Offline avión:** videos cacheados y juegos funcionan `UI_UX_Guide.md:232`.

## Referencias
`AGENTS.md:158-159` tipografía/borde, `AGENTS.md:322` checklist, `UI_UX_Guide.md:199-203` accesibilidad, `morrowasi-preview.html:89-121` nav 48px, `RNF-03` Atkinson.
