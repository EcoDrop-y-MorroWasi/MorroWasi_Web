import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calcPew, calcWasiStage, mockFamily, WASI_STAGES } from "../data/mock";
import { useHydroPoints } from "../utils/hydroStore";
import { useExp } from "../utils/expStore";
import { useReservoir } from "../utils/litersStore";
import { useStreakDays } from "../utils/streakStore";
import { signOut as signOutSupabase } from "../utils/authStore";
import { AVATARS as SHOP_AVATARS } from "../data/avatarShop";
import { getAvatarThumbnail } from "../utils/avatarSkinPainter";
import { useAvatarShop } from "../utils/avatarShopStore";
import { allCoursesCompleted, allGamesCompleted } from "../utils/completionStore";
import ProfileAvatarGlyph from "../components/ProfileAvatarGlyph";
import { shopAvatarValue } from "../utils/profileAvatar";
import { applyImportedProgress, exportProgress, readProgressFile, type ImportPreview } from "../utils/progressBackup";
import {
  generateSyncCode,
  getLinkedCode,
  resolveConflict,
  setLinkedCode,
  syncProgress,
  type SyncResult,
} from "../utils/progressSync";

const THEME_STORAGE_KEY = "morrowasi_theme_v1";
const PROFILE_STORAGE_KEY = "morrowasi_perfil_v1";
const HARD_SHADOW = "shadow-[4px_4px_0_0_#1c1c11]";
const AVATARS = ["🌊", "💧", "🌵", "🌻", "🐦", "🐟", "🦋", "🌈", "☀️", "🏡", "🌿", "🦙"];
const CAPACITIES = [500, 1000, 1500, 2000] as const;

type Theme = "claro" | "oscuro";

function loadTheme(): Theme {
  if (typeof window === "undefined") return "claro";
  try {
    return (window.localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "claro";
  } catch {
    return "claro";
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme === "oscuro" ? "dark" : "light";
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* localStorage no disponible */
  }
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
}

type EditableProfile = { name: string; avatar: string; members: number };

function loadProfile(): EditableProfile {
  const fallback: EditableProfile = { name: mockFamily.name, avatar: mockFamily.avatar, members: 1 };
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<EditableProfile>) } : fallback;
  } catch {
    return fallback;
  }
}

