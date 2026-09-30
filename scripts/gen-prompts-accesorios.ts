// Genera documentacion/accesorios-prompts.md: una ficha por accesorio (121)
// con el prompt para que Claude lo construya en voxel y lo exporte a .glb.
// La forma y el tamaño salen de src/data/models3dSpec.ts (la misma función que
// usa el pipeline), así el .md y `pnpm modelos:procesar` nunca se contradicen.
// Lo que vive acá es solo el diseño: qué trae puesto cada avatar, su paleta y
// el motivo de cada accesorio.
//
//   pnpm modelos:prompts                 escribe documentacion/accesorios-prompts.md
//   pnpm modelos:prompts --salida <md>   escribe en otra ruta
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AVATARS, AVATAR_ACCESSORIES, SLOT_LABELS, type Accessory } from "../src/data/avatarShop.ts";
import { AVATAR_HEADS, AVATAR_HEIGHT, SHAPE_SPECS, shapeKey, targetSize } from "../src/data/models3dSpec.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const i = args.indexOf("--salida");
// documentacion/ está en .gitignore (material de trabajo, no se sube).
const OUT = i >= 0 ? args[i + 1] : join(ROOT, "documentacion", "accesorios-prompts.md");

/** Tamaño del cubito voxel que se le pide a Claude (los avatares van de ~1 a ~1.9 cm). */
const VOXEL = 0.018;
const VOXEL_CM = (VOXEL * 100).toFixed(1);

// ---------- Avatares (modelo NORMAL: los accesorios no se ven con la Skin Especial) ----------
interface AvatarBrief {
  etapa: string;
  tiene: string;
  paleta: string;
  /** Choques con lo que ya trae puesto, por zona. */
  ojo?: Partial<Record<Accessory["slot"], string>>;
}

const GLASSES = "ya usa anteojos: nada de lentes ENCIMA de los suyos; los lentes/gafas van como clip-on (cristales que se enganchan por delante de su montura) y el antifaz lleva aberturas grandes que dejan ver sus anteojos";

