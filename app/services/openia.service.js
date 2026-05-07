import OpenAI from "openai";
import db from '../models/index.js';
import { Op } from "sequelize";

const { stickers, productos, colores, tallas, inventarios } = db;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const evaluarConIA = async (mensajeUsuario, historial) => {
  try {
    const mensajeLimpio = mensajeUsuario.toLowerCase().replace(/[?¿!¡.,]/g, "").trim();
    
    // 1. Detección de saludo
    const esSaludo = ["hola", "buenos dias", "buenas tardes", "hey", "que tal", "saludos"].includes(mensajeLimpio);

    const ruido = ["hola", "puedes", "mandar", "que", "zapatos", "tienes", "color", "ver", "quiero", "busca", "para", "unos", "talla", "tengas", "algun", "modelo"];
    const palabrasClave = mensajeLimpio.split(" ").filter(p => p.length >= 1 && !ruido.includes(p)); 

    let colorIdEncontrado = null;
    let tallaIdEncontrada = null;
    let productosEncontrados = [];

    // 2. Búsqueda en Base de Datos (Mantenemos filtros de color y talla)
    if (!esSaludo || palabrasClave.length > 0) {
      for (const palabra of palabrasClave) {
        if (!colorIdEncontrado) {
          const colorMatch = await colores.findOne({ where: { nombre: { [Op.iLike]: `%${palabra}%` } } });
          if (colorMatch) colorIdEncontrado = colorMatch.id;
        }
        if (!tallaIdEncontrada) {
          const tallaMatch = await tallas.findOne({ where: { numero: palabra } });
          if (tallaMatch) tallaIdEncontrada = tallaMatch.id;
        }
      }

      productosEncontrados = await productos.findAll({
        where: {
          [Op.or]: [
            ...(palabrasClave.length > 0 ? palabrasClave.map(p => ({ nombre: { [Op.iLike]: `%${p}%` } })) : []),
            colorIdEncontrado ? { '$inventarios.colorId$': colorIdEncontrado } : null,
            tallaIdEncontrada ? { '$inventarios.tallaId$': tallaIdEncontrada } : null
          ].filter(Boolean)
        },
        include: [{ 
          model: inventarios, 
          required: (colorIdEncontrado || tallaIdEncontrada) ? true : false,
          include: [{ model: colores }, { model: tallas }]
        }],
        distinct: true
      });
    }

    const listaDeStickers = await stickers.findAll();
    const catalogoStickers = listaDeStickers.map(s => `- "${s.emocion}": ${s.url}`).join("\n");

    let contextoExtra = "";

    // 3. Reconstrucción del contexto filtrando por lo que el usuario pidió
    if (productosEncontrados.length > 0) {
      const datosParaIA = productosEncontrados.map(p => {
        // 🔥 FILTRO CRÍTICO: Si el usuario pidió un color o talla, solo mostramos eso en el mensaje
        let invFiltrado = p.inventarios;
        if (colorIdEncontrado) invFiltrado = invFiltrado.filter(i => i.colorId === colorIdEncontrado);
        if (tallaIdEncontrada) invFiltrado = invFiltrado.filter(i => i.tallaId === tallaIdEncontrada);

        const misColores = [...new Set(invFiltrado.map(i => i.colore?.nombre || i.color?.nombre))].filter(Boolean).join(", ");
        const misTallas = [...new Set(invFiltrado.map(i => i.talla?.numero))].filter(Boolean).sort((a,b) => a-b).join(", ");
        const linkDetalle = `https://zona404shoes.vercel.app/producto/${p.id}`;
        
        return `PRODUCTO: ${p.nombre} | PRECIO: Q.${p.precio} | COLORES: ${misColores} | TALLAS: ${misTallas} | LINK: ${linkDetalle} | FOTO: ${p.imagenUrl}`;
      }).filter(d => !d.includes("COLORES:  | TALLAS: ")); // Filtra si quedó vacío por el cruce

      contextoExtra = `\n\n[INVENTARIO REAL DISPONIBLE]:\n${datosParaIA.join("\n")}`;
    } else if (esSaludo && palabrasClave.length === 0) {
      contextoExtra = `\n\n[SISTEMA]: El usuario está saludando. Responde amablemente y ofrece ayuda.`;
    } else {
      contextoExtra = `\n\n[SISTEMA]: No hay stock para los filtros aplicados. Sugiere otros colores o tallas.`;
    }

    const messages = [
      { 
        role: "system", 
        content: `Eres Glitch, el asistente de "Zona 404 Shoes" 🐺.
        
        STICKERS DISPONIBLES:
        ${catalogoStickers}

        REGLAS DE FORMATO (Obligatorio 3 burbujas separadas por |||):
        Burbuja 1: Sticker ![Sticker](URL)
        |||
        Burbuja 2: Mensaje de texto amigable.
        |||
        Burbuja 3: Lista de productos con su foto arriba. 
        Si el usuario pidió un color o talla específica, solo muestra la información que coincida con lo que el sistema te pasó en el inventario.

        IMPORTANTE: No uses listas con guiones. Pon la foto siempre antes del nombre del zapato.`
      },
      ...historial.map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.contenido })),
      { role: "user", content: mensajeUsuario + contextoExtra }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.5,
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return "![Sticker](https://github.com/Esteban-can/Sticker_Glitch/blob/main/Sticker_3.png?raw=true) ||| Hubo un error en mi sistema. 🐺";
  }
};