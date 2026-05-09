import OpenAI from "openai";
import db from '../models/index.js';
import { Op } from "sequelize";

const { stickers, productos, colores, tallas, inventarios } = db;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const evaluarConIA = async (mensajeUsuario, historial) => {
  try {
    const mensajeLimpio = mensajeUsuario.toLowerCase().replace(/[?¿!¡.,=]/g, " ").trim();
    const esSaludo = ["hola", "buenos dias", "buenas tardes", "hey", "que tal", "saludos"].includes(mensajeLimpio);

    const ruido = ["puedes", "mandar", "que", "zapatos", "tienes", "ver", "quiero", "busca", "para", "unos", "tengas", "algun", "modelo", "marca", "de", "la"];
    const palabrasClave = mensajeLimpio.split(" ").filter(p => p.length >= 2 && !ruido.includes(p)); 

    let colorIdEncontrado = null;
    let tallaIdEncontrada = null;

    // 1. Identificación de criterios
    if (palabrasClave.length > 0) {
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
    }

    // 2. Búsqueda con filtros combinados (AND para color/talla, OR para nombre)
    let productosEncontrados = [];
    if (!esSaludo || palabrasClave.length > 0) {
      const condiciones = [];
      
      // Si hay palabras que no son color/talla, buscamos por nombre
      if (palabrasClave.length > 0) {
        condiciones.push({
          [Op.or]: palabrasClave.map(p => ({ nombre: { [Op.iLike]: `%${p}%` } }))
        });
      }

      // 🔥 Filtros estrictos de Inventario
      if (colorIdEncontrado) condiciones.push({ '$inventarios.colorId$': colorIdEncontrado });
      if (tallaIdEncontrada) condiciones.push({ '$inventarios.tallaId$': tallaIdEncontrada });

      productosEncontrados = await productos.findAll({
        where: { [Op.and]: condiciones }, // Aquí forzamos que se cumpla TODO
        include: [{ 
          model: inventarios, 
          required: true, // Si hay filtros, el inventario debe existir
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
        // Filtrado final del inventario para mostrar solo lo que el usuario pidió
        let invFiltrado = p.inventarios;
        if (colorIdEncontrado) invFiltrado = invFiltrado.filter(i => i.colorId === colorIdEncontrado);
        if (tallaIdEncontrada) invFiltrado = invFiltrado.filter(i => i.tallaId === tallaIdEncontrada);

        const misColores = [...new Set(invFiltrado.map(i => i.colore?.nombre || i.color?.nombre))].filter(Boolean).join(", ");
        const misTallas = [...new Set(invFiltrado.map(i => i.talla?.numero))].filter(Boolean).sort((a,b) => a-b).join(", ");
        const linkDetalle = `https://zona404shoes.vercel.app/producto/${p.id}`;
        
        return `[![${p.nombre}](${p.imagenUrl})](${linkDetalle}) \n**${p.nombre}**\nPrecio: Q.${p.precio}\nColores: ${misColores}\nTallas: ${misTallas}`;
      }).filter(d => !d.includes("Colores:  | Tallas: "));

      contextoExtra = `\n\n[INVENTARIO FILTRADO]:\n${datosParaIA.join("\n\n")}`;
    } else {
      contextoExtra = `\n\n[SISTEMA]: No se encontraron productos con esos filtros exactos.`;
    }

    const messages = [
      { 
        role: "system", 
        content: `Eres Glitch, asistente de "Zona 404 Shoes" 🐺.
        STICKERS: ${catalogoStickers}
        REGLAS:
        1. 3 burbujas separadas por "|||".
        2. NO repitas links de texto. Usa [![alt](img)](link).
        3. Si el usuario pide un color y talla específicos, confírmale que los tenemos.`
      },
      ...historial.map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.contenido })),
      { role: "user", content: mensajeUsuario + contextoExtra }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.2,
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return "![Sticker](...) ||| Error de sistema. 🐺";
  }
};