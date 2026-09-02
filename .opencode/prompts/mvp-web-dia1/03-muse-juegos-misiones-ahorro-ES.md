# Prompt Muse Spark — Juegos + Misiones + Ahorro (ES) | MVP Web Dia 1

Eres Muse Spark (OpenCode) implementando MorroWasi Web en paralelo. Coordinas con Gemini para validación build.

**Lee primero:**
- `AGENTS.md:224-245` (HydroPuntos, misiones, PEW/Wasi)
- `Morrowasi_web.md:193-204` (Ranking/Eco-Retos/Estadísticas) y `Morrowasi_web.md:9` (secciones)
- `Flujotrabajo.md:158` (UI/UX cursos y juegos)
- `Proyecto_Contexto.md:126-141` (fórmulas litraje y misiones)

**Objetivo:** 3 pantallas visuales mock:

1. **Juegos (30-100 HP según desempeño):** FUGAS_DETECT, HUELLA_HIDRICA, COSECHA_LLUVIA, RIEGO_OPT con video intro mock + MinigameCard. Grid con xpMaxReward.

2. **Misiones/Eco-Retos:** Sub-tabs Diarias/Semanales/Mensuales. Misiones base: Cero goteos 20L/10XP, Ducha Flash 60L/15XP, Reuso agua gris 45L/20XP, Riego nocturno 30L/15XP. Form misión personalizada: xp=round(litros/3) acotado 5-40 XP, literSaved, category (ducha/lavanderia/riego/cocina/fugas/otros), familyMember. Completar suma XP+litros, desmarcar revierte sin bajar de 0.

3. **Ahorro:** Contador total, meta 1000L, botones registro rápido ducha +20L, cepillado +10L, lavadora +40L, riego nocturno +15L, calculadora costo desperdicio en soles (S/).

**Constraints:**
- Paleta AGENTS.md:145 (#99B4D8/#FFB793/#E26D5C), Tailwind, 48dp, bordes 2px, español, comentarios en español, strings centralizados.
- Mock data local `src/data/minigames.mock.ts` + `src/data/tasks.mock.ts`. No BLE/Flask.
- Offline-first visual.

**Output esperado:**
- `src/pages/Juegos.tsx` + `src/pages/MinigamePlayScreen.tsx` mock
- `src/pages/Misiones.tsx`
- `src/pages/Ahorro.tsx`
- `src/components/MinigameCard.tsx` + `MissionCard.tsx`
- `src/data/minigames.mock.ts`, `src/data/tasks.mock.ts`

**Validación:** `npm run build`. Verificar xp=round(litros/3) 5-40 y revierte sin <0. Botones rápidos suman liters+HP.

---
Nota Gemini: Estos 3 módulos son los que más testean lógica gamificación, preparar para Estrategia_Pruebas.md Fase 8.