const AVATAR_BRIEFS: Record<string, AvatarBrief> = {
  angie: {
    etapa: "Etapa 1 · Pequeño Brote (maceta de barro, brote tímido)",
    tiene: "pelo negro muy largo hasta la cintura, gancho rosa en X, chompa rosa con corazones, falda marrón, medias negras con corazones, zapatillas y **mochila**",
    paleta: "rosa `#EEACCB`, crema `#F6E3CF`, marrón topo `#7D6C63`, terracota `#C0714F`, verde brote `#7BB662`, dorado `#D9A441`",
    ojo: {
      espalda: "ya lleva mochila (cuerpo 0.30 × 0.35 × 0.14 m, entre 0.88 y 1.23 m de altura): sus piezas de espalda son agregados PARA esa mochila, no la reemplazan",
      piernas: "usa zapatillas voluminosas (≈0.20 m de ancho × 0.26 m de largo × 0.18 m de alto por pie, centradas en x = −0.11): lo de piernas va POR FUERA de ellas, envolviéndolas — si queda más chico, desaparece adentro",
    },
  },
  britney: {
    etapa: "Etapa 2 · Semilla Germinada (hojas verdes, gota de rocío)",
    tiene: "anteojos, pelo castaño largo, chompa rosa, cargo beige ancho, zapatillas blancas y **mochila con conejito**",
    paleta: "rosa `#F6B8D2`, beige `#DED0B6`, verde hoja `#7BB662`, celeste rocío `#9FD3E8`, dorado `#D9A441`",
    ojo: { cara: GLASSES, espalda: "ya lleva mochila con conejito (cuerpo 0.29 × 0.34 × 0.15 m, entre 0.99 y 1.33 m de altura): sus piezas de espalda son agregados PARA esa mochila, no la reemplazan", piernas: "cargo ancho hasta el zapato: lo de piernas tiene que ser más ancho que el ruedo (≈0.17 m)" },
  },
  francheska: {
    etapa: "Etapa 3 · Jardín de Duna (cactus y suculentas sobre arena)",
    tiene: "anteojos, pelo largo ondulado, casaca morada «20», buzo morado, zapatillas lilas",
    paleta: "morado `#7856AD`, lila `#B9A2DF`, arena `#E3C98F`, verde suculenta `#6A9A5B`, dorado `#D9A441`",
    ojo: { cara: GLASSES, cabeza: "pelo voluminoso: la capucha tiene que ser amplia" },
  },
  dayra: {
    etapa: "Etapa 4 · Arbusto Resiliente (flores amarillas de algarrobo)",
    tiene: "**lentes de sol sobre la cabeza**, rulos largos, **poncho blanco** que tapa el torso, pantalón negro, botas blancas",
    paleta: "blanco `#F3EEE5`, negro `#211F23`, amarillo algarrobo `#F2C230`, verde arbusto `#5B7F3A`, marrón rama `#6B4A2F`",
    ojo: {
      cabeza: "lleva lentes de sol arriba de la cabeza: la vincha va a la altura de las cejas y la corona detrás de los lentes, sin taparlos",
      pecho: "el poncho tapa el torso: el chaleco va POR ENCIMA del poncho (más ancho) y la insignia prendida al poncho",
      piernas: "usa botas blancas: el pie mide ≈0.15 m de ancho × 0.26 m de largo × 0.12 m de alto (centrado en x = −0.10) y la caña sigue hacia arriba (0.16 m de fondo); la zapatilla envuelve el pie de la bota y la caña blanca queda asomando como una media",
    },
  },
  felipe: {
    etapa: "Etapa 5 · Oasis Temprano (charco cristalino, mariposa)",
    tiene: "pelo corto, casaca azul marino con franja roja, jean con parche de oso, zapatillas",
    paleta: "azul marino `#2E3650`, rojo franja `#A33B45`, celeste agua `#7EC8E3`, azul mariposa `#3E7CC4`, blanco `#F4F4F8`",
  },
  milagros: {
    etapa: "Etapa 6 · Refugio Verde (tronco firme, sombra, césped)",
    tiene: "pelo lacio largo con gancho rojo, top negro, collar con cruz, jean acampanado que tapa el zapato",
    paleta: "jean `#5A70A4`, negro `#231915`, verde refugio `#4F8A4B`, verde césped `#7CC05A`, marrón tronco `#6B4A2F`",
    ojo: { pecho: "tiene collar con cruz: el medallón/chaleco no lo tapan del todo", piernas: "jean acampanado: su ruedo (0.28 m de ancho) arranca a 0.06 m del piso y tapa la parte de arriba del pie; debajo, zapatillas de ≈0.16 × 0.28 m (centradas en x = −0.13). Botas y polainas más anchas que el ruedo; en la zapatilla lo que se luce es la suela y la puntera, que asoman por delante del ruedo" },
  },
  jimmy: {
    etapa: "Etapa 7 · Flujo del Chira (canalito de agua limpia)",
    tiene: "anteojos, pelo negro rizado, camisa blanca con corbata roja y escudo del colegio, pantalón azul marino",
    paleta: "azul marino `#15172C`, blanco `#EFEEF5`, rojo corbata `#B3313A`, celeste Chira `#5FB3D9`, arena ribera `#CDB892`",
    ojo: { cara: GLASSES, pecho: "ya tiene escudo en el lado izquierdo del pecho: la insignia va del lado DERECHO; el chaleco abierto deja ver la corbata" },
  },
  genesis: {
    etapa: "Etapa 8 · Bosque Seco (chilalos y picaflores)",
    tiene: "anteojos rojos, uniforme escolar (camisa blanca, jumper azul marino, cordón rojo), medias blancas, zapatos negros",
    paleta: "azul marino `#172247`, blanco `#F8F8FB`, rojo `#C8323C`, verde oliva `#8A8F4A`, turquesa picaflor `#2FB8A8`, marrón chilalo `#B5653A`",
    ojo: {
      cara: GLASSES,
      piernas: "usa zapatos escolares negros de ≈0.17 m de ancho × 0.25 m de largo × 0.09 m de alto (centrados en x = −0.085) con medias blancas encima: lo de piernas va POR FUERA del zapato",
    },
  },
  rihana: {
    etapa: "Etapa 9 · Santuario Hídrico (fauna y plantas medicinales)",
    tiene: "pelo largo ondulado, casaca de cuero negra, jean ancho que tapa el zapato",
    paleta: "negro cuero `#2E2724`, jean `#344D78`, verde medicinal `#5E9C6A`, turquesa agua `#4DB6C4`, verde musgo `#5A6B3A`",
    ojo: { piernas: "jean ancho: botas y polainas más anchas que el ruedo (≈0.18 m)" },
  },
  flordejesus: {
    etapa: "Etapa 10 · Oasis Sagrado (árbol ancestral, flores y frutos)",
    tiene: "**sombrero de paja**, **lentes rojos**, trenza, blusa verde floreada, falda larga estampada, bolso cruzado",
    paleta: "verde azulado `#1F4A52`, paja `#E6A775`, rojo fruto `#C8423A`, dorado `#D9A441`, celeste cielo `#8EC9EC`",
    ojo: {
      cabeza: "ya usa sombrero de paja: la corona rodea la copa del sombrero y el tocado es un adorno que se prende a su costado",
      cara: GLASSES,
      piernas: "falda larga cuyo ruedo llega a 0.06 m del piso: debajo, zapatos marrones de ≈0.20 × 0.25 m (centrados en x = −0.11). Lo de piernas asoma por debajo de la falda: en la zapatilla se luce la suela y la puntera",
    },
  },
  claudio: {
    etapa: "Secreto · Guardián Dorado",
    tiene: "**lentes de sol**, polo negro «Camping», jean, reloj",
    paleta: "dorado `#FFCB3F`, dorado oscuro `#C9962B`, blanco `#F7F3E6`, negro `#3A3839`, azul gema `#3B6FD1`",
    ojo: { cara: "ya usa lentes de sol: el antifaz lleva aberturas grandes por encima de sus lentes y los «Lentes de Luz Dorada» son clip-on dorados translúcidos" },
  },
};

