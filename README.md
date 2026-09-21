# MorroWasi Web

## Qué es MorroWasi

MorroWasi es una iniciativa educativa para promover el uso responsable del agua en hogares y escuelas de Morropón/Piura. La idea central: convertir el ahorro de agua en un hábito familiar visible y gratificante, no en una obligación abstracta.

Cada familia registra sus hábitos de ahorro (litros, misiones diarias/semanales) y ve crecer a su **Wasi** — un jardín/hogar virtual que evoluciona en etapas según el agua ahorrada y la constancia (racha) de la familia. Alrededor de eso hay cursos cortos sobre técnicas reales de ahorro (SODIS, reuso de aguas grises, filtros caseros, riego por goteo, cosecha de lluvia), minijuegos educativos, un ranking comunitario/escolar para motivar por comparación sana, y una tienda de avatares 3D como recompensa cosmética.

El ecosistema completo tiene tres piezas: una app Android familiar (el uso diario, offline-first), un dispositivo físico llamado **Eco-Drop** que detecta goteos junto a la grifería con visión artificial y avisa con sonido en el momento, y esta plataforma web.

## Qué hace esta web puntualmente

Portal educativo y de administración: cursos y minijuegos, misiones diarias/semanales/mensuales, panel de ahorro/estadísticas, logros/álbum de badges, tienda de avatares 3D (accesorios y personalización visible en el Wasi), un **ranking comunitario** (diario/semanal/mensual/global, validado en servidor) y un **chat temporal entre familias** (se crea una sala con un código de 6 dígitos, dura 1 día, y sirve para que dos familias se motiven o compartan tips entre ellas sin exponer datos a nadie más). El acceso no pide correo ni contraseña: es una sesión anónima de Supabase (solo para que el chat y el resto de las RLS tengan un `auth.uid()` real) más un código corto de 10 caracteres generado en el propio dispositivo, que es lo que de verdad identifica el progreso y permite sincronizarlo o recuperarlo en otro celular.

Construida en React 19 + TypeScript + Vite + Tailwind CSS 4, desplegada en Vercel.

## Requisitos

- Node.js 20+
- pnpm (el repo usa `pnpm-lock.yaml`)

## Desarrollo local

```bash
pnpm install
pnpm dev
```

`pnpm build` compila TypeScript y genera el build de producción; `pnpm test` corre los tests con Vitest; `pnpm lint` corre Oxlint.

## Variables de entorno

Login (Google + correo) y el chat temporal entre familias usan [Supabase](https://supabase.com). Creá un `.env.local` en la raíz (ignorado por git) con:

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-publishable/anon-key>
```

Sacás ambos valores del dashboard de Supabase en **Project Settings → API** (o **Data API** para la URL). No uses las "Secret keys"/`service_role` acá — esas nunca van al frontend.

Sin estas variables, la app no arranca: `src/lib/supabaseClient.ts` tira un error explícito apenas carga.

## Backend (Supabase)

- `supabase/migrations/` — todo el esquema SQL vive acá, versionado como una migración por cambio. Se corren pegando el contenido en el SQL Editor del dashboard de Supabase, en orden, o con `supabase db push` si tenés el proyecto linkeado por CLI. Grupos principales:
  - **Chat temporal** (`0001`, `0002`, `0003`, `0004`) — tablas `chats`/`chat_participants`/`messages`, Realtime, rate limit de intentos de unirse por código, y `join_chat_by_code()` que valida código + expiración + cupo antes de dejar entrar a una sala.
  - **Moderación de texto** (`0005`, `0008`) — filtro de palabras aplicado a mensajes del chat y al nombre público del ranking, con límite de advertencias.
  - **Sync de progreso entre dispositivos** (`0006`, `0007`, `0011`, `0012`, `0015`) — guarda/restaura el progreso local con un código corto generado en el dispositivo, sin necesidad de cuenta; incluye rate limiting contra fuerza bruta del código.
  - **Ranking comunitario** (`0009`, `0010`, `0013`, `0014`) — el cliente no envía un puntaje final, envía el historial de eventos (qué misión/juego/curso y cuándo); el servidor recalcula el total y lo valida contra un catálogo de recompensas espejo de `src/utils/gamification.ts` (se regenera con `pnpm gen:catalogo`).
- `supabase/functions/create-chat/` — Edge Function (Deno) que genera el código de 6 dígitos del lado servidor con `crypto.getRandomValues` (nunca en el navegador) y crea la sala. Se deploya con:
  ```bash
  supabase login
  supabase link --project-ref <tu-ref>
  supabase functions deploy create-chat
  ```
  Requiere Docker Desktop corriendo (la CLI empaqueta la función en un contenedor antes de subirla).
- Google Sign-In se configura en el dashboard de Supabase (**Authentication → Providers → Google**) con un Client ID/Secret creado en Google Cloud Console (OAuth consent screen + credencial tipo "Aplicación web", usando el Callback URL que da Supabase).

## Estructura

```
src/
  components/   componentes compartidos (Layout, ChatWidget, viewers 3D, cards...)
  pages/        una página por ruta (Dashboard, Academia, Avatares, Login...)
  data/         mocks y catálogos estáticos (cursos, ranking, tienda de avatares)
  utils/        stores reactivos tipo hook (hydroStore, expStore, authStore...)
  lib/          clientes de servicios externos (supabaseClient)
  three/        escena 3D del Wasi (Three.js)
api/            funciones Edge de Vercel (ej. proxy de noticias sobre agua)
supabase/       migraciones SQL y Edge Functions de Supabase
mockups/        prototipos HTML sueltos, no forman parte del build
```

Los `utils/*Store.ts` siguen un patrón común: funciones module-level para leer/escribir estado (localStorage o, en el caso de `authStore`, la sesión de Supabase) más un hook `useX()` que se mantiene sincronizado entre pantallas y pestañas.

