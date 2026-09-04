import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { useAuthSession } from "../utils/authStore";

type EstadoChat = "cerrado" | "unirse" | "codigo-generado" | "abierto" | "minimizado";

interface Mensaje {
  id: number;
  senderId: string;
  texto: string;
  hora: string;
}

interface Sala {
  id: string;
  codigo: string;
  expiraEn: number;
}

function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

// Flag de solo lectura para el logro "Voz de la Familia" del Álbum — se marca
// la primera vez que la familia crea o se une a un chat real.
const CHAT_USADO_KEY = "morrowasi_chat_usado_v1";
function marcarChatUsado() {
  try {
    window.localStorage.setItem(CHAT_USADO_KEY, "true");
  } catch {
    /* localStorage no disponible */
  }
}

function formatearTiempoRestante(expiraEn: number): string {
  const ms = expiraEn - Date.now();
  if (ms <= 0) return "Expirado";
  const horasTotales = Math.floor(ms / (1000 * 60 * 60));
  const dias = Math.floor(horasTotales / 24);
  const horas = horasTotales % 24;
  if (dias > 0) return `Expira en ${dias}d ${horas}h`;
  const minutos = Math.floor((ms / (1000 * 60)) % 60);
  return `Expira en ${horas}h ${minutos}m`;
}

