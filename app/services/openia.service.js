import OpenAI from "openai";
import db from '../models/index.js';
import { Op } from "sequelize";

const { stickers, productos, colores, tallas, inventarios } = db;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const evaluarConIA = async (mensajeUsuario, historial) => {
  try {
    const mensajeLimpio = mensajeUsuario.toLowerCase().replace(/[?¿!¡.,]/g, "").trim();
    const ruido = ["hola", "puedes", "mandar", "que", "zapatos", "tienes", "color", "ver", "quiero", "busca", "para", "unos", "talla", "tengas", "algun", "modelo"];
    const palabrasClave = mensajeLimpio.split(" ").filter(p => p.length >= 1 && !ruido.includes(p)); 

    // 1. BUSCAR COLOR Y TALLA EN PARALELO
    let colorIdEncontrado = null;
    let tallaIdEncontrada = null;

    for (const palabra of palabrasClave) {
      // ¿Es un color?
      if (!colorIdEncontrado) {
        const colorMatch = await colores.findOne({ where: { nombre: { [Op.iLike]: `%${palabra}%` } } });
        if (colorMatch) colorIdEncontrado = colorMatch.id;
      }
      // ¿Es una talla? (Buscamos coincidencia exacta de número)
      if (!tallaIdEncontrada) {
        const tallaMatch = await tallas.findOne({ where: { numero: palabra } });
        if (tallaMatch) tallaIdEncontrada = tallaMatch.id;
      }
    }

    // 2. BÚSQUEDA DINÁMICA DE PRODUCTOS
    const productosEncontrados = await productos.findAll({
      where: {
        [Op.or]: [
          ...(palabrasClave.length > 0 ? palabrasClave.map(p => ({ nombre: { [Op.iLike]: `%${p}%` } })) : []),
          colorIdEncontrado ? { '$inventarios.colorId$': colorIdEncontrado } : null,
          tallaIdEncontrada ? { '$inventarios.tallaId$': tallaIdEncontrada } : null
        ].filter(Boolean)
      },
      include: [
        { 
          model: inventarios, 
          required: (colorIdEncontrado || tallaIdEncontrada) ? true : false, // Si pidió algo específico, forzamos el cruce
          include: [{ model: colores }, { model: tallas }]
        }
      ],
      distinct: true
    });

    // 3. CARGA DE STICKERS
    const listaDeStickers = await stickers.findAll();
    const catalogoStickers = listaDeStickers.map(s => `- "${s.emocion}": ![Sticker](${s.url})`).join("\n");

    // 4. CONSTRUIR CONTEXTO
    let contextoExtra = "";
    if (productosEncontrados.length > 0) {
      const datosParaIA = productosEncontrados.map(p => {
        // Filtrar inventario si el usuario pidió una talla específica
        const invFiltrado = tallaIdEncontrada 
          ? p.inventarios.filter(i => i.tallaId === tallaIdEncontrada)
          : p.inventarios;

        const misColores = [...new Set(invFiltrado.map(i => i.colore?.nombre || i.color?.nombre))].filter(Boolean).join(", ");
        const misTallas = [...new Set(invFiltrado.map(i => i.talla?.numero))].filter(Boolean).sort().join(", ");
        
        return {
          id: p.id,
          nombre: p.nombre,
          precio: p.precio,
          colores: misColores,
          tallas: misTallas,
          imagen: p.imagenUrl
        };
      }).filter(d => d.tallas !== ""); // Solo mostrar si hay stock de esa talla

      contextoExtra = datosParaIA.length > 0 
        ? `\n\n[INFO REAL DE DB NEON]: ${JSON.stringify(datosParaIA)}`
        : `\n\n[INFO REAL DE DB NEON]: NO HAY STOCK en la talla solicitada.`;
    } else {
      contextoExtra = `\n\n[INFO REAL DE DB NEON]: NO HAY STOCK.`;
    }

    // 5. RESPUESTA OPENAI
    const messages = [
      { 
        role: "system", 
        content: `Eres Glitch, el lobo alfa de "Zona 404 Shoes". 🐺
        ${catalogoStickers}
        REGLAS:
        1. SEPARADOR: "|||".
        2. VERDAD: Solo lo que está en [INFO REAL DE DB NEON].
        3. ESTRUCTURA: Sticker ||| Texto ||| Producto.
        4. Si el usuario pide una talla y NO hay en el JSON, di que no la tienes.`
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
    return "![Sticker](https://github.com/Esteban-can/Sticker_Glitch/blob/main/Sticker_3.png?raw=true) ||| ¡Auuu! Hubo un error en la búsqueda. 🐺";
  }
};