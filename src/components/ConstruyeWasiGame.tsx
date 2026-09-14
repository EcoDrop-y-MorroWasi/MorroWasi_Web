import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

// "Construye tu Wasi" — puzzle de construcción isométrico, pensado para dedo.
//
// Se descartó three.js a propósito: colocar bloques en una escena 3D con el dedo
// obliga a apuntar a la cara de un cubo, que en pantalla chica falla mucho. Acá
// cada celda es un polígono SVG con su propio área táctil, así que el toque cae
// siempre donde el jugador cree. De paso no suma dependencias ni MB al bundle,
// que importa en los celulares de gama baja a los que apunta la app.
//
// La mecánica enseña algo real: el agua solo pasa entre piezas contiguas, y lo
// que va a consumo humano tiene que cruzar un filtro antes. El biohuerto, en
// cambio, acepta agua sin filtrar — es el mismo criterio de las aguas grises.

const COLS = 7;
const FILAS = 7;
const TILE_W = 52;
const TILE_H = 26;
const ALTURA = 16; // cuánto "levanta" una pieza colocada

export type PiezaId = "techo" | "canaleta" | "filtro" | "tanque" | "biohuerto" | "ducha";

interface PiezaMeta {
  emoji: string;
  nombre: string;
  /** Cara superior del bloque. */
  color: string;
  /** Laterales — el mismo tono más oscuro da el volumen. */
  sombra: string;
  /** Si el agua puede seguir de largo por esta pieza. */
  conduce: boolean;
}

const PIEZAS: Record<PiezaId, PiezaMeta> = {
  techo: { emoji: "🏠", nombre: "Techo", color: "#E26D5C", sombra: "#a94b3e", conduce: true },
  canaleta: { emoji: "🟦", nombre: "Canaleta", color: "#99B4D8", sombra: "#6d87a9", conduce: true },
  filtro: { emoji: "⚗️", nombre: "Filtro", color: "#FFB793", sombra: "#c4835f", conduce: true },
  tanque: { emoji: "🛢️", nombre: "Tanque", color: "#7fa3c9", sombra: "#54708c", conduce: true },
  biohuerto: { emoji: "🌱", nombre: "Biohuerto", color: "#8fcf9f", sombra: "#5d9670", conduce: false },
  ducha: { emoji: "🚿", nombre: "Ducha", color: "#bcd3ea", sombra: "#7f96ad", conduce: false },
};

interface Destino {
  col: number;
  row: number;
  /** true = consumo humano, el agua debe haber cruzado un filtro. */
  requiereFiltro: boolean;
}

interface Ronda {
  titulo: string;
  objetivo: string;
  pista: string;
  fijas: { col: number; row: number; pieza: PiezaId }[];
  presupuesto: Partial<Record<PiezaId, number>>;
  destinos: Destino[];
}

const RONDAS: Ronda[] = [
  {
    titulo: "Ronda 1 — Riega el biohuerto",
    objetivo: "Lleva el agua del techo hasta el biohuerto.",
    pista: "El agua solo pasa entre piezas que se tocan por un lado. Nada de diagonales.",
    fijas: [
      { col: 0, row: 0, pieza: "techo" },
      { col: 4, row: 4, pieza: "biohuerto" },
    ],
    presupuesto: { canaleta: 12 },
    destinos: [{ col: 4, row: 4, requiereFiltro: false }],
  },
  {
    titulo: "Ronda 2 — Agua segura para la ducha",
    objetivo: "Conecta el techo con la ducha pasando por un filtro.",
    pista: "El agua de consumo humano tiene que cruzar el filtro antes de llegar.",
    fijas: [
      { col: 0, row: 3, pieza: "techo" },
      { col: 6, row: 3, pieza: "ducha" },
    ],
    presupuesto: { canaleta: 10, filtro: 1, tanque: 1 },
    destinos: [{ col: 6, row: 3, requiereFiltro: true }],
  },
  {
    titulo: "Ronda 3 — Todo el Wasi",
    objetivo: "Riega el biohuerto y abastece la ducha con agua filtrada.",
    pista: "Un solo filtro alcanza: haz que la rama de la ducha pase por él.",
    fijas: [
      { col: 3, row: 0, pieza: "techo" },
      { col: 0, row: 6, pieza: "biohuerto" },
      { col: 6, row: 6, pieza: "ducha" },
    ],
    presupuesto: { canaleta: 16, filtro: 1, tanque: 1 },
    destinos: [
      { col: 0, row: 6, requiereFiltro: false },
      { col: 6, row: 6, requiereFiltro: true },
    ],
  },
];

const clave = (col: number, row: number) => `${col},${row}`;