// ---------- Forma: cómo se construye (según models3dSpec) ----------
const SHAPE_HOW: Record<string, string> = {
  "cabeza:0": "sombrero: copa + ala plana alrededor, **hueco por dentro** para calzar una cabeza de ~0.40 m",
  "cabeza:1": "vincha fina: aro CUADRADO de esquinas redondeadas (la cabeza es un cubo), 2 cubitos de alto, que rodea cabeza y pelo a la altura del nacimiento del pelo, con el adorno al frente",
  "cabeza:2": "corona: aro CUADRADO de esquinas redondeadas (la cabeza es un cubo), 3–4 cubitos de alto, con 3–5 puntas hacia arriba",
  "cabeza:3": "vincha ancha: aro CUADRADO de esquinas redondeadas, 4–5 cubitos de alto, a la altura de las cejas",
  "cabeza:4": "capucha: cubre la coronilla y cae por atrás y los costados hasta los hombros, **abierta adelante** (la cara queda libre), hueca",
  "cabeza:5": "gorro/tocado que cubre la parte de arriba de la cabeza (hueco) con un adorno que sale hacia el costado izquierdo del personaje (+X)",
  "cara:0": "lentes: dos aros redondos (en voxel) unidos por un puente y dos patillas que van hacia atrás ~0.20 m",
  "cara:1": "gafas de banda: una sola franja de 3–4 cubitos de alto de lado a lado, con patillas hacia atrás",
  "cara:2": "antifaz: máscara que cubre la franja de los ojos, con dos aberturas para los ojos, borde marcado y cinta hacia atrás",
  "cara:3": "visera: franja angosta **por encima** de los ojos (no los tapa), sostenida por una cinta que rodea la cabeza",
  "pecho:0": "prenda sin mangas que envuelve el torso (~0.46 × 0.40 m, profundidad ~0.28 m, hueca), abierta adelante",
  "pecho:1": "medallón: cordón que rodea el cuello y cae al pecho con una placa/dije al centro",
  "pecho:2": "banda diagonal: franja de 3 cubitos de ancho que cruza el torso del hombro derecho a la cadera izquierda, por delante y por detrás (anillo inclinado, hueco)",
  "pecho:3": "insignia/prendedor plano (2 cubitos de grosor) para prender en el pecho",
  "espalda:0": "capa: tela plana (1–2 cubitos de grosor) que cae desde los hombros hasta las rodillas, más ancha abajo, con cuello o broche arriba",
  "espalda:1": "mochila/alforja: cuerpo de ~0.30 × 0.40 × 0.14 m con bolsillo y dos correas que suben por la espalda y pasan por encima de los hombros (sin rodear el torso por delante)",
  "espalda:2": "manto liviano: tela corta que cuelga de los hombros hasta la cintura",
  "espalda:enrollado": "manto/frazada enrollada en forma de cilindro acostado (voxel), un poco más ancha que la mochila, atada con dos correas; va APOYADA ARRIBA de la mochila que el avatar ya tiene",
  "espalda:funda": "funda impermeable que envuelve la mochila que el avatar ya tiene: una caja hueca de tela con el borde elastizado adelante, abierta del lado que toca la espalda",
  "espalda:colgante": "objeto chico que cuelga de un mosquetón o cordón al costado derecho de la mochila que el avatar ya tiene (incluí el mosquetón arriba)",
  "piernas:0": "**UNA sola bota (pie derecho)**, de la suela a media pantorrilla, hueca arriba",
  "piernas:1": "vendas enrolladas en **UNA sola pierna (la derecha)**: franjas cruzadas desde el tobillo hacia arriba formando un tubo hueco de ~0.13 m",
  "piernas:2": "**UNA sola ojota (pie derecho)**: suela plana + correas cruzadas",
  "piernas:3": "**UNA sola polaina (pierna derecha)**: tubo hueco del tobillo a la pantorrilla",
  "piernas:zapatilla":
    "**UNA sola zapatilla (pie derecho)** de caña media: suela gruesa (2–3 cubitos) que sobresale un poco, puntera redondeada, lengüeta, cordones y ojalillos; HUECA por dentro y MÁS GRANDE que el calzado que el avatar ya tiene, para envolverlo entero (la del avatar no tiene que asomar por ningún lado)",
  "manos:regadera": "regadera chica con manija arriba y pico largo con roseta",
  "manos:balde": "balde con asa arriba",
  "manos:libro": "libro cerrado de tapa dura (~0.20 × 0.15 × 0.04 m)",
  "manos:vara": "vara/bastón recto y vertical, 2–3 cubitos de grosor, con remate decorativo arriba",
};

