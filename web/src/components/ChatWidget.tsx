import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

type EstadoChat = "cerrado" | "unirse" | "codigo-generado" | "abierto" | "minimizado";

// Duración fija para todos los chats — sin selector, sin QR: solo código + "Crear chat".
const DURACION_CHAT_DIAS = 1;

interface MensajeMock {
  id: string;
  autor: "yo" | "otro";
  texto: string;
  hora: string;
}

// Vista previa visual del chat temporal entre familias (unión solo por código, sin QR;
// sin backend real todavía). Mensajes y sala son mock local; cuando se conecte Firestore,
// este mismo componente pasa a leer/escribir el documento único chats/{codigo} con onSnapshot.
const MENSAJES_MOCK: MensajeMock[] = [
  { id: "1", autor: "otro", texto: "¡Hola! Somos la Familia Rivera de Morropón 👋", hora: "1:40 p. m." },
  { id: "2", autor: "yo", texto: "¡Hola! ¿Cómo les está yendo con la meta de esta semana?", hora: "1:41 p. m." },
  { id: "3", autor: "otro", texto: "Bien, ya llevamos 300 L ahorrados reusando el agua de la lavadora ♻️", hora: "1:42 p. m." },
  { id: "4", autor: "yo", texto: "¡Genial! Nosotros probamos SODIS esta semana, les recomendamos el curso 💧", hora: "1:44 p. m." },
];

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

