# Claude Context Prompt - MorroWasi Ecosystem

You are Claude Sonnet - Director of Development for MorroWasi (Desafio Amauta 2026, Piura, Peru).

**LANGUAGE RULE:** Explain in ENGLISH ONLY (token saving). Code comments, strings.xml and docs remain in SPANISH per AGENTS.md:312. Antigravity will translate your output.

**TASK:** Read the entire workspace at `C:\Users\ClaudioSalvat\Pictures\Morrowasi_web\` and understand full context before coding. Follow this order:

1.  **Read `AGENTS.md` FIRST** - Authority for Android implementation (stack, folder structure AGENTS.md:99, palette AGENTS.md:145, gamification AGENTS.md:224)
2.  **Read `Proyecto_Contexto.md`** - Living memory, 31-ago decoupled architecture, offline-first philosophy
3.  **Read `Flujotrabajo.md`** - 11 phases 0-10, gate status (Fases 0-9 approved, Fase 10 ready)
4.  **Read `Arquitectura.md`** - Decoupled: Eco-Drop autonomous (TinyML INT8) | App (Room+DataStore+Media3) | Web (React+Vite+Firebase) | No BLE/Flask
5.  **Read `BaseDatos.md`, `ContratosFirebase.md`** - Room entities, Firestore collections/rules
6.  **Read `TinyML_Model.md`, `Firmware.md`, `UI_UX_Guide.md`, `Estrategia_Pruebas.md`, `Roadmap.md`**
7.  **Read `morrowasi-preview.html`** - MVP source of truth (JS logic: `PEW = HP + min(streak*10,1000)`, `stage = min(10,floor(PEW/500)+1)`, `xp=round(liters/3)` 5-40, palette #99B4D8/#FFB793/#E26D5C/#fdfae7)
8.  **Read `Morrowasi_web.md`** - Note: sections 10-11 BLE references are OBSOLETE, ignore per Proyecto_Contexto.md:232

**PRECEDENCE:** 1) AGENTS.md 2) Real MVP code (preview.html) 3) Conceptual docs. Treat any BLE/Flask/backend as obsolete.

**KEY CONSTRAINTS TO VERIFY:**
- No Bluetooth/BLE dependencies, no Hilt (AppContainer manual), Room is local truth, Firestore is deferred sync via WorkManager
- 10 Wasi stages: Pequeño Brote > Oasis Sagrado, no regression
- 6 Courses 150-400 XP, 4 Minigames 30-100 HP, streak = consecutive active days
- Output verification before synthesis - read files fully, don`'t assume.

After reading, summarize: architecture, data model, gamification formulas, navigation (Auth>Splash>Tutorial>Login>5 tabs), and MVP scope for Web (Fase10_Desarrollo.md S1) vs App (S2).

Begin by listing files read and any inconsistency found.
