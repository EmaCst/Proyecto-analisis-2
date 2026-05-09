import OpenAI from "openai";
import db from '../models/index.js';
import { Op } from "sequelize";

const { stickers, productos, colores, tallas, inventarios } = db;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const evaluarConIA = async (mensajeUsuario, historial) => {
  try {
    const mensajeLimpio = mensajeUsuario.toLowerCase().replace(/[?¿!¡.,=]/g, " ").trim();
    const esSaludo = ["hola", "buenos dias", "buenas tardes", "hey", "que tal", "saludos"].includes(mensajeLimpio);

    const ruido = ["puedes", "mandar", "que", "zapatos", "tienes", "ver", "quiero", "busca", "para", "unos", "tengas", "algun", "modelo", "marca", "de", "la", "en", "con", "por", "del", "par"];
    const palabrasClave = mensajeLimpio.split(" ").filter(p => p.length >= 3 && !ruido.includes(p)); 

    let colorIdEncontrado = null;
    let tallaIdEncontrada = null;

    // 1. Identificación de filtros técnicos
    for (const palabra of palabrasClave) {
      const colorMatch = await colores.findOne({ where: { nombre: { [Op.iLike]: palabra } } });
      if (colorMatch) colorIdEncontrado = colorMatch.id;
      
      const tallaMatch = await tallas.findOne({ where: { numero: palabra } });
      if (tallaMatch) tallaIdEncontrada = tallaMatch.id;
    }

    let productosEncontrados = [];
    if (!esSaludo || palabrasClave.length > 0) {
      const condicionesAnd = [];
      
      // 🔥 LA SOLUCIÓN: Buscar en NOMBRE o en MARCA
      if (palabrasClave.length > 0) {
        condicionesAnd.push({
          [Op.or]: palabrasClave.flatMap(p => [
            { nombre: { [Op.iLike]: `%${p}%` } },
            { marca: { [Op.iLike]: `%${p}%` } } // Ahora busca Roy aquí también
          ])
        });
      }

      // Filtros de inventario
      if (colorIdEncontrado) {
        condicionesAnd.push({
          id: { [Op.in]: db.sequelize.literal(`(SELECT "productoId" FROM "inventarios" WHERE "colorId" = ${colorIdEncontrado})`) }
        });
      }
      if (tallaIdEncontrada) {
        condicionesAnd.push({
          id: { [Op.in]: db.sequelize.literal(`(SELECT "productoId" FROM "inventarios" WHERE "tallaId" = ${tallaIdEncontrada})`) }
        });
      }

      productosEncontrados = await productos.findAll({
        where: { [Op.and]: condicionesAnd },
        include: [{ 
          model: inventarios, 
          include: [{ model: colores }, { model: tallas }]
        }],
        distinct: true
      });
    }

    // --- Lógica de Stickers ---
    const listaDeStickers = await stickers.findAll();
    const catalogoStickers = listaDeStickers.map(s => `- "${s.emocion}": ${s.url}`).join("\n");

    let contextoExtra = "";
    if (productosEncontrados.length > 0) {
      const datosParaIA = productosEncontrados.map(p => {
        let invFiltrado = p.inventarios;
        if (colorIdEncontrado) invFiltrado = invFiltrado.filter(i => i.colorId === colorIdEncontrado);
        if (tallaIdEncontrada) invFiltrado = invFiltrado.filter(i => i.tallaId === tallaIdEncontrada);

        const misColores = [...new Set(invFiltrado.map(i => i.colore?.nombre || i.color?.nombre))].filter(Boolean).join(", ");
        const misTallas = [...new Set(invFiltrado.map(i => i.talla?.numero))].filter(Boolean).sort((a,b) => a-b).join(", ");
        const linkDetalle = `https://zona404shoes.vercel.app/producto/${p.id}`;
        
        return `[BLOQUE] [![${p.nombre}](${p.imagenUrl})](${linkDetalle}) \n**${p.nombre}** (${p.marca})\nPrecio: Q.${p.precio}\nColores: ${misColores}\nTallas: ${misTallas} [/BLOQUE]`;
      }).filter(d => d.includes("Precio:"));

      contextoExtra = `\n\n[INVENTARIO REAL]:\n${datosParaIA.join("\n\n")}`;
    } else {
      contextoExtra = `\n\n[SISTEMA]: No hay stock para "${mensajeUsuario}".`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres Glitch 🐺. Responde en 3 burbujas (|||). En la 3ra, COPIA el contenido de los [BLOQUE] tal cual, sin agregar links de texto extra." },
        ...historial.map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.contenido })),
        { role: "user", content: mensajeUsuario + contextoExtra }
      ],
      temperature: 0,
    });

    return response.choices[0].message.content.replace(/\[\/?BLOQUE\]/g, "").trim();

  } catch (error) {
    return "![Sticker](...) ||| Error en la búsqueda. 🐺";
  }
};