// ---------- Motivo de cada accesorio (qué lo hace ser ESE accesorio) ----------
const MOTIFS: Record<string, string> = {
  "angie-acc0": "banda rosa con un brotecito de dos hojas verdes al frente",
  "angie-acc1": "vincha terracota con una macetita de barro en miniatura al costado",
  "angie-acc2": "montura rosa y cristales celeste claro semitransparentes, con una gotita de rocío en una esquina",
  "angie-acc3": "terracota con textura de tierra agrietada (cubitos en dos tonos)",
  "angie-acc4": "crema con ribete rosa, tres botones dorados y un brote bordado en el bolsillo",
  "angie-acc5": "macetita terracota con un brote verde saliendo",
  "angie-acc6": "frazada marrón topo enrollada, con raíces doradas bordadas en los extremos y correas crema",
  "angie-acc7": "bolsita de tela crema cerrada con cordón rosa, semillitas asomando y una etiqueta con forma de hoja",
  "angie-acc8": "terracota con suela marrón oscuro y cordones crema",
  "angie-acc9": "zapatilla crema con puntera y talón rosa, suela blanca gruesa, cordones verde brote y un brotecito de dos hojas saliendo de la lengüeta",
  "angie-acc10": "rosa con roseta dorada",
  "britney-acc0": "puntas con forma de hojitas verdes que brotan de una base beige, con una semilla dorada al centro",
  "britney-acc1": "banda verde hoja con una hoja grande al costado",
  "britney-acc2": "cristales celeste rocío con forma de gota",
  "britney-acc3": "visera con forma de hoja verde, nervaduras en verde oscuro",
  "britney-acc4": "rosa con una fila de semillitas doradas",
  "britney-acc5": "verde hoja con cierre beige y bolsillos con forma de semilla",
  "britney-acc6": "celeste pálido con gotitas de rocío (cubitos blancos) y una hojita verde en la esquina",
  "britney-acc7": "alforja chica beige de dos bolsillos con semillas asomando",
  "britney-acc8": "verde claro con el borde de arriba recortado en hojitas",
  "britney-acc9": "beige con un brote verde saliendo del borde de la caña",
  "britney-acc10": "balde rosa con una franja de hojitas verdes",
  "francheska-acc0": "color arena con ribete lila",
  "francheska-acc1": "vincha ancha morada con una flor de cactus rosada al costado",
  "francheska-acc2": "cristales ámbar dorado, clip-on",
  "francheska-acc3": "color arena con un sol dorado al frente",
  "francheska-acc4": "poncho corto sin mangas verde suculenta con rombos lila y flecos",
  "francheska-acc5": "cordón morado y medalla dorada con una flor de cinco pétalos",
  "francheska-acc6": "manto color arena con borde lila",
  "francheska-acc7": "mochila de explorador color arena, correas moradas y una cantimplora colgando",
  "francheska-acc8": "botas de explorador color arena con suela morada",
  "francheska-acc9": "vendas color arena con un amarre lila",
  "francheska-acc10": "tapa verde suculenta con una suculenta dibujada y lomo morado",
  "dayra-acc0": "vincha blanca con un racimo de flores amarillas de algarrobo",
  "dayra-acc1": "corona de ramitas marrones con florcitas amarillas",
  "dayra-acc2": "amarillo algarrobo con pétalos en las puntas",
  "dayra-acc3": "montura negra y cristales ámbar",
  "dayra-acc4": "pechera corta de ramas tejidas marrones con hojitas verdes, más ancha para ir sobre el poncho",
  "dayra-acc5": "flor amarilla de algarrobo",
  "dayra-acc6": "verde arbusto con flores amarillas en el borde",
  "dayra-acc7": "alforja marrón con vainas de algarrobo colgando",
  "dayra-acc8": "zapatilla blanca con suela marrón rama, costuras en forma de raíces marrones que suben desde la suela y cordones amarillo algarrobo",
  "dayra-acc9": "verde arbusto con florcitas amarillas",
  "dayra-acc10": "rama de algarrobo con racimo de flores amarillas arriba",
  "felipe-acc0": "azul marino con cinta celeste y una mariposa posada en el ala",
  "felipe-acc1": "gorro celeste con una mariposa azul posada al costado",
  "felipe-acc2": "montura azul marino y cristales celeste transparentes",
  "felipe-acc3": "con forma de alas de mariposa celestes y azules",
  "felipe-acc4": "azul marino con franja roja, bolsillos y una gota celeste bordada",
  "felipe-acc5": "celeste con ondas de agua blancas",
  "felipe-acc6": "celeste que se oscurece hacia abajo con borde de ondas",
  "felipe-acc7": "azul marino con cantimplora celeste al costado",
  "felipe-acc8": "botas de lluvia celestes con suela azul marino",
  "felipe-acc9": "vendas celeste claro",
  "felipe-acc10": "celeste con una mariposa azul en el costado",
  "milagros-acc0": "verde refugio con hojas grandes saliendo al costado",
  "milagros-acc1": "verde césped con briznas de pasto hacia arriba",
  "milagros-acc2": "marrón tronco con vetas de madera",
  "milagros-acc3": "banda verde refugio con cristales oscuros",
  "milagros-acc4": "poncho corto sin mangas verde oscuro con hojas",
  "milagros-acc5": "jean con un parche de árbol",
  "milagros-acc6": "capa corta verde césped",
  "milagros-acc7": "marrón con textura de corteza",
  "milagros-acc8": "botas altas marrones por fuera del jean",
  "milagros-acc9": "zapatilla verde refugio con puntera verde césped, suela crema gruesa con borde de pasto (briznas verdes) y cordones blancos",
  "milagros-acc10": "balde verde con asa marrón",
  "jimmy-acc0": "gorro azul marino con ondas celestes",
  "jimmy-acc1": "chullo andino con orejeras y pompón, rayas celestes y blancas",
  "jimmy-acc2": "celeste translúcida",
  "jimmy-acc3": "cristales celestes, clip-on",
  "jimmy-acc4": "azul marino abierto adelante con una gota bordada",
  "jimmy-acc5": "ondas de río celestes sobre fondo azul marino",
  "jimmy-acc6": "celeste con ondas",
  "jimmy-acc7": "alforja arena con un remo pequeño cruzado",
  "jimmy-acc8": "botas de agua azul marino con borde blanco",
  "jimmy-acc9": "celeste con rayas blancas",
  "jimmy-acc10": "tapa azul con un río dibujado",
  "genesis-acc0": "corona verde oliva con un picaflor turquesa al frente",
  "genesis-acc1": "tocado con un chilalo (pajarito marrón rojizo) al costado entre ramitas",
  "genesis-acc2": "plumas marrones y turquesa",
  "genesis-acc3": "cristales verde oliva, clip-on",
  "genesis-acc4": "verde oliva con bolsillos y botones dorados",
  "genesis-acc5": "banda con plumas marrón rojizo",
  "genesis-acc6": "marrón corteza con hojas secas en el borde",
  "genesis-acc7": "mochila verde oliva con binoculares colgando",
  "genesis-acc8": "zapatilla de trekking verde oliva con puntera y suela marrón chilalo, cordones rojos y una plumita turquesa de picaflor al costado",
  "genesis-acc9": "vendas beige",
  "genesis-acc10": "rama retorcida con un picaflor turquesa posado arriba",
  "rihana-acc0": "vincha verde medicinal con hojitas de muña",
  "rihana-acc1": "corona turquesa con gotas de agua en las puntas",
  "rihana-acc2": "montura verde con dos ranitas en las esquinas",
  "rihana-acc3": "verde musgo con gotitas de agua",
  "rihana-acc4": "poncho corto sin mangas turquesa con peces dibujados",
  "rihana-acc5": "tortuga verde",
  "rihana-acc6": "capa corta turquesa con ondas",
  "rihana-acc7": "alforja de cuero negro con plantas medicinales asomando",
  "rihana-acc8": "botas de lluvia verde musgo",
  "rihana-acc9": "turquesa con borde blanco",
  "rihana-acc10": "turquesa con una hoja verde en el costado",
  "flordejesus-acc0": "corona de flores y frutos rojos (con toques dorados) que rodea la copa del sombrero de paja, por encima del ala",
  "flordejesus-acc1": "ramillete de hojas y frutos rojos para prender al costado del sombrero (solo el adorno, no un gorro)",
  "flordejesus-acc2": "pétalos amarillos radiantes alrededor de los ojos",
  "flordejesus-acc3": "cristales celeste cielo, clip-on",
  "flordejesus-acc4": "sobrevestido/pechera sin mangas verde azulado con frutos dorados, sin tapar la correa del bolso",
  "flordejesus-acc5": "árbol dorado",
  "flordejesus-acc6": "verde azulado con borde de hojas doradas",
  "flordejesus-acc7": "capa corta color paja con flores y frutos rojos",
  "flordejesus-acc8": "celestes con nubecitas blancas",
  "flordejesus-acc9": "zapatilla verde azulado con puntera y talón dorados, suela color paja y un fruto rojo con hojita en la lengüeta",
  "flordejesus-acc10": "balde dorado lleno de frutos rojos",
  "claudio-acc0": "corona dorada con una gema azul al frente",
  "claudio-acc1": "casco dorado con cresta arriba",
  "claudio-acc2": "dorado",
  "claudio-acc3": "cristales redondos dorados translúcidos, clip-on",
  "claudio-acc4": "dorado con ribete dorado oscuro",
  "claudio-acc5": "gota de agua dorada",
  "claudio-acc6": "capa larga dorada con ribete oscuro",
  "claudio-acc7": "capa blanca con rayos dorados",
  "claudio-acc8": "botas doradas con suela dorado oscuro",
  "claudio-acc9": "doradas con puntitos claros",
  "claudio-acc10": "vara dorada con una gota de cristal azul arriba",
};