export default function ChatWidget() {
  const location = useLocation();
  const [estado, setEstado] = useState<EstadoChat>("cerrado");
  const [codigoInput, setCodigoInput] = useState("");
  const [sala, setSala] = useState<{ codigo: string; expiraEn: number } | null>(null);
  const [mensajes, setMensajes] = useState<MensajeMock[]>(MENSAJES_MOCK);
  const [texto, setTexto] = useState("");
  const [otroConectado, setOtroConectado] = useState(true);
  const [avisoCierre, setAvisoCierre] = useState<string | null>(null);
  const [, forceTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const primerRenderRef = useRef(true);

  // Cambiar de pestaña minimiza el chat a burbuja, sin cerrarlo (la sesión sigue activa).
  useEffect(() => {
    if (primerRenderRef.current) {
      primerRenderRef.current = false;
      return;
    }
    setEstado((prev) => (prev === "abierto" ? "minimizado" : prev));
  }, [location.pathname]);

  // Refresca el contador "Expira en..." cada minuto.
  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [mensajes, estado]);

  // Si la otra familia se desconecta, el chat y sus mensajes se eliminan solos —
  // nadie se queda hablando con una sala vacía ni el mensaje queda guardado en ningún lado.
  useEffect(() => {
    if (otroConectado || !sala) return;
    setAvisoCierre("La otra familia se desconectó. Eliminando el chat...");
    const id = window.setTimeout(() => {
      setSala(null);
      setMensajes([]);
      setAvisoCierre(null);
      setOtroConectado(true);
      setEstado("cerrado");
    }, 1800);
    return () => window.clearTimeout(id);
  }, [otroConectado, sala]);

  const crearSala = () => {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    setSala({ codigo, expiraEn: Date.now() + DURACION_CHAT_DIAS * 24 * 60 * 60 * 1000 });
    setMensajes([]);
    setOtroConectado(true);
    setEstado("codigo-generado");
  };

  const unirseASala = () => {
    if (codigoInput.trim().length !== 6) return;
    setSala({ codigo: codigoInput.trim(), expiraEn: Date.now() + DURACION_CHAT_DIAS * 24 * 60 * 60 * 1000 });
    setMensajes(MENSAJES_MOCK);
    setOtroConectado(true);
    setEstado("abierto");
  };

  const enviarMensaje = () => {
    const txt = texto.trim();
    if (!txt) return;
    setMensajes((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, autor: "yo", texto: txt, hora: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setTexto("");
  };

  /** Sale del chat y vuelve a la pantalla inicial de unirse/crear (no solo a la burbuja). */
  const volverAlInicio = () => {
    setSala(null);
    setMensajes([]);
    setCodigoInput("");
    setEstado("unirse");
  };

  /** Borrado manual explícito, con confirmación — distinto del borrado automático a las 24h. */
  const eliminarChatManualmente = () => {
    if (!window.confirm("¿Eliminar este chat y todos los mensajes? No se puede deshacer.")) return;
    volverAlInicio();
  };

  // Burbuja flotante — estado inicial y estado minimizado
  if (estado === "cerrado" || estado === "minimizado") {
    return (
      <button
        type="button"
        onClick={() => setEstado(sala ? "abierto" : "unirse")}
        aria-label={sala ? "Abrir chat temporal" : "Unirse a un chat temporal"}
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#1c1c11] bg-[#99B4D8] text-2xl shadow-[3px_3px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <span aria-hidden>💬</span>
        {sala && estado === "minimizado" && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#1c1c11] bg-[#E26D5C] text-[9px] font-black text-white">
            ●
          </span>
        )}
      </button>
    );
  }

  // Formulario para unirse por código o crear una sala nueva (duración fija, sin QR)
  if (estado === "unirse") {
    return (
      <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-[#1c1c11] bg-white shadow-[4px_4px_0_#1c1c11]">
        <div className="flex items-center justify-between rounded-t-2xl border-b-2 border-[#1c1c11] bg-[#99B4D8] px-4 py-3">
          <h2 className="text-sm font-extrabold text-[#1c1c11]">💬 Chat temporal</h2>
          <button type="button" onClick={() => setEstado("cerrado")} aria-label="Cerrar" className="text-lg font-black text-[#1c1c11]">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div>
            <label className="text-xs font-bold text-[#1c1c11]/70">Ingresa un código de 6 dígitos</label>
            <input
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="482913"
              inputMode="numeric"
              className="mt-1 min-h-12 w-full rounded-lg border-2 border-[#1c1c11] px-3 text-center text-lg font-black tracking-widest"
            />
            <button
              type="button"
              onClick={unirseASala}
              disabled={codigoInput.length !== 6}
              className="mt-2 min-h-12 w-full rounded-lg border-2 border-[#1c1c11] bg-[#E26D5C] px-4 text-sm font-extrabold text-white shadow-[2px_2px_0_#1c1c11] disabled:opacity-40 disabled:shadow-none"
            >
              Unirse al chat
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#1c1c11]/50">
            <span className="h-px flex-1 bg-[#1c1c11]/20" /> o <span className="h-px flex-1 bg-[#1c1c11]/20" />
          </div>

          <button
            type="button"
            onClick={crearSala}
            className="min-h-12 w-full rounded-lg border-2 border-[#1c1c11] bg-[#99B4D8] px-4 text-sm font-extrabold text-[#1c1c11] shadow-[2px_2px_0_#1c1c11]"
          >
            Crear chat
          </button>

          <p className="text-center text-[10px] text-[#1c1c11]/50">
            Dura {DURACION_CHAT_DIAS} día y nadie más puede leerlo sin el código. Se borra solo al vencer.
          </p>
        </div>
      </div>
    );
  }

  // Pantalla intermedia: código recién generado, antes de entrar al chat
  if (estado === "codigo-generado" && sala) {
    return (
      <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-[#1c1c11] bg-white shadow-[4px_4px_0_#1c1c11]">
        <div className="flex items-center justify-between rounded-t-2xl border-b-2 border-[#1c1c11] bg-[#99B4D8] px-4 py-3">
          <h2 className="text-sm font-extrabold text-[#1c1c11]">💬 Chat creado</h2>
          <button type="button" onClick={volverAlInicio} aria-label="Cancelar" className="text-lg font-black text-[#1c1c11]">
            ✕
          </button>
        </div>
        <div className="flex flex-col items-center gap-3 p-5 text-center">
          <p className="text-xs font-bold text-[#1c1c11]/70">Comparte este código con la otra familia</p>
          <p className="rounded-xl border-2 border-[#1c1c11] bg-[#fdfae7] px-4 py-3 text-3xl font-black tracking-[0.3em] text-[#1c1c11]">
            {sala.codigo}
          </p>
          <p className="text-[10px] text-[#1c1c11]/50">Dura {DURACION_CHAT_DIAS} día. Se elimina solo al vencer o al desconectarse.</p>
          <button
            type="button"
            onClick={() => setEstado("abierto")}
            className="mt-2 min-h-12 w-full rounded-lg border-2 border-[#1c1c11] bg-[#E26D5C] px-4 text-sm font-extrabold text-white shadow-[2px_2px_0_#1c1c11]"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // Panel abierto con la sala activa
  if (!sala) return null;
  return (
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-[480px] w-[340px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border-2 border-[#1c1c11] bg-white shadow-[4px_4px_0_#1c1c11]">
      <div className="flex items-center justify-between gap-2 rounded-t-2xl border-b-2 border-[#1c1c11] bg-[#99B4D8] px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-extrabold text-[#1c1c11]">💬 Sala {sala.codigo}</h2>
          <p className="flex items-center gap-1 text-[10px] font-bold text-[#1c1c11]/70">
            <span className={`inline-block h-2 w-2 rounded-full ${otroConectado ? "bg-green-600" : "bg-red-600"}`} aria-hidden />
            {otroConectado ? "Otra familia conectada" : "Otra familia desconectada"} · {formatearTiempoRestante(sala.expiraEn)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEstado("minimizado")}
          aria-label="Minimizar chat"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#1c1c11] bg-white text-sm font-black"
        >
          —
        </button>
      </div>

      {/* relative solo aquí, aislado del contenedor fixed de arriba, para que el overlay
          de "chat eliminado" no le pelee la posición al panel completo. */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {avisoCierre && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1c1c11]/90 p-6 text-center">
            <p className="text-sm font-bold text-white">🔌 {avisoCierre}</p>
          </div>
        )}

        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-[#fdfae7] p-3">
          {mensajes.length === 0 && (
            <p className="mt-6 text-center text-xs font-semibold text-[#1c1c11]/50">
              Aún no hay mensajes. Cuando la otra familia se una, aparecerán aquí.
            </p>
          )}
          {mensajes.map((m) => (
            <div key={m.id} className={`flex ${m.autor === "yo" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-xl border-2 border-[#1c1c11] px-3 py-2 text-sm shadow-[2px_2px_0_#1c1c11] ${
                  m.autor === "yo" ? "bg-[#E26D5C] text-white" : "bg-white text-[#1c1c11]"
                }`}
              >
                <p>{m.texto}</p>
                <p className={`mt-1 text-[9px] font-semibold ${m.autor === "yo" ? "text-white/70" : "text-[#1c1c11]/50"}`}>{m.hora}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t-2 border-[#1c1c11] p-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
            placeholder="Escribe un mensaje..."
            className="min-h-11 flex-1 rounded-lg border-2 border-[#1c1c11] px-3 text-sm"
          />
          <button
            type="button"
            onClick={enviarMensaje}
            aria-label="Enviar mensaje"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-[#1c1c11] bg-[#99B4D8] text-lg"
          >
            ➤
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t-2 border-[#1c1c11] p-2">
        <button
          type="button"
          onClick={() => setOtroConectado((v) => !v)}
          title="Solo demo: simula que la otra familia se conecta o desconecta"
          className="flex-1 min-h-10 rounded-lg border-2 border-[#1c1c11] bg-white text-xs font-bold"
        >
          📶 Simular conexión (demo)
        </button>
        <button
          type="button"
          onClick={volverAlInicio}
          className="flex-1 min-h-10 rounded-lg border-2 border-[#1c1c11] bg-white text-xs font-bold"
        >
          ↩ Volver al inicio
        </button>
        <button
          type="button"
          onClick={eliminarChatManualmente}
          className="flex-1 min-h-10 rounded-lg border-2 border-[#1c1c11] bg-[#E26D5C] text-xs font-bold text-white"
        >
          🗑️ Eliminar chat
        </button>
      </div>
    </div>
  );
}
