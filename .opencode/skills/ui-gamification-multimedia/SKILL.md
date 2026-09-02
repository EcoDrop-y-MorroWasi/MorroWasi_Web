# Skill: UI Gamificación + Multimedia Offline — Wasi, Juegos y Video

> Universal para todos los agentes. Cubre `AGENTS.md:224-245` (PEW/Wasi/XP), `UI_UX_Guide.md:3-4` (cursos/video/juegos), `Proyecto_Contexto.md:126-138`.

## Objetivo
Que cualquier IA implemente correctamente fórmulas de gamificación y reproductor offline sin inventar valores ni permitir farmeo.

## 1. Fórmulas oficiales (no tocar)

```ts
// AGENTS.md:245 + Proyecto_Contexto.md:132
PEW = HydroPuntos + min(racha * 10, 1000)
etapa = min(10, floor(PEW / 500) + 1) // 1..10
progreso = PEW % 500 // de 500 al siguiente nivel
xpCustom = clamp(round(litros / 3), 5, 40) // misión personalizada
```

**10 etapas Wasi** `AGENTS.md:239`:
1 Pequeño Brote, 2 Semilla Germinada, 3 Jardín de Duna, 4 Arbusto Resiliente, 5 Oasis Temprano, 6 Refugio Verde, 7 Flujo del Chira, 8 Bosque Seco, 9 Santuario Hídrico, 10 Oasis Sagrado.

**Racha** `Proyecto_Contexto.md:132`: días consecutivos Lima con ≥1 actividad (misión/ahorro/lección/juego) → +1; sin actividad → 0. No depende de Eco-Drop.

**Misiones diarias base** `AGENTS.md:228`: Cero goteos 20L/10XP, Ducha Flash 60L/15XP, Reuso 45L/20XP, Riego nocturno 30L/15XP. Completar suma, desmarcar revierte sin <0.
**Accesos rápidos Ahorro** `AGENTS.md:227`: +20/+10/+40/+15L.

**Cursos** `AGENTS.md:229` / `UI_UX_Guide.md:3.1`:
SODIS 150 (—), Reuso 200 (—), Filtros 250 (300HP), Riego 180 (200HP), Cosecha 300 (Wasi2), Biológico 400 (Wasi3). Una vez por familia.

**Mini-juegos** `AGENTS.md:236` / `UI_UX_Guide.md:4.1`: 30–100 HP por precisión. Solo al superar `bestScore` se otorga HP (no farmeo).

## 2. Componentes gamificados

### Wasi Card (Dashboard central `UI_UX_Guide.md:187`)
```html
<!-- wasi-card morrowasi-preview.html:192-218 -->
<div class="card wasi-card bg-gradient-to-br from-[#99B4D8] to-[#b8d4f0]">
  <div class="wasi-bar-track h-[20px] bg-white/50 border-2 border-[#1c1c11] rounded-full overflow-hidden">
    <div class="wasi-bar-fill bg-[#E26D5C] transition-[width] duration-600" style="width: 38%"></div>
  </div>
  <div class="wasi-info flex justify-between text-[0.85rem] font-semibold">
    <span>PEW: 940</span><span>Siguiente: Jardín de Duna (1000)</span>
  </div>
</div>
```
Compose: `LinearProgressIndicator(progress=progreso/500f, color=Color(0xFFE26D5C), trackColor=Color.White.copy(0.5f), modifier=Modifier.border(2.dp))`

### Tanque animado (Dashboard `morrowasi-preview.html:374-426`)
SVG con `wave` CSS animado según `currentPercentage` `AGENTS.md:214`. Altura ola = `percentage%`.

### Feedback juvenil
- `framer-motion`: `+15 XP` flotante `animate={{y:-20, opacity:0}}`
- `canvas-confetti`: al completar curso/juego/subir etapa
- Estado misión: `mission-item` `morrowasi-preview.html:236` → `.done { bg:#d4edda; border:#28a745 }` + botón `btn-done`

## 3. Multimedia offline

### Web (React)
```tsx
// VideoPlayerView mock hoy, futuro Storage
<video controls poster={thumbnail} className="w-full aspect-video border-2 border-[#1c1c11] rounded-xl">
  <source src={videoUrl} type="video/mp4" />
  <track kind="subtitles" srcLang="es" src={`${videoUrl}.vtt`} default />
</video>
// Estados: cacheado → play | no cacheado offline → placeholder "Descarga con WiFi" + botón
```

### Android `UI_UX_Guide.md:99-100`
```kotlin
// VideoPlayerView.kt — Media3 + CacheDataSource LRU 200MB BaseDatos.md:4.1
SimpleCache(cacheDir, LeastRecentlyUsedCacheEvictor(200*1024*1024), StandaloneDatabaseProvider(context))
ExoPlayer.Builder(context).setMediaSourceFactory(DefaultMediaSourceFactory(cacheDataSourceFactory)).build()
// Guarda progressPct y videoPositionMs cada 5s en course_progress
```

### Mini-juegos `UI_UX_Guide.md:4.1`
| Juego | Intro | Mecánica 60-90s | Puntos |
|---|---|---|---|
| FUGAS_DETECT | `minigames/fugas/intro.mp4` | taps gotas +10/-5 | `clamp(30+accuracy*70,30,100)` |
| HUELLA_HIDRICA | trivia 10preg | 10s/preg | 30-100 |
| COSECHA_LLUVIA | drag gotas | tanque | 30-100 |
| RIEGO_OPT | toggle día/noche | riega jardín | 30-100 |

Cada partida = actividad para racha. HP solo si `score > bestScore`.

## Validación
- `npm run build` y `calcPEW(850,12)==970 && calcStage(970)==2`
- `xpCustom(60)==20` y `xpCustom(200)==40` (tope)
- Video offline avión reproduce cacheado, placeholder si no.
- Sin farmeo: re-jugar sin mejorar no suma HP.

## Referencias
`AGENTS.md:224-245`, `morrowasi-preview.html:192-299`, `UI_UX_Guide.md:99-128`, `Proyecto_Contexto.md:126-138`