// Huella del pie derecho de cada avatar (x y z, m), medida en su .glb a ras del
// piso. Lo de piernas se arma para ese pie y el visor lo espeja al izquierdo:
// si cruza x = 0 se superpone con el espejado (pasó con la primera zapatilla de
// Angie: 0.29 m de ancho sobre un pie de 0.21, las dos se veían como un bloque).
const FEET: Record<string, [number, number, number, number]> = {
  angie: [-0.208, 0.005, -0.11, 0.15],
  britney: [-0.209, -0.068, -0.05, 0.12],
  francheska: [-0.195, -0.01, -0.12, 0.16],
  dayra: [-0.167, -0.018, -0.1, 0.13],
  felipe: [-0.205, -0.011, -0.09, 0.2],
  milagros: [-0.211, -0.052, -0.08, 0.2],
  jimmy: [-0.185, -0.007, -0.11, 0.17],
  genesis: [-0.173, 0.005, -0.1, 0.15],
  rihana: [-0.229, -0.077, -0.1, 0.18],
  flordejesus: [-0.252, 0.002, -0.09, 0.16],
  claudio: [-0.206, -0.012, -0.08, 0.22],
};

// ---------- Armado ----------
const m = (v: number) => `${v.toFixed(2)} m`;
const cubes = (v: number) => Math.round(v / VOXEL);

