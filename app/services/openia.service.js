// ==========================================
// openia.service.js
// ==========================================

import OpenAI from "openai";
import { Op } from "sequelize";

// ==========================================
// IMPORT MODELS
// ==========================================

import pkg from "../models/index.js";

const db = pkg.default || pkg;

const {
  productos,
  inventarios,
  colores,
  tallas,
  stickers
} = db;

// ==========================================
// OPENAI
// ==========================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

export const evaluarConIA = async (
  mensajeUsuario,
  historial
) => {

  try {

    // ==========================================
    // LIMPIAR MENSAJE
    // ==========================================

    const mensajeLimpio =
      mensajeUsuario
        .toLowerCase()
        .replace(/[?¿!¡.,]/g, "")
        .trim();

    // ==========================================
    // CONVERSACIONES CASUALES
    // ==========================================

    const conversacionesCasuales = [
      "hola",
      "holi",
      "holaa",
      "buenos dias",
      "buen dia",
      "buenas tardes",
      "buenas noches",
      "hey",
      "ey",
      "que tal",
      "q tal",
      "saludos",
      "como estas",
      "como andas",
      "como te va",
      "todo bien",
      "todo good",
      "que haces",
      "que onda",
      "gracias",
      "muchas gracias",
      "thanks",
      "ok",
      "oka",
      "vale",
      "perfecto",
      "dale",
      "esta bien",
      "listo",
        "algo",
  "alguna",
  "alguno",
  "algunos",
  "algunas",
  "quiero",
  "busco",
  "buscar",
  "marca",
  "producto",
  "productos",
  "zapato",
  "zapatos",
  "tenis",
  "ropa",
  "camisa",
  "camiseta",
  "unos",
  "unas",
  "un",
  "una",
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "en"
    ];

    const esConversacionCasual =
      conversacionesCasuales.some(frase =>
        mensajeLimpio.includes(frase)
      );

      

    // ==========================================
    // PALABRAS BASURA
    // ==========================================

    const ruido = [
      "hola",
      "par",
      "pares",
      "puedes",
      "mandar",
      "que",
      "zapatos",
      "tenis",
      "tienes",
      "color",
      "colores",
      "ver",
      "quiero",
      "busca",
      "para",
      "unos",
      "unas",
      "talla",
      "tengas",
      "algun",
      "modelo",
      "de",
      "los",
      "las",
      "un",
      "una",
      "me",
      "muestras",
      "mostrar",
      "ensena",
      "hay",
      "con",
        "algo",
  "alguna",
  "alguno",
  "algunos",
  "algunas",
  "quiero",
  "busco",
  "buscar",
  "marca",
  "producto",
  "productos",
  "zapato",
  "zapatos",
  "tenis",
  "ropa",
  "camisa",
  "camiseta",
  "unos",
  "unas",
  "un",
  "una",
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "en",
  "dar", 
  "pueda", 
  "info"
    ];

    // ==========================================
    // KEYWORDS
    // ==========================================

// ==========================================
    // DEBUG: Ver qué llega exactamente
    console.log("📥 MENSAJE ORIGINAL:", mensajeLimpio);

    const palabrasClave = mensajeLimpio
      .split(/\s+/)
      .filter(palabra => palabra.length > 0); // Primero agarramos TODO

      const conectores = ["de", "del", "la", "el", "los", "las", "en", "un", "una", "y"];
      const palabrasFiltradas = palabrasClave.filter(p => !conectores.includes(p.toLowerCase()));

    console.log("🔍 TODAS LAS PALABRAS:", palabrasClave);

    // ==========================================
    // IDS ENCONTRADOS
    let colorIdEncontrado = null;
    let tallaIdEncontrada = null;
    const palabrasBusquedaProducto = [];

    // ==========================================
    // PROCESAR
    for (const palabraOriginal of palabrasClave) {
      // Ignorar palabras de ruido manualmente aquí para ver qué pasa
      if (ruido.includes(palabraOriginal.toLowerCase()) && palabraOriginal.length > 3) {
          continue; 
      }

      const esNumero = !isNaN(palabraOriginal);
      let encontrada = false;

      // 1. BUSCAR TALLA (Si es número o tiene 2-3 dígitos)
      if (!tallaIdEncontrada && (esNumero || palabraOriginal.length <= 3)) {
        const tallaMatch = await tallas.findOne({
          where: { numero: palabraOriginal }
        });
        if (tallaMatch) {
          tallaIdEncontrada = tallaMatch.id;
          encontrada = true;
          console.log("📏 TALLA DETECTADA:", tallaMatch.numero);
        }
      }

// 1. FILTRO DE RUIDO (Agregamos esto para que "pueda", "ver", etc., no lleguen abajo)
    const pBaja = palabraOriginal.toLowerCase();
    const excluir = ["que", "pueda", "ver", "tienes", "info", "dar"]; 

    if (ruido.includes(pBaja) || excluir.includes(pBaja) || pBaja.length <= 2) {
      console.log(`🚫 RUIDO DETECTADO: ${pBaja}`);
      encontrada = true; // <--- Bloqueamos la palabra para que no pase a Color ni a Producto
    }

    // 2. BUSCAR COLOR (Tu lógica original intacta)
    if (!encontrada && !colorIdEncontrado && !esNumero) {
      let pColor = palabraOriginal.toLowerCase();
      if (pColor.length > 4) {
        if (pColor.endsWith("es")) pColor = pColor.slice(0, -2);
        else if (pColor.endsWith("s")) pColor = pColor.slice(0, -1);
      }

      const colorMatch = await colores.findOne({
        where: { nombre: { [Op.iLike]: `%${pColor}%` } }
      });

      if (colorMatch) {
        colorIdEncontrado = colorMatch.id;
        encontrada = true;
        console.log("🎨 COLOR DETECTADO:", colorMatch.nombre);
      }
    }

    // 3. SI NO ES NADA, VA A PRODUCTO
    // (Ahora "pueda" no entrará aquí porque arriba pusimos encontrada = true)
    if (!encontrada) {
      palabrasBusquedaProducto.push(palabraOriginal);
    }
    }

    console.log("✅ RESULTADO FILTROS -> Keywords:", palabrasBusquedaProducto, "Color:", colorIdEncontrado, "Talla:", tallaIdEncontrada);

    // ==========================================
    // DEBUG
    // ==========================================

    console.log(
      "📝 Keywords Producto:",
      palabrasBusquedaProducto
    );

    console.log(
      "🎨 Color ID:",
      colorIdEncontrado
    );

    console.log(
      "📏 Talla ID:",
      tallaIdEncontrada
    );

    // ==========================================
    // CONDICIONES
    // ==========================================

    const condiciones = [];

    // ==========================================
    // BÚSQUEDA FLEXIBLE PRODUCTOS
    // ==========================================

if (palabrasBusquedaProducto.length > 0) {
  // Unimos las palabras que quedaron para buscar la frase completa
  const fraseBusqueda = palabrasBusquedaProducto.join(" ");

  condiciones.push({
    [Op.or]: [
      { nombre: { [Op.iLike]: `%${fraseBusqueda}%` } },
      { modelo: { [Op.iLike]: `%${fraseBusqueda}%` } },
      { marca: { [Op.iLike]: `%${fraseBusqueda}%` } },
      // Por si acaso el usuario puso las palabras en otro orden,
      // mantenemos el filtro individual pero como un AND (más estricto)
      {
        [Op.and]: palabrasBusquedaProducto.map(p => ({
          nombre: { [Op.iLike]: `%${p}%` }
        }))
      }
    ]
  });
}

    // ==========================================
    // FILTRO COLOR
    // ==========================================

    if (colorIdEncontrado) {

      condiciones.push({

        "$inventarios.colorId$":
          colorIdEncontrado
      });
    }

    // ==========================================
    // FILTRO TALLA
    // ==========================================

    if (tallaIdEncontrada) {

      condiciones.push({

        "$inventarios.tallaId$":
          tallaIdEncontrada
      });
    }

    // ==========================================
    // BUSCAR PRODUCTOS
    // ==========================================

    let productosEncontrados = [];

    if (
      !esConversacionCasual ||
      palabrasClave.length > 0
    ) {

      productosEncontrados =
        await productos.findAll({

          where:

            condiciones.length > 0

              ? {
                  [Op.and]:
                    condiciones
                }

              : {},

          include: [

            {
              model: inventarios,

              required:
                !!(
                  colorIdEncontrado ||
                  tallaIdEncontrada
                ),

              include: [

                {
                  model: colores,
                  as: "color"
                },

                {
                  model: tallas,
                  as: "talla"
                }
              ]
            }
          ],

          distinct: true
        });
    }

    // ==========================================
    // DEBUG
    // ==========================================

    console.log(
      "👟 PRODUCTOS:",
      productosEncontrados.length
    );

    // ==========================================
    // STICKERS
    // ==========================================

    const listaDeStickers =
      await stickers.findAll();

    const catalogoStickers =
      listaDeStickers
        .map(
          sticker =>

            `- "${sticker.emocion}": ${sticker.url}`
        )
        .join("\n");

    // ==========================================
    // CONTEXTO
    // ==========================================

    let contextoExtra = "";

    // ==========================================
    // PRODUCTOS ENCONTRADOS
    // ==========================================

    if (
      productosEncontrados.length > 0
    ) {

      const datosParaIA =
        productosEncontrados

          .map(producto => {

            let inventarioFiltrado =
              producto.inventarios || [];

            // ==========================================
            // FILTRAR COLOR
            // ==========================================

            if (colorIdEncontrado) {

              inventarioFiltrado =
                inventarioFiltrado.filter(

                  inventario =>

                    inventario.colorId ===
                    colorIdEncontrado
                );
            }

            // ==========================================
            // FILTRAR TALLA
            // ==========================================

            if (tallaIdEncontrada) {

              inventarioFiltrado =
                inventarioFiltrado.filter(

                  inventario =>

                    inventario.tallaId ===
                    tallaIdEncontrada
                );
            }

            // ==========================================
            // SI NO HAY INVENTARIO
            // ==========================================

            if (
              inventarioFiltrado.length === 0 &&
              (
                colorIdEncontrado ||
                tallaIdEncontrada
              )
            ) {

              return null;
            }

            // ==========================================
            // COLORES
            // ==========================================

            const coloresDisponibles =

              [
                ...new Set(

                  inventarioFiltrado.map(

                    inventario =>

                      inventario.color?.nombre
                  )
                )
              ]

                .filter(Boolean)

                .join(", ");

            // ==========================================
            // TALLAS
            // ==========================================

            const tallasDisponibles =

              [
                ...new Set(

                  inventarioFiltrado.map(

                    inventario =>

                      inventario.talla?.numero
                  )
                )
              ]

                .filter(Boolean)

                .sort(
                  (a, b) => a - b
                )

                .join(", ");

            const linkDetalle =
              `https://zona404shoes.vercel.app/producto/${producto.id}`;

            return `

PRODUCTO: ${producto.nombre}

PRECIO: Q.${producto.precio}

COLORES: ${coloresDisponibles || "No especificados"}

TALLAS: ${tallasDisponibles || "No especificadas"}

LINK: ${linkDetalle}

FOTO: ${producto.imagenUrl}

`;
          })

          .filter(Boolean);

      // ==========================================
      // RESPUESTA INVENTARIO
      // ==========================================

      if (datosParaIA.length > 0) {

        contextoExtra = `

[INVENTARIO REAL DISPONIBLE]:

${datosParaIA.join("\n")}

`;

      } else {

        contextoExtra = `

[SISTEMA]:

No hay stock exacto para esos filtros.

Sugiere alternativas similares.

`;
      }

    }

    // ==========================================
    // CONVERSACIÓN CASUAL
    // ==========================================

    else if (
      esConversacionCasual &&
      palabrasClave.length === 0
    ) {

      contextoExtra = `

[SISTEMA]:

El usuario está teniendo una conversación casual.

NO recomiendes productos.
NO hables de inventario.
NO sugieras zapatos.

Responde únicamente de forma amigable.

`;

    }

    // ==========================================
    // SIN PRODUCTOS
    // ==========================================

    else {

      contextoExtra = `

[SISTEMA]:

No se encontraron productos.

Sugiere productos similares.

`;
    }

    // ==========================================
    // MENSAJES IA
    // ==========================================

    const messages = [

      {
        role: "system",

        content: `

Eres Glitch, el asistente de "Zona 404 Shoes" 🐺.

STICKERS DISPONIBLES:

${catalogoStickers}

REGLAS:

1. EXACTAMENTE 3 burbujas separadas por |||

2. FORMATO:

Burbuja 1:
Sticker

![Sticker](URL)

|||

Burbuja 2:
Mensaje cool.

|||

Burbuja 3:
Productos.

FORMATO PRODUCTO:

![Zapato](URL)

**Nombre**

💰 Precio

🎨 Colores

📏 Tallas

🔗 Link

IMPORTANTE:

- Foto primero
- NO usar listas con guiones
- SOLO mostrar datos enviados
- Si no hay stock sugerir alternativas
- Si es conversación casual:
  NO mostrar productos
  NO recomendar zapatos
`
      },

      ...historial.map(msg => ({

        role:

          msg.role === "assistant"
            ? "assistant"
            : "user",

        content:
          msg.contenido
      })),

      {
        role: "user",

        content:
          mensajeUsuario +
          contextoExtra
      }
    ];

    // ==========================================
    // OPENAI
    // ==========================================

    const response =
      await openai.chat.completions.create({

        model: "gpt-4o-mini",

        messages,

        temperature: 0.5
      });

    // ==========================================
    // RETORNO
    // ==========================================

    return response
      .choices[0]
      .message
      .content;

  } catch (error) {

    console.error(
      "❌ ERROR:",
      error
    );

    return `

![Sticker](https://github.com/Esteban-can/Sticker_Glitch/blob/main/Sticker_3.png?raw=true)

|||

Hubo un error en mi sistema 🐺

|||

Intenta nuevamente.

`;
  }
};