interface EstadoAgua {
  /** Celdas que reciben agua, para pintarlas. */
  mojadas: Set<string>;
  /** Destinos satisfechos (llegó agua y, si hacía falta, filtrada). */
  satisfechos: Set<string>;
}

/**
 * Propaga el agua desde cada techo por las piezas contiguas. El recorrido lleva
 * un bit extra —"ya pasó por un filtro"— porque la misma celda puede alcanzarse
 * por una rama filtrada y otra sin filtrar, y a la ducha solo le sirve la primera.
 */
function calcularAgua(tablero: Map<string, PiezaId>, destinos: Destino[]): EstadoAgua {
  const mojadas = new Set<string>();
  const satisfechos = new Set<string>();
  const visitados = new Set<string>(); // "col,row|filtrada"
  const cola: { col: number; row: number; filtrada: boolean }[] = [];

  for (const [k, pieza] of tablero) {
    if (pieza !== "techo") continue;
    const [col, row] = k.split(",").map(Number);
    cola.push({ col, row, filtrada: false });
  }

  const porDestino = new Map(destinos.map((d) => [clave(d.col, d.row), d]));

  while (cola.length > 0) {
    const actual = cola.shift()!;
    const k = clave(actual.col, actual.row);
    const pieza = tablero.get(k);
    if (!pieza) continue;

    const filtrada = actual.filtrada || pieza === "filtro";
    const estado = `${k}|${filtrada}`;
    if (visitados.has(estado)) continue;
    visitados.add(estado);
    mojadas.add(k);

    const destino = porDestino.get(k);
    if (destino && (!destino.requiereFiltro || filtrada)) satisfechos.add(k);

    // Las piezas terminales (biohuerto, ducha) reciben pero no reparten.
    if (!PIEZAS[pieza].conduce) continue;

    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nc = actual.col + dc;
      const nr = actual.row + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= FILAS) continue;
      if (!tablero.has(clave(nc, nr))) continue;
      cola.push({ col: nc, row: nr, filtrada });
    }
  }

  return { mojadas, satisfechos };
}

function tableroInicial(ronda: Ronda): Map<string, PiezaId> {
  return new Map(ronda.fijas.map((f) => [clave(f.col, f.row), f.pieza]));
}