function fit(acc: Accessory): string {
  const h = AVATAR_HEADS[acc.avatarId];
  if (!h) return "";
  if (acc.slot === "cabeza" && acc.avatarId === "flordejesus")
    return "Medidas: va sobre su sombrero de paja — copa cuadrada de 0.32 × 0.32 m entre 1.54 y 1.72 m de altura, ala de 0.54 m a 1.46–1.54 m.";
  if (acc.slot === "cabeza") return `Medidas: su cabeza + pelo ocupa ${m(h.w)} de ancho × ${m(h.d)} de fondo (de ${h.bottom} a ${h.top} m de altura); lo que la rodea tiene que tener esa medida POR DENTRO.`;
  if (acc.slot === "cara") return `Medidas: su cabeza mide ${m(h.w)} de ancho y el frente de la cara está en z = ${h.faceZ} m; la pieza se apoya ahí.`;
  const foot = FEET[acc.avatarId];
  if (acc.slot === "piernas" && foot) {
    const [x0, x1, z0, z1] = foot;
    const from = x0 - 0.025;
    const to = -0.005; // aunque el pie termine antes: margen para envolverlo también por dentro
    return `Medidas: su pie derecho ocupa de x = ${x0.toFixed(2)} a ${x1.toFixed(2)} y de z = ${z0.toFixed(2)} a ${z1.toFixed(2)} (largo ${m(z1 - z0)}); la pieza va ENTRE x = ${from.toFixed(3)} y x = ${to.toFixed(3)} (ancho máximo ${m(to - from)}) — NUNCA cruza x = 0, ahí está el otro pie y el visor lo espeja.`;
  }
  return "";
}

