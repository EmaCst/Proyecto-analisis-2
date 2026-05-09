import OpenAI from "openai";
import db from '../models/index.js';
import { Op } from "sequelize";

const { stickers, productos, colores, tallas, inventarios } = db;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const evaluarConIA = async (mensajeUsuario, historial) => {
  try {
    const mensajeLimpio = mensajeUsuario.toLowerCase().replace(/[?¿!¡.,=]/g, " ").trim();
    const esSaludo = ["hola", "buenos dias", "buenas tardes", "hey", "que tal", "saludos"].includes(mensajeLimpio);

    const ruido = ["puedes", "mandar", "que", "zapatos", "tienes", "ver", "quiero", "busca", "para", "unos", "tengas", "algun", "modelo"];
    const palabrasClave = mensajeLimpio.split(" ").filter(p => p.length >= 2 && !ruido.includes(p)); 

    let colorIdEncontrado = null;
    let tallaIdEncontrada = null;
    let productosEncontrados = [];

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
            ...(palabrasClave.map(p => ({ nombre: { [Op.iLike]: `%${p}%` } }))),
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

    if (productosEncontrados.length > 0) {
      const datosParaIA = productosEncontrados.map(p => {
        let invFiltrado = p.inventarios;
        if (colorIdEncontrado) invFiltrado = invFiltrado.filter(i => i.colorId === colorIdEncontrado);
        if (tallaIdEncontrada) invFiltrado = invFiltrado.filter(i => i.tallaId === tallaIdEncontrada);

        const misColores = [...new Set(invFiltrado.map(i => i.colore?.nombre || i.color?.nombre))].filter(Boolean).join(", ");
        const misTallas = [...new Set(invFiltrado.map(i => i.talla?.numero))].filter(Boolean).sort((a,b) => a-b).join(", ");
        const linkDetalle = `https://zona404shoes.vercel.app/producto/${p.id}`;
        
        // 🔥 CAMBIO CLAVE: Entregamos el bloque ya formateado para que la IA solo lo copie
        return `[![${p.nombre}](${p.imagenUrl})](${linkDetalle}) \n**${p.nombre}**\nPrecio: Q.${p.precio}\nColores: ${misColores}\nTallas: ${misTallas}`;
      }).filter(d => d.includes("Precio: Q."));

      contextoExtra = `\n\n[INVENTARIO ENCONTRADO - COPIA ESTE FORMATO EXACTO]:\n${datosParaIA.join("\n\n")}`;
    } else if (esSaludo && palabrasClave.length === 0) {
      contextoExtra = `\n\n[SISTEMA]: El usuario saludó. Responde amable y ofrece ayuda.`;
    } else {
      contextoExtra = `\n\n[SISTEMA]: No hay stock. NO inventes productos.`;
    }

    const messages = [
      { 
        role: "system", 
        content: `Eres Glitch, asistente de "Zona 404 Shoes" 🐺.
        
        STICKERS:
        ${catalogoStickers}

        REGLAS DE ORO (PROHIBIDO FALLAR):
        1. Responde SIEMPRE en 3 burbujas separadas por "|||".
        2. BURBUJA 3: Usa ÚNICAMENTE el formato de inventario que te pasé.
        3. ❌ PROHIBIDO: No añadidas enlaces de texto como "[Ver más]" o "[Ver detalles]" al final. El link ya está dentro de la imagen.
        4. Si no hay productos, la burbuja 3 debe ofrecer ayuda o sugerir otra búsqueda.`
      },
      ...historial.map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.contenido })),
      { role: "user", content: mensajeUsuario + contextoExtra }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.2, // Bajamos a 0.2 para que sea más obediente con el formato
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return "![Sticker](https://github.com/Esteban-can/Sticker_Glitch/blob/main/Sticker_3.png?raw=true) ||| Hubo un error en mi olfato. 🐺";
  }
};