export default function ConstruyeWasiGame({
  duration,
  onComplete,
}: {
  duration: number;
  onComplete: (accuracy: number) => void;
}) {
  const [rondaIndex, setRondaIndex] = useState(0);
  const [tablero, setTablero] = useState(() => tableroInicial(RONDAS[0]));
  const [seleccion, setSeleccion] = useState<PiezaId>("canaleta");
  const [rondasResueltas, setRondasResueltas] = useState(0);
  const [piezasUsadas, setPiezasUsadas] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);

  // Ref para que el cronómetro no necesite depender del contador de rondas: si
  // dependiera, cada ronda resuelta reiniciaría el intervalo y regalaría tiempo.
  const resueltasRef = useRef(0);
  const terminadoRef = useRef(false);

  useEffect(() => {
    resueltasRef.current = rondasResueltas;
  }, [rondasResueltas]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!terminadoRef.current) {
        terminadoRef.current = true;
        onComplete(resueltasRef.current / RONDAS.length);
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, onComplete]);

  const finalizar = (resueltas: number) => {
    if (terminadoRef.current) return;
    terminadoRef.current = true;
    onComplete(resueltas / RONDAS.length);
  };

  const ronda = RONDAS[rondaIndex];
  const fijas = useMemo(
    () => new Set(ronda.fijas.map((f) => clave(f.col, f.row))),
    [ronda],
  );

  const agua = useMemo(() => calcularAgua(tablero, ronda.destinos), [tablero, ronda]);
  const completa = ronda.destinos.every((d) => agua.satisfechos.has(clave(d.col, d.row)));

  const colocadas = (pieza: PiezaId) => {
    let n = 0;
    for (const [k, p] of tablero) if (p === pieza && !fijas.has(k)) n++;
    return n;
  };

  const restantes = (pieza: PiezaId) => (ronda.presupuesto[pieza] ?? 0) - colocadas(pieza);

  const tocarCelda = (col: number, row: number) => {
    const k = clave(col, row);
    if (fijas.has(k)) return; // techo y destinos no se mueven

    setTablero((prev) => {
      const next = new Map(prev);
      if (next.has(k)) {
        next.delete(k);
        return next;
      }
      if (restantes(seleccion) <= 0) return prev;
      next.set(k, seleccion);
      return next;
    });
    if (!tablero.has(k)) setPiezasUsadas((n) => n + 1);
  };

  const siguienteRonda = () => {
    const resueltas = rondasResueltas + 1;
    setRondasResueltas(resueltas);
    if (rondaIndex + 1 >= RONDAS.length) {
      // Resolver las 3 rondas ya vale la puntuación máxima; gastar menos piezas
      // no da más puntos, para no castigar al que explora antes de acertar.
      finalizar(resueltas);
      return;
    }
    const siguiente = RONDAS[rondaIndex + 1];
    setRondaIndex((i) => i + 1);
    setTablero(tableroInicial(siguiente));
    setSeleccion("canaleta");
  };

  const rendirse = () => finalizar(rondasResueltas);

  const reiniciar = () => setTablero(tableroInicial(ronda));

  // Encuadre del SVG: el rombo más a la izquierda es (0, FILAS-1) y el más a la
  // derecha (COLS-1, 0); se desplaza todo para que nada quede con x negativa.
  const offsetX = (FILAS - 1) * (TILE_W / 2) + TILE_W / 2;
  const anchoSvg = (COLS + FILAS - 1) * (TILE_W / 2) + TILE_W / 2;
  const altoSvg = (COLS + FILAS - 1) * (TILE_H / 2) + TILE_H + ALTURA + 8;

  const proyectar = (col: number, row: number, elevada: boolean) => ({
    x: (col - row) * (TILE_W / 2) + offsetX,
    y: (col + row) * (TILE_H / 2) + TILE_H + (elevada ? -ALTURA : 0),
  });

  // Pintar de atrás hacia adelante para que las piezas cercanas tapen a las lejanas.
  const celdas: { col: number; row: number }[] = [];
  for (let suma = 0; suma <= COLS + FILAS - 2; suma++) {
    for (let col = 0; col < COLS; col++) {
      const row = suma - col;
      if (row >= 0 && row < FILAS) celdas.push({ col, row });
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full border-2 border-ink bg-surface px-3 py-1 text-xs font-black">
          ⏱ {timeLeft}s
        </span>
        <span className="rounded-full border-2 border-ink bg-[#FFB793] px-3 py-1 text-xs font-black">
          🏗️ {rondasResueltas}/{RONDAS.length} rondas
        </span>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full border-2 border-ink bg-[#99B4D8] px-3 py-1 text-[11px] font-black">
          {ronda.titulo}
        </span>
      </div>

      <p className="rounded-2xl border-[3px] border-ink bg-[#FFB793] p-3 font-display text-sm font-extrabold leading-snug shadow-[4px_4px_0_#1c1c11]">
        🎯 {ronda.objetivo}
      </p>
      <p className="mt-1 font-body text-[11px] font-semibold text-ink/70">💡 {ronda.pista}</p>

      {/* Estado de cada destino, en vivo mientras construye */}
      <div className="mt-2 flex flex-wrap gap-2">
        {ronda.destinos.map((d) => {
          const ok = agua.satisfechos.has(clave(d.col, d.row));
          const pieza = tablero.get(clave(d.col, d.row));
          return (
            <span
              key={clave(d.col, d.row)}
              className={`rounded-full border-2 border-ink px-3 py-1 text-[11px] font-black ${
                ok ? "bg-[#8fcf9f]" : "bg-bg-light"
              }`}
            >
              {pieza ? PIEZAS[pieza].emoji : ""} {pieza ? PIEZAS[pieza].nombre : ""}{" "}
              {ok ? "✓ con agua" : d.requiereFiltro ? "— falta agua filtrada" : "— sin agua"}
            </span>
          );
        })}
      </div>

      {/* Tablero isométrico */}
      <div className="mt-2 overflow-hidden rounded-2xl border-[3px] border-ink bg-[#f2ecd4] p-2">
        <svg
          viewBox={`0 0 ${anchoSvg} ${altoSvg}`}
          className="h-auto w-full touch-manipulation select-none"
          role="group"
          aria-label="Tablero de construcción del Wasi"
        >
          {celdas.map(({ col, row }) => {
            const k = clave(col, row);
            const pieza = tablero.get(k);
            const mojada = agua.mojadas.has(k);
            const base = proyectar(col, row, false);
            const meta = pieza ? PIEZAS[pieza] : null;
            const tope = proyectar(col, row, Boolean(pieza));

            const rombo = (cx: number, cy: number) =>
              `${cx},${cy - TILE_H / 2} ${cx + TILE_W / 2},${cy} ${cx},${cy + TILE_H / 2} ${cx - TILE_W / 2},${cy}`;

            return (
              <g
                key={k}
                onClick={() => tocarCelda(col, row)}
                style={{ cursor: fijas.has(k) ? "not-allowed" : "pointer" }}
                role="button"
                aria-label={
                  pieza
                    ? `${meta!.nombre} en columna ${col + 1}, fila ${row + 1}${mojada ? ", con agua" : ""}`
                    : `Celda vacía en columna ${col + 1}, fila ${row + 1}`
                }
              >
                {/* Suelo: siempre presente, y es el área táctil de la celda vacía */}
                <polygon
                  points={rombo(base.x, base.y)}
                  fill={pieza ? "#ddd6bb" : "#fdfae7"}
                  stroke="#1c1c11"
                  strokeWidth={1.2}
                />

                {pieza && (
                  <>
                    {/* Caras laterales — dan el volumen del bloque */}
                    <polygon
                      points={`${tope.x - TILE_W / 2},${tope.y} ${tope.x},${tope.y + TILE_H / 2} ${tope.x},${tope.y + TILE_H / 2 + ALTURA} ${tope.x - TILE_W / 2},${tope.y + ALTURA}`}
                      fill={meta!.sombra}
                      stroke="#1c1c11"
                      strokeWidth={1.2}
                    />
                    <polygon
                      points={`${tope.x + TILE_W / 2},${tope.y} ${tope.x},${tope.y + TILE_H / 2} ${tope.x},${tope.y + TILE_H / 2 + ALTURA} ${tope.x + TILE_W / 2},${tope.y + ALTURA}`}
                      fill={meta!.sombra}
                      opacity={0.78}
                      stroke="#1c1c11"
                      strokeWidth={1.2}
                    />
                    {/* Cara superior. El agua se pinta como un tinte encima, no
                        reemplazando el color: si todas las piezas mojadas quedaran
                        del mismo azul, en la ronda 3 sería imposible ver dónde
                        quedó el filtro. */}
                    <polygon
                      points={rombo(tope.x, tope.y)}
                      fill={meta!.color}
                      stroke="#1c1c11"
                      strokeWidth={1.5}
                    />
                    {mojada && (
                      <polygon
                        points={rombo(tope.x, tope.y)}
                        fill="#99B4D8"
                        opacity={0.55}
                        stroke="#1c1c11"
                        strokeWidth={1.5}
                        style={{ pointerEvents: "none" }}
                      />
                    )}
                    <text
                      x={tope.x}
                      y={tope.y + 5}
                      textAnchor="middle"
                      fontSize={15}
                      style={{ pointerEvents: "none" }}
                    >
                      {meta!.emoji}
                    </text>
                    {mojada && (
                      <text
                        x={tope.x}
                        y={tope.y - 9}
                        textAnchor="middle"
                        fontSize={10}
                        style={{ pointerEvents: "none" }}
                      >
                        💧
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Paleta — botones de 48dp, scroll horizontal si no entran */}
      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
        {(Object.keys(ronda.presupuesto) as PiezaId[]).map((pieza) => {
          const quedan = restantes(pieza);
          const activa = seleccion === pieza;
          return (
            <button
              key={pieza}
              type="button"
              onClick={() => setSeleccion(pieza)}
              disabled={quedan <= 0 && !activa}
              className={`flex min-h-12 shrink-0 items-center gap-2 rounded-xl border-2 border-ink px-3 font-display text-xs font-bold shadow-[2px_2px_0_#1c1c11] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 ${
                activa ? "bg-[#E26D5C] text-white" : "bg-bg-light"
              }`}
            >
              <span aria-hidden="true" className="text-lg">{PIEZAS[pieza].emoji}</span>
              {PIEZAS[pieza].nombre}
              <span className={`rounded-full border-2 border-ink px-1.5 text-[10px] ${activa ? "bg-white text-ink" : "bg-surface"}`}>
                {quedan}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-1 font-body text-[11px] font-semibold text-ink/60">
        Toca una celda para colocar {PIEZAS[seleccion].nombre.toLowerCase()}. Toca una pieza tuya para quitarla.
      </p>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={reiniciar}
          className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-bg-light font-display text-sm font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          ↺ Limpiar
        </button>
        <button
          type="button"
          onClick={rendirse}
          className="min-h-12 flex-1 rounded-xl border-2 border-ink bg-surface font-display text-sm font-bold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Terminar
        </button>
      </div>

      {completa && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={siguienteRonda}
          className="mt-2 min-h-12 w-full rounded-xl border-2 border-ink bg-[#8fcf9f] font-display text-sm font-extrabold shadow-[4px_4px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          ✅ ¡El agua llega! {rondaIndex + 1 >= RONDAS.length ? "Ver mi puntaje →" : "Siguiente ronda →"}
        </motion.button>
      )}

      <p className="mt-2 text-center font-body text-[11px] font-semibold text-ink/50">
        Piezas colocadas: {piezasUsadas}
      </p>
    </div>
  );
}