// Chat temporal entre familias — unión solo por código de 6 dígitos, sin QR.
// El código lo genera la Edge Function create-chat (crypto seguro, servidor).
// Unirse valida vía join_chat_by_code() en Postgres (código + expiración + cupo).
// RLS asegura que solo quien esté en chat_participants lea/escriba esa sala.
export default function ChatWidget() {
  const location = useLocation();
  const { session } = useAuthSession();
  const [estado, setEstado] = useState<EstadoChat>("cerrado");
  const [codigoInput, setCodigoInput] = useState("");
  const [sala, setSala] = useState<Sala | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [otroConectado, setOtroConectado] = useState(true);
  const [avisoCierre, setAvisoCierre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [advertencias, setAdvertencias] = useState(0);
  const [, forceTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const primerRenderRef = useRef(true);
  const canalRef = useRef<RealtimeChannel | null>(null);
  // Distingue "todavía nadie se unió" (normal, false al crear la sala) de
  // "se unió y se fue" (ahí sí hay que avisar) — sin esto, el efecto de abajo
  // disparaba el aviso de desconexión apenas se creaba la sala.
  const huboSegundaFamiliaRef = useRef(false);

  useEffect(() => {
    if (primerRenderRef.current) {
      primerRenderRef.current = false;
      return;
    }
    setEstado((prev) => (prev === "abierto" ? "minimizado" : prev));
  }, [location.pathname]);

  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [mensajes, estado]);

  // Suscripción realtime a la sala: nuevos mensajes + presencia de la otra familia.
  //
  // Orden importa: nos suscribimos ANTES de pedir el snapshot inicial. Si lo
  // hiciéramos al revés (o en paralelo), un mensaje insertado justo en el hueco
  // entre "se ejecutó la query del snapshot" y "el canal terminó su handshake"
  // no aparecería ni en el snapshot ni por realtime — quedaba invisible en la
  // UI (aunque sí en la base) hasta que algo más forzara un refetch. Con la
  // suscripción ya activa antes de pedir el snapshot, cualquier INSERT que
  // pase durante ese pedido llega por realtime igual; merge por id (en vez de
  // reemplazar con el snapshot) evita que se dupliquen o se pisen entre sí.
  useEffect(() => {
    if (!sala || !session) return;

    let cancelado = false;

    const mezclarPorId = (prev: typeof mensajes, nuevos: typeof mensajes) => {
      const vistos = new Set(prev.map((m) => m.id));
      const agregados = nuevos.filter((m) => !vistos.has(m.id));
      if (agregados.length === 0) return prev;
      return [...prev, ...agregados].sort((a, b) => a.id - b.id);
    };

    const canal = supabase
      .channel(`chat:${sala.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${sala.id}` },
        (payload) => {
          const m = payload.new as { id: number; sender_id: string; text: string; created_at: string };
          setMensajes((prev) => mezclarPorId(prev, [{ id: m.id, senderId: m.sender_id, texto: m.text, hora: formatearHora(m.created_at) }]));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_participants", filter: `chat_id=eq.${sala.id}` },
        () => setOtroConectado(true),
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED" || cancelado) return;
        supabase
          .from("messages")
          .select("id, sender_id, text, created_at")
          .eq("chat_id", sala.id)
          .order("created_at", { ascending: true })
          .then(({ data }) => {
            if (cancelado || !data) return;
            setMensajes((prev) =>
              mezclarPorId(prev, data.map((m) => ({ id: m.id, senderId: m.sender_id, texto: m.text, hora: formatearHora(m.created_at) }))),
            );
          });
      });

    canalRef.current = canal;
    return () => {
      cancelado = true;
      supabase.removeChannel(canal);
      canalRef.current = null;
    };
  }, [sala, session]);

  // Chequea cada 15s si la sala sigue existiendo del lado servidor — cubre
  // "la otra familia salió" (leave_chat) y "la otra familia fue baneada por
  // lenguaje inapropiado" (moderar_mensaje borra la sala al 3er strike) con
  // el mismo código, para las dos familias, no solo para quien lo causó.
  // No usamos postgres_changes DELETE acá a propósito: chat_participants se
  // borra en cascada en la misma transacción, así que para cuando Realtime
  // evalúa el permiso de RLS para avisar, la tabla que usa para chequear "sos
  // participante" ya está vacía — el aviso no llegaría de forma confiable.
  useEffect(() => {
    if (!sala || !session) return;
    const id = window.setInterval(async () => {
      const { data } = await supabase.from("chats").select("id").eq("id", sala.id).maybeSingle();
      if (!data) {
        setSala(null);
        setMensajes([]);
        setAdvertencias(0);
        setEstado("cerrado");
        setError("El chat se cerró (la otra familia salió o se superó el límite de lenguaje inapropiado).");
      }
    }, 15_000);
    return () => window.clearInterval(id);
  }, [sala, session]);

  // Marca que la sala ya tuvo a las dos familias — solo a partir de ahí un
  // otroConectado=false más adelante significa "se desconectó", no "recién
  // creada, esperando".
  useEffect(() => {
    if (otroConectado) huboSegundaFamiliaRef.current = true;
  }, [otroConectado]);

  useEffect(() => {
    huboSegundaFamiliaRef.current = false;
  }, [sala?.id]);

  // Si la otra familia se desconecta (canal cae) DESPUÉS de haber estado ambas
  // presentes, avisamos y volvemos al inicio — no se borra la sala del lado
  // servidor, solo se sale de la vista local.
  useEffect(() => {
    if (!huboSegundaFamiliaRef.current || otroConectado || !sala) return;
    setAvisoCierre("La otra familia se desconectó.");
    const id = window.setTimeout(() => {
      setSala(null);
      setMensajes([]);
      setAvisoCierre(null);
      setOtroConectado(true);
      setEstado("cerrado");
    }, 1800);
    return () => window.clearTimeout(id);
  }, [otroConectado, sala]);

  const crearSala = async () => {
    if (!session) return;
    setError(null);
    setCargando(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke<{ id: string; code: string; expires_at: string }>(
        "create-chat",
        { method: "POST" },
      );
      if (fnError || !data) throw fnError ?? new Error("Sin respuesta");
      setSala({ id: data.id, codigo: data.code, expiraEn: new Date(data.expires_at).getTime() });
      setMensajes([]);
      setOtroConectado(false);
      setAdvertencias(0);
      setEstado("codigo-generado");
      marcarChatUsado();
    } catch {
      setError("No se pudo crear el chat. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const unirseASala = async () => {
    if (codigoInput.trim().length !== 6 || !session) return;
    setError(null);
    setCargando(true);
    try {
      const { data: chatId, error: rpcError } = await supabase.rpc("join_chat_by_code", { p_code: codigoInput.trim() });
      if (rpcError || !chatId) throw rpcError ?? new Error("Código inválido");
      const { data: chat } = await supabase.from("chats").select("id, code, expires_at").eq("id", chatId).single();
      if (!chat) throw new Error("Sala no encontrada");
      setSala({ id: chat.id, codigo: chat.code, expiraEn: new Date(chat.expires_at).getTime() });
      setOtroConectado(true);
      setAdvertencias(0);
      setEstado("abierto");
      marcarChatUsado();
    } catch {
      setError("Código inválido, vencido o la sala ya está llena.");
    } finally {
      setCargando(false);
    }
  };

  // El trigger moderar_mensaje() en Postgres censura groserías y cuenta
  // advertencias por (sala, usuario) — este texto ya lo hace real la base,
  // acá solo detectamos si vino censurado (texto guardado != lo que mandé)
  // para avisarle a quien escribió. Al 3er strike el trigger cancela el
  // insert y borra la sala entera (data queda null/vacío).
  const enviarMensaje = async () => {
    const txt = texto.trim();
    if (!txt || !sala || !session) return;
    setTexto("");
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({ chat_id: sala.id, sender_id: session.user.id, text: txt })
      .select("text")
      .single();

    if (insertError) {
      if (insertError.code === "PGRST116") {
        setSala(null);
        setMensajes([]);
        setAdvertencias(0);
        setEstado("cerrado");
        setError("El chat se cerró: demasiados mensajes con lenguaje inapropiado.");
        return;
      }
      setError("No se pudo enviar el mensaje.");
      return;
    }

    if (data && data.text !== txt) {
      setAdvertencias((n) => n + 1);
    }
  };

  const volverAlInicio = () => {
    setSala(null);
    setMensajes([]);
    setCodigoInput("");
    setError(null);
    setAdvertencias(0);
    setEstado("unirse");
  };

  // Borra la sala de verdad (cascada se lleva mensajes y participantes) —
  // afecta a las dos familias, no solo cierra la vista local de quien sale.
  const salirDelChat = async () => {
    if (!window.confirm("¿Salir de este chat? Se borra para las dos familias. No se puede deshacer.")) return;
    if (sala) await supabase.rpc("leave_chat", { p_chat_id: sala.id });
    volverAlInicio();
  };

  if (!session) return null;

  if (estado === "cerrado" || estado === "minimizado") {
    return (
      <button
        type="button"
        onClick={() => setEstado(sala ? "abierto" : "unirse")}
        aria-label={sala ? "Abrir chat temporal" : "Unirse a un chat temporal"}
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-[#99B4D8] text-2xl shadow-[3px_3px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <span aria-hidden>💬</span>
        {sala && estado === "minimizado" && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-ink bg-[#E26D5C] text-[9px] font-black text-white">
            ●
          </span>
        )}
      </button>
    );
  }

  if (estado === "unirse") {
    return (
      <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-ink bg-surface shadow-[4px_4px_0_#1c1c11]">
        <div className="flex items-center justify-between rounded-t-2xl border-b-2 border-ink bg-[#99B4D8] px-4 py-3">
          <h2 className="text-sm font-extrabold text-ink">💬 Chat temporal</h2>
          <button type="button" onClick={() => setEstado("cerrado")} aria-label="Cerrar" className="text-lg font-black text-ink">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div>
            <label className="text-xs font-bold text-ink/70">Ingresa un código de 6 dígitos</label>
            <input
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="482913"
              inputMode="numeric"
              className="mt-1 min-h-12 w-full rounded-lg border-2 border-ink px-3 text-center text-lg font-black tracking-widest"
            />
            <button
              type="button"
              onClick={unirseASala}
              disabled={codigoInput.length !== 6 || cargando}
              className="mt-2 min-h-12 w-full rounded-lg border-2 border-ink bg-[#E26D5C] px-4 text-sm font-extrabold text-white shadow-[2px_2px_0_#1c1c11] disabled:opacity-40 disabled:shadow-none"
            >
              {cargando ? "Uniendo..." : "Unirse al chat"}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-ink/50">
            <span className="h-px flex-1 bg-[#1c1c11]/20" /> o <span className="h-px flex-1 bg-[#1c1c11]/20" />
          </div>

          <button
            type="button"
            onClick={crearSala}
            disabled={cargando}
            className="min-h-12 w-full rounded-lg border-2 border-ink bg-[#99B4D8] px-4 text-sm font-extrabold text-ink shadow-[2px_2px_0_#1c1c11] disabled:opacity-40"
          >
            {cargando ? "Creando..." : "Crear chat"}
          </button>

          {error && <p className="text-center text-xs font-bold text-accent">{error}</p>}

          <p className="text-center text-[10px] text-ink/50">
            Dura 1 día y nadie más puede leerlo sin el código. Se borra solo al vencer.
          </p>
        </div>
      </div>
    );
  }

  if (estado === "codigo-generado" && sala) {
    return (
      <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-ink bg-surface shadow-[4px_4px_0_#1c1c11]">
        <div className="flex items-center justify-between rounded-t-2xl border-b-2 border-ink bg-[#99B4D8] px-4 py-3">
          <h2 className="text-sm font-extrabold text-ink">💬 Chat creado</h2>
          <button type="button" onClick={volverAlInicio} aria-label="Cancelar" className="text-lg font-black text-ink">
            ✕
          </button>
        </div>
        <div className="flex flex-col items-center gap-3 p-5 text-center">
          <p className="text-xs font-bold text-ink/70">Comparte este código con la otra familia</p>
          <p className="rounded-xl border-2 border-ink bg-bg-light px-4 py-3 text-3xl font-black tracking-[0.3em] text-ink">
            {sala.codigo}
          </p>
          <p className="text-[10px] text-ink/50">Dura 1 día. Se elimina solo al vencer.</p>
          <button
            type="button"
            onClick={() => setEstado("abierto")}
            className="mt-2 min-h-12 w-full rounded-lg border-2 border-ink bg-[#E26D5C] px-4 text-sm font-extrabold text-white shadow-[2px_2px_0_#1c1c11]"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (!sala) return null;
  return (
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-[480px] w-[340px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border-2 border-ink bg-surface shadow-[4px_4px_0_#1c1c11]">
      <div className="flex items-center justify-between gap-2 rounded-t-2xl border-b-2 border-ink bg-[#99B4D8] px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-extrabold text-ink">💬 Sala {sala.codigo}</h2>
          <p className="flex items-center gap-1 text-[10px] font-bold text-ink/70">
            <span className={`inline-block h-2 w-2 rounded-full ${otroConectado ? "bg-green-600" : "bg-red-600"}`} aria-hidden />
            {otroConectado ? "Otra familia conectada" : "Esperando a la otra familia..."} · {formatearTiempoRestante(sala.expiraEn)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEstado("minimizado")}
          aria-label="Minimizar chat"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-surface text-sm font-black"
        >
          —
        </button>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {avisoCierre && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1c1c11]/90 p-6 text-center">
            <p className="text-sm font-bold text-white">🔌 {avisoCierre}</p>
          </div>
        )}

        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-bg-light p-3">
          {mensajes.length === 0 && (
            <p className="mt-6 text-center text-xs font-semibold text-ink/50">
              Aún no hay mensajes. Cuando la otra familia se una, aparecerán aquí.
            </p>
          )}
          {mensajes.map((m) => {
            const esMio = m.senderId === session.user.id;
            return (
              <div key={m.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-xl border-2 border-ink px-3 py-2 text-sm shadow-[2px_2px_0_#1c1c11] ${
                    esMio ? "bg-[#E26D5C] text-white" : "bg-surface text-ink"
                  }`}
                >
                  <p>{m.texto}</p>
                  <p className={`mt-1 text-[9px] font-semibold ${esMio ? "text-white/70" : "text-ink/50"}`}>{m.hora}</p>
                </div>
              </div>
            );
          })}
        </div>

        {advertencias > 0 && (
          <p className="border-t-2 border-ink bg-[#E26D5C]/20 px-3 py-1.5 text-center text-[11px] font-bold text-accent">
            ⚠️ Advertencia {advertencias}/3 por lenguaje inapropiado — al llegar a 3, el chat se cierra para las dos familias.
          </p>
        )}
        <div className="flex items-center gap-2 border-t-2 border-ink p-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
            placeholder="Escribe un mensaje..."
            className="min-h-11 flex-1 rounded-lg border-2 border-ink px-3 text-sm"
          />
          <button
            type="button"
            onClick={enviarMensaje}
            aria-label="Enviar mensaje"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-[#99B4D8] text-lg"
          >
            ➤
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t-2 border-ink p-2">
        <button
          type="button"
          onClick={volverAlInicio}
          className="flex-1 min-h-10 rounded-lg border-2 border-ink bg-surface text-xs font-bold"
        >
          ↩ Volver al inicio
        </button>
        <button
          type="button"
          onClick={salirDelChat}
          className="flex-1 min-h-10 rounded-lg border-2 border-ink bg-[#E26D5C] text-xs font-bold text-white"
        >
          🗑️ Salir del chat
        </button>
      </div>
    </div>
  );
}
