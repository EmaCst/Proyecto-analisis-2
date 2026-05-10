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
  "en"
    ];

    // ==========================================
    // KEYWORDS
    // ==========================================

    const palabrasClave =
      mensajeLimpio
        .split(" ")
        .filter(
          palabra =>
            palabra.length >= 2 &&
            !ruido.includes(palabra)
        );

    // ==========================================
    // IDS ENCONTRADOS
    // ==========================================

    let colorIdEncontrado = null;
    let tallaIdEncontrada = null;

    // ==========================================
    // PALABRAS PARA PRODUCTOS
    // ==========================================

    const palabrasBusquedaProducto = [];

    // ==========================================
    // BUSCAR COLOR Y TALLA
    // ==========================================

    for (const palabraOriginal of palabrasClave) {

      // ==========================================
      // NORMALIZAR
      // ==========================================

      const palabra =
        palabraOriginal.endsWith("es")
          ? palabraOriginal.slice(0, -2)
          : palabraOriginal.endsWith("s")
            ? palabraOriginal.slice(0, -1)
            : palabraOriginal;

      let encontrada = false;

      // ==========================================
      // BUSCAR COLOR
      // ==========================================

      if (!colorIdEncontrado && palabra.length >= 4) {

    const colorMatch =
      await colores.findOne({

        where: {
          nombre: {
            [Op.iLike]: `%${palabra}%`
          }
        }

      });

    if (colorMatch) {

      colorIdEncontrado =
        colorMatch.id;

      encontrada = true;

      console.log(
        "🎨 COLOR:",
        colorMatch.nombre
      );
    }
}
      // ==========================================
      // BUSCAR TALLA
      // ==========================================

      if (!tallaIdEncontrada) {

        const tallaMatch =
          await tallas.findOne({

            where: {
              numero: palabra
            }
          });

        if (tallaMatch) {

          tallaIdEncontrada =
            tallaMatch.id;

          encontrada = true;

          console.log(
            "📏 TALLA:",
            tallaMatch.numero
          );
        }
      }

      // ==========================================
      // SI NO ERA COLOR NI TALLA
      // ==========================================

      if (!encontrada) {

        palabrasBusquedaProducto.push(
          palabra
        );
      }
    }

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

  condiciones.push({

    [Op.or]:

      palabrasBusquedaProducto.flatMap(
        palabra => ([
          {
            nombre: {
              [Op.iLike]: `%${palabra}%`
            }
          },
          {
            marca: {
              [Op.iLike]: `%${palabra}%`
            }
          },
          {
            modelo: {
              [Op.iLike]: `%${palabra}%`
            }
          }
        ])
      )
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