function prompt(acc: Accessory, av: AvatarBrief): string {
  const key = shapeKey(acc);
  const size = targetSize(acc);
  const warn = av.ojo?.[acc.slot];
  return [
    `Construye en voxel el accesorio «${acc.name}» para ${acc.avatarId === "claudio" ? "Joe" : AVATARS.find((a) => a.id === acc.avatarId)!.name}: ${SHAPE_HOW[key]}.`,
    `Diseño: ${MOTIFS[acc.id]}.`,
    `Colores: ${av.paleta.replace(/`/g, "")} (usá los que pidan el diseño).`,
    // Los ⚠️ son decisiones pendientes para el equipo, no instrucciones para Claude.
    warn && !warn.startsWith("⚠️") ? `Ojo: ${warn}.` : "",
    fit(acc),
    `Lado más largo: ${m(size)} (≈${cubes(size)} cubitos de ${VOXEL_CM} cm). Exporta \`${acc.id}.glb\`.`,
  ]
    .filter(Boolean)
    .join(" ");
}

const byAvatar = AVATARS.map((av) => ({ av, brief: AVATAR_BRIEFS[av.id], accs: AVATAR_ACCESSORIES[av.id] }));
for (const { av, brief, accs } of byAvatar) {
  if (!brief) throw new Error(`falta AVATAR_BRIEFS.${av.id}`);
  for (const a of accs) if (!MOTIFS[a.id]) throw new Error(`falta MOTIFS["${a.id}"]`);
}