// Perfil — avatar, HydroPuntos, racha, badge Wasi dinámico (AGENTS.md §5 RF-024), litros totales,
// logros mock derivados de datos reales (sin inventar otra familia — mockFamily es la única fuente),
// ajustes de tema (claro/oscuro) persistido en localStorage y aplicado a document.documentElement.
export default function Perfil() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [profile, setProfile] = useState<EditableProfile>(loadProfile);
  const [initial, setInitial] = useState("");

  // Mismo cierre de sesión que el header de escritorio (Layout.tsx) — en mobile el
  // header ya no muestra ícono ni botón "Salir" por falta de espacio, así que vive acá.
  const signOut = () => {
    signOutSupabase().finally(() => navigate("/inicio-publico", { replace: true }));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [code, setCode] = useState(() => getLinkedCode() ?? "");
  const [codeInput, setCodeInput] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Extract<SyncResult, { status: "conflicto" }> | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError(null);
    try {
      setPreview(await readProgressFile(file));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "No se pudo leer el archivo.");
    }
  };

  const runSync = async (targetCode: string) => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncProgress(targetCode);
      setLinkedCode(targetCode);
      setCode(targetCode);
      if (result.status === "conflicto") {
        setConflict(result);
      } else {
        const mensajes: Record<Exclude<SyncResult["status"], "conflicto">, string | null> = {
          "sin-cambios": "Ya estaba todo sincronizado.",
          subido: null,
          descargado: "Se aplicó el progreso del servidor (recargando)…",
        };
        setSyncMessage(mensajes[result.status]);
      }
    } catch (err) {
      setSyncMessage(err instanceof Error ? `Error: ${err.message}` : "No se pudo sincronizar.");
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerateCode = () => {
    const nuevo = generateSyncCode();
    void runSync(nuevo);
  };

  const handleLinkCode = () => {
    // El código es sensible a mayúsculas/minúsculas (incluye ambas para más
    // variedad) — no se normaliza, solo se recorta espacios accidentales.
    const normalizado = codeInput.trim();
    if (normalizado.length !== 10) {
      setSyncMessage("El código tiene 10 caracteres.");
      return;
    }
    void runSync(normalizado);
  };

  const handleResolveConflict = async (keep: "local" | "remote") => {
    if (!conflict || !code) return;
    await resolveConflict(code, keep, conflict);
    setConflict(null);
    if (keep === "local") setSyncMessage("Guardaste tu progreso local en el servidor, pisando el del código.");
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      window.dispatchEvent(new Event("morrowasi-perfil-actualizado"));
    } catch { /* El perfil sigue disponible durante esta sesión. */ }
  }, [profile]);

  const [hydroPoints] = useHydroPoints();
  const [exp] = useExp();
  const reservoir = useReservoir();
  const streakDays = useStreakDays();
  const pew = calcPew(exp, streakDays);
  const { stage, progressInStage, xpParaSiguiente } = calcWasiStage(pew);
  const wasiStage = WASI_STAGES.find((w) => w.number === stage) ?? WASI_STAGES[0];
  const progressPct = Math.round((progressInStage / xpParaSiguiente) * 100);

  // Mismo criterio de desbloqueo que Avatares.tsx: cada avatar de la tienda
  // aparece acá como opción de foto de perfil recién al llegar a su etapa del
  // Wasi (el secreto, al cumplir las 4 condiciones) — nunca se muestra bloqueado.
  const avatarShop = useAvatarShop();
  const secretAvatarUnlocked =
    stage >= 10 &&
    allGamesCompleted() &&
    allCoursesCompleted() &&
    SHOP_AVATARS.filter((a) => !a.special).every((a) => avatarShop.allOwned(a));
  const unlockedShopAvatars = SHOP_AVATARS.filter((a) => (a.special ? secretAvatarUnlocked : (a.stage ?? Infinity) <= stage));

  const achievements: Achievement[] = [
    {
      id: "racha-7",
      title: "Racha de 7 días",
      description: "Actividad diaria sostenida una semana completa.",
      emoji: "🔥",
      unlocked: streakDays >= 7,
    },
    {
      id: "hp-1000",
      title: "1000+ HydroPuntos",
      description: "Superaste los mil puntos acumulados.",
      emoji: "⚡",
      unlocked: hydroPoints >= 1000,
    },
    {
      id: "litros-2000",
      title: "2000+ litros ahorrados",
      description: "Ahorro histórico familiar superior a 2000 L.",
      emoji: "💧",
      unlocked: reservoir.totalLitersSaved >= 2000,
    },
    {
      id: "wasi-3",
      title: `Etapa Wasi 3 — ${WASI_STAGES[2].name}`,
      description: "Tu Wasi alcanzó su tercera etapa de crecimiento.",
      emoji: "🌿",
      unlocked: stage >= 3,
    },
    {
      id: "wasi-5",
      title: `Etapa Wasi 5 — ${WASI_STAGES[4].name}`,
      description: "Meta siguiente: sigue sumando HydroPuntos y racha.",
      emoji: "🏆",
      unlocked: stage >= 5,
    },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-24">
      {/* Cabecera perfil */}
      <section className={`rounded-2xl border-2 border-ink bg-[#99B4D8] p-5 text-ink ${HARD_SHADOW}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-bg-light text-4xl shadow-[2px_2px_0_0_#1c1c11]"
            >
              <ProfileAvatarGlyph value={profile.avatar} imgClassName="h-14 w-14 object-contain" />
            </span>
            <div className="min-w-0">
              <p className="font-body text-sm font-semibold text-ink/70">Perfil familiar</p>
              <h1 className="font-display text-2xl font-extrabold leading-tight">{profile.name}</h1>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-[#FFB793] px-3 py-1 text-xs font-black">
                🏅 Guardián del Agua · {wasiStage.name}
              </span>
            </div>
          </div>
          {/* Solo mobile: el header (Layout.tsx) ya no muestra ícono/botón de salir ahí por
              falta de espacio (se cortaba en pantallas angostas) — acá siempre hay lugar. */}
          <button
            type="button"
            onClick={signOut}
            className="min-h-12 shrink-0 rounded-xl border-2 border-ink bg-bg-light px-3 text-sm font-bold text-ink shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:hidden"
          >
            Salir
          </button>
        </div>
      </section>

      <section className={`rounded-2xl border-2 border-ink bg-surface p-5 ${HARD_SHADOW}`}>
        <h2 className="font-display text-lg font-bold">Editar perfil familiar</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">Nombre de la familia<input value={profile.name} maxLength={40} onChange={(event) => setProfile((p) => ({ ...p, name: event.target.value }))} className="mt-1 min-h-12 w-full rounded-xl border-2 border-ink bg-bg-light px-3 font-semibold" /></label>
          <label className="text-sm font-bold">Integrantes<input type="number" min={1} max={20} value={profile.members} onChange={(event) => setProfile((p) => ({ ...p, members: Math.max(1, Math.min(20, Number(event.target.value) || 1)) }))} className="mt-1 min-h-12 w-full rounded-xl border-2 border-ink bg-bg-light px-3 font-semibold" /></label>
        </div>
        <fieldset className="mt-4"><legend className="text-sm font-bold">Avatar (12 opciones o inicial)</legend><div className="mt-2 flex flex-wrap gap-2">
          {AVATARS.map((avatar) => <button key={avatar} type="button" aria-label={`Usar avatar ${avatar}`} aria-pressed={profile.avatar === avatar} onClick={() => setProfile((p) => ({ ...p, avatar }))} className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink text-2xl shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${profile.avatar === avatar ? "bg-[#FFB793]" : "bg-bg-light"}`}>{avatar}</button>)}
          <label className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-ink bg-bg-light px-2 font-bold">Inicial<input value={initial} maxLength={1} aria-label="Inicial para avatar" onChange={(event) => setInitial(event.target.value.toLocaleUpperCase("es-PE"))} className="h-9 w-9 rounded-lg border-2 border-ink bg-surface text-center" /><button type="button" onClick={() => initial && setProfile((p) => ({ ...p, avatar: initial }))} className="min-h-12 rounded-lg bg-primary px-3">Usar</button></label>
        </div></fieldset>
        {unlockedShopAvatars.length > 0 && (
          <fieldset className="mt-4">
            <legend className="text-sm font-bold">Avatares de tu Wasi (se van desbloqueando por etapa)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {unlockedShopAvatars.map((avatar) => {
                const value = shopAvatarValue(avatar.id);
                const selected = profile.avatar === value;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    aria-label={`Usar avatar ${avatar.name}`}
                    aria-pressed={selected}
                    onClick={() => setProfile((p) => ({ ...p, avatar: value }))}
                    className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-ink shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      selected ? "bg-[#FFB793]" : "bg-bg-light"
                    }`}
                  >
                    <img
                      src={getAvatarThumbnail(avatar)}
                      alt=""
                      className="h-9 w-9 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
        {/* Este emoji es la foto de perfil de la familia (header/ranking). El avatar 3D del
            Wasi —el que el niño viste con accesorios y su Skin Especial— es otra cosa y vive
            en su propia pestaña; este link solo evita que parezcan el mismo sistema. */}
        <button
          type="button"
          onClick={() => navigate("/avatares")}
          className="mt-3 flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border-2 border-ink bg-bg-light px-3 text-left text-sm font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <span>🧑 ¿Buscás vestir al avatar 3D del Wasi? Está en la pestaña Avatares</span>
          <span aria-hidden="true">→</span>
        </button>
        <fieldset className="mt-4"><legend className="text-sm font-bold">Capacidad del tanque</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{CAPACITIES.map((capacity) => <button key={capacity} type="button" aria-pressed={reservoir.capacityLiters === capacity} onClick={() => reservoir.setCapacityLiters(capacity)} className={`min-h-12 rounded-xl border-2 border-ink px-2 font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${reservoir.capacityLiters === capacity ? "bg-[#E26D5C] text-white" : "bg-bg-light"}`}>{capacity} L</button>)}</div>{reservoir.capacityLiters === 0 && <p className="mt-2 text-xs font-bold text-[#E26D5C]">Elegí la capacidad de tu tanque para activar el monitor del reservorio.</p>}</fieldset>
        <p className="mt-3 text-xs font-semibold text-ink/80">Los cambios se guardan solo en este dispositivo.</p>
      </section>

      {/* Métricas */}
      <section className="grid grid-cols-3 gap-3">
        <StatCard label="HydroPuntos" value={String(hydroPoints)} highlight />
        <StatCard label="Racha" value={`${streakDays} días`} sub="🔥 actividad" />
        <StatCard label="Litros ahorrados" value={`${reservoir.totalLitersSaved} L`} />
      </section>

      {/* Badge Wasi */}
      <section
        aria-label={`Wasi etapa ${wasiStage.number} ${wasiStage.name}`}
        className={`rounded-2xl border-2 border-ink bg-[#FFB793]/40 p-5 ${HARD_SHADOW}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-body text-sm font-semibold text-ink/70">Etapa {wasiStage.number} de 10</p>
            <h2 className="font-display text-xl font-extrabold">{wasiStage.name}</h2>
            <p className="font-body text-xs font-semibold text-ink/60">PEW: {pew}</p>
          </div>
          <span aria-hidden="true" className="text-4xl">
            🌿
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progressInStage}
          aria-valuemin={0}
          aria-valuemax={xpParaSiguiente}
          aria-label="Progreso PEW hacia la siguiente etapa"
          className="mt-4 h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-surface"
        >
          <div className="h-full bg-[#E26D5C] transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-2 font-body text-xs font-semibold text-ink/70">
          {progressInStage.toLocaleString('es-PE')}/{xpParaSiguiente.toLocaleString('es-PE')} ({progressPct}%) hacia la siguiente etapa
        </p>
      </section>

      {/* Logros */}
      <section className={`rounded-2xl border-2 border-ink bg-surface p-5 ${HARD_SHADOW}`}>
        <h2 className="font-display text-lg font-bold">Logros</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-2 rounded-xl border-2 border-ink p-3 ${
                a.unlocked ? "bg-[#4f9d69]/25" : "bg-bg-light opacity-60"
              }`}
            >
              <span aria-hidden="true" className="text-xl">
                {a.unlocked ? a.emoji : "🔒"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">{a.title}</p>
                <p className="text-xs leading-snug text-ink/70">{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Respaldo/sync de progreso — sin cuenta, sin email (ver progressBackup.ts/progressSync.ts). */}
      <section className={`rounded-2xl border-2 border-ink bg-surface p-5 ${HARD_SHADOW}`}>
        <h2 className="font-display text-lg font-bold">Respaldo de progreso</h2>
        <p className="mt-1 text-xs text-ink/70">
          Todo tu progreso vive en este navegador. Descargá un backup o restaurá uno para no perderlo.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={exportProgress}
            className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-primary px-4 font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Exportar
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-bg-light px-4 font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Importar
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
        </div>
        {importError && <p className="mt-2 text-xs font-bold text-[#E26D5C]">{importError}</p>}
      </section>

      <section className={`rounded-2xl border-2 border-ink bg-surface p-5 ${HARD_SHADOW}`}>
        <h2 className="font-display text-lg font-bold">Código de acceso</h2>
        <p className="mt-1 text-xs text-ink/70">
          Sin email ni Google: un código de 10 caracteres para tener tu progreso en más de un dispositivo.
        </p>
        {code ? (
          <div className="mt-3">
            <p className="text-xs text-ink/60">Tu código:</p>
            <p className="font-display text-lg font-bold tracking-widest">{code}</p>
            <button
              type="button"
              disabled={syncing}
              onClick={() => runSync(code)}
              className="mt-2 min-h-12 w-full rounded-xl border-2 border-ink bg-primary px-4 font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
            >
              {syncing ? "Sincronizando…" : "Sincronizar ahora"}
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <button
              type="button"
              disabled={syncing}
              onClick={handleGenerateCode}
              className="min-h-12 w-full rounded-xl border-2 border-ink bg-primary px-4 font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
            >
              Guardar progreso
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={10}
                placeholder="Código de otro dispositivo"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-bg-light px-2 font-bold tracking-widest"
              />
              <button
                type="button"
                disabled={syncing}
                onClick={handleLinkCode}
                className="min-h-12 rounded-xl border-2 border-ink bg-bg-light px-3 font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
              >
                Vincular
              </button>
            </div>
          </div>
        )}
        {syncMessage && <p className="mt-2 text-xs text-ink/70">{syncMessage}</p>}
      </section>

      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c1c11]/80 p-4">
          <div className={`w-full max-w-sm rounded-2xl border-2 border-ink bg-surface p-6 ${HARD_SHADOW}`}>
            <h3 className="font-display text-base font-bold">Restaurar progreso</h3>
            <p className="mt-2 text-xs text-ink/70">
              Backup del perfil <span className="font-bold">{preview.profileId}</span>, exportado el{" "}
              {new Date(preview.exportedAt).toLocaleString()}.
            </p>
            <p className="mt-2 text-xs text-ink/70">
              Esto reemplaza tu progreso actual en este navegador ({preview.entries.length} valores). No se puede deshacer.
            </p>
            {preview.localIsNewer && (
              <p className="mt-2 rounded-lg bg-red-100 p-2 text-xs text-red-700">
                ⚠️ Tu progreso actual en este navegador es más reciente que este backup. Restaurarlo puede hacerte perder avances.
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-bg-light font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => applyImportedProgress(preview)}
                className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-primary font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {conflict && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c1c11]/80 p-4">
          <div className={`w-full max-w-sm rounded-2xl border-2 border-ink bg-surface p-6 ${HARD_SHADOW}`}>
            <h3 className="font-display text-base font-bold">Progreso distinto en cada lado</h3>
            <p className="mt-2 text-xs text-ink/70">
              Este navegador y el código <span className="font-bold">{code}</span> tienen cambios que no coinciden. Elegí cuál conservar — el otro se pierde.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink/60">
              <p>Este navegador: {new Date(conflict.local.lastModified).toLocaleString()}</p>
              <p>Código: {new Date(conflict.remote.lastModified).toLocaleString()}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleResolveConflict("remote")}
                className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-bg-light font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Usar el del código
              </button>
              <button
                type="button"
                onClick={() => handleResolveConflict("local")}
                className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-primary font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Usar este navegador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ajustes: tema */}
      <section className={`rounded-2xl border-2 border-ink bg-surface p-5 ${HARD_SHADOW}`}>
        <h2 className="font-display text-lg font-bold">Ajustes</h2>
        <p className="mt-1 text-xs text-ink/70">Tema de la aplicación — se guarda en este dispositivo.</p>
        <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Selector de tema">
          <button
            type="button"
            role="radio"
            aria-checked={theme === "claro"}
            onClick={() => setTheme("claro")}
            className={`min-h-12 flex-1 rounded-xl border-2 border-ink px-4 font-bold shadow-[2px_2px_0_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
              theme === "claro" ? "bg-[#99B4D8]" : "bg-bg-light"
            }`}
          >
            ☀️ Claro
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={theme === "oscuro"}
            onClick={() => setTheme("oscuro")}
            className={`min-h-12 flex-1 rounded-xl border-2 border-ink px-4 font-bold shadow-[2px_2px_0_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
              theme === "oscuro" ? "bg-[#99B4D8]" : "bg-bg-light"
            }`}
          >
            🌙 Oscuro
          </button>
        </div>
      </section>

    </div>
  );
}

function StatCard({ label, value, highlight, sub }: { label: string; value: string; highlight?: boolean; sub?: string }) {
  return (
    <div
      className={`flex min-h-24 flex-col items-center justify-center rounded-2xl border-2 border-ink p-3 text-center ${HARD_SHADOW} ${
        highlight ? "bg-[#E26D5C] text-white" : "bg-bg-light text-ink"
      }`}
    >
      <p className={`font-display text-lg font-extrabold ${highlight ? "text-white" : "text-[#E26D5C]"}`}>{value}</p>
      <p className="font-body text-xs font-bold">{label}</p>
      {sub && <p className={`font-body text-[10px] ${highlight ? "text-white/80" : "text-ink/60"}`}>{sub}</p>}
    </div>
  );
}
