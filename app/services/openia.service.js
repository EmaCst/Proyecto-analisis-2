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

    let colorIdEncontrado = null;
    let tallaIdEncontrada = null;

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
          required: (colorIdEncontrado || tallaIdEncontrada) ? true : false,
          include: [{ model: colores }, { model: tallas }]
        }
      ],
      distinct: true
    });

    const listaDeStickers = await stickers.findAll();
    const catalogoStickers = listaDeStickers.map(s => `- "${s.emocion}": ${s.url}`).join("\n");

    let contextoExtra = "";
    if (productosEncontrados.length > 0) {
      const datosParaIA = productosEncontrados.map(p => {
        const invFiltrado = tallaIdEncontrada 
          ? p.inventarios.filter(i => i.tallaId === tallaIdEncontrada)
          : p.inventarios;

        const misColores = [...new Set(invFiltrado.map(i => i.colore?.nombre || i.color?.nombre))].filter(Boolean).join(", ");
        const misTallas = [...new Set(invFiltrado.map(i => i.talla?.numero))].filter(Boolean).sort((a,b) => a-b).join(", ");
        const linkDetalle = `https://zona404shoes.vercel.app/producto/${p.id}`;

        // Enviamos explícitamente la URL de la imagen en el contexto
        return `PRODUCTO: ${p.nombre} | PRECIO: $${p.precio} | COLORES: ${misColores} | TALLAS: ${misTallas} | LINK: ${linkDetalle} | FOTO: ${p.imagenUrl}`;
      }).filter(d => !d.includes("TALLAS: "));

      contextoExtra = `\n\n[INVENTARIO REAL DISPONIBLE]:\n${datosParaIA.join("\n")}`;
    } else {
      contextoExtra = `\n\n[SISTEMA]: No hay stock disponible.`;
    }

    const messages = [
      { 
        role: "system", 
        content: `Eres Glitch, el lobo alfa de "Zona 404 Shoes" 🐺.
        
        STICKERS DISPONIBLES:
        ${catalogoStickers}

        REGLAS DE FORMATO:
        1. SEPARADOR: Usa "|||" para dividir las 3 burbujas.
        2. ESTRUCTURA:
           Burbuja 1: Sticker ![Sticker](URL)
           |||
           Burbuja 2: Mensaje de texto cool.
           |||
           Burbuja 3: Lista detallada:
           ![Zapato](URL_DE_FOTO)
           **Nombre del Zapato**
           💰 Precio: $XXX
           🎨 Colores: ...
           📏 Tallas: ...
           🔗 [Ver más detalles](LINK)
        
        3. FOTOS: Es obligatorio poner la foto del zapato al principio de la descripción de cada producto.`
      },
      ...historial.map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.contenido })),
      { role: "user", content: mensajeUsuario + contextoExtra }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.1,
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return "![Sticker](https://github.com/Esteban-can/Sticker_Glitch/blob/main/Sticker_3.png?raw=true) ||| ¡Auuu! Hubo un error en mi olfato. 🐺";
  }
};