const header = `# Accesorios 3D — Fichas de generación (121 piezas)

> Generado por \`pnpm modelos:prompts\` (scripts/gen-prompts-accesorios.ts). Si lo editás a mano, la próxima vez que se regenere se pierde: cambiá los datos en el script.

Forma y tamaño salen de \`src/data/models3dSpec.ts\`, la misma fuente que usa el pipeline: **la forma sigue al nombre** («Botas» son botas, «Lentes» son lentes).

## Cómo usar este archivo

1. Abrí una conversación con Claude y pegá una vez el **Brief para Claude** de abajo.
2. Por cada accesorio, pegá su **Prompt**. Claude devuelve un HTML con three.js que arma la pieza y la descarga como \`.glb\`.
3. Guardá el archivo con el nombre de la columna **Archivo** en \`avatares 3d/<avatar>/accesorios/\` (ej. \`avatares 3d/angie/accesorios/angie-acc0.glb\`). Ese nombre es lo que lo relaciona con el accesorio del juego.
4. \`pnpm modelos:check\` → \`pnpm modelos:procesar\` → revisar en \`/dev/calibrar-3d\` y afinar.

## Brief para Claude (pegar una vez al inicio)

\`\`\`
Vas a construir accesorios 3D para avatares voxel de un juego educativo (MorroWasi, Piura).
Por cada pedido, devolvé UN archivo HTML autocontenido que:
- Use three.js (import desde https://cdn.jsdelivr.net/npm/three@0.185/…) y construya la pieza SOLO con cubos
  (BoxGeometry) alineados a una grilla de ${VOXEL_CM} cm, sin biseles ni esferas: mismo estilo pixel-art 3D que los avatares.
- Fusione los cubos del mismo color en una sola malla (BufferGeometryUtils.mergeGeometries), con
  MeshStandardMaterial de color plano (roughness 0.8, metalness 0; lo dorado metalness 0.3, roughness 0.5).
  Máximo ~5 000 triángulos; si hace falta, menos cubitos antes que más triángulos.
- Unidades en METROS, Y hacia arriba, el FRENTE mira a +Z, la derecha del personaje es −X.
- Solo el accesorio: sin cuerpo, cabeza, pelo ni mano; sin luces, cámaras ni animación dentro del .glb.
- Piernas: UNA sola pieza para el pie/pierna DERECHO (x negativo), que nunca cruza x = 0 (el visor la
  espeja al izquierdo; si cruza, las dos se pisan). Cada pedido trae la franja de x permitida.
- Muestre la pieza con OrbitControls y un botón "Descargar" que exporte GLB binario con GLTFExporter
  ({ binary: true }) usando el nombre de archivo que te indico.
Medidas del avatar (${AVATAR_HEIGHT.toFixed(2)} m, proporción chibi): la CABEZA ES UN CUBO (con el pelo, entre 0.39 y
0.51 m de ancho según el avatar; cada pedido trae las medidas exactas), así que vinchas, coronas y
gorros son cuadrados con esquinas redondeadas, no círculos. Torso ≈0.42 ancho × 0.40 alto × 0.25 prof.
(centro a 1.00 m); pierna ≈0.13 m de ancho; mano derecha en x ≈ −0.33, y ≈ 0.71.
La escala final la ajusta el pipeline, pero respetá el "lado más largo" que te pido para que la cantidad de
cubitos quede pareja entre todas las piezas.
\`\`\`

## Zonas y formas

| Zona | Forma | Lado más largo | Cómo se construye |
|---|---|---|---|
${Object.entries(SHAPE_SPECS)
  .map(([k, s]) => `| ${k.split(":")[0]} | ${s.label} | ${m(s.size)} | ${SHAPE_HOW[k].replace(/\*\*/g, "")} |`)
  .join("\n")}

Los accesorios **solo se ven con el modelo normal** del avatar (con la Skin Especial puesta se ocultan), por eso cada ficha los adapta a lo que el avatar normal ya trae puesto.

**Angie y Britney ya llevan mochila** en su modelo normal: sus piezas de espalda son agregados para esa mochila (manto enrollado arriba, funda, colgante al costado), no una segunda mochila.

---
`;

function headLine(id: string): string {
  const h = AVATAR_HEADS[id];
  const base = `${m(h.w)} × ${m(h.d)}, de ${h.bottom} a ${h.top} m de altura, cara al frente en z = ${h.faceZ} m`;
  return id === "flordejesus" ? `${base}; encima, sombrero de paja (ala 0.54 m, copa 0.32 m hasta 1.72 m)` : base;
}

const sections = byAvatar.map(({ av, brief, accs }) => {
  const name = av.id === "claudio" ? "Joe" : av.name;
  const warnings = Object.entries(brief.ojo || {})
    .map(([slot, w]) => `- **${SLOT_LABELS[slot as Accessory["slot"]]}:** ${w}`)
    .join("\n");
  const rows = accs
    .map((a) => {
      const key = shapeKey(a);
      return `| \`${a.id}.glb\` | ${a.name} | ${SLOT_LABELS[a.slot]} · ${SHAPE_SPECS[key].label} | ${m(targetSize(a))} | ${prompt(a, brief).replace(/\|/g, "/")} |`;
    })
    .join("\n");
  return `## ${name} — ${brief.etapa}

**Ya trae puesto (modelo normal):** ${brief.tiene}.
**Paleta:** ${brief.paleta}.
**Cabeza + pelo:** ${headLine(av.id)}.
${warnings ? `\n**Cuidado con:**\n${warnings}\n` : ""}
| Archivo | Nombre | Zona · forma | Tamaño | Prompt |
|---|---|---|---|---|
${rows}
`;
});

writeFileSync(OUT, header + "\n" + sections.join("\n---\n\n"));
console.log(`✓ ${accs121()} fichas → ${OUT}`);

function accs121() {
  return byAvatar.reduce((n, x) => n + x.accs.length, 